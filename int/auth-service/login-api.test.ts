import * as request from 'supertest'
import {Response} from 'supertest'
import {
    corsAllowedHeaders,
    refreshTokenCookieKey,
    refreshTokenValidityDurationDays,
    setCookieHeaderKey,
} from '../../lib/auth-service/auth.consts'
import {AuthReq, AuthRes} from '../../lib/auth-service/auth.types'
import {testAcceptedEmailDomain, testAdminEmail, testAdminPassword} from '../../lib/consts'
import {deleteUser, registerUser} from '../aws-helpers'
import {testCognitoUserPoolClientId, testCognitoUserPoolId, testRestApiEndpoint} from '../config'

describe('User login api tests', () => {

    const req = request(testRestApiEndpoint)

    test('POST "/login" should login', async () => {
        const loginReq = {
            email: testAdminEmail,
            password: testAdminPassword,
        } satisfies AuthReq

        await req.post('api/v1/login')
            .send(loginReq)
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

                const {[setCookieHeaderKey.toLowerCase()]: setCookieHeaderVals} = res.headers
                const setCookieHeader = setCookieHeaderVals[0] as string
                expect(setCookieHeader).toBeDefined()
                expect(setCookieHeader).toContain(`${refreshTokenCookieKey}=`)
                expect(setCookieHeader).toContain('SameSite=Strict;')
                expect(setCookieHeader).toContain('Secure;')
                expect(setCookieHeader).toContain('HttpOnly;')
                expect(setCookieHeader).toContain(`Max-Age=${refreshTokenValidityDurationDays * 24 * 60 * 60};`)
            })
    })

    test(`POST "/login" should not accept if user is not confirmed`, async () => {
        const loginReq: AuthReq = {
            email: `kornwalia.pomidor@${testAcceptedEmailDomain}`,
            password: 'Passw0$rd',
        }
        // Clean up
        await deleteUser(testCognitoUserPoolId, loginReq.email)

        await registerUser(testCognitoUserPoolClientId, loginReq)
        await req.post('api/v1/login')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(409)
            .then((res: Response) => {
                expect(res.text).toMatch(/User is not confirmed/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, loginReq.email)
    })

    test(`POST "/login" should not accept if user doesn't exist in db`, async () => {
        const loginReq: AuthReq = {
            email: 'Milka@Walesa.com',
            password: 'Passw0$rd',
        }
        await req.post('api/v1/login')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Incorrect username or password/)
            })
    })

    test(`POST "/login" should not accept if email in the wrong format`, async () => {
        const loginReq: AuthReq = {
            email: 'Lech.Walesa.com',
            password: 'Wałęsa',
        }
        await req.post('api/v1/login')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/is not a valid email address/)
            })
    })

    test(`POST "/login" should not accept if wrong password`, async () => {
        const loginReq: AuthReq = {
            email: testAdminEmail,
            password: `${testAdminPassword}!!`,
        }
        await req.post('api/v1/login')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Incorrect username or password/)
            })
    })

    test('POST "/login" should not accept because of the missing field', async () => {
        const loginReq = {
            email: 'Lech',
        } as AuthReq

        await req.post('api/v1/login')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object has missing required properties')
            })
    })

    test('POST "/login" should not accept because of the extra field', async () => {
        const loginReq = {
            email: 'Lech',
            password: 'Wałęsa',
            hack: 'let me in',
        } as AuthReq

        await req.post('api/v1/login')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object instance has properties which are not allowed by the schema')
            })
    })
})
