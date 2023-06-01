#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlwsStageOfStack } from '../lib/alws-stage-of-stack';
import { Context } from '../lib/context/context';

const app = new cdk.App();

const context = Context.of(app.node);

const id = `AlwsStageOf${context.currentStageIdOfPascalCase()}Stack`;
new AlwsStageOfStack(app, id, {
    context,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
