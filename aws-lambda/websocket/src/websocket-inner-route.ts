import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { WebSocketEvent } from './websocket-event';

export class WebSocketInnterRoute extends WebSocketEvent {
    protected async inHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        if (!process.env.DYNAMODB_WEBSOCKET_TABLE
            || !process.env.WEBSOCKET_ENDPOINT
            || !event.toUserId
            || !event.message) return this.res(400, 'Parameter missing');

        const sendJson = this.buildSendJson(event);

        const command = this.buildQueryCommand(event, process.env.DYNAMODB_WEBSOCKET_TABLE);
        const records = await this.dynamoDB.send(command);

        const managementApiClient = new ApiGatewayManagementApiClient({
            apiVersion: '2018-11-29',
            endpoint: process.env.WEBSOCKET_ENDPOINT
        });
        const postCalls = records.Items?.filter(i => i.userId === event.toUserId)
            .map(async ({ connectionId }) => {
                await managementApiClient.send(
                    new PostToConnectionCommand({
                        Data: new TextEncoder().encode(sendJson),
                        ConnectionId: connectionId.S
                    })
                );
            });

        if (postCalls) await Promise.all(postCalls);

        return this.res(200, 'Send WebSocket successed.');
    }

    private buildQueryCommand(event: any, tableName: string): QueryCommand {
        const query: QueryCommandInput = {
            TableName: tableName,
        }
        return new QueryCommand(query);
    }

    private buildSendJson(event: any): string {
        return JSON.stringify({
            toUserId: event.toUserId,
            message: event.message,
            fromUserId: event.fromUserId,
            fromUserName: event.fromUserName,
            fromServerTime: event.fromServerTime,
            apiSendTime: new Date().toISOString()
        });
    }
}
