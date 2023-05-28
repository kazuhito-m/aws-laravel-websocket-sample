#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlwsGlobalStack } from '../lib/alws-global-stack';

const app = new cdk.App();
new AlwsGlobalStack(app, 'AlwsGlobalStack', {
});
