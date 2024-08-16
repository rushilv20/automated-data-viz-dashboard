// src/components/RevenuePerHour.js

import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { breakevenPrices } from './constants';

const RevenuePerHour = ({ aircraftData, selectedAircrafts, selectedMonthYear }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !selectedMonthYear) return;

        const ctx = chartRef.current.getContext('2d');
        const filteredData = {};

        const [selectedYear, selectedMonth] = selectedMonthYear.value.split('-');
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of the selected month

        const monthLabel = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        selectedAircrafts.forEach(aircraft => {
            if (aircraftData[aircraft]) {
                Object.keys(aircraftData[aircraft]).forEach(date => {
                    const dateObj = new Date(date);
                    if (dateObj >= startDate && dateObj <= endDate) {
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

        const breakevenDataPoints = labels.map(aircraft => breakevenPrices[monthLabel][aircraft]);

        const chartData = {
            labels,
            datasets: [
                {
                    label: 'Revenue Per Hour',
                    data: dataPoints,
                    backgroundColor: 'rgba(75, 192, 192, 0.3)', // Solid color for bars
                    borderColor: 'rgba(75, 192, 192, 1)', // Solid color for border
                    borderWidth: 1,
                    order: 1, // Draw this dataset first
                    type: 'bar'
                },
                {
                    label: 'Breakeven Price/Hour',
                    data: breakevenDataPoints,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    order: 2, // Draw this dataset after the bars
                    type: 'line',
                    pointStyle: 'circle',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        };

        if (chartRef.current.chartInstance) {
            chartRef.current.chartInstance.destroy();  // Destroy previous chart instance if exists
        }

        chartRef.current.chartInstance = new Chart(ctx, {
            type: 'bar', // Initial chart type
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }, [aircraftData, selectedAircrafts, selectedMonthYear]);

    return <div className="chart-container"><canvas ref={chartRef} width="1000" height="600"></canvas></div>; // Adjust width and height here
};

export default RevenuePerHour;
