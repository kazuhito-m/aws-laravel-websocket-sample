import { Construct } from 'constructs';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { PublicHostedZone, CnameRecord } from 'aws-cdk-lib/aws-route53';
import { Duration } from 'aws-cdk-lib';
import { Context } from '../../context/context';

export interface DnsAndCertificateProps {
    readonly context: Context;
}

export class DnsAndCertificate extends Construct {
    constructor(scope: Construct, id: string, props: DnsAndCertificateProps) {
        super(scope, id);

        const context = props.context;

        const domainName = context.global.siteDomain;
        const hostedZone = new PublicHostedZone(this, `${context.systemNameOfPascalCase()}HostedZone`, {
            zoneName: domainName,
            comment: `Site ${domainName} hosted Zone. Created from cdk.`
        });
        const certificate = new Certificate(this, `${context.systemNameOfPascalCase()}Certificate`, {
            certificateName: `${context.systemName()}-common-certificate`,
            domainName: `*.${domainName}`,
            validation: CertificateValidation.fromDns(hostedZone),
        });

        new CnameRecord(this, "DnsCommonCnameRecord", {
            zone: hostedZone,
            recordName: "*",
            domainName: ".",
            ttl: Duration.minutes(5),
            comment: 'All names that do not exist in the A record are treated as "."'
        });
    }
}
