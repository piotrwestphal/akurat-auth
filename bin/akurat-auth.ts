#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import 'source-map-support/register'
import {BaseStack} from '../lib/base-stack'
import {testAcceptedEmailDomain, testAdminEmail, testAdminPassword, testAutoConfirmedEmail} from '../lib/consts'

// when triggered on the GH actions it gives a unique name for the current PR
const cdkTestStackName = process.env.CDK_STACK_NAME as string || 'AkuratAuthStack'

const app = new cdk.App()
new BaseStack(app, 'dev-AkuratAuthStack', {
    description: '[dev] Auth service infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'dev',
    authApi: {
        domainPrefix: 'dev',
        apiPrefix: 'auth',
        certArn: 'arn:aws:acm:eu-central-1:412644677543:certificate/a4333aff-4aed-4a57-9100-0d2355ad55fd',
        userPoolIdParamName: '/akurat/auth-service/dev/user-pool-id',
    },
    userMgmt: {
        adminUsers: [
            {
                email: 'piotr.westphal@gmail.com',
                password: 'Passw0rd',
            },
        ],
        autoConfirmedEmails: [],
        acceptedEmailDomains: ['gmail.com'],
    },
    logRetention: RetentionDays.ONE_WEEK,
})

new BaseStack(app, `int-${cdkTestStackName}`, {
    description: '[int] Auth service infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'int',
    userMgmt: {
        adminUsers: [{email: testAdminEmail, password: testAdminPassword}],
        autoConfirmedEmails: [testAutoConfirmedEmail],
        acceptedEmailDomains: [testAcceptedEmailDomain],
    },
    logRetention: RetentionDays.ONE_WEEK,
})

new BaseStack(app, 'prod-AkuratAuthStack', {
    description: '[prod] Auth service infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'prod',
    authApi: {
        apiPrefix: 'auth',
        certArn: 'arn:aws:acm:eu-central-1:412644677543:certificate/2fc15cbf-9c03-4a7e-99d4-a778a3a55e09',
        userPoolIdParamName: '/akurat/auth-service/prod/user-pool-id',
    },
    userMgmt: {adminUsers: [], autoConfirmedEmails: [], acceptedEmailDomains: ['*']},
    disableUsersApi: true,
    logRetention: RetentionDays.ONE_MONTH,
})