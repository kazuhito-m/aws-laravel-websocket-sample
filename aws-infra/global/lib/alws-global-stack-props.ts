import { StackProps } from 'aws-cdk-lib'
import { Context } from './context/context'

export interface AlwsGlobalStackProps extends StackProps {
    context: Context,
}
