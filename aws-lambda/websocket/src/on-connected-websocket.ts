import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { BatchWriteItemCommand, WriteRequest } from '@aws-sdk/client-dynamodb';
import { WebSocketEvent } from './websocket-event';

export class OnConnectWebSocket extends WebSocketEvent {
    protected async inHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        if (!event.requestContext.connectionId
            || !event.queryStringParameters?.userId
            || !process.env?.TABLE_NAME) return this.res(400, 'Parameter missing');

        const command = this.buildWriteCommand(
            event.requestContext.connectionId,
            event.queryStringParameters?.userId,
            process.env.TABLE_NAME,
        );

        await this.dynamoDB.send(command);

        return this.res(200, 'Connected');
    }

    private buildWriteCommand(connectionId: string, userId: string, tableName: string): BatchWriteItemCommand {
        const requests: WriteRequest[] = [{
            PutRequest: {
                Item: {
                    connectionId: { S: connectionId },
                    userId: { S: userId },
                    connectedTime: { S: new Date().toISOString() }
                }
            }
        }];

        return new BatchWriteItemCommand({
            RequestItems: {
                [tableName]: requests
            }
        });
    }
}
