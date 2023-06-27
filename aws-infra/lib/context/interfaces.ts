import { Environment } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';

export interface GlobalContext {
    systemName: string,
    siteDomain: string,
    mailServerName: string,
}

export interface Stage {
    id: string,
    migrateInfrastructure: boolean,
    withBasicAuthentication: boolean,
    siteFqdn: string,
    apiFqdn: string,
    uploadStorageDomainName: string,
    rds: RdsSettings,
    container: ContainerSettings,
}

export interface RdsSettings {
    class: InstanceClass,
    size: InstanceSize,
    multiAz: boolean
}

export interface ContainerSettings {
    minCapacity: number,
    maxCapacity: number,
    cpuUtilizationPercent: number
}

export interface EnvContext extends Environment {
    account: string,
    region: string,
}
