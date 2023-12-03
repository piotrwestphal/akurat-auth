import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    InitiateAuthCommand,
    NotAuthorizedException,
    UserNotConfirmedException,
    UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {refreshTokenCookieKey, refreshTokenValidityDurationDays, setCookieHeaderKey} from '../auth.consts'
import {AuthReq, AuthRes} from '../auth.types'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const cognitoClient = new CognitoIdentityProviderClient()
const refreshTokenValidityDurationSeconds = refreshTokenValidityDurationDays * 24 * 60 * 60

export const handler = async ({
                                  body,
                                  headers: {origin},
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, password} = JSON.parse(body) as AuthReq
    try {
        const authResult = await cognitoClient.send(new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            ClientId: userPoolClientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        }))
        if (authResult.AuthenticationResult) {
            const {RefreshToken, IdToken, ExpiresIn, AccessToken} = authResult.AuthenticationResult

            return resWithCors(
                200,
                {
                    token: IdToken!,
                    expiresIn: ExpiresIn!,
                    accessToken: AccessToken!,
                } satisfies AuthRes,
                {
                    [setCookieHeaderKey]: `${refreshTokenCookieKey}=${RefreshToken}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=${refreshTokenValidityDurationSeconds};`,
                },
                origin)
        }
        return errorResponse(400, `Incorrect username or password`, origin)
    } catch (err) {
        console.error(`Error during logging in a user with the email [${email}]`, err)
        if (err instanceof UserNotConfirmedException) {
            return errorResponse(409, `User is not confirmed`, origin)
        }
        if (err instanceof NotAuthorizedException) {
            return errorResponse(400, `Incorrect username or password`, origin)
        }
        if (err instanceof UserNotFoundException) {
            return errorResponse(400, `Incorrect username or password`, origin)
        }
        const {name, message} = err as CognitoIdentityProviderServiceException
        return errorResponse(500, `${name}: ${message}`, origin)
    }
}

const errorResponse = (statusCode: number, message: string, origin?: string) =>
    resWithCors(statusCode, {message}, {}, origin)