import {ApiGatewayLambdaResponse} from '@lambda-types'
import {corsHeaders} from './auth-service/auth.consts'

export const resWithCors = (statusCode: number,
                            body: Record<any, any>,
                            headers: Record<string, string> = {}): ApiGatewayLambdaResponse => ({
    statusCode,
    body: JSON.stringify(body),
    headers: {
        ...headers,
        ...corsHeaders,
    },
})