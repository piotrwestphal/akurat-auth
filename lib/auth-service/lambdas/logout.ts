import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {refreshTokenCookieKey, setCookieHeaderKey} from '../auth.consts'

export const handler = async ({
                                  headers: {origin},
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        return resWithCors(
            200,
            {message: 'User has been logged out'},
            {[setCookieHeaderKey]: `${refreshTokenCookieKey}=x; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=0;`},
            origin)
    } catch (err) {
        console.error(`Error during logging out a user`, err)
        const {name, message} = err as Error
        return resWithCors(500, {message: `${name}: ${message}`}, {}, origin)
    }
}