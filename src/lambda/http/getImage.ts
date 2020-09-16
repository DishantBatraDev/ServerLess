import {APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

const docClient = new AWS.DynamoDB.DocumentClient();

const imagesTable = process.env.IMAGES_TABLE
const imageIdIndex = process.env.IMAGE_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent):Promise<APIGatewayProxyResult>=>{
console.log('Caller event: ', event)

const imageId = event.pathParameters.imageId

const result =await docClient.query({
    TableName: imagesTable,
    IndexName: imageIdIndex,
    KeyConditionExpression: 'imageId= :imageId',
    ExpressionAttributeValues:{
        ':imageId': imageId
    }
}).promise()

if(result.Count!==0){
    return {
        statusCode: 200,
        headers:{
            'Access-Control-Allow-Origin':'*'
        },
        body:JSON.stringify(result.Items[0])
    }
}

return {
    statusCode:404,
    headers:{
        'Access-Control-Allow-Origin':'*'
    },
    body:''
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