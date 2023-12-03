import {ApiGatewayLambdaResponse} from '@lambda-types'

export const resWithCors = (statusCode: number,
                            body: Record<any, any>,
                            headers: Record<string, string> = {},
                            origin = '*'): ApiGatewayLambdaResponse => ({
    statusCode,
    body: JSON.stringify(body),
    headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': true,
        'Vary': 'origin',
        ...headers,
    },
})