import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {toUserResponse} from './users.mapper'

const userPoolId = process.env.USER_POOL_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async ({
                                  pathParameters,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const sub = pathParameters?.id!!
    try {
        const result = await cognitoClient.send(new ListUsersCommand({
            UserPoolId: userPoolId,
            Filter: `sub = "${sub}"`,
        }))
        const users = result.Users || []
        if (users.length === 0) {
            return resWithCors(404, {message: `Resource with an id [${sub}] does not exist`})
        }
        return resWithCors(200, toUserResponse(users[0]))
    } catch (err) {
        console.error(`Error during fetching a user with sub [${sub}]`, err)
        const {name, message} = err as CognitoIdentityProviderServiceException
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}