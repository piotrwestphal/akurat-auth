import {RemovalPolicy} from 'aws-cdk-lib'
import {CognitoUserPoolsAuthorizer, LambdaIntegration, Resource} from 'aws-cdk-lib/aws-apigateway'
import {AccountRecovery, UserPool} from 'aws-cdk-lib/aws-cognito'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {CognitoUser} from '../common/cognito-user'
import {UserMgmtParams} from '../types'

type UserMgmtProps = Readonly<{
    envName: string
    disableUsersApi?: true
    restApiV1Resource: Resource
    userMgmt: UserMgmtParams
    logRetention: RetentionDays
}>

export class UserMgmt extends Construct {

    readonly userPool: UserPool

    constructor(scope: Construct,
                id: string,
                {
                    envName,
                    restApiV1Resource,
                    userMgmt: {
                        adminUsers,
                        autoConfirmedEmails,
                        acceptedEmailDomains,
                    },
                    disableUsersApi,
                    logRetention,
                }: UserMgmtProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const preSignupFunc = new NodejsFunction(this, 'PreSignupFunc', {
            description: 'Pre signing up user',
            entry: join(__dirname, 'lambdas', 'pre-signup.ts'),
            environment: {
                AUTO_CONFIRMED_EMAILS: autoConfirmedEmails.join(','),
                ACCEPTED_EMAIL_DOMAINS: acceptedEmailDomains.join(','),
            },
            ...commonProps,
        })

        this.userPool = new UserPool(this, 'UserPool', {
            userPoolName: `${envName}-UserPool`,
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            lambdaTriggers: {
                preSignUp: preSignupFunc,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireDigits: true,
                requireUppercase: false,
                requireSymbols: false,
            },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            removalPolicy: RemovalPolicy.DESTROY,
        })

        adminUsers.forEach(user => {
            new CognitoUser(this, `User-${user.email}`, {userPool: this.userPool, ...user})
        })

        if (!disableUsersApi) {
            const authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
                cognitoUserPools: [this.userPool],
            })

            const usersResource = restApiV1Resource.addResource('users', {
                defaultMethodOptions: {
                    authorizer,
                },
            })
            const getAllUsersFunc = new NodejsFunction(this, 'GetAllUsersFunc', {
                description: 'List users',
                entry: join(__dirname, 'lambdas', 'get-all.ts'),
                environment: {
                    USER_POOL_ID: this.userPool.userPoolId,
                },
                ...commonProps,
            })
            usersResource.addMethod('GET', new LambdaIntegration(getAllUsersFunc))
            this.userPool.grant(getAllUsersFunc, 'cognito-idp:ListUsers')

            const userByIdResource = usersResource.addResource('{id}')
            const getUserFunc = new NodejsFunction(this, 'GetUserFunc', {
                description: 'Get a user',
                entry: join(__dirname, 'lambdas', 'get.ts'),
                environment: {
                    USER_POOL_ID: this.userPool.userPoolId,
                },
                ...commonProps,
            })
            userByIdResource.addMethod('GET', new LambdaIntegration(getUserFunc))
            this.userPool.grant(getUserFunc, 'cognito-idp:ListUsers')
        }
    }
}