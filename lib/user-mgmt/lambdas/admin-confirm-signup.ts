import {
    AdminConfirmSignUpCommand,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {AdminConfirmUserReq} from '../../auth-service/auth.types'
import {resWithCors} from '../../lambda.utils'

const userPoolId = process.env.USER_POOL_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async ({
                                  body,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email} = JSON.parse(body) as AdminConfirmUserReq
    try {
        await cognitoClient.send(new AdminConfirmSignUpCommand({
            Username: email,
            UserPoolId: userPoolId,
        }))
        return resWithCors(200, {message: 'The user account has been confirmed'})
    } catch (err) {
        console.error(`Error during confirming sign up for a user with the email [${email}]`, err)
        const {name, message} = err as CognitoIdentityProviderServiceException
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}