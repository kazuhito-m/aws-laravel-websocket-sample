import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { WebSocketEvent } from './websocket-event';

export class WebSocketInnterRoute extends WebSocketEvent {
    protected async inHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        if (this.invalidateParameters(event)) return this.res(400, 'Parameter missing');
        const receiveBody = JSON.parse(event.body as string);

        const records = await this.findAllDynamoDB(receiveBody, process.env.DYNAMODB_WEBSOCKET_TABLE);

        console.log('見つかったレコード数:' + records.Items?.length);
        records.Items?.forEach(i => console.log('単品でループを回してみる. connectionId:' + i.connectionId));

        const sendJson = this.buildSendJson(receiveBody);
        const client = this.buildManagementApiClient();
        const postCalls = records.Items?.map(async ({ connectionId }) => {

            console.log('見つかったconnectionId:' + connectionId);

            await client.send(
                new PostToConnectionCommand({
                    Data: new TextEncoder().encode(sendJson),
                    ConnectionId: connectionId.S
                })
            );
        });
        if (postCalls) await Promise.all(postCalls);

        console.log('メソッドの終盤、このまま終わってしまうのか…一度固定値で投げてみる。');

        return this.res(200, 'Send WebSocket successed.');
    }

    private async findAllDynamoDB(receiveBody: any, tableName: string): Promise<ScanCommandOutput> {
        const docClient = DynamoDBDocumentClient.from(this.dynamoDB, {});

        const scan: ScanCommandInput = {
            TableName: tableName,
            ProjectionExpression: "connectionId, userId",
            FilterExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": { S: receiveBody.toUserId },
            },
        };
        const command = new ScanCommand(scan);

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
