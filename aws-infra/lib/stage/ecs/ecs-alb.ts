import { Construct } from 'constructs';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Cluster, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Duration } from 'aws-cdk-lib';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ApplicationLoadBalancer, ApplicationProtocol, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Context } from '../../context/context';
import { ParameterStore } from '../../parameterstore/parameter-store';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

export interface EcsAlbProps {
    readonly context: Context;
    readonly ecsSecurityGroup: SecurityGroup;
    readonly ecsCluster: Cluster;
    readonly taskDifinition: FargateTaskDefinition;
}

export class EcsAlb extends Construct {
    public readonly alb: ApplicationLoadBalancer;

    constructor(scope: Construct, id: string, props: EcsAlbProps) {
        super(scope, id);

        const context = props.context;
        const hostedZone = this.lookUpHostedZone(context);

        const certificateArn = new ParameterStore(props.context, this).cerificationArn();
        const certificate = Certificate.fromCertificateArn(this, 'SearchCertificationByArn', certificateArn);

        const albFargateService = new ApplicationLoadBalancedFargateService(this, 'AppService', {
            serviceName: context.wpk('app-service'),
            taskDefinition: props.taskDifinition,
            securityGroups: [props.ecsSecurityGroup],
            healthCheckGracePeriod: Duration.seconds(240),
            loadBalancerName: context.wpk('app-alb'),
            cluster: props.ecsCluster,
            domainName: context.applicationDnsARecordName(),
            domainZone: hostedZone,
            protocol: ApplicationProtocol.HTTPS,
            listenerPort: 443,
            certificate: certificate,
            sslPolicy: SslPolicy.RECOMMENDED_TLS,
            redirectHTTP: true,
        });
        albFargateService.targetGroup.configureHealthCheck({
            path: "/login",
            healthyThresholdCount: 2,
            interval: Duration.seconds(15),
        });
        if (context.isContainerAutoScaling()) {
            const config = context.currentStage().container;
            const autoScaling = albFargateService.service.autoScaleTaskCount({
                minCapacity: config.minCapacity,
                maxCapacity: config.maxCapacity,
            });
            autoScaling.scaleOnCpuUtilization('CpuBurstControl', {
                targetUtilizationPercent: config.cpuUtilizationPercent
            })
        }

        this.alb = albFargateService.loadBalancer;
    }

    private lookUpHostedZone(context: Context): IHostedZone {
        const hostedZoneId = new ParameterStore(context, this).hostedZoneId();
        return HostedZone.fromHostedZoneAttributes(this, "HostZone", {
            zoneName: context.global.siteDomain,
            hostedZoneId: hostedZoneId,
        });
    }
}
