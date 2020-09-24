import {APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import * as util from '../../auth/util'
import {createGroup} from '../../businessLogic/group'
import { create } from 'domain'
import {CreateGroupRequest} from '../../requests/CreateGroupRequest'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent):Promise<APIGatewayProxyResult>=>{
console.log('Processing event: ', event)
const newGroup:CreateGroupRequest = JSON.parse(event.body)
const authorization = event.headers.Authorization
const split = authorization.split(' ')
const jwtToken = split[1]

const newItem = await createGroup(newGroup,jwtToken)
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials':'*'
    },
    body: JSON.stringify({
      newItem
    })
  }
}