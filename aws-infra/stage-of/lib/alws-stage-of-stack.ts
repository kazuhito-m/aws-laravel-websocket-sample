import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';
import { Context } from './context/context';

export class AlwsStageOfStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context as Context;
        this.confimationOfPreconditions(props?.context);

        // VPC & networks
        const vpc = new ec2.Vpc(this, settings.wpp('Vpc'), {
            vpcName: settings.wpk('vpc'),
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'sn-public',
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    name: 'sn-private-ecs',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    name: 'sn-private-rds',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                }
            ]
        });
        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroupEcs', {
            vpc: vpc,
            securityGroupName: 'sg-ecs'
        });

        this.setTag("Stage", settings.currentStageId);
        this.setTag("Version", settings.packageVersion());
    }

    private setTag(key: string, value: string): void {
        cdk.Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');

        if (settings.invalidCurrentStageId())
            throw new Error(`stageIdが正しく指定されていません。(${settings.currentStageId}) 有効なstageIdは ${settings.stageIdsText()} のいずれかです。`);
    }
}
