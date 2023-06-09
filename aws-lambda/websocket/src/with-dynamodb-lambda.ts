import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DelegeteLambda } from './delegete-lambda'

export abstract class WithDynamoDbLambda implements DelegeteLambda {
    protected readonly dynamoDB = new DynamoDBClient({});

    protected abstract inHandler(event: APIGatewayEvent): Promise<APIGatewayProxyResult>;

    public async handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
        try {
            return await this.inHandler(event);
        } catch (err) {
            console.log('WebSocketEvent.handler() catch Exception.');
            console.log(err);
            console.log(err.Stack);
            return this.res(500, `{"Failed": ${JSON.stringify(err)}}`);
        }
    }

    protected res(status: number, message: string): APIGatewayProxyResult {
        console.log(`Lambda end. response|httpStatus:${status}, message:${message}`);
        return {
            statusCode: status,
            body: JSON.stringify({ message: message })
        };
    }
}
