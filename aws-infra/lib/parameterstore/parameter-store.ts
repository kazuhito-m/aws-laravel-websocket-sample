import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Context } from '../context/context';

export class ParameterStore {
    constructor(
        private readonly context: Context,
        private readonly scope: Construct,
    ) { }

    public cerificationArn(): string {
        return this.lookup(this.certArnPraStoreName());
    }

    public cerificationGlobalArn(): string {
        return this.lookup(this.certGlobalArnPraStoreName());
    }

    public hostedZoneId(): string {
        return this.lookup(this.hostedZoneIdPraStoreName());
    }


    public registerCerificationArn(value: string): void {
        this.register(this.certArnPraStoreName(), value);
    }

    public registerHostedZoneId(value: string): void {
        this.register(this.hostedZoneIdPraStoreName(), value);
    }


    public certArnPraStoreName(): string {
        return `${this.context.systemName()}-certification-arn`;
    }

    public certGlobalArnPraStoreName(): string {
        return `${this.context.systemName()}-certification-global-arn`;
    }

    public hostedZoneIdPraStoreName(): string {
        return `${this.context.systemName()}-hostedzone-id`;
    }


    private lookup(parameterName: string): string {
        return StringParameter.valueFromLookup(this.scope, parameterName);
    }

    private register(parameterName: string, value: string): StringParameter {
        return new StringParameter(this.scope, parameterName, { stringValue: value });
    }
}
