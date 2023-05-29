import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AlwsStackProps } from './alws-stack-props';

export class AlwsStageOfStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: AlwsStackProps) {
        super(scope, id, props);

        const settings = props?.context;
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');

        if (settings.invalidCurrentStageId())
            throw new Error(`stageIdが正しく指定されていません。(${settings.currentStageId}) 有効なstageIdは ${settings.stageIdsText()} のいずれかです。`);

        console.log(settings.currentStageIdOfPascalCase());
    }
}
