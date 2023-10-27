import {
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AuthenticationResultType,
    AuthFlowType,
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    MessageActionType,
    SignUpCommand,
    UserType,
} from '@aws-sdk/client-cognito-identity-provider'
import {UserParams} from '../lib/types'

const cognitoClient = new CognitoIdentityProviderClient({region: 'eu-central-1'})

export const authorize = async (userPoolClientId: string,
                                {email, password}: UserParams): Promise<AuthenticationResultType> => {
    const authResult = await cognitoClient.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: userPoolClientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    }))
    return authResult.AuthenticationResult!
}

export const registerUser = async (userPoolClientId: string,
                                   {email, password}: UserParams) =>
    cognitoClient.send(new SignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
    }))

export const createUser = async (userPoolId: string,
                                 email: string): Promise<UserType> => {
    const createUserResult = await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: MessageActionType.SUPPRESS,
    }))
    return createUserResult.User!
}

export const deleteUser = async (userPoolId: string,
                                 email: string) => {
    try {
        await cognitoClient.send(new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: email,
        }))
        console.log(`User with an email [${email}] has been deleted`)
    } catch (err) {
        console.log(`There is no user with an email [${email}]`)
    }
}
