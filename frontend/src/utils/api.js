// frontend/src/utils/api.js
import axios from 'axios';

const getData = async () => {
    try {
        const response = await axios.get('https://backendeb.bellairdashboard.com/api/dashboard'); // Update to use Elastic Beanstalk domain
        return response;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export default {
    getData,
};
