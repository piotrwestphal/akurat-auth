import {
    CodeMismatchException,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ConfirmForgotPasswordCommand,
    ExpiredCodeException,
    InvalidPasswordException,
    LimitExceededException,
    UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {ConfirmForgotPasswordReq} from '../auth.types'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async ({
                                  body,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, password, confirmationCode} = JSON.parse(body) as ConfirmForgotPasswordReq
    try {
        await cognitoClient.send(new ConfirmForgotPasswordCommand({
            ClientId: userPoolClientId,
            Username: email,
            Password: password,
            ConfirmationCode: confirmationCode,
        }))
        return resWithCors(200, {message: 'Password has been reset'})
    } catch (err) {
        console.error(`Error during a forgot password confirmation for a user with the email [${email}]`, err)
        const {name, message} = err as CognitoIdentityProviderServiceException

        if (err instanceof UserNotFoundException) {
            return badRequest('User not found')
        }
        if (err instanceof InvalidPasswordException) {
            return badRequest(message)
        }
        if (err instanceof CodeMismatchException) {
            return badRequest(message)
        }
        if (err instanceof ExpiredCodeException) {
            return badRequest(message)
        }
        if (err instanceof LimitExceededException) {
            return badRequest(message)
        }
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}

const badRequest = (message: string) => resWithCors(400, {message})