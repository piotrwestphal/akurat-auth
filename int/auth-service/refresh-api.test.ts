import * as request from 'supertest'
import {Response} from 'supertest'
import {cookieHeaderKey, refreshTokenCookieKey} from '../../lib/auth-service/auth.consts'
import {AuthReq, AuthRes} from '../../lib/auth-service/auth.types'
import {testAdminEmail, testAdminPassword} from '../../lib/consts'
import {authorize} from '../aws-helpers'
import {testCognitoUserPoolClientId, testRestApiEndpoint} from '../config'

describe('Refresh token api tests', () => {

    const req = request(testRestApiEndpoint)

    test('GET "/refresh" should receive refreshed tokens', async () => {
        const loginReq = {
            email: testAdminEmail,
            password: testAdminPassword,
        } satisfies AuthReq

        const {RefreshToken} = await authorize(testCognitoUserPoolClientId, loginReq)
        await req.get('api/v1/refresh')
            .set(cookieHeaderKey, `${refreshTokenCookieKey}=${RefreshToken}`)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect('Vary', 'origin')
            .expect(200)
            .then((res: Response) => {
                const {token, expiresIn, accessToken} = res.body as AuthRes
                expect(token).toBeDefined()
                expect(expiresIn).toBe(900) // idToken expiration time in seconds
                expect(accessToken).toBeDefined()
            })
    })

    test('GET "/refresh" should not accept if invalid token', async () => {
        await req.get('api/v1/refresh')
            .set(cookieHeaderKey, `${refreshTokenCookieKey}=abc`)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect('Vary', 'origin')
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Invalid token/)
            })
    })
})
