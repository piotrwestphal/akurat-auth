import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider'
import {resWithCors} from '../../lambda.utils'
import { toUserResponse } from './users.mapper'
import { UserListRes } from '../user-mgmt.types'

const userPoolId = process.env.USER_POOL_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async (_: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        const result = await cognitoClient.send(new ListUsersCommand({
            UserPoolId: userPoolId,
        }))
        return resWithCors(200, {items: (result.Users || []).map(v => toUserResponse(v))} satisfies UserListRes)
    } catch (err) {
        console.error(`Error during fetching users`, err)
        const {name, message} = err as CognitoIdentityProviderServiceException
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}

