import { Construct } from 'constructs';
import { InstanceType, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion, SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { SecretValue } from 'aws-cdk-lib';
import { Context } from '../../context/context';

export interface S3BucketForUploadProps {
    readonly context: Context;
}

export class S3BucketForUpload extends Construct {
    public readonly appRds: DatabaseInstance;
    public readonly rdsSecret: Secret;

    constructor(scope: Construct, id: string, props: S3BucketForUploadProps) {
        super(scope, id);

        const context = props.context;

    }
}
