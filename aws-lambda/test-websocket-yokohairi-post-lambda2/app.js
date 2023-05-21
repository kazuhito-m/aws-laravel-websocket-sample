import AWS from "aws-sdk";
// AWS.config.update({ region: process.env.AWS_REGION });
// var DDB = new AWS.DynamoDB({ apiVersion: "2012-10-08" });

// require('aws-sdk/clients/apigatewaymanagementapi');

exports.handler = function (event, context, callback) {
    // TODO implement

    callback(null, {
        statusCode: 200,
        body: JSON.stringify('TABLE_NAME:' + process.env.TABLE_NAME),
    })
}

