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
    domainPrefix: string
    certArn: string
}>