const dynamoClient = require('../clients/dynamoClient');
const config = require('../constants/config');
const responseHandler = require('../utils/responseHandler');

const getData = async (req, res) => {
    const params = {
        LoggedFlights: config.LOGGED_FLIGHTS,
        TripFinances: config.TRIP_FINANCES,
        Invoices: config.INVOICES
    };

    try {
        const data = await dynamoClient.scan(params).promise();
        responseHandler.success(res, data.Items);
    } catch (error) {
        responseHandler.error(res, error);
    }
};

module.exports = {
    getData,
};
