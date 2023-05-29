import { Node } from 'constructs';
import { Environment } from 'aws-cdk-lib';

export interface GlobalContext {
    systemName: string,
    githubAccessToken: string
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

        const global = node.tryGetContext('global');

        return new Context(env, global);
    }

    public systemName(): string {
        return this.global.systemName;
    }

    public systemNameOfPascalCase(): string {
        const name = this.systemName();
        return name.substring(0, 1).toUpperCase()
            + name.substring(1);
    }

    public containerImageId(): string {
        return `${this.systemName()}-app`;
    }

    public packageVersion(): string {
        const ver = process.env.npm_package_version;
        return ver ? ver : '';
    }
}
