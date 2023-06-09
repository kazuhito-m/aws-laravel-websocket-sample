import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs';
import { Context } from '../context/context';

export interface EcsClusterProps {
    readonly vpc: Vpc;
    readonly rdsSecurityGroup: SecurityGroup;
    readonly ecsSecurityGroup: SecurityGroup;
    readonly context: Context;
}

export class EcsCluster extends Construct {
    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);


    }
}