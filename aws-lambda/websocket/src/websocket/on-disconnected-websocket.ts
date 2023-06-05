import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { WithDynamoDbLambda } from '../with-dynamodb-lambda';

export class OnDisconnectedWebSocket extends WithDynamoDbLambda {
  protected async inHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (!event.requestContext.connectionId || !process.env?.TABLE_NAME)
      return this.res(400, 'Parameter missing');

    const command = new DeleteItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { connectionId: { S: event.requestContext.connectionId } }
    });

    await this.dynamoDB.send(command);

    return this.res(200, 'Connected');
  }
}
