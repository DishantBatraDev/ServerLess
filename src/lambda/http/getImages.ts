import {APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent):Promise<APIGatewayProxyResult>=>{
console.log('Caller event: ', event)

const groupId = event.pathParameters.groupId

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

const images = await getImagesForGroup(groupId)

return {
    statusCode: 200,
    headers:{
        'Access-Control-Allow-Origin':'*'
    },
    body:JSON.stringify({items:images})
}
}


async function getImagesForGroup(groupId:string){
    const result = await docClient.query({
        TableName:imagesTable,
        KeyConditionExpression:'groupId= :groupId',
        ExpressionAttributeValues:{
            ':groupId': groupId
        },
        ScanIndexForward:false  // It basically give the result in reverese sorted order ,so latest images will be shown first
    }).promise()

    return result.Items;
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