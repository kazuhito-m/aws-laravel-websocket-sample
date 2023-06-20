#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';
import { Test2Stack } from '../lib/test2-stack';
import { TestStack } from '../lib/test-stack';
import { Test3Stack } from '../lib/test3-stack';
import { Test4Stack } from '../lib/test4-stack';

const app = new cdk.App();

const props = {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
};

new InfrastructureStack(app, 'InfrastructureStack', props);
new TestStack(app, 'TestStack', props);
new Test2Stack(app, 'Test2Stack', props);
new Test3Stack(app, 'Test3Stack', props);
new Test4Stack(app, 'Test4Stack', props);
