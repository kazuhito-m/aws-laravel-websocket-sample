import { Construct } from 'constructs';
import { InstanceType, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion, SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { SecretValue } from 'aws-cdk-lib';
import { Context } from '../../context/context';

export interface RdsProps {
    readonly context: Context;
    readonly vpc: Vpc;
    readonly rdsSecurityGroup: SecurityGroup;
    readonly ecsSecurityGroup: SecurityGroup;
}

export class ApplicationRds extends Construct {
    public readonly appRds: DatabaseInstance;
    public readonly rdsSecret: Secret;

    constructor(scope: Construct, id: string, props: RdsProps) {
        super(scope, id);

        const context = props.context;

        const rdsSecret = new Secret(this, context.wpp("RdsAppSecret"), {
            secretName: context.wpk("rds-app-secret"),
            generateSecretString: {
                excludePunctuation: true,
                includeSpace: false,
                secretStringTemplate: JSON.stringify({ username: 'user' }),
                generateStringKey: 'password',
            },
        });
        const rdsCredential = Credentials.fromPassword(
            rdsSecret.secretValueFromJson('username').unsafeUnwrap(),
            SecretValue.unsafePlainText(
                rdsSecret.secretValueFromJson('password').unsafeUnwrap()
            )
        );

        const rdsSettings = context.currentStage().rds;

        const appRds = new DatabaseInstance(this, context.wpp("AppRds"), {
            instanceIdentifier: context.wpk('app-rds'),
            engine: DatabaseInstanceEngine.mysql({ version: MysqlEngineVersion.VER_8_0_32 }),
            instanceType: InstanceType.of(
                rdsSettings.class,
                rdsSettings.size
            ),
            multiAz: rdsSettings.multiAz,
            databaseName: context.systemName(),
            credentials: rdsCredential,
            vpc: props.vpc,
            vpcSubnets: props.vpc.selectSubnets(),
            securityGroups: [props.rdsSecurityGroup],
            subnetGroup: new SubnetGroup(this, context.wpp("AppRdsSubnetGroup"), {
                subnetGroupName: context.wpk('app-rds-sg'),
                description: 'for App RDS Subnets(only Private and Isolated)',
                vpc: props.vpc,
                vpcSubnets: props.vpc.selectSubnets({
                    subnetType: SubnetType.PRIVATE_ISOLATED
                }),
            })
        });

        this.appRds = appRds;
        this.rdsSecret = rdsSecret;
    }
}
