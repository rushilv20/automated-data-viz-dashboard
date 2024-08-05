import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Select from 'react-select';
import RevenuePerHour from './RevenuePerHour';
import MoMRevenueComparison from './MoMRevenueComparison';
import YoYRevenueComparison from './YoYRevenueComparison';
import { consolidateFlights, matchInvoices, organizeDataByAircraft } from '../utils/dataHelpers';
import '../styles/chartComponent.css'; // Import CSS file for styling

const ChartComponent = () => {
    const [aircraftData, setAircraftData] = useState({});
    const [error, setError] = useState(null);

    // Pre-select these aircrafts
    const preSelectedAircrafts = [
        'N118DL', 'N17FA', 'N525F', 'N560MC', 'N808MC', 'N399LF', 'N804MC', 'N440WP'
    ];

    const [selectedAircrafts, setSelectedAircrafts] = useState(preSelectedAircrafts);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthYear = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonthYear, setSelectedMonthYear] = useState({ value: currentMonthYear, label: new Date(currentYear, currentDate.getMonth()).toLocaleString('default', { month: 'long', year: 'numeric' }) });

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

    if (error) {
        return <div>{error}</div>;
    }

    const aircraftOptions = Object.keys(aircraftData).map(aircraft => ({
        value: aircraft,
        label: aircraft
    }));

    const monthYearOptions = [];
    for (let year = 2023; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
            monthYearOptions.push({
                value: `${year}-${String(month).padStart(2, '0')}`,
                label: new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
            });
        }
    }

    return (
        <div>
            <h1>BellAir Dashboard</h1>
            <div className="filters">
                <div className="filter">
                    <label>Month and Year:</label>
                    <Select
                        options={monthYearOptions}
                        value={selectedMonthYear}
                        onChange={setSelectedMonthYear}
                        styles={{ container: base => ({ ...base, width: 300 }) }}
                    />
                </div>
                <div className="filter">
                    <label>Aircraft:</label>
                    <Select
                        isMulti
                        options={aircraftOptions}
                        value={aircraftOptions.filter(option => selectedAircrafts.includes(option.value))}
                        onChange={selected => setSelectedAircrafts(selected.map(option => option.value))}
                        styles={{
                            container: base => ({ ...base, width: '600px' }) // Adjust width as needed
                        }}
                    />
                </div>
            </div>
            <div className="charts-grid">
                <div className="chart-container">
                    <h2>Actual Price/Hour Vs. Breakeven Price/Hour</h2>
                    <RevenuePerHour aircraftData={aircraftData} selectedAircrafts={selectedAircrafts} selectedMonthYear={selectedMonthYear} />
                </div>
                <div className="chart-container">
                    <h2>M.O.M. Revenue/Hour Comparison</h2>
                    <MoMRevenueComparison aircraftData={aircraftData} selectedAircrafts={selectedAircrafts} selectedMonthYear={selectedMonthYear} />
                </div>
                <div className="chart-container">
                    <h2>Y.O.Y. Revenue/Hour Comparison</h2>
                    <YoYRevenueComparison aircraftData={aircraftData} selectedAircrafts={selectedAircrafts} selectedMonthYear={selectedMonthYear} />
                </div>
                {/* Add more chart components here */}
            </div>
        </div>
    );
};

export default ChartComponent;
