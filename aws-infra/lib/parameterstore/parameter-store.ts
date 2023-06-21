import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Lazy } from 'aws-cdk-lib';
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
        return Lazy.string({
            produce: () => StringParameter.valueFromLookup(this.scope, parameterName)
        });
    }
}
