import { CfnStage } from "aws-cdk-lib/aws-apigatewayv2";

export class ApiGatewayEndpoint {
    constructor(private readonly apiStage: CfnStage) { }

    public path(): string {
        const s = this.apiStage;
        return `${s.apiId}.execute-api.${s.stack.region}.amazonaws.com/${s.stageName}`;
    }

    public httpUrl(): string {
        return 'https://' + this.path();
    }
}