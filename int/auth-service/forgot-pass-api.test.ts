import * as request from 'supertest'
import {Response} from 'supertest'
import {AuthReq, ForgotPasswordReq, ForgotPasswordRes} from '../../lib/auth-service/auth.types'
import {testAcceptedEmailDomain, testAutoConfirmedEmail} from '../../lib/consts'
import {deleteUser} from '../aws-helpers'
import {testCognitoUserPoolId, testRestApiEndpoint} from '../config'

describe('Forgot password api tests', () => {

    const req = request(testRestApiEndpoint)

    test('POST "/forgot" should return delivery details', async () => {
        const signUpReq = {
            email: testAutoConfirmedEmail,
            password: 'testTest1',
        } satisfies AuthReq

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)

        await req.post('api/v1/signup')
            .send(signUpReq)
            .expect(200)

        await req.post('api/v1/forgot')
            .send({email: signUpReq.email} satisfies ForgotPasswordReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(200)
            .then((res: Response) => {
                const {codeDeliveryDetails} = res.body as ForgotPasswordRes
                expect(codeDeliveryDetails?.deliveryMedium).toBe('EMAIL')
                expect(codeDeliveryDetails?.destination).toBeDefined()
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)
    })

    test('POST "/forgot" should not accept if user is not confirmed', async () => {
        const signUpReq = {
            email: `temp@${testAcceptedEmailDomain}`,
            password: 'testTest1',
        } satisfies AuthReq

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)

        await req.post('api/v1/signup')
            .send(signUpReq)
            .expect(200)

        await req.post('api/v1/forgot')
            .send({email: signUpReq.email} satisfies ForgotPasswordReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Cannot reset password for the user as there is no registered\/verified email or phone_number/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)
    })

    test('POST "/forgot" should not accept if user not found', async () => {
        await req.post('api/v1/forgot')
            .send({email: `nonexistinguser@${testAcceptedEmailDomain}`} satisfies ForgotPasswordReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/User not found/)
            })
    })

    test('POST "/forgot" should not accept because of the missing field', async () => {
        await req.post('api/v1/forgot')
            .send({})
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object has missing required properties')
            })
    })

    test('POST "/forgot" should not accept because of the extra field', async () => {
        await req.post('api/v1/forgot')
            .send({email: `someuser@${testAcceptedEmailDomain}`, extra: 'value'} as ForgotPasswordReq)
            .expect('Content-Type', 'application/json')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Credentials', 'true')
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object instance has properties which are not allowed by the schema')
            })
    })
})
