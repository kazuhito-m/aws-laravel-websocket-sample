import { Construct } from 'constructs';
import { InstanceType, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Context } from '../../context/context';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';

export interface S3BucketForUploadProps {
    readonly context: Context;
}

export class S3BucketForUpload extends Construct {
    constructor(scope: Construct, id: string, props: S3BucketForUploadProps) {
        super(scope, id);

        const context = props.context;

        const bucket = new Bucket(this, 'S3CreateBucket', {
            bucketName: context.s3BucketName(),
            publicReadAccess: true,
            blockPublicAccess: new BlockPublicAccess({
                blockPublicAcls: false,
                ignorePublicAcls: false,
                blockPublicPolicy: false,
                restrictPublicBuckets: false,
            })
        });
    }
}
