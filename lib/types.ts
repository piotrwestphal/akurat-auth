import {restApiEndpointOutputKey, userPoolClientIdOutputKey, userPoolIdOutputKey} from './consts'

export type UserParams = Readonly<{
    email: string
    password: string
}>

export type UserMgmtParams = Readonly<{
    adminUsers: UserParams[]
    autoConfirmedEmails: string[]
    acceptedEmailDomains: string[]
}>

export type ApiParams = Readonly<{
    apiPrefix: string
    certArn: string
    userPoolIdParamName: string
    domainPrefix?: string
}>

export type CdkOutputs = Readonly<{
    [restApiEndpointOutputKey]: string
    [userPoolClientIdOutputKey]: string
    [userPoolIdOutputKey]: string
}>
