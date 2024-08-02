// frontend/src/utils/api.js
import axios from 'axios';

const getData = async () => {
    try {
        const response = await axios.get('https://my-env.eba-vzy2z5hp.us-east-1.elasticbeanstalk.com/api/dashboard'); // Update to use Elastic Beanstalk domain
        return response;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export default {
    getData,
};
