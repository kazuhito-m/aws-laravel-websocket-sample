const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const { TABLE_NAME, WEBSOCKET_ENDPOINT } = process.env;

exports.handler = async (event, context) => {
  console.log('これ、もしかして正しく出ている？');
  console.log(event);
  console.log(context);

  return { statusCode: 200, body: '途中で終わった系の関数。' };

  let connectionData;
  
  try {
    const conditions = {
      TableName: TABLE_NAME
    };
    
    connectionData = await ddb.scan(conditions).promise();
    
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }
  
  console.log("WEBSOCKET_ENDPOINT:" + WEBSOCKET_ENDPOINT);
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: WEBSOCKET_ENDPOINT
  });
  
  const postData = JSON.stringify({
    toUserId: event.toUserId,
    message: event.message,
    fromUserId: event.fromUserId,
    fromUserName: event.fromUserName,
    fromServerTime: event.fromServerTime,
    apiSendTime: new Date().toISOString()
  });
  
  console.log('DynamoDBで取得できた connectionData の中身。');
  console.log(connectionData);
  
        
  const postCalls = connectionData.Items.filter(i => i.userId === event.toUserId).map(async ({ connectionId }) => {
    try {
      await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
      } else {
        throw e;
      }
    }
  });
  
  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
