import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const YoYRevenueComparison = ({ aircraftData, selectedAircrafts, selectedMonthYear }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !selectedMonthYear) return;

        const ctx = chartRef.current.getContext('2d');
        const filteredData = {};
        const datasets = [];

        const [selectedYear, selectedMonth] = selectedMonthYear.value.split('-');
        const currentMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const previousYear = selectedYear - 1;

        const months = [
            { year: selectedYear, label: `${currentMonth.toLocaleString('default', { month: 'long' })} ${selectedYear}` },
            { year: previousYear, label: `${currentMonth.toLocaleString('default', { month: 'long' })} ${previousYear}` }
        ];

        months.forEach((month, index) => {
            const startDate = new Date(month.year, currentMonth.getMonth(), 1);
            const endDate = new Date(month.year, currentMonth.getMonth() + 1, 0); // Last day of the month

            Object.keys(aircraftData).forEach(aircraft => {
                if (selectedAircrafts.length === 0 || selectedAircrafts.includes(aircraft)) {
                    Object.keys(aircraftData[aircraft]).forEach(date => {
                        const dateObj = new Date(date);
                        if (dateObj >= startDate && dateObj <= endDate) {
                            if (!filteredData[aircraft]) {
                                filteredData[aircraft] = Array(2).fill({ totalPrice: 0, totalFlightHrs: 0 });
                            }
                            filteredData[aircraft][index] = {
                                totalPrice: filteredData[aircraft][index].totalPrice + aircraftData[aircraft][date].Price,
                                totalFlightHrs: filteredData[aircraft][index].totalFlightHrs + aircraftData[aircraft][date].FlightHrs
                            };
                        }
                    });
                }
            });
        });

        const labels = Object.keys(filteredData);
        const colors = ['rgba(255, 156, 0, 0.7)', 'rgba(0, 20, 255, 0.7)']; // Solid colors
        const labelsArray = months.map(month => month.label);

        for (let i = 0; i < 2; i++) {
            const dataPoints = labels.map(aircraft => 
                filteredData[aircraft][i].totalFlightHrs ? filteredData[aircraft][i].totalPrice / filteredData[aircraft][i].totalFlightHrs : 0
            );
            datasets.push({
                label: labelsArray[i],
                data: dataPoints,
                backgroundColor: colors[i],
                borderColor: colors[i],
                borderWidth: 1,
                type: 'bar'
            });
        }

        const chartData = {
            labels,
            datasets
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

    return <div className="chart-container"><canvas ref={chartRef} width="1000" height="600"></canvas></div>; // Adjust width and height here
};

export default YoYRevenueComparison;
