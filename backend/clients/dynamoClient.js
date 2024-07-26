const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const config = require('../constants/config');

const dynamoClient = new DynamoDBClient({
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_ACCESS_KEY,
        secretAccessKey: config.AWS_SECRET_KEY,
    }
});

module.exports = dynamoClient;
