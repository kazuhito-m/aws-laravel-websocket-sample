import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DelegeteLambda } from './delegete-lambda'

export class WebSocketInnterRoute implements DelegeteLambda {
    public async handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Send WebSocket successed.' }),
        };
    }
}
