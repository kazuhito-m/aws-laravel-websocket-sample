import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib/core";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import * as route53 from "aws-cdk-lib/aws-route53";

import { WebServerInstance } from './constructs/web-server-instance';

export class InfrastructureStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "BlogVpc", {
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        });

        const EC2_INSTANCE_COUNT = 2;
        const webServers = [...Array(EC2_INSTANCE_COUNT)]
            .map((_, i) => i + 1)
            .map(i => new WebServerInstance(this, `WebServer${i}`, { vpc }));

        const dbServer = new rds.DatabaseInstance(this, "WordPressDB", {
            vpc,
            engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_31 }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
            databaseName: "wordpress",
            multiAz: true,
        });

        // RDSのエンドポイントをDNSで別名に置き換える
        const zone = new route53.PrivateHostedZone(this, 'HostedZone', {
            zoneName: 'invpc',
            vpc,
        })
        new route53.CnameRecord(this, `CnameRdsRecord`, {
            zone,
            recordName: 'rds',
            domainName: dbServer.dbInstanceEndpointAddress,
        }).applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        for (let webServer of webServers) {
            dbServer.connections.allowDefaultPortFrom(webServer.instance);
        }

        const alb = new elbv2.ApplicationLoadBalancer(this, "LoadBalancer", {
            vpc,
            internetFacing: true,
        });
        const listener = alb.addListener("Listener", {
            port: 80,
        });
        listener.addTargets("ApplicationFleet", {
            port: 80,
            targets: [new targets.InstanceTarget(webServers[0].instance, 80),
            // ターゲットに 2 台目のインスタンスを追加
            new targets.InstanceTarget(webServers[1].instance, 80)],
            healthCheck: {
                path: "/wp-includes/images/blank.gif",
            },
        });

        for (let webServer of webServers) {
            webServer.instance.connections.allowFrom(alb, ec2.Port.tcp(80));
        }
    }
}
