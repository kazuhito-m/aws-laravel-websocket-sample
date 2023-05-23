const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

// const mysql = require('mysql');
//
// function connectionOfMySQL() {
//   return mysql.createConnection({
//         host     : process.env.RDS_ENDPOINT,
//         user     : 'root',
//         password : process.env.RDS_PASSWORD,
//         database : 'laravel'
//   });
// }
//
// function createWebsocketConnectedOnMySQL(connectionId, userId) {
//   const connection = connectionOfMySQL();
//   connection.connect();
//
//   const sql = `INSERT INTO websocket_connections (connection_id, user_id) VALUES (?, ?);`
//   console.log('実行SQL:' + sql);
//   connection.query(sql, [connectionId, userId], (err, result) => {
//     if (err) console.log("error発生:" + err);
//     if (err) throw err;
//   });
//
//   connection.commit();
//   connection.end();
// }

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

  // console.log('DBへのSessionIDの保存。');
  // createWebsocketConnectedOnMySQL(
  //   event.requestContext.connectionId,
  //   parseInt(event.queryStringParameters.userId, 10)
  // );
  // console.log('DBへの保存、終わり。');

  return { statusCode: 200, body: 'Connected.' };
};
