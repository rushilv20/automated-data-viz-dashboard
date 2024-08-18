import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { fixedCosts, variableCosts } from './constants';

const BreakevenHours = ({ aircraftData, selectedAircrafts, selectedMonthYear }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !selectedMonthYear || !aircraftData || !selectedAircrafts) return;

        const ctx = chartRef.current.getContext('2d');
        const filteredData = {};

        const [selectedYear, selectedMonth] = selectedMonthYear.value.split('-');
        const monthLabel = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        selectedAircrafts.forEach(aircraft => {
            if (aircraftData[aircraft]) {
                const flightHours = Object.keys(aircraftData[aircraft]).reduce((totalHours, date) => {
                    const dateObj = new Date(date);
                    if (dateObj >= new Date(selectedYear, selectedMonth - 1, 1) && dateObj <= new Date(selectedYear, selectedMonth, 0)) {
                        return totalHours + (aircraftData[aircraft][date].FlightHrs || 0);
                    }
                    return totalHours;
                }, 0);

                const revenuePerHour = flightHours > 0 ? aircraftData[aircraft].totalPrice / flightHours : 0;
                const contributionMargin = revenuePerHour - (variableCosts[monthLabel][aircraft] || 0);
                const breakevenHours = contributionMargin > 0 ? (fixedCosts[monthLabel][aircraft] || 0) / contributionMargin : null;

                filteredData[aircraft] = {
                    flightHours,
                    breakevenHours
                };
            }
        });

        const labels = Object.keys(filteredData);
        const flightHoursData = labels.map(aircraft => filteredData[aircraft].flightHours);
        const breakevenData = labels.map(aircraft => filteredData[aircraft].breakevenHours);

        const backgroundColors = flightHoursData.map((hours, index) =>
            hours >= breakevenData[index] ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)' // Green if flight hours >= breakeven hours, otherwise red
        );

        const chartData = {
            labels,
            datasets: [
                {
                    label: 'Total Flight Hours',
                    data: flightHoursData,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    type: 'bar'
                },
                {
                    label: 'Breakeven Hours',
                    data: breakevenData,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    type: 'line',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: false,
                    tension: 0.4 // Add some tension to make the line slightly curved
                }
            ]
        };

        if (chartRef.current.chartInstance) {
            chartRef.current.chartInstance.destroy();  // Destroy previous chart instance if exists
        }

        chartRef.current.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }, [aircraftData, selectedAircrafts, selectedMonthYear]);

    return (
        <div className="chart-container">
            <canvas ref={chartRef} width="1000" height="600"></canvas>
        </div>
    );
};

export default BreakevenHours;
