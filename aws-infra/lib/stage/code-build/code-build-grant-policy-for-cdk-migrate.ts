import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { IProject, Project } from 'aws-cdk-lib/aws-codebuild';
import { ManagedPolicy, IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CodeBuildGrantPolicyProps } from './code-build-grant-policy';
import { Context } from '../../context/context';


/**
 * CodeBuildで「CDKをキックする」ための権限設定Construct。
 * 
 * 「LambdaとECSにコンテナをデプロイする」権限も上位として包含するため、強権のこちらを用いる。
 * (CDKの実行を行わない場合は、CodeBuildGrantPolicyを使用する。)
 */
export class CodeBuildGrantPolicyForCdkMigrate extends Construct {
    constructor(stack: Stack, id: string, props: CodeBuildGrantPolicyProps) {
        super(stack, id);

        this.grantPolicy(props.codeBuildProject, props, stack);
    }

    private grantPolicy(
        project: IProject,
        props: CodeBuildGrantPolicyProps,
        stack: Stack
    ) {
        const role = project.role as IRole;
        const awsManagedPolicyNames = [
            'AWSCodeBuildAdminAccess', // TODO AWSCodeBuildDeveloperAccess に変えられないか？
            'AmazonECS_FullAccess',
            'AmazonRDSFullAccess',
            'AmazonVPCFullAccess',
            `AmazonAPIGatewayAdministrator`,
            'AWSLambda_FullAccess',
            'AmazonDynamoDBFullAccess'
        ];
        for (const name of awsManagedPolicyNames) {
            role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName(name));
        }

        const context = props.context;
        const me = Stack.of(this).account;
        role.addToPrincipalPolicy(PolicyStatement.fromJson({
            "Effect": "Allow",
            "Action": "ssm:GetParameters",
            "Resource": `arn:aws:ssm:${stack.region}:${me}:parameter/${context.systemName()}-*`
        }));
    }
}
