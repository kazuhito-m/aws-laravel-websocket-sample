import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { AlwsGlobalStackProps } from './alws-global-stack-props';

export class AlwsGlobalStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsGlobalStackProps) {
        super(scope, id, props);

        const settings = props?.context;
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');

        const containerRepository = new ecr.Repository(this, 'ContainerRepsitory', {
            repositoryName: settings?.containerImageId(),
            imageTagMutability: ecr.TagMutability.IMMUTABLE,
            imageScanOnPush: true,
        });
        // Stack削除時、連鎖削除設定だが、イメージが一つでも在れば削除せず、Stackから外れる。
        containerRepository.addLifecycleRule({
            maxImageCount: 500
        })

        cdk.Tags.of(this).add("Version", settings.packageVersion());
    }
}
