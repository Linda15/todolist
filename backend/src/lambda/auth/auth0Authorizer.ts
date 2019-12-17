import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'


const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set

const cert = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJY5EKlQRlOJ8WMA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
BAMTFmRldi14Njh1ZXBycS5hdXRoMC5jb20wHhcNMTkxMTA0MDIzOTAzWhcNMzMw
NzEzMDIzOTAzWjAhMR8wHQYDVQQDExZkZXYteDY4dWVwcnEuYXV0aDAuY29tMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4De5BQIQM91DfAuhGDBf0MoS
lr9uUNh6+iJaD58KEMgtpROCPDbPismDlitugpYrrTp8ejpSZMO2+uRFdDs2JDWk
EYiLvtc/+Ef5fjLmBHW3efW5GLkj3WYx/i1aH9pZkoEW6X1CUaRng64XDy7lJb3X
jMzSpa2ZtnxleX67y/Oo4kgiAvNWLSr2ZtiN+3hnWf473tdY8ZYwBV3nAcNZEv9p
euxLfKdYOsq/tfzfSROOuVH+3f4q532hbOTl/8Lx61qxKkTIZ1C1h2/xXkSJ3qCU
Zx0oza1CTi8ScLwHz7M8tkAPluoosbdFBIVR70cwvzpJfGAJDzTG9iNXBusxhwID
AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBT/oTL1YXyCk9cFO1AK
OTtrL9/iqTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAIpv535K
nifmm1AVRcaIhyrTQ3pvcRoZBaTIrbMK+ErdgmyBuQZykQ6eQBHR95fxI2bTgHMu
1i1NboRzONOnJSMqriLog+RiGG9rTtidd4BJUlK2RT+kiMMD5ov04pwoBnm2l2E6
2yuU6+2nS4FyIifqrJebqHm+j7kHswl86tWUXamSmfvSIWRMFi5JlT0B4C5+iMtN
EZiOS3VjwR+KnRqmGjIUTGlkP7vet0nLndvrWLdm6Jg6esjl3dvFpFAYPs7nzHfK
URyXZtvJgfv/nOT/dVDGLfx7JabsApLCAiQk6NMypZbAUA4CclPJjSM1TS9yiS+p
nVOCrZlzqr0F7G4=
-----END CERTIFICATE-----
`

export const handler = async (
  event: CustomAuthorizerEvent
 ): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtPayload = await verifyToken(event.authorizationToken)
    console.log('jwtPayload.sub: ' + jwtPayload.sub)

    logger.info('User was authorized', jwtPayload.sub)

    return {
      principalId: jwtPayload.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {  //Jwt
  const token = getToken(authHeader)

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}