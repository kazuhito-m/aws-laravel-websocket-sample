import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DelegeteLambda } from './delegete-lambda'

export abstract class WebSocketEvent implements DelegeteLambda {
    protected readonly dynamoDB = new DynamoDBClient({});

    protected abstract inHandler(event: APIGatewayEvent): Promise<APIGatewayProxyResult>;

    public async handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
        try {
            return await this.inHandler(event);
        } catch (err) {
            return this.resOf(500, `Failed: ${JSON.stringify(err)}`);
        }
    }

    protected resOf(status: number, message: string): APIGatewayProxyResult {
        return {
            statusCode: status,
            body: JSON.stringify({ message: message })
        };
    }
}
