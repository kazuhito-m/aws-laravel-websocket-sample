import { Construct } from 'constructs';
import { Context } from '../../context/context';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface WafAndAuthenticationrops {
    readonly context: Context;
    readonly alb: ApplicationLoadBalancer;
}

export class WafAndAuthentication extends Construct {
    constructor(scope: Construct, id: string, props: WafAndAuthenticationrops) {
        super(scope, id);

        const context = props.context;

        const waf = new CfnWebACL(this, "CreateWaf", {
            name: context.wpk('waf-webacl'),
            defaultAction: { allow: {} },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                sampledRequestsEnabled: true,
                metricName: context.wpk('app-wafv2-webacl-metric'),
            },
            rules: this.buildRules(context),
        });

        const webAclAssociation = new CfnWebACLAssociation(this, "WafAddAlbResource", {
            resourceArn: props.alb.loadBalancerArn,
            webAclArn: waf.attrArn,
        });
        webAclAssociation.addDependency(waf);
    }

    private buildRules(context: Context): Array<CfnWebACL.RuleProperty> {
        const rules = Array<CfnWebACL.RuleProperty>();

        rules.push(this.basicAuthorizationRule());

        return rules;
    }

    private basicAuthorizationRule(): CfnWebACL.RuleProperty {
        const userAndPass = 'testuser:testpass';
        const encodedUP = Buffer.from(userAndPass).toString('base64');

        return {
            name: 'basic-authorization-rule',
            priority: 0,
            statement: {
                notStatement: {
                    statement: {
                        byteMatchStatement: {
                            searchString: `Basic ${encodedUP}`,
                            fieldToMatch: {
                                singleHeader: { name: 'authorization' }
                            },
                            textTransformations: [{
                                priority: 0,
                                type: 'NONE'
                            }],
                            positionalConstraint: 'EXACTLY',
                        }
                    }
                }
            },
            action: {
                block: {
                    customResponse: {
                        responseCode: 401,
                        responseHeaders: [{
                            name: 'www-authenticate',
                            value: 'Basic'
                        }]
                    }
                }
            },
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: false,
                metricName: "BasicAuthRule"
            }
        }
    }
}
