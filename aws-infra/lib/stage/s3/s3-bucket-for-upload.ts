import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { AllowedMethods, CachePolicy, CachedMethods, Distribution, OriginAccessIdentity, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CanonicalUserPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Context } from '../../context/context';
import { ParameterStore } from '../../parameterstore/parameter-store';

export interface S3BucketForUploadProps {
    readonly context: Context;
}

export class S3BucketForUpload extends Construct {
    constructor(scope: Construct, id: string, props: S3BucketForUploadProps) {
        super(scope, id);

        const context = props.context;
        const paramStore = new ParameterStore(context, this);

        const bucket = this.buildS3Bucket(context);

        const distribution = this.buildCloudFrontDistribution(bucket, paramStore, context);

        this.buildDnsARecord(distribution, paramStore, context);
    }

    private buildS3Bucket(context: Context) {
        return new Bucket(this, 'S3CreateBucket', {
            bucketName: context.s3BucketName(),
        });
    }

    private buildCloudFrontDistribution(bucket: Bucket, paramStore: ParameterStore, context: Context) {
        const certificateArn = paramStore.cerificationGlobalArn();
        const certificate = Certificate.fromCertificateArn(this, 'SearchCertificationByArn', certificateArn);

        const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity', {
            comment: context.wpk('image-cloudfront-distribution-oai')
        });

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
            comment: `画像参照用S3バケット ${bucket.bucketName} をパブリック公開するためのCDN。`,
            defaultBehavior: {
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: CachedMethods.CACHE_GET_HEAD,
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                origin: new S3Origin(bucket, {
                    originAccessIdentity: originAccessIdentity,
                    originId: bucket.bucketName + '-s3'
                }),
            },
            priceClass: PriceClass.PRICE_CLASS_200,
            certificate: certificate,
            domainNames: [context.currentStage().uploadStorageDomainName]
        });
        return distribution;
    }

    private buildDnsARecord(distribution: Distribution, paramStore: ParameterStore, context: Context) {
        const hostedZone = HostedZone.fromHostedZoneAttributes(this, "SearchHostZone", {
            zoneName: context.global.siteDomain,
            hostedZoneId: paramStore.hostedZoneId(),
        });

        new ARecord(this, "DnsImageAnameRecord", {
            zone: hostedZone,
            recordName: context.currentStage().uploadStorageDomainName,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
            ttl: Duration.minutes(5),
            comment: `For ${context.currentStageId} CloudFront of Image S3 Record.`
        });
    }
}
