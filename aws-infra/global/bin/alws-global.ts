#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlwsGlobalStack } from '../lib/alws-global-stack';
import { Context } from '../lib/context/context';

const app = new cdk.App();

const context = Context.of(app.node);

new AlwsGlobalStack(app, 'AlwsGlobalStack', { context });
