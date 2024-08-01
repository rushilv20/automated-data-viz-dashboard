import axios from 'axios';

const API_URL = 'https://bellairdashboard.com';

const getData = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard`);
        return response;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export default {
    getData,
};
