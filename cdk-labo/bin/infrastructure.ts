#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { Test2Stack } from '../lib/test2-stack';
import { TestStack } from '../lib/test-stack';

const app = new cdk.App();

const props = {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
};

new InfrastructureStack(app, 'InfrastructureStack', props);
new TestStack(app, 'TestStack', props);
new Testack(app, 'Test2Stack', props);
