#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlwsStageOfStack } from '../lib/alws-stage-of-stack';

const app = new cdk.App();
new AlwsStageOfStack(app, 'AlwsStageOfStack', {});