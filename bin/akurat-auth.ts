#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import 'source-map-support/register'
import {AkuratAuthStack} from '../lib/akurat-auth-stack'

// when triggered on the GH actions it gives a unique name for the current PR
const cdkTestStackName = process.env.CDK_STACK_NAME as string || 'AkuratAuthStack'

const app = new cdk.App()
new AkuratAuthStack(app, 'dev-AkuratAuthStack', {
    description: '[dev] Auth service infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'dev',
    api: {
        domainPrefix: 'auth.dev',
        certArn: 'arn:aws:acm:eu-central-1:412644677543:certificate/a4333aff-4aed-4a57-9100-0d2355ad55fd',
    },
    artifactsBucketName: 'akurat-artifacts',
    logRetention: RetentionDays.ONE_WEEK,
})

new AkuratAuthStack(app, `int-${cdkTestStackName}`, {
    description: '[int] Auth service infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'int',
    artifactsBucketName: 'akurat-artifacts',
    logRetention: RetentionDays.ONE_WEEK,
})

new AkuratAuthStack(app, 'prod-AkuratAuthStack', {
    description: '[prod] Auth service infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'prod',
    api: {
        domainPrefix: 'auth',
        certArn: 'arn:aws:acm:eu-central-1:412644677543:certificate/2fc15cbf-9c03-4a7e-99d4-a778a3a55e09',
    },
    artifactsBucketName: 'akurat-artifacts',
    logRetention: RetentionDays.ONE_MONTH,
})