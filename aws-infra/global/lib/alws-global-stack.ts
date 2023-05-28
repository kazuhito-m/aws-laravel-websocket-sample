import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { LifecycleHook } from 'aws-cdk-lib/aws-autoscaling';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { Duplex } from 'stream';
import { AlwsGlobalStackProps } from './alws-global-stack-props';

export class AlwsGlobalStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsGlobalStackProps) {
        super(scope, id, props);

        const settings = props?.context;

        const containerRepository = new ecr.Repository(this, 'ContainerRepsitory', {
            repositoryName: settings?.containerImageId(),
            imageTagMutability: ecr.TagMutability.IMMUTABLE,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteImages: false,  // Stack削除時、連鎖削除設定だが、イメージが一つでも在れば削除しない。            
        });
        containerRepository.addLifecycleRule({
            maxImageAge: Duration.days(180),
            maxImageCount: 1000
        })
    }
}
