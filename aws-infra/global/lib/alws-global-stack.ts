import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AlwsGlobalStackProps } from './alws-global-stack-props';

export class AlwsGlobalStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsGlobalStackProps) {
        super(scope, id, props);

        console.log('systemName: ' + props?.context.global.systemName);
    }
}
