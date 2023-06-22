import { Construct } from 'constructs';
import { Context } from '../../context/context';
import { CfnWebACL } from 'aws-cdk-lib/aws-wafv2';
import { IResolvable } from 'aws-cdk-lib';
import { CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafregional';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface WafAndAuthenticationrops {
    readonly context: Context;
    readonly alb: ApplicationLoadBalancer;
}

export class WafAndAuthentication extends Construct {
    constructor(scope: Construct, id: string, props: WafAndAuthenticationrops) {
        super(scope, id);

        const context = props.context;

        const waf = new CfnWebACL(this, "CreateWAF", {
            name: context.wpk('waf-web-acl'),
            defaultAction: { allow: {} },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: context.wpk('app-wafv2-webacl'),
            },
            rules: this.buildRules(context),
        });

        const webAclAssociation = new CfnWebACLAssociation(this, "AddAlbResource", {
            resourceArn: props.alb.loadBalancerArn,
            webAclId: waf.attrArn,
        });
        webAclAssociation.addDependency(waf);
    }

    private buildRules(context: Context): Array<CfnWebACL.RuleProperty | IResolvable> {
        const rules = Array();



        return rules;
    }
}
