import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { WebSocketEvent } from './websocket-event';

export class WebSocketInnterRoute extends WebSocketEvent {
    protected async inHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        if (this.invalidateParameters(event)) return this.res(400, 'Parameter missing');
        const receiveBody = JSON.parse(event.body as string);
        const env = process.env;

        const command = this.buildQueryCommand(env.DYNAMODB_WEBSOCKET_TABLE);
        const records = await this.dynamoDB.send(command);

        const sendJson = this.buildSendJson(receiveBody);
        const managementApiClient = new ApiGatewayManagementApiClient({
            apiVersion: '2018-11-29',
            endpoint: env.WEBSOCKET_ENDPOINT
        });
        const postCalls = records.Items?.filter(i => i.userId === receiveBody.toUserId)
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

    private buildQueryCommand(tableName: string): QueryCommand {
        const query: QueryCommandInput = { TableName: tableName };
        return new QueryCommand(query);
    }

    private buildSendJson(body: any): string {
        return JSON.stringify({
            toUserId: body.toUserId,
            message: body.message,
            fromUserId: body.fromUserId,
            fromUserName: body.fromUserName,
            fromServerTime: body.fromServerTime,
            apiSendTime: new Date().toISOString()
        });
    }

    private invalidateParameters(event: APIGatewayProxyEvent): boolean {
        if (!event.body) return true;
        const jsonBody = JSON.parse(event.body);

        return !process.env.DYNAMODB_WEBSOCKET_TABLE
            || !process.env.WEBSOCKET_ENDPOINT
            || !jsonBody.toUserId
            || !jsonBody.message;
    }
}
