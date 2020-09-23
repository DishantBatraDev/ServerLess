import {APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as uuid from 'uuid'
import * as middy from 'middy'
import {  cors } from "middy/middlewares";
const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = +process.env.SIGNED_URL_EXPIRATION

const s3 =  new AWS.S3({
 signatureVersion: 'v4' 
})
export const handler= middy( async (event: APIGatewayProxyEvent):Promise<APIGatewayProxyResult>=>{
console.log('Processing event: ', event)
const groupId = event.pathParameters.groupId
const parsedBody = JSON.parse(event.body)
const imageId=  uuid.v4() 

const validGroupId = await groupExists(groupId)
if(!validGroupId){
    return {
        statusCode: 404,
        headers: {
            'Access-Control-Allow-Origin':'*',
        },
        body: JSON.stringify({error:'Group does not exist'})
    }
}
const uploadUrl = getUploadUrl(imageId)
const newItem = {
    groupId: groupId,
    timeStamp: new Date().toISOString(),
    imageId,
    ...parsedBody,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  }


await createImage(newItem);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem,
      uploadUrl
    })
  }
})

handler.use(cors({
  credentials: true   //It means it allows headers that allow credentials from the browser
}))

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration,
  });
}

async function createImage(newItem: any) {
    await docClient.put({
        TableName: imagesTable,
        Item: newItem
    }).promise();
}

async function groupExists(groupId: string){
    const result = await docClient.get({
        TableName: groupsTable,
        Key:{
            id: groupId
        }
    }).promise()

    console.log('Get group ', result)
    return !!result.Item
}