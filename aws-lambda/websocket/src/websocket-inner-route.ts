import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { QueryCommand, QueryCommandInput, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { WebSocketEvent } from './websocket-event';

export class WebSocketInnterRoute extends WebSocketEvent {
    protected async inHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        if (this.invalidateParameters(event)) return this.res(400, 'Parameter missing');
        const receiveBody = JSON.parse(event.body as string);

        const records = await this.findAllDynamoDB(receiveBody, process.env.DYNAMODB_WEBSOCKET_TABLE);

        const sendJson = this.buildSendJson(receiveBody);
        const client = this.buildManagementApiClient();
        const postCalls = records.Items?.filter(i => i.userId === receiveBody.toUserId)
            .map(async ({ connectionId }) => {
                await client.send(
                    new PostToConnectionCommand({
                        Data: new TextEncoder().encode(sendJson),
                        ConnectionId: connectionId.S
                    })
                );
            });
        if (postCalls) await Promise.all(postCalls);

        return this.res(200, 'Send WebSocket successed.');
    }

    private async findAllDynamoDB(receiveBody: any, tableName: string): Promise<QueryCommandOutput> {
        const docClient = DynamoDBDocumentClient.from(this.dynamoDB, {});

        const query: QueryCommandInput = {
            TableName: tableName,
            ProjectionExpression: "connectionId, userId",
            ExpressionAttributeValues: {
                ":id": { S: receiveBody.fromUserId },
            },
            KeyConditionExpression: "userId = :id",
        };
        const command = new QueryCommand(query);

        return await docClient.send(command);
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

    private buildManagementApiClient(): ApiGatewayManagementApiClient {
        return new ApiGatewayManagementApiClient({
            apiVersion: '2018-11-29',
            endpoint: process.env.WEBSOCKET_ENDPOINT
        });
    }
}
