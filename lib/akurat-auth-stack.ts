import * as cdk from 'aws-cdk-lib'
import {StackProps} from 'aws-cdk-lib'
import {MockIntegration, PassthroughBehavior, ResponseType, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {ARecord, HostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets'
import {Construct} from 'constructs'
import {ApiParams, UserMgmtParams} from './types'


type BaseStackProps = Readonly<{
    envName: string
    artifactsBucketName: string
    logRetention: RetentionDays
    api?: ApiParams
    userMgmt?: UserMgmtParams
}> & StackProps

export class AkuratAuthStack extends cdk.Stack {
    constructor(scope: Construct,
                id: string,
                {
                    envName,
                    artifactsBucketName,
                    api,
                    userMgmt,
                    logRetention,
                    ...props
                }: BaseStackProps) {
        super(scope, id, props)

        const baseDomainName = this.node.tryGetContext('domainName') as string | undefined

        const restApi = new RestApi(this, 'RestApi', {
            description: `[${envName}] REST api for auth service`,
            cloudWatchRole: true,
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

        if (baseDomainName && api) {
            const {domainPrefix, certArn} = api
            const domainName = domainPrefix ? `${domainPrefix}.${baseDomainName}` : baseDomainName
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
    }
}
