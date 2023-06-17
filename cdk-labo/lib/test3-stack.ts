import { Stack, StackProps } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class Test3Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, 'Test3CreateBucket', {
            bucketName: "laravel-test3-upload-bucket",
            publicReadAccess: true,
            blockPublicAccess: new BlockPublicAccess({
                blockPublicAcls: false,
                ignorePublicAcls: false,
                blockPublicPolicy: false,
                restrictPublicBuckets: false,
            })
        });
        // bucket.addToResourcePolicy(PolicyStatement.fromJson(
        //     {
        //         "Sid": "PublicReadGetObject",
        //         "Effect": "Allow",
        //         "Principal": "*",
        //         "Action": "s3:GetObject",
        //         "Resource": "arn:aws:s3:::laravel-test3-upload-bucket/*"
        //     }
        // ));
    }
}
