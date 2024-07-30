import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import Chart from 'chart.js/auto';
import Select from 'react-select';
import './chartComponent.css'; // Import CSS file for styling

// Helper function to parse date strings into Date objects
const parseDate = dateString => {
    const [month, day, year] = dateString.split('/');
    return new Date(`20${year}`, month - 1, day);
};

// Consolidate flights by trip ID, summing flight hours and organizing by date
const consolidateFlights = flights => {
    const flightData = {};
    flights.forEach(flight => {
        const dateKey = parseDate(flight['Start Z']).toISOString().slice(0, 10); // Convert date to YYYY-MM-DD format
        if (!flightData[flight.Trip]) {
            flightData[flight.Trip] = {
                Aircraft: flight.Aircraft,
                TotalFlightHrs: 0,
                Dates: {}
            };
        }
        flightData[flight.Trip].TotalFlightHrs += parseFloat(flight['Flight hrs']);
        if (!flightData[flight.Trip].Dates[dateKey]) {
            flightData[flight.Trip].Dates[dateKey] = {
                Trip: flight.Trip,
                FlightHrs: parseFloat(flight['Flight hrs']),
                Price: 0 // Initialize price, to be updated from invoices
            };
        } else {
            flightData[flight.Trip].Dates[dateKey].FlightHrs += parseFloat(flight['Flight hrs']);
        }
    });
    return flightData;
};

// Add invoice pricing information to the consolidated flights data
const matchInvoices = (flights, invoices) => {
    invoices.forEach(invoice => {
        const flight = flights[invoice.Trip];
        if (flight) {
            // Calculate total flight hours for the trip
            const totalFlightHrs = flight.TotalFlightHrs;
            // Distribute price proportionally to each date
            Object.keys(flight.Dates).forEach(date => {
                const dateData = flight.Dates[date];
                const proportion = dateData.FlightHrs / totalFlightHrs;
                dateData.Price += proportion * parseFloat(invoice.Price);
            });
        }
    });
};

// Organize flight data by aircraft, consolidating data by date under each aircraft
const organizeDataByAircraft = flights => {
    const aircraftData = {};
    Object.values(flights).forEach(flight => {
        const { Aircraft, Dates } = flight;
        if (!aircraftData[Aircraft]) {
            aircraftData[Aircraft] = {};
        }
        Object.entries(Dates).forEach(([date, data]) => {
            if (data.FlightHrs > 0 && !isNaN(data.FlightHrs) && data.Price > 0 && !isNaN(data.Price)) {
                if (!aircraftData[Aircraft][date]) {
                    aircraftData[Aircraft][date] = data;
                } else {
                    aircraftData[Aircraft][date].FlightHrs += data.FlightHrs;
                    aircraftData[Aircraft][date].Price += data.Price;
                }
            }
        });
    });
    return aircraftData;
};

const ChartComponent = () => {
    const [aircraftData, setAircraftData] = useState({});
    const [error, setError] = useState(null);
    const [selectedAircrafts, setSelectedAircrafts] = useState([]);
    const [startDate, setStartDate] = useState('2023-01-01');
    const [endDate, setEndDate] = useState('2024-12-31');
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.getData();
                const flights = consolidateFlights(result.data.loggedFlights);
                matchInvoices(flights, result.data.invoices);
                const organizedData = organizeDataByAircraft(flights);
                setAircraftData(organizedData);

                console.log("Aircraft Data Organized by Date:", organizedData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Error fetching data.');
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');
        const filteredData = {};

        Object.keys(aircraftData).forEach(aircraft => {
            if (selectedAircrafts.length === 0 || selectedAircrafts.includes(aircraft)) {
                Object.keys(aircraftData[aircraft]).forEach(date => {
                    const dateObj = new Date(date);
                    if (dateObj >= new Date(startDate) && dateObj <= new Date(endDate)) {
                        if (!filteredData[aircraft]) {
                            filteredData[aircraft] = { totalPrice: 0, totalFlightHrs: 0 };
                        }
                        filteredData[aircraft].totalPrice += aircraftData[aircraft][date].Price;
                        filteredData[aircraft].totalFlightHrs += aircraftData[aircraft][date].FlightHrs;
                    }
                });
            }
        });

        const labels = Object.keys(filteredData);
        const dataPoints = labels.map(aircraft => 
            filteredData[aircraft].totalFlightHrs ? filteredData[aircraft].totalPrice / filteredData[aircraft].totalFlightHrs : 0
        );

        const chartData = {
            labels,
            datasets: [{
                label: 'Revenue Per Hour',
                data: dataPoints,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        };

        if (chartRef.current.chartInstance) {
            chartRef.current.chartInstance.destroy();  // Destroy previous chart instance if exists
        }

        chartRef.current.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }, [aircraftData, selectedAircrafts, startDate, endDate]);

    if (error) {
        return <div>{error}</div>;
    }

    const aircraftOptions = Object.keys(aircraftData).map(aircraft => ({
        value: aircraft,
        label: aircraft
    }));

    return (
        <div>
            <h1>Aircraft Revenue Analysis</h1>
            <div className="filters">
                <div className="filter">
                    <label>Start Date:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="filter">
                    <label>End Date:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="filter">
                    <label>Aircraft:</label>
                    <Select
                        isMulti
                        options={aircraftOptions}
                        value={aircraftOptions.filter(option => selectedAircrafts.includes(option.value))}
                        onChange={selected => setSelectedAircrafts(selected.map(option => option.value))}
                        styles={{ container: base => ({ ...base, width: 300 }) }}
                    />
                </div>
            </div>
            <canvas ref={chartRef} width="400" height="400"></canvas>
        </div>
    );
};

export default ChartComponent;
