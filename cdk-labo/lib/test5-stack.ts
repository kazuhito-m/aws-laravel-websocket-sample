import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import { IResolvable } from 'aws-cdk-lib';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class Test5Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const waf = new CfnWebACL(this, "CreateWAF", {
            name: 'test-waf-webacl',
            defaultAction: { allow: {} },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: 'test-app-wafv2-webacl',
            },
            rules: this.buildRules(),
        });

        const webAclAssociation = new CfnWebACLAssociation(this, "AddAlbResource", {
            resourceArn: 'arn:aws:elasticloadbalancing:ap-northeast-1:077931172314:loadbalancer/app/alws-production-app-alb/c5ae1f0cb8bebe0b',
            webAclArn: waf.attrArn,
        });
        webAclAssociation.addDependency(waf);
    }

    private buildRules(): Array<CfnWebACL.RuleProperty | IResolvable> {
        const rules = Array();



        return rules;
    }
}
