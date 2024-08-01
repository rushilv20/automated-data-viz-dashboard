const dynamoClient = require('../clients/dynamoClient');
const { ScanCommand } = require("@aws-sdk/client-dynamodb"); // Import ScanCommand
const config = require('../constants/config');
const responseHandler = require('../utils/responseHandler');

const parseDynamoDBData = (data) => {
    return data.map(item => {
        const parsedItem = {};
        for (const key in item) {
            const valueObj = item[key];
            if ('S' in valueObj) {
                parsedItem[key] = valueObj.S;
            } else if ('N' in valueObj) {
                parsedItem[key] = parseFloat(valueObj.N);
            } else if ('BOOL' in valueObj) {
                parsedItem[key] = valueObj.BOOL;
            } else if ('NULL' in valueObj) {
                parsedItem[key] = null;
            } else if ('M' in valueObj) {
                parsedItem[key] = parseDynamoDBData([valueObj.M])[0]; // Recursive parse for Map types
            } else if ('L' in valueObj) {
                parsedItem[key] = parseDynamoDBData(valueObj.L); // Recursive parse for List types
            } else {
                console.error("Unhandled DynamoDB data type:", key, valueObj);
            }
        }
        return parsedItem;
    });
};

const getData = async (req, res) => {
    const tableNames = [config.TRIP_FINANCES, config.LOGGED_FLIGHTS, config.INVOICES];
    
    try {
        const promises = tableNames.map(tableName => {
            const params = {
                TableName: tableName,
            };
            const command = new ScanCommand(params);
            return dynamoClient.send(command);
        });

        const results = await Promise.all(promises);

        const data = {
            tripFinances: parseDynamoDBData(results[0].Items),
            loggedFlights: parseDynamoDBData(results[1].Items),
            invoices: parseDynamoDBData(results[2].Items)
        };

        // Set CORS headers explicitly
        res.setHeader('Access-Control-Allow-Origin', 'https://www.bellairdashboard.com');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        responseHandler.success(res, data);
    } catch (error) {
        console.error('Error fetching data:', error);
        responseHandler.error(res, error);
    }
};

module.exports = {
    getData,
};
