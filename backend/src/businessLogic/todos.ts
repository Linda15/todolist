import * as uuid from 'uuid'
import { TodoItem } from '../models/TodoItem'
import { TodosAccess } from '../dataLayer/todosAccess'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { getUserId } from '../lambda/utils'
import { TodoUpdate } from '../models/TodoUpdate'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { APIGatewayProxyEvent } from 'aws-lambda'

import * as AWS  from 'aws-sdk'
import { createLogger } from '../utils/logger'

const todosAccess = new TodosAccess()
const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export async function getAllTodos(event: APIGatewayProxyEvent): Promise<TodoItem[]> {  
  const userId = getUserId(event)

  const logger = createLogger('GetAllTodos') 
  logger.info('User was authorized', {
    key: userId
  })
  return todosAccess.getAllTodos(userId)
}

export async function getCreatedAt(todoId) {
  var params = {
    TableName: todosTable,
    KeyConditionExpression: "todoId = :todoId",
    ExpressionAttributeValues: {
      ":todoId": todoId
    },
    ProjectionExpression: 'createdAt'
  }  
  const retValue = await docClient.query(params).promise()
  return retValue.Items[0].createdAt
}

export async function deleteTodo(
  todoId: string
  ): Promise<string> {

  return await todosAccess.deleteTodo(todoId)
}

export async function updateTodo(
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
  ): Promise<TodoUpdate> {

  return await todosAccess.updateTodo(todoId, {
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  })
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  event: APIGatewayProxyEvent
  ): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = getUserId(event)
  const bucketName = process.env.AWS_MEDIA_BUCKET

  return await todosAccess.createTodo({
    userId: userId,
    todoId: itemId,    
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${itemId}.png`
  })
}

export async function getSignedUrl(
  todoId: string
  ): Promise<string> {

  return await todosAccess.getSignedUrl(todoId)
}
