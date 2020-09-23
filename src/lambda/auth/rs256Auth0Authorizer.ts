import {
  CustomAuthorizerEvent,
  CustomAuthorizerResult,
  CustomAuthorizerHandler,
} from "aws-lambda";
import "source-map-support/register";
import { verify } from "jsonwebtoken";
import { JwtToken } from "../../auth/JwtToken";
const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJfDuR/FYdWaB/MA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1sNmgtNHJ1cy51cy5hdXRoMC5jb20wHhcNMjAwOTIyMDkxNDI5WhcN
MzQwNjAxMDkxNDI5WjAkMSIwIAYDVQQDExlkZXYtbDZoLTRydXMudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoGeLvMGOshjPI0pc
c6g4ZB+2e5zlni8XW88SlF/fXVSZKV41Y36uhyL42KEWYSQt9HKxFbGXfwpgaCJ4
OteSQHJMgr9GOJkxnQE03Q86CGZL8F5SGMq2TDh2R80V7Bz0vE5IKUuk5eoijua7
AQoLprxaTGBBviY0TEg8qm5rbHEwSkC8AWe7I2Cx84fbRZyaPZyLwp5mQ/vvbQYn
dtuQ7dZhWTyAcvdW92peUxIngxI3XKYY/igHFITjj8TtfqOemCvz+uQzTu69wShp
AHI5HRI/3Wc38M+lJvxCtkBEubptpkpPOtmO4YKr9ePKglyTzHFXgm2U4cte6RvB
IhaV9wIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR2ScF9L6CR
lMIWsVO5j3+4k3dI3jAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AGtJEYkWa6D/4qgA8mLBHZY2Q6Z9CNlmPQ+a4yLhKW8BGLCKshIz4Bc5KZWNfWuC
tmrCK/pwuiSrtZfRlx82g0H26+RGKy2HIBSKE0CkCr1s5qUpN40w6HOClOUuBHji
iq+HUu728LCiHFuSsbpDt5uyOk7FsQR/rz7pJRozOx/uwLTZQf/B4Bh097C2Fz4/
JHDgM6sH//MR+ClDlLC6Lv5BSX+v5C4W6ubIFm+z89Ckz+neraJmrTHPcCMJuQ0V
P2yaL5M9y5h2wreCpT+S+K4zcV1sc9Y5FCnGT7j5jy4kQ7oey6HDy6Ml0gDwgqWL
UeKWGcMaaoQfdpj5VnyK6MY=
-----END CERTIFICATE-----`;

export const handler: CustomAuthorizerHandler = async (
  event: CustomAuthorizerEvent,
): Promise<CustomAuthorizerResult> => {
  try {
    const decodedToken = verifyToken(event.authorizationToken, cert);
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
};

function verifyToken(
  authHeader: string,
  secret: string
): Promise<JwtToken> {
  if (!authHeader) throw new Error("No authentication header");

  if (!authHeader.toLowerCase().startsWith("bearer"))
    throw new Error("Invalid authentication header");

  const split = authHeader.split(" ");

  const token = split[1];
  console.log("token ", token);
  console.log("secret ", secret);

  return verify(token, cert, { algorithms: ["RS256"] }) as JwtToken;
}

//we will use middy middleware to get secrets from aws secret manager
//  async function getSecret() {
//   if(cachedSecret)return cachedSecret

//   const data= await client.getSecretValue({SecretId:secretId}).promise()

//   cachedSecret= data.SecretString

//   return JSON.parse(cachedSecret) //There are multiple fields in the secret string, this is json string we need to parse
// }
