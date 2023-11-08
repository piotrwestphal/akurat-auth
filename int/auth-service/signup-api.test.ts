import * as request from 'supertest'
import { Response } from 'supertest'
import {corsAllowedHeaders} from '../../lib/auth-service/auth.consts'
import { createUser, deleteUser } from '../aws-helpers'
import { testAcceptedEmailDomain, testAutoConfirmedEmail } from '../../lib/consts'
import { testCognitoUserPoolId, testRestApiEndpoint } from '../config'
import { AuthReq, SignUpRes } from '../../lib/auth-service/auth.types'

describe('Signup user api tests', () => {

    const req = request(testRestApiEndpoint)

    test('POST "/signup" should sign up a user', async () => {
        const signUpReq = {
            email: testAutoConfirmedEmail,
            password: 'testTest1',
        } satisfies AuthReq

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)

        await req.post('api/v1/signup')
            .send(signUpReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(200)
            .then((res: Response) => {
                const {userSub, userConfirmed, codeDeliveryDetails} = res.body as SignUpRes
                expect(userSub).toBeDefined()
                expect(userConfirmed).toBeTruthy()
                expect(codeDeliveryDetails).not.toBeDefined()
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)
    })

    test(`POST "/signup" should not accept if user already signed up`, async () => {
        const signupReq: AuthReq = {
            email: `kornwalia.pomidor@${testAcceptedEmailDomain}`,
            password: 'Passw0$rd',
        }
        // Clean up
        await deleteUser(testCognitoUserPoolId, signupReq.email)

        await createUser(testCognitoUserPoolId, signupReq.email)
        await req.post('api/v1/signup')
            .send(signupReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/An account with the given email already exists/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, signupReq.email)
    })

    test(`POST "/signup" should not accept if invalid email domain`, async () => {
        const loginReq: AuthReq = {
            email: 'Lech@Walesa.com',
            password: 'Passw0$rd',
        }
        await req.post('api/v1/signup')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Email domain is not accepted/)
            })
    })

    test(`POST "/signup" should not accept if the password does not meet the conditions`, async () => {
        const loginReq: AuthReq = {
            email: `Lech@${testAcceptedEmailDomain}`,
            password: 'Wałęsa',
        }
        await req.post('api/v1/signup')
            .send(loginReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Password did not conform with policy/)
            })
    })

    test(`POST "/signup" should not accept if email in the wrong format`, async () => {
        const loginReq: AuthReq = {
            email: 'Lech.Walesa.com',
            password: 'Wałęsa',
        }
        await req.post('api/v1/signup')
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

    test('POST "/signup" should not accept because of the missing field', async () => {
        const loginReq = {
            email: `Lech@${testAcceptedEmailDomain}`,
        } as AuthReq

        await req.post('api/v1/signup')
            .expect(400)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .send(loginReq)
            .then((res: Response) => {
                expect(res.text).toMatch(/object has missing required properties/)
            })
    })

    test('POST "/signup" should not accept because of the extra field', async () => {
        const loginReq = {
            email: `Lech@${testAcceptedEmailDomain}`,
            password: 'Wałęsa',
            hack: 'let me in'
        } as AuthReq

        await req.post('api/v1/signup')
            .expect(400)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Methods', 'OPTIONS,GET,POST')
            .expect('Access-Control-Allow-Headers', corsAllowedHeaders)
            .expect('Access-Control-Allow-Credentials', 'true')
            .send(loginReq)
            .then((res: Response) => {
                expect(res.text).toMatch(/object instance has properties which are not allowed by the schema/)
            })
    })
})
