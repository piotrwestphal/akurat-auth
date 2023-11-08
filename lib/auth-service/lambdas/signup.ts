import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    InvalidPasswordException,
    SignUpCommand,
    SignUpCommandOutput,
    UserLambdaValidationException,
    UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {AuthReq, SignUpRes} from '../auth.types'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async ({
                                  body,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, password} = JSON.parse(body) as AuthReq
    try {
        const result = await cognitoClient.send(new SignUpCommand({
            ClientId: userPoolClientId,
            Username: email,
            Password: password,
        }))
        console.log(`A user account for the email address [${email}] has been successfully created.`)
        return resWithCors(200, toResponse(result))
    } catch (err) {
        console.error(`Error during signing up user with email [${email}]`, err)
        if (err instanceof UsernameExistsException) {
            return badRequest(err)
        }
        if (err instanceof UserLambdaValidationException) {
            // original error message - `PreSignUp failed with error Email domain is not accepted.`
            return resWithCors(400, {message: 'Email domain is not accepted.'})
        }
        if (err instanceof InvalidPasswordException) {
            return badRequest(err)
        }
        const {name, message} = err as CognitoIdentityProviderServiceException
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}

const toResponse = ({
                        UserSub,
                        UserConfirmed,
                        CodeDeliveryDetails,
                    }: SignUpCommandOutput): SignUpRes => {
    const codeDeliveryDetails = CodeDeliveryDetails
        ? {
            deliveryMedium: CodeDeliveryDetails.DeliveryMedium!,
            destination: CodeDeliveryDetails.Destination!,
        } satisfies SignUpRes['codeDeliveryDetails']
        : undefined
    return {
        userConfirmed: UserConfirmed!,
        userSub: UserSub!,
        codeDeliveryDetails,
    }
}

const badRequest = (err: CognitoIdentityProviderServiceException) =>
    resWithCors(400, {message: err.message})
