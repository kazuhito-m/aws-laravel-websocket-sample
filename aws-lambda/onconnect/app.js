// Copyright 2018-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const mysql = require('mysql');

function connectionOfMySQL() {
  return mysql.createConnection({
        host     : process.env.RDS_ENDPOINT,
        user     : 'root',
        password : 'QwPCtmf6rKuJdjadCZWn',
        database : 'laravel'
  });
}

function createWebsocketConnectedOnMySQL(connectionId, userId) {
  const connection = connectionOfMySQL();
  
  const sql = `INSERT INTO websocket_connections (connection_id, user_id) values (?, ?);`
  connection.query(sql, [connectionId, userId], (err, result) => {
    if (err) throw err;
  });
  
  connection.commit();
  connection.end();
}

exports.handler = async event => {
  const putParams = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: event.requestContext.connectionId,
      userId: event.queryStringParameters.userId,
      connectedTime: new Date().toISOString()
    }
  };

  try {
    await ddb.put(putParams).promise();
  } catch (err) {
    return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
  }
  
  createWebsocketConnectedOnMySQL(
    event.requestContext.connectionId,
    parseInt(event.queryStringParameters.userId, 10)
  );

  return { statusCode: 200, body: 'Connected.' };
};

