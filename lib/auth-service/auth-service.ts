import {Duration} from 'aws-cdk-lib'
import {LambdaIntegration, Resource, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {UserPool} from 'aws-cdk-lib/aws-cognito'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {refreshTokenValidityDurationDays} from './auth.consts'
import {authReqSchema} from './schemas/auth-req.schema'
import {confirmForgotPassReqSchema} from './schemas/confirm-forgot-pass-req.schema'
import {confirmSignupReqSchema} from './schemas/confirm-signup-req.schema'
import {forgotPassReqSchema} from './schemas/forgot-pass-req.schema'

type AuthProps = Readonly<{
    restApi: RestApi
    restApiV1Resource: Resource
    userPool: UserPool
    logRetention: RetentionDays
}>

export class AuthService extends Construct {

    readonly userPoolClientId: string

    constructor(scope: Construct,
                id: string,
                {
                    restApi,
                    restApiV1Resource,
                    userPool,
                    logRetention,
                }: AuthProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const userPoolClient = userPool.addClient('UserPoolClient', {
            authFlows: {userPassword: true},
            idTokenValidity: Duration.minutes(15),
            accessTokenValidity: Duration.minutes(15),
            refreshTokenValidity: Duration.days(refreshTokenValidityDurationDays),
        })

        const loginResource = restApiV1Resource.addResource('login')
        const loginFunc = new NodejsFunction(this, 'LoginFunc', {
            description: 'Login user',
            entry: join(__dirname, 'lambdas', 'login.ts'),
            ...commonProps,
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        })

        loginResource.addMethod('POST', new LambdaIntegration(loginFunc),
            {
                requestValidator: restApi.addRequestValidator('LoginUserReqBodyValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': restApi.addModel('LoginUserReqModel', {
                        modelName: 'LoginUserReqModel',
                        schema: authReqSchema,
                    }),
                },
            })

        const logoutResource = restApiV1Resource.addResource('logout')
        const logoutFunc = new NodejsFunction(this, 'LogoutFunc', {
            description: 'Logout user',
            entry: join(__dirname, 'lambdas', 'logout.ts'),
            ...commonProps,
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        })

        logoutResource.addMethod('GET', new LambdaIntegration(logoutFunc))

        const refreshResource = restApiV1Resource.addResource('refresh')
        const refreshFunc = new NodejsFunction(this, 'RefreshFunc', {
            description: 'Refresh token',
            entry: join(__dirname, 'lambdas', 'refresh.ts'),
            ...commonProps,
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        })
        refreshResource.addMethod('GET', new LambdaIntegration(refreshFunc))

        const registerResource = restApiV1Resource.addResource('signup')
        const signupFunc = new NodejsFunction(this, 'SignupFunc', {
            description: 'Sign up user',
            entry: join(__dirname, 'lambdas', 'signup.ts'),
            ...commonProps,
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        })

        registerResource.addMethod('POST', new LambdaIntegration(signupFunc),
            {
                requestValidator: restApi.addRequestValidator('SignupUserReqBodyValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': restApi.addModel('SignupUserReqModel', {
                        modelName: 'SignupUserReqModel',
                        schema: authReqSchema,
                    }),
                },
            })

        const confirmSignupResource = restApiV1Resource.addResource('confirm-signup')
        const confirmSignupFunc = new NodejsFunction(this, 'ConfirmSignupFunc', {
            description: 'Confirm sign up user',
            entry: join(__dirname, 'lambdas', 'confirm-signup.ts'),
            ...commonProps,
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        })

        confirmSignupResource.addMethod('POST', new LambdaIntegration(confirmSignupFunc),
            {
                requestValidator: restApi.addRequestValidator('ConfirmSignupReqBodyValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': restApi.addModel('ConfirmSignupUserReqModel', {
                        modelName: 'ConfirmSignupUserReqModel',
                        schema: confirmSignupReqSchema,
                    }),
                },
            })

        const forgotPasswordResource = restApiV1Resource.addResource('forgot')

        const forgotPasswordFunc = new NodejsFunction(this, 'ForgotPasswordFunc', {
            description: 'Forgot user password',
            entry: join(__dirname, 'lambdas', 'forgot.ts'),
            ...commonProps,
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        })

        forgotPasswordResource.addMethod('POST', new LambdaIntegration(forgotPasswordFunc),
            {
                requestValidator: restApi.addRequestValidator('ForgotPasswordReqBodyValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': restApi.addModel('ForgotPasswordReqModel', {
                        modelName: 'ForgotPasswordReqModel',
                        schema: forgotPassReqSchema,
                    }),
                },
            })

        const confirmForgotPasswordResource = restApiV1Resource.addResource('confirm-forgot')

        const confirmForgotPasswordFunc = new NodejsFunction(this, 'ConfirmForgotPasswordFunc', {
            description: 'Confirm forgot user password',
            entry: join(__dirname, 'lambdas', 'confirm-forgot.ts'),
            ...commonProps,
            environment: {
                USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        })

        confirmForgotPasswordResource.addMethod('POST', new LambdaIntegration(confirmForgotPasswordFunc),
            {
                requestValidator: restApi.addRequestValidator('ConfirmForgotPasswordReqBodyValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': restApi.addModel('ConfirmForgotPasswordReqModel', {
                        modelName: 'ConfirmForgotPasswordReqModel',
                        schema: confirmForgotPassReqSchema,
                    }),
                },
            })

        this.userPoolClientId = userPoolClient.userPoolClientId
    }
}