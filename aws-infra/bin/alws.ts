#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { Context } from '../lib/context/context';
import { AlwsGlobalStack } from '../lib/global/alws-global-stack';
import { AlwsStageOfStack } from '../lib/stage/alws-stage-of-stack';

const app = new App();

const context = Context.of(app.node);
const props = {
    context,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
};

if (context.currentStageId === 'global') {
    new AlwsGlobalStack(app, 'AlwsGlobalStack', props);
} else {
    const id = `AlwsStageOf${context.currentStageIdOfPascalCase()}Stack`;
    new AlwsStageOfStack(app, id, props);
}
