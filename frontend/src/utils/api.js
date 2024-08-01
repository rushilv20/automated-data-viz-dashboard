import axios from 'axios';

const getData = async () => {
    try {
        const response = await axios.get('https://www.bellairdashboard.com/api/dashboard'); // Ensure the correct URL
        return response;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export default {
    getData,
};
