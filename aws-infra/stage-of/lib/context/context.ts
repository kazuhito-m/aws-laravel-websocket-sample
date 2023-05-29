import { Node } from 'constructs';
import { Environment } from 'aws-cdk-lib';

export interface GlobalContext {
    systemName: string,
    githubAccessToken: string
}

export interface Stage {
    id: string,
    mainDomainFqdn: string,
}

export interface EnvContext extends Environment {
    account: string,
    region: string,
}


export class Context {
    private constructor(
        public readonly env: EnvContext,
        public readonly global: GlobalContext,
        public readonly stages: { [key: string]: Stage; },
        public readonly currentStageId: string
    ) { };

    public static of(node: Node): Context {
        const env: EnvContext = {
            account: process.env.CDK_DEFAULT_ACCOUNT as string,
            region: process.env.CDK_DEFAULT_REGION as string,
        }

        const global = node.tryGetContext('global');
        const stages = node.tryGetContext('stages');
        for (const key in stages) stages[key].id = key;
        const stageId = node.tryGetContext('stageId');

        console.log('stageId ->-> ' + stageId);

        return new Context(env, global, stages, stageId);
    }

    public systemName(): string {
        return this.global.systemName;
    }

    public systemNameOfPascalCase(): string {
        return this.toPascalCase(this.systemName());
    }

    public containerImageId(): string {
        return `${this.systemName()}-app`;
    }

    public packageVersion(): string {
        const ver = process.env.npm_package_version;
        return ver ? ver : '';
    }

    public invalidCurrentStageId(): boolean {
        return !Object.keys(this.stages)
            .includes(this.currentStageId);
    }

    public stageIdsText(): string {
        return Object.keys(this.stages)
            .join(', ');
    }

    public currentStageIdOfPascalCase(): string {
        return this.toPascalCase(this.currentStageId);
    }

    private toPascalCase(text: string): string {
        if (!text) return '';
        return text.substring(0, 1).toUpperCase()
            + text.substring(1);
    }
}
