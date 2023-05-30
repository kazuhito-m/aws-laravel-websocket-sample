import { StackProps } from 'aws-cdk-lib'
import { Context } from './context/context'

export interface AlwsStackProps extends StackProps {
    context: Context,
}
