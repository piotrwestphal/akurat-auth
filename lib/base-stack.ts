import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib'
import {MockIntegration, PassthroughBehavior, ResponseType, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {ARecord, HostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'
import {Construct} from 'constructs'
import {AuthService} from './auth-service/auth-service'
import {setCookieHeaderKey} from './auth-service/auth.consts'
import {restApiEndpointOutputKey, userPoolClientIdOutputKey, userPoolIdOutputKey} from './consts'
import {ApiParams, UserMgmtParams} from './types'
import {UserMgmt} from './user-mgmt/user-mgmt'


type BaseStackProps = Readonly<{
    envName: string
    userMgmt: UserMgmtParams
    logRetention: RetentionDays
    authApi?: ApiParams
}> & StackProps

// TODO: export user pool arn to be used by core stack
export class BaseStack extends Stack {
    constructor(scope: Construct,
                id: string,
                {
                    envName,
                    authApi,
                    userMgmt,
                    logRetention,
                    ...props
                }: BaseStackProps) {
        super(scope, id, props)

        const baseDomainName = this.node.tryGetContext('domainName') as string | undefined

        const restApi = new RestApi(this, 'RestApi', {
            description: `[${envName}] REST api for auth service`,
            deployOptions: {
                stageName: envName,
            },
        })
        // adds extended request body validation messages
        restApi.addGatewayResponse('BadRequestBodyValidationTemplate', {
            type: ResponseType.BAD_REQUEST_BODY,
            statusCode: '400',
            templates: {
                'application/json': `{"message": "$context.error.validationErrorString"}`,
            },
        })

        const restApiV1Resource = restApi.root.addResource('api').addResource('v1')
        restApiV1Resource.addMethod('ANY', new MockIntegration({
            integrationResponses: [
                {statusCode: '200'},
            ],
            passthroughBehavior: PassthroughBehavior.NEVER,
            requestTemplates: {
                'application/json': '{ "statusCode": 200 }',
            },
        }), {
            methodResponses: [
                {statusCode: '200'},
            ],
        })

        const {userPool} = new UserMgmt(this, 'UserMgmt', {
            envName,
            restApiV1Resource,
            userMgmt,
            logRetention,
        })

        const {userPoolClientId} = new AuthService(this, 'AuthService', {
            restApi,
            restApiV1Resource,
            userPool,
            logRetention,
        })

        if (baseDomainName && authApi) {
            restApiV1Resource.addCorsPreflight({
                allowHeaders: ['Content-Type', 'Authorization', setCookieHeaderKey],
                allowMethods: ['OPTIONS', 'GET', 'POST'],
                allowCredentials: true,
                allowOrigins: [`https://${baseDomainName}`],
            })
            const {domainPrefix, apiPrefix, certArn} = authApi
            const domainName = domainPrefix ? `${apiPrefix}.${domainPrefix}.${baseDomainName}` : `${apiPrefix}.${baseDomainName}`
            const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {domainName: baseDomainName})
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
