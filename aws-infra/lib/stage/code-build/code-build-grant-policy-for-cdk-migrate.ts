import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';
import { Project } from 'aws-cdk-lib/aws-codebuild';
import { ManagedPolicy, IRole } from 'aws-cdk-lib/aws-iam';
import { CodeBuildGrantPolicyProps } from './code-build-grant-policy';


/**
 * CodeBuildで「CDKをキックする」ための権限設定Construct。
 * 
 * 「LambdaとECSにコンテナをデプロイする」権限も上位として包含するため、強権のこちらを用いる。
 * (CDKの実行を行わない場合は、CodeBuildGrantPolicyを使用する。)
 */
export class CodeBuildGrantPolicyForCdkMigrate extends Construct {
    constructor(stack: Stack, id: string, props: CodeBuildGrantPolicyProps) {
        super(stack, id);

        this.grantPolicy(props.codeBuildProject);
    }

    private grantPolicy(project: Project): void {
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
    }
}
