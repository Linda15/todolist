import * as AWS  from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { getCreatedAt } from '../businessLogic/todos'

import * as AWSXRay from 'aws-xray-sdk'
const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }
  
  private readonly s3Client = new AWS.S3({
    signatureVersion: 'v4',
    region: process.env.MEDIA_BUCKET_REGION,
    params: {Bucket: process.env.AWS_MEDIA_BUCKET}
  });

  async deleteTodo(todoId: string): Promise<string> {
    const value = await getCreatedAt(todoId) 
    await this.docClient.delete({
      TableName: this.todosTable,
      Key:{             
            "todoId": todoId,
            "createdAt": value
          }
    }).promise()
    return 'Todo Deleted'
  }

  async updateTodo(todoId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {  
    const value = await getCreatedAt(todoId)
    var params = {
      TableName: this.todosTable,
      Key:{
        "todoId": todoId,
        "createdAt": value
      },        
      UpdateExpression: 'SET #n =:val1, dueDate =:val2, done =:val3',
      ExpressionAttributeNames: {"#n":"name"},
      ExpressionAttributeValues: {
          ':val1': todoUpdate.name,
          ':val2': todoUpdate.dueDate,
          ':val3': todoUpdate.done
      },
      ReturnValues:"UPDATED_NEW"
    };
    await this.docClient.update(params).promise()
    return todoUpdate
  }

  async updateURL(todoId: string, sAttachmentUrl: string): Promise<string> {   
    const value = await getCreatedAt(todoId)
    var params = {
      TableName: this.todosTable,
      Key:{
        "todoId": todoId,
        "createdAt": value
      },        
      UpdateExpression: 'SET attachmentUrl =:val1',
      ExpressionAttributeValues: {
        ':val1': sAttachmentUrl
      },
      ReturnValues:"UPDATED_NEW"
    };
    await this.docClient.update(params).promise()
    return "Updated URL"
  }

  async getSignedUrl(key: string): Promise<string> {
    const signedUrlExpireSeconds = 60 * 5
    const param = { Bucket: process.env.AWS_MEDIA_BUCKET, Key: 'xandertest.jpg', Expires: signedUrlExpireSeconds };    
    const url = this.s3Client.getSignedUrl('putObject', param);
    const getURL = this.s3Client.getSignedUrl('getObject', param);

    const retValue = await this.updateURL(key, getURL)
    console.log(retValue + '--getURL: ' + getURL)

    return url as string
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')
    console.log('userId: ' + userId)   

    var params = {
      TableName: this.todosTable,
      IndexName: 'userIdIndex',
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: {"#userId":"userId"},
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }
    const result = await this.docClient.query(params).promise()
    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    console.log('Create Todo')

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()
    return todoItem
  }
}
  
function createDynamoDBClient() {
  console.log('Creating an AWS DynamoDBClient instance')  
  return new XAWS.DynamoDB.DocumentClient()
}