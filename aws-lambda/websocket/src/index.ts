import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DelegeteLambda } from './delegete-lambda';
import { OnConnectWebSocket } from './websocket/on-connected-websocket';
import { OnDisconnectedWebSocket } from './websocket/on-disconnected-websocket';
import { WebSocketInnterRoute } from './other/websocket-inner-route';

const handlers: { [key: string]: DelegeteLambda; } = {
    'CONNECT': new OnConnectWebSocket(),
    'DISCONNECT': new OnDisconnectedWebSocket(),
    'INNER_ROUTE': new WebSocketInnterRoute()
};

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const handlerId = context.functionName.includes('send-websocket-inner-route-lambda')
        ? 'INNER_ROUTE'
        : event.requestContext.eventType as string;
    const handle = handlers[handlerId];
    if (!handle) return { statusCode: 400, body: 'Handler not found.' };

    return await handle.handler(event, context);
}
