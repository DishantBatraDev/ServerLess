import {
  CustomAuthorizerEvent,
  CustomAuthorizerResult,
  // CustomAuthorizerHandler,
} from "aws-lambda";
import "source-map-support/register";
// import * as AWS from "aws-sdk";
import { verify } from "jsonwebtoken";
import { JwtToken } from "../../auth/JwtToken";
import * as middy from "middy";
import {  secretsManager } from "middy/middlewares";

const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;


export const handler = middy(
  async (event: CustomAuthorizerEvent, context): Promise<CustomAuthorizerResult> => {
    try {
      const decodedToken = await verifyToken(event.authorizationToken, context.AUTH0_SECRET[secretField]);
      console.log("User was authorized");

      return {
        principalId: decodedToken.sub, //sub is the if of the user which passed the authorization
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Allow",
              Resource: "*",
            },
          ],
        },
      };
    } catch (e) {
      console.log("User was not authorized", e.message);
      return {
        principalId: "user",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Deny",
              Resource: "*",
            },
          ],
        },
      };
    }
  }
);

 function verifyToken(authHeader: string,secret:string): JwtToken {
  if (!authHeader) throw new Error("No authentication header");

  if (!authHeader.toLowerCase().startsWith("bearer"))
    throw new Error("Invalid authentication header");

  const split = authHeader.split(" ");

  const token = split[1];
  console.log("token ", token);
  console.log("secret ", secret);

  return verify(token, secret) as JwtToken;
}

//we will use middy middleware to get secrets from aws secret manager
//  async function getSecret() {
//   if(cachedSecret)return cachedSecret

//   const data= await client.getSecretValue({SecretId:secretId}).promise()

//   cachedSecret= data.SecretString

//   return JSON.parse(cachedSecret) //There are multiple fields in the secret string, this is json string we need to parse
// }

handler.use(
  secretsManager({
    cache: true,
    cacheExpiryInMillis: 60000,
    throwOnFailedCall: true,
    secrets:{
      AUTH0_SECRET: secretId
    }
  })
);
