import { Stack, StackProps } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class Test2Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const values: string[] = Array(3);

        // FIXME これが取れない…TestStack側の設定値は「よくわからない謎のID」になる…。
        values[0] = StringParameter.valueFromLookup(this, 'test-parameter');
        values[1] = StringParameter.valueFromLookup(this, 'MiuraKazuhito');
        values[2] = StringParameter.valueFromLookup(this, '日本語パラメータ');

        new StringParameter(this, 'TotalALlValue', { stringValue: values.join(', ') });

        console.log('Test2です。');
    }
}
