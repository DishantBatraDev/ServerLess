import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import * as express from 'express'
import * as awsServerlessExpress from 'aws-serverless-express'
import "source-map-support/register";

import { getAllGroups } from "../../businessLogic/group";

const app = express()

app.get('/groups', async (_req, res) => {
  const groups = await getAllGroups()

  res.json({
    items: groups
  })
})

const server = awsServerlessExpress.createServer(app)
exports.handler = (event, context) => { awsServerlessExpress.proxy(server, event, context) }
