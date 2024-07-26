import axios from 'axios';

const getData = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/dashboard');
        return response;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

export default {
    getData,
};
