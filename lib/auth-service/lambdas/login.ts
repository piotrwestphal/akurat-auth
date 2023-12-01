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
const domainName = process.env.DOMAIN_NAME as string

const cognitoClient = new CognitoIdentityProviderClient()
const refreshTokenValidityDurationSeconds = refreshTokenValidityDurationDays * 24 * 60 * 60

export const handler = async ({
                                  body,
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
                    [setCookieHeaderKey]: `${refreshTokenCookieKey}=${RefreshToken}; Domain=${domainName}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=${refreshTokenValidityDurationSeconds};`,
                })
        }
        return errorResponse
    } catch (err) {
        console.error(`Error during logging in a user with the email [${email}]`, err)
        if (err instanceof UserNotConfirmedException) {
            return resWithCors(409, {message: `User is not confirmed`})
        }
        if (err instanceof NotAuthorizedException) {
            return errorResponse
        }
        if (err instanceof UserNotFoundException) {
            return errorResponse
        }
        const {name, message} = err as CognitoIdentityProviderServiceException
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}

const errorResponse =
    resWithCors(400, {message: `Incorrect username or password`})