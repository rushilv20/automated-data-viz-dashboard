import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const BreakevenHoursChart = ({ aircraftData, selectedAircrafts, selectedMonthYear, fixedCosts, variableCosts }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !selectedMonthYear) return;

        const ctx = chartRef.current.getContext('2d');
        const filteredData = {};
        const breakevenData = {};

        const [selectedYear, selectedMonth] = selectedMonthYear.value.split('-');
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);

        // Filter aircraft data
        Object.keys(aircraftData).forEach(aircraft => {
            if (selectedAircrafts.length === 0 || selectedAircrafts.includes(aircraft)) {
                Object.keys(aircraftData[aircraft]).forEach(date => {
                    const dateObj = new Date(date);
                    if (dateObj >= startDate && dateObj <= endDate) {
                        if (!filteredData[aircraft]) {
                            filteredData[aircraft] = { totalFlightHrs: 0, totalRevenue: 0 };
                        }
                        filteredData[aircraft].totalFlightHrs += aircraftData[aircraft][date].FlightHrs;
                        filteredData[aircraft].totalRevenue += aircraftData[aircraft][date].Price;
                    }
                });

                // Calculate Revenue/hr
                const revenuePerHour = filteredData[aircraft].totalRevenue / filteredData[aircraft].totalFlightHrs;

                // Calculate Contribution Margin
                const contributionMargin = revenuePerHour - variableCosts[aircraft];

                // Calculate Breakeven Hours
                breakevenData[aircraft] = fixedCosts[aircraft] / contributionMargin;
            }
        });

        const labels = Object.keys(filteredData);
        const dataPoints = labels.map(aircraft => filteredData[aircraft].totalFlightHrs);
        const breakevenPoints = labels.map(aircraft => breakevenData[aircraft]);

        const chartData = {
            labels,
            datasets: [
                {
                    label: 'Actual Flight Hours',
                    data: dataPoints,
                    backgroundColor: '#FF0000', // Red color for bars
                    borderColor: '#FF0000',
                    borderWidth: 1,
                    order: 1, // Draw this dataset first
                    type: 'bar'
                },
                {
                    label: 'Breakeven Hours @ Current Pricing',
                    data: breakevenPoints,
                    backgroundColor: '#C0C0C0',
                    borderColor: '#C0C0C0',
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
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
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

    return <div className="chart-container"><canvas ref={chartRef} width="1000" height="600"></canvas></div>; // Adjust width and height here
};

export default BreakevenHoursChart;
