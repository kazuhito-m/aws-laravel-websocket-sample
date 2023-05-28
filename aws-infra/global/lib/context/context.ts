import {Node} from 'constructs';
import { Environment } from 'aws-cdk-lib';

export interface GlobalContext {
    systemName: string
}

export interface EnvContext extends Environment {
    account: string,
    region: string,
}

export class Context {
    private constructor(
        public readonly env: EnvContext,
        public readonly global: GlobalContext,
    ) { };

    public static of(node: Node): Context {
        const env: EnvContext = {
            account: process.env.CDK_DEFAULT_ACCOUNT as string,
            region: process.env.CDK_DEFAULT_REGION as string,
        }

        const global =  node.tryGetContext('global');
        
        return new Context(env , global);
    }
}
