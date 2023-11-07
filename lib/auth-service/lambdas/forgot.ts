import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ForgotPasswordCommand,
    ForgotPasswordCommandOutput,
    InvalidParameterException,
    UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {resWithCors} from '../../lambda.utils'
import {ForgotPasswordReq, ForgotPasswordRes} from '../auth.types'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const cognitoClient = new CognitoIdentityProviderClient()

export const handler = async ({
                                  body,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email} = JSON.parse(body) as ForgotPasswordReq
    try {
        const result = await cognitoClient.send(new ForgotPasswordCommand({
            ClientId: userPoolClientId,
            Username: email,
        }))

        return resWithCors(200, toResponse(result))
    } catch (err) {
        console.error(`Error during notifying about forgot password for a user with the email [${email}]`, err)
        const {name, message} = err as CognitoIdentityProviderServiceException

        if (err instanceof UserNotFoundException) {
            return resWithCors(400, {message: `User not found`})
        }
        if (err instanceof InvalidParameterException) {
            return resWithCors(400, {message})
        }
        return resWithCors(500, {message: `${name}: ${message}`})
    }
}

const toResponse = ({
                        CodeDeliveryDetails,
                    }: ForgotPasswordCommandOutput): ForgotPasswordRes => {
    return {
        codeDeliveryDetails: CodeDeliveryDetails
            ? {
                deliveryMedium: CodeDeliveryDetails.DeliveryMedium!,
                destination: CodeDeliveryDetails.Destination!,
            } satisfies ForgotPasswordRes['codeDeliveryDetails']
            : undefined,
    }
}