import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { OnConnectWebSocket } from './on-connected-websocket';
import { OnDisconnectedWebSocket } from './on-disconnected-websocket';
import { DelegeteLambda } from './delegete-lambda';

const handlers: { [key: string]: DelegeteLambda; } = {
    'CONNECT': new OnConnectWebSocket(),
    'DISCONNECT': new OnDisconnectedWebSocket(),
};

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const handle = handlers[ event.requestContext.eventType as string];
    if (!handle) return { statusCode: 400, body: 'Handler not found.' };
    return await handle.handler(event, context);
}
