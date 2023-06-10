import { IpAddresses, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs';
import { Context } from '../context/context';

export interface VpcAndNetworkProps {
    readonly context: Context;
}

export class VpcAndNetwork extends Construct {
    public vpc: Vpc;
    public rdsSecurityGroup: SecurityGroup;
    public ecsSecurityGroup: SecurityGroup;
    public context: Context;

    constructor(scope: Construct, id: string, props: VpcAndNetworkProps) {
        super(scope, id);

        const vpc = new Vpc(this, props.context.wpp('Vpc'), {
            vpcName: props.context.wpk('vpc'),
            ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
            maxAzs: 2,
            subnetConfiguration: [
                { name: 'Public', subnetType: SubnetType.PUBLIC },
                { name: 'PrivateEcs', subnetType: SubnetType.PRIVATE_WITH_EGRESS },
                { name: 'PrivateRds', subnetType: SubnetType.PRIVATE_ISOLATED }
            ]
        });
        const ecsSecurityGroup = new SecurityGroup(this, 'SecurityGroupEcs', {
            vpc: vpc,
            securityGroupName: props.context.wpk('ecs-sg')
        });
        const rdsSecurityGroup = new SecurityGroup(this, 'SecurityGroupRds', {
            vpc: vpc,
            securityGroupName: props.context.wpk('rds-sg'),
        });
        rdsSecurityGroup.addIngressRule(
            Peer.securityGroupId(ecsSecurityGroup.securityGroupId),
            Port.tcp(3306),
            'from ECS(container) to RDS access.'
        );

        this.vpc = vpc;
        this.rdsSecurityGroup = rdsSecurityGroup;
        this.ecsSecurityGroup = ecsSecurityGroup;
        this.context = props.context;
    }
}
