import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {refreshTokenCookieKey, setCookieHeaderKey} from '../auth.consts'

const domainName = process.env.DOMAIN_NAME as string
export const handler = async (_: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        return resWithCors(
            200,
            {message: 'User has been logged out'},
            {[setCookieHeaderKey]: `${refreshTokenCookieKey}=x; Domain=${domainName}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=0;`})
    } catch (err) {
        console.error(`Error during logging out a user`, err)
        const {name, message} = err as Error
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}