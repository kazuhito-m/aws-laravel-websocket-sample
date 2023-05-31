import { Node } from 'constructs';
import { Environment } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';

export interface GlobalContext {
    systemName: string,
    siteDomain: string,
    githubAccessToken: string
}

export interface Stage {
    id: string,
    siteFqdn: string,
    apiFqdn: string,
    rds: RdsSettings,
    container: ContainerSettings,
}

export interface RdsSettings {
    class: InstanceClass,
    size: InstanceSize,
    multiAz: boolean
}

export interface ContainerSettings {
    minCapacity: number,
    maxCapacity: number,
    cpuUtilizationPercent: number
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

    public currentStage(): Stage {
        return this.stages[this.currentStageId];
    }


    public currentStageIdOfPascalCase(): string {
        return this.toPascalCase(this.currentStageId);
    }

    public systemPrefixOfPascalCase(): string {
        return `${this.systemNameOfPascalCase()}${this.currentStageIdOfPascalCase()}`;
    }

    public systemPrefixOfKebapCase(): string {
        return `${this.systemName()}-${this.currentStageId}`;
    }

    public wpp(id: string): string {
        return this.systemPrefixOfPascalCase() + id;
    }

    public wpk(id: string): string {
        return `${this.systemPrefixOfKebapCase()}-${id}`;
    }

    public isContainerAutoScaling(): boolean {
        const settings = this.currentStage().container;
        return settings.minCapacity > 1
            && settings.maxCapacity > 1
            && settings.maxCapacity > settings.minCapacity;
    }

    private toPascalCase(text: string): string {
        if (!text) return '';
        return text.substring(0, 1).toUpperCase()
            + text.substring(1);
    }
}
