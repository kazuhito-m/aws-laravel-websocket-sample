import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, CachePolicy, CachedMethods, Distribution, OriginAccessIdentity, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CanonicalUserPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class Test4Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, 'Test4CreateBucket', {
            bucketName: "laravel-test4-upload-bucket",
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity',
            { comment: 'website-distribution-originAccessIdentity' }
        );

        bucket.addToResourcePolicy(new PolicyStatement({
            actions: ['s3:GetObject'],
            effect: Effect.ALLOW,
            principals: [
                new CanonicalUserPrincipal(
                    originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
                ),
            ],
            resources: [`${bucket.bucketArn}/*`],
        }));

        const distribution = new Distribution(this, 'distribution', {
            comment: 'for laravel-test4-upload-bucket s3 bucket CDN.',
            defaultBehavior: {
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: CachedMethods.CACHE_GET_HEAD,
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                origin: new S3Origin(bucket, {
                    originAccessIdentity: originAccessIdentity,
                }),
            },
            priceClass: PriceClass.PRICE_CLASS_ALL,
        });
    }
}
