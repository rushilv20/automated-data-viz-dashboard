import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';

const ChartComponent = () => {
    const [chartData, setChartData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const result = await api.getData();
            const data = result.data;

            setChartData({
                labels: data.map(item => item.label), // Adjust according to your data
                datasets: [
                    {
                        label: 'My Dataset',
                        data: data.map(item => item.value), // Adjust according to your data
                        borderColor: 'rgba(75,192,192,1)',
                        fill: false,
                    },
                ],
            });
        };
        fetchData();
    }, []);

    return (
        <div>
            <h1>My Chart</h1>
            <Line data={chartData} />
        </div>
    );
};

export default ChartComponent;
