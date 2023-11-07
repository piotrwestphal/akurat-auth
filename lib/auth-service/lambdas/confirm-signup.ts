import {
    CodeMismatchException,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ConfirmSignUpCommand,
    NotAuthorizedException,
    UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {ConfirmSignupReq} from '../auth.types'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async ({
                                  body,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, confirmationCode} = JSON.parse(body) as ConfirmSignupReq
    try {
        await cognitoClient.send(new ConfirmSignUpCommand({
            ClientId: userPoolClientId,
            Username: email,
            ConfirmationCode: confirmationCode,
        }))
        return resWithCors(200, {message: 'The user account has been confirmed'})
    } catch (err) {
        console.error(`Error during fetching users`, err)
        const {name, message} = err as CognitoIdentityProviderServiceException
        if (err instanceof UserNotFoundException) {
            return badRequest(err)
        }
        if (err instanceof NotAuthorizedException) {
            return badRequest(err)
        }
        if (err instanceof CodeMismatchException) {
            return badRequest(err)
        }
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}

const badRequest = (err: CognitoIdentityProviderServiceException) =>
    resWithCors(400, {message: err.message})
