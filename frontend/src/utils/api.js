import axios from 'axios';

const API_URL = 'https://backend-env.eba-mhhmuukm.us-east-1.elasticbeanstalk.com/api';

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
