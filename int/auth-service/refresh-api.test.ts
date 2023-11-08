import * as request from 'supertest'
import { Response } from 'supertest'
import {corsAllowedHeaders} from '../../lib/auth-service/auth.consts'
import { testCognitoUserPoolClientId, testRestApiEndpoint } from '../config'
import { authorize } from '../aws-helpers'
import { testAdminEmail, testAdminPassword } from '../../lib/consts'
import { AuthReq, AuthRes } from '../../lib/auth-service/auth.types'

describe('Refresh token api tests', () => {

    const req = request(testRestApiEndpoint)

    test('GET "/refresh" should receive refreshed tokens', async () => {
        const loginReq = {
            email: testAdminEmail,
            password: testAdminPassword,
        } satisfies AuthReq

        const {RefreshToken} = await authorize(testCognitoUserPoolClientId, loginReq)
        await req.get('api/v1/refresh')
            .set('Cookie', `token=${RefreshToken}`)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
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
            .set('Cookie', `token=abc`)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Invalid token/)
            })
    })
})
