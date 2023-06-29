import { Stack, StackProps } from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib/core';

import { Context } from '../context/context';
import { Ses } from './ses/ses';
import { Ecr } from './ecr/ecr';
import { CodeBuildForTagBuild } from './code-build/code-build-for-tag-build';

export interface AlwsStackProps extends StackProps {
    context: Context,
}

export class AlwsGlobalStack extends Stack {
    constructor(stack: Stack, id: string, props?: AlwsStackProps) {
        super(stack, id, props);

        const context = props?.context as Context;
        this.confimationOfPreconditions(context);

        const ecr = new Ecr(stack, 'CreateEcr', { context: context });

        new CodeBuildForTagBuild(stack, 'CreateCodeBuild', {
            context: context,
            repositories: ecr.repositories,
        })

        // 一旦コメントアウト。ここは「手動操作」で作成する(ということを手順書ベースで書いておく)
        // new DnsAndCertificate(stack, 'CreateDnsAndCertificate', { context: context });

        new Ses(stack, 'CreateSes', { context: context });

        this.setTag("Version", context.packageVersion());
    }

    private setTag(key: string, value: string): void {
        Tags.of(this).add(key, value);
    }

    private confimationOfPreconditions(settings?: Context): void {
        if (!settings) throw new Error('cdk.json の内容が読めませんでした。');
    }
}
