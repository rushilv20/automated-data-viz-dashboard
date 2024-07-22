const AWS = require('aws-sdk');
const config = require('../constants/config');

AWS.config.update({
    region: config.AWS_REGION,
    accessKeyId: config.AWS_ACCESS_KEY,
    secretAccessKey: config.AWS_SECRET_KEY,
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();

module.exports = dynamoClient;
