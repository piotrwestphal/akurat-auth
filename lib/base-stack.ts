import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib'
import {Cors, ResponseType, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {ARecord, HostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'
import {StringParameter} from 'aws-cdk-lib/aws-ssm'
import {Construct} from 'constructs'
import {AuthService} from './auth-service/auth-service'
import {apiGwResponseHeaders, setCookieHeaderKey} from './auth-service/auth.consts'
import {restApiEndpointOutputKey, userPoolClientIdOutputKey, userPoolIdOutputKey} from './consts'
import {ApiParams, UserMgmtParams} from './types'
import {UserMgmt} from './user-mgmt/user-mgmt'


type BaseStackProps = Readonly<{
    envName: string
    userMgmt: UserMgmtParams
    authApi?: ApiParams
    disableUsersApi?: true
    logRetention: RetentionDays
}> & StackProps

export class BaseStack extends Stack {
    constructor(scope: Construct,
                id: string,
                {
                    envName,
                    userMgmt,
                    authApi,
                    disableUsersApi,
                    logRetention,
                    ...props
                }: BaseStackProps) {
        super(scope, id, props)

        const baseDomainName = this.node.tryGetContext('domainName') as string | undefined

        const restApi = new RestApi(this, 'AuthApi', {
            description: `[${envName}] REST api for auth service`,
            deployOptions: {
                stageName: envName,
            },
            defaultCorsPreflightOptions: {
                allowHeaders: ['Content-Type', 'Authorization', setCookieHeaderKey],
                allowMethods: ['OPTIONS', 'GET', 'POST'],
                allowCredentials: true,
                allowOrigins: Cors.ALL_ORIGINS,
            },
        })
        restApi.addGatewayResponse('BadRequestBodyValidationTemplate', {
            statusCode: '400',
            type: ResponseType.BAD_REQUEST_BODY,
            responseHeaders: apiGwResponseHeaders,
            templates: {
                // adds extended request body validation messages
                'application/json': `{"message": "$context.error.validationErrorString"}`,
            },
        })
        restApi.addGatewayResponse('AuthorizerFailureTemplate', {
            statusCode: '401',
            type: ResponseType.UNAUTHORIZED,
            responseHeaders: apiGwResponseHeaders,
            templates: {
                // adds extended request body validation messages
                'application/json': `{"message": "$context.error.message"}`,
            },
        })

        const restApiV1Resource = restApi.root.addResource('api').addResource('v1')
        const {userPool} = new UserMgmt(this, 'UserMgmt', {
            envName,
            restApiV1Resource,
            userMgmt,
            disableUsersApi,
            logRetention,
        })

        const {userPoolClientId} = new AuthService(this, 'AuthService', {
            restApi,
            restApiV1Resource,
            userPool,
            logRetention,
        })

        if (baseDomainName && authApi) {
            const {domainPrefix, apiPrefix, certArn, userPoolIdParamName} = authApi
            const fullDomainName = domainPrefix ? `${domainPrefix}.${baseDomainName}` : baseDomainName
            const domainName = `${apiPrefix}.${fullDomainName}`
            const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {domainName: baseDomainName})
            new StringParameter(this, 'UserPoolIdParam', {
                parameterName: userPoolIdParamName,
                stringValue: userPool.userPoolId,
            })
            restApi.addDomainName('DomainName', {
                domainName,
                certificate: Certificate.fromCertificateArn(this, 'CFCertificate', certArn),
            })
            new ARecord(this, 'AuthServiceRecordSet', {
                recordName: domainName,
                zone: hostedZone,
                target: RecordTarget.fromAlias(new ApiGateway(restApi)),
            })
        }
        new CfnOutput(this, restApiEndpointOutputKey, {value: restApi.url})
        new CfnOutput(this, userPoolClientIdOutputKey, {value: userPoolClientId})
        new CfnOutput(this, userPoolIdOutputKey, {value: userPool.userPoolId})
    }
}
