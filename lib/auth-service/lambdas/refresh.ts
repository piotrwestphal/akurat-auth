import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    InitiateAuthCommand,
    NotAuthorizedException,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {refreshTokenCookieKey} from '../auth.consts'
import {AuthRes} from '../auth.types'
import {getCookieValue} from './utils'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async ({
                                  headers,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {origin} = headers
    const refreshToken = getCookieValue(headers, refreshTokenCookieKey)
    if (!refreshToken) {
        return resWithCors(400, {message: `Missing token`}, {}, origin)
    }
    try {
        const authResult = await cognitoClient.send(new InitiateAuthCommand({
            AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
            ClientId: userPoolClientId,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        }))
        const {IdToken, ExpiresIn, AccessToken} = authResult.AuthenticationResult!
        return resWithCors(
            200,
            {
                token: IdToken!,
                expiresIn: ExpiresIn!,
                accessToken: AccessToken!,
            } satisfies AuthRes,
            {},
            origin)
    } catch (err) {
        console.error(`Error during refreshing token`, err)
        const {name, message} = err as CognitoIdentityProviderServiceException
        if (err instanceof NotAuthorizedException) {
            return resWithCors(401, {message: 'Invalid token'}, {}, origin)
        }
        return resWithCors(500, {message: `${name}: ${message}`}, {}, origin)
    }
}