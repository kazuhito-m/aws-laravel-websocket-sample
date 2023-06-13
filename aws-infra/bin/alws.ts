#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlwsGlobalStack } from '../lib/global/alws-global-stack';
import { Context } from '../lib/context/context';
import { AlwsStageOfStack } from '../lib/stage/alws-stage-of-stack';

const app = new cdk.App();

const context = Context.of(app.node);
const props = {
    context,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
};

new AlwsGlobalStack(app, 'AlwsGlobalStack', props);

const id = `AlwsStageOf${context.currentStageIdOfPascalCase()}Stack`;
new AlwsStageOfStack(app, id, props);