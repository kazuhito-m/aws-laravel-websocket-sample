import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, CachePolicy, CachedMethods, Distribution, OriginAccessIdentity, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CanonicalUserPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';

export class Test4Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const certificateArn = StringParameter.valueFromLookup(this, "alws-certification-arn-global");
        const certificate = Certificate.fromCertificateArn(this, 'test', certificateArn);

        const hostedZoneId = StringParameter.valueFromLookup(this, "alws-hostedzone-id");
        const cfDomainName = 'cdk-sample-image-s3.testcity.click';


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
            certificate: certificate,
            domainNames: [cfDomainName]
        });

        const hostedZone = HostedZone.fromHostedZoneAttributes(this, "HostZone", {
            zoneName: 'testcity.click',
            hostedZoneId: hostedZoneId,
        });
        new ARecord(this, "DnsImageAnameRecord", {
            zone: hostedZone,
            recordName: cfDomainName,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
            ttl: Duration.minutes(5),
            comment: 'CloudFront of Image S3 Record.'
        });
    }
}
