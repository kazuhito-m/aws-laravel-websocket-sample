const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

// const mysql = require('mysql');
//
// function connectionOfMySQL() {
//   return mysql.createConnection({
//         host     : process.env.RDS_ENDPOINT,
//         user     : 'root',
//         password : 'QwPCtmf6rKuJdjadCZWn',
//         database : 'laravel'
//   });
// }
//
// function removeWebsocketConnectedOnMySQL(connectionId) {
//   const connection = connectionOfMySQL();
//
//   const sql = `DELETE websocket_connections WHERE connection_id = ?;`
//   connection.query(sql, [connectionId], (err, result) => {
//     if (err) throw err;
//   });
//
//   connection.commit();
//   connection.end();
// }

exports.handler = async event => {
  const deleteParams = {
    TableName: process.env.TABLE_NAME,
    Key: {
      connectionId: event.requestContext.connectionId
    }
  };

  try {
    await ddb.delete(deleteParams).promise();
  } catch (err) {
    return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
  }

  // removeWebsocketConnectedOnMySQL(event.requestContext.connectionId);

  return { statusCode: 200, body: 'Disconnected.' };
};

