import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const MoMRevenueComparison = ({ aircraftData, selectedAircrafts, selectedMonthYear }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !selectedMonthYear) return;

        const ctx = chartRef.current.getContext('2d');
        const filteredData = {};
        const datasets = [];

        const [selectedYear, selectedMonth] = selectedMonthYear.value.split('-');
        const currentMonth = new Date(selectedYear, selectedMonth - 1, 1);

        const months = [0, 1, 2, 3].map(offset => {
            const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - offset, 1);
            const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - offset + 1, 0); // Last day of the month
            return { startDate, endDate };
        });

        months.forEach((month, index) => {
            Object.keys(aircraftData).forEach(aircraft => {
                if (selectedAircrafts.length === 0 || selectedAircrafts.includes(aircraft)) {
                    Object.keys(aircraftData[aircraft]).forEach(date => {
                        const dateObj = new Date(date);
                        if (dateObj >= month.startDate && dateObj <= month.endDate) {
                            if (!filteredData[aircraft]) {
                                filteredData[aircraft] = Array(4).fill({ totalPrice: 0, totalFlightHrs: 0 });
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
        const colors = ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)', 'rgba(255, 205, 86, 1)', 'rgba(201, 203, 207, 1)']; // Solid colors
        const labelsArray = ['This Month Rev/Hr', 'Last Month Rev/Hr', '2 Months Ago Rev/Hr', '3 Months Ago Rev/Hr'];

        for (let i = 0; i < 4; i++) {
            const dataPoints = labels.map(aircraft => 
                filteredData[aircraft][i].totalFlightHrs ? filteredData[aircraft][i].totalPrice / filteredData[aircraft][i].totalFlightHrs : 0
            );
            datasets.push({
                label: labelsArray[i],
                data: dataPoints,
                backgroundColor: colors[i],
                borderColor: colors[i],
                borderWidth: 1
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
            type: 'bar',
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

export default MoMRevenueComparison;
