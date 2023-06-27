import { Construct } from 'constructs';
import { Context } from '../../context/context';
import { EmailIdentity, Identity } from 'aws-cdk-lib/aws-ses';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { ParameterStore } from '../../parameterstore/parameter-store';

export interface SesProps {
    readonly context: Context;
}

export class Ses extends Construct {
    constructor(scope: Construct, id: string, props: SesProps) {
        super(scope, id);

        const context = props.context;
        const hostedZone = this.lookUpHostedZone(context);

        const identity = new EmailIdentity(this, 'Identity', {
            identity: Identity.publicHostedZone(hostedZone),
            mailFromDomain: context.mailDomainName(),
        });
    }

    private lookUpHostedZone(context: Context): IHostedZone {
        const hostedZoneId = new ParameterStore(context, this).hostedZoneId();
        return HostedZone.fromHostedZoneAttributes(this, "HostZone", {
            zoneName: context.global.siteDomain,
            hostedZoneId: hostedZoneId,
        });
    }
}
