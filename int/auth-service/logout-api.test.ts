import * as request from 'supertest'
import {Response} from 'supertest'
import {refreshTokenCookieKey, setCookieHeaderKey} from '../../lib/auth-service/auth.consts'
import {testRestApiEndpoint} from '../config'

describe('User logout api tests', () => {

    const req = request(testRestApiEndpoint)

    test('GET "/logout" should log out current user', async () => {
        await req.get('api/v1/logout')
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect('Vary', 'origin')
            .expect(200)
            .then((res: Response) => {
                const {[setCookieHeaderKey.toLowerCase()]: setCookieHeaderVals} = res.headers
                const setCookieHeader = setCookieHeaderVals[0] as string
                expect(setCookieHeader).toBeDefined()
                expect(setCookieHeader).toContain(`${refreshTokenCookieKey}=x`)
                expect(setCookieHeader).toContain('SameSite=None;')
                expect(setCookieHeader).toContain('Secure;')
                expect(setCookieHeader).toContain('HttpOnly;')
                expect(setCookieHeader).toContain(`Max-Age=0;`)
            })
    })
})