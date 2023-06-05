import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

export interface DelegeteLambda {
    handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult>;
}
