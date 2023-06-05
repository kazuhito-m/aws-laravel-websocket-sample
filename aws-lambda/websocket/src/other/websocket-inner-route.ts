import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi'
import { ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { WithDynamoDbLambda } from '../with-dynamodb-lambda';

export class WebSocketInnterRoute extends WithDynamoDbLambda {
    protected async inHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        if (this.invalidateParameters(event)) return this.res(400, 'Parameter missing');
        const receiveBody = JSON.parse(event.body as string);

        const records = await this.findAllDynamoDB(receiveBody.toUserId, process.env.DYNAMODB_WEBSOCKET_TABLE);

        console.log('found DynamoDB record count:' + records.Items?.length);

        const sendJson = this.buildSendJson(receiveBody);
        const client = this.buildManagementApiClient();
        const postCalls = records.Items?.map(async ({ connectionId }) => {
            console.log('send target connectionId:' + connectionId.S);
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

    private async findAllDynamoDB(userId: string, tableName: string): Promise<ScanCommandOutput> {
        const docClient = DynamoDBDocumentClient.from(this.dynamoDB, {});

        const scan: ScanCommandInput = {
            TableName: tableName,
            ProjectionExpression: "connectionId, userId",
            FilterExpression: "userId = :uid",
            ExpressionAttributeValues: {
                ":uid": { S: userId },
            },
        };

        return await docClient.send(new ScanCommand(scan));
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
