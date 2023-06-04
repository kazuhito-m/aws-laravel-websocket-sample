import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DelegeteLambda } from './delegete-lambda'

export class WebSocketInnterRoute implements DelegeteLambda {
    public async handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
        return this.res(200, 'Send WebSocket successed.');
    }

    protected res(status: number, message: string): APIGatewayProxyResult {
        return {
            statusCode: status,
            body: JSON.stringify({ message: message })
        };
    }
}
