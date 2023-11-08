import { authorize } from './aws-helpers'
import { testAdminEmail, testAdminPassword } from '../lib/consts'
import {CdkOutputs} from "../lib/types";

// this file is generated during CDK stack deployment - see readme for more details
const outputsJson = require('./outputs.json')
console.log('Outputs json: ', outputsJson)

// grab first key in json - the value should be the map with the current cdk stack outputs
const cdkStackName = Object.keys(outputsJson)[0]

const {
    RestApiEndpoint,
    UserPoolClientId,
    UserPoolId,
} = outputsJson[cdkStackName] as CdkOutputs

export const testRestApiEndpoint = RestApiEndpoint
export const testCognitoUserPoolId = UserPoolId
export const testCognitoUserPoolClientId = UserPoolClientId

export let defaultUserToken = ''
export let defaultAccessToken = ''

beforeAll(async () => {
    const {IdToken, AccessToken} = await authorize(testCognitoUserPoolClientId, {email: testAdminEmail, password: testAdminPassword})
    defaultUserToken = IdToken!
    defaultAccessToken = AccessToken!
})