// frontend/src/utils/api.js
import axios from 'axios';

const getData = async () => {
    try {
        const response = await axios.get('https://9517wd7v2e.execute-api.us-east-1.amazonaws.com/dev/api/dashboard'); // Update to use Elastic Beanstalk domain
        return response;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export default {
    getData,
};
