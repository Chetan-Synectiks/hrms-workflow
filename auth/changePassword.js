require("dotenv").config();
const { z } = require("zod");
const {
	RespondToAuthChallengeCommand,
    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand
	
} = require("@aws-sdk/client-cognito-identity-provider");
exports.handler = async (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
	const req = {
		email: requestBody.email,
		password: requestBody.password,
	};
	const reqSchema = z.object({
		email: z.string(),
		password: z.string(),
	});
	const valResult = reqSchema.safeParse(req);
	if (!valResult.success) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				error: valResult.error.formErrors.fieldErrors,
			}),
		};
	}
    const cognitoClient = new CognitoIdentityProviderClient({
		region: "us-east-1",
	});
try{
    const input = {
        UserPoolId: process.env.COGNITO_POOL_ID,
        ClientId : process.env.COGNITO_CLIENT_ID,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
            USERNAME: req.email,
            PASSWORD: req.password
        }
    };
    const authResponse = await cognitoClient.send(
        new AdminInitiateAuthCommand(input)
    );
    const newPassword = req.password;
            const respondToAuthChallengeInput = {
                ChallengeName: 'NEW_PASSWORD_REQUIRED',
                ClientId: process.env.COGNITO_CLIENT_ID,
                ChallengeResponses: {
                    USERNAME: req.email,
                    NEW_PASSWORD: newPassword
                },
                Session: authResponse.Session
            };
            newPasswordResponse = await cognitoClient.send(
                new RespondToAuthChallengeCommand(respondToAuthChallengeInput)
            );
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({message:"Password changed successfully"})
            };
            
}catch (error) {
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: error.message,
				error: error,
			}),
		};
	}
};