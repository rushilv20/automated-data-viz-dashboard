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
                        return totalHours + (aircraftData[aircraft][date]?.FlightHrs || 0);
                    }
                    return totalHours;
                }, 0);

                const revenuePerHour = flightHours > 0 ? aircraftData[aircraft].totalPrice / flightHours : 0;
                const contributionMargin = revenuePerHour - (variableCosts[monthLabel]?.[aircraft] || 0);
                const breakevenHours = contributionMargin > 0 ? (fixedCosts[monthLabel]?.[aircraft] || 0) / contributionMargin : null;

                filteredData[aircraft] = {
                    flightHours,
                    breakevenHours
                };
            }
        });

        const labels = Object.keys(filteredData);
        const flightHoursData = labels.map(aircraft => filteredData[aircraft].flightHours);
        const breakevenData = labels.map(aircraft => filteredData[aircraft].breakevenHours);

        const chartData = {
            labels,
            datasets: [
                {
                    label: 'Total Flight Hours',
                    data: flightHoursData,
                    backgroundColor: 'rgba(75, 192, 192, 0.3)',
                    borderColor: 'rgba(75, 192, 192, 1)',
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
                    pointHoverRadius: 7
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
                }
            }
        });
    }, [aircraftData, selectedAircrafts, selectedMonthYear]);

    return <div className="chart-container"><canvas ref={chartRef} width="1000" height="600"></canvas></div>; // Adjust width and height here
};

export default BreakevenHours;
