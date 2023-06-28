import { Construct } from 'constructs';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { Context } from '../../context/context';

export interface EcrProps {
    readonly context: Context;
}

export class Ecr extends Construct {
    public readonly repositories: Repository[];

    constructor(scope: Construct, id: string, props: EcrProps) {
        super(scope, id);

        const context = props.context;

        const repositories: Repository[] = [];
        [context.containerRegistryNameApp(), context.containerRegistryNameLambda()].forEach(name => {
            const containerRepository = new Repository(scope, 'ContainerRepsitory_' + name, {
                repositoryName: name,
                imageTagMutability: TagMutability.IMMUTABLE,
                imageScanOnPush: false, // 脆弱性検査は Amazon Inspector に移譲する
            });
            // Stack削除時、連鎖削除設定だが、イメージが一つでも在れば削除せず、Stackから外れる。
            containerRepository.addLifecycleRule({
                maxImageCount: 500
            });
            repositories.push(containerRepository);
        });

        this.repositories = repositories;
    }
}
