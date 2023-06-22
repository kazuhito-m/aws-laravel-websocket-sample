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
            resourceArn: 'arn:aws:elasticloadbalancing:ap-northeast-1:000000000000:loadbalancer/app/xxx-app-alb/xxx',
            webAclArn: waf.attrArn,
        });
        webAclAssociation.addDependency(waf);
    }

    private buildRules(): Array<CfnWebACL.RuleProperty | IResolvable> {
        const rules = Array<CfnWebACL.RuleProperty>();

        rules.push(this.basicAuthorizationRule());

        return rules;
    }

    private basicAuthorizationRule(): CfnWebACL.RuleProperty {
        return {
            name: 'basic-authorization-rule',
            priority: 0,
            statement: {
                notStatement: {
                    statement: {
                        byteMatchStatement: {
                            searchString: 'Basic dGVzdDp0ZXN0', // test:test
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
