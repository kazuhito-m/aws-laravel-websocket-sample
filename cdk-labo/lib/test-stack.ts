import { Stack, StackProps } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class TestStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // FIXME 設定値は、第2引数のIDではない「よくわからない謎のID」になる…。
        new StringParameter(this, 'test-parameter', { stringValue: 'これがでればOK' });
        new StringParameter(this, 'MiuraKazuhito', { stringValue: '三浦一仁' });
        new StringParameter(this, '日本語パラメータ', { stringValue: '文字列が表示されるかな。' });
    }
}
