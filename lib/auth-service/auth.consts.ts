export const authorizationHeaderKey = 'Authorization'
export const cookieHeaderKey = 'Cookie'
export const setCookieHeaderKey = 'Set-Cookie'
export const refreshTokenCookieKey = 'token'
export const refreshTokenValidityDurationDays = 30

export const corsAllowedHeaders = `Authorization,Content-Type,X-Amz-Date,X-Amz-Security-Token,X-Api-Key,${setCookieHeaderKey}`
export const apiGwResponseHeaders = {
    'Content-Type': "'application/json'",
    'Access-Control-Allow-Headers': `'${corsAllowedHeaders}'`,
    'Access-Control-Allow-Methods': "'OPTIONS,GET,POST'",
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Credentials': "'true'",
}
export const corsHeaders = (origin: string) => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': corsAllowedHeaders,
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': true,
})