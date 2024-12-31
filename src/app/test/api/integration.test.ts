import { describe, expect, test, beforeAll, afterAll } from 'vitest'
import { createTestUser, createTestProduct, createTestRequest, cleanupDatabase } from '../utils/testUtils'


interface RequestData {
  id: string;
  customer: { email: string };
  product: { name: string };
}
describe('API Integration Tests', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  

  test('Complete request workflow', async () => {
    // 1. Create a user
    const customer = await createTestUser()
    
    // 2. Create a product
    const product = await createTestProduct()
    
    // 3. Create a request
    const newRequest = {
      customer_id: customer.id,
      product_id: product.id,
      quantity: 5,
      budget: 1000,
      status: 'pending'
    }

    const createResponse = await fetch('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    })
    const request = await createResponse.json()

    expect(createResponse.status).toBe(200)
    expect(request.status).toBe('pending')

    // 4. Update request status
    const updateResponse = await fetch('http://localhost:3000/api/requests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: request.id,
        status: 'approved',
        notes: 'Request approved by admin',
        updated_by: customer.id
      })
    })
    const updatedRequest = await updateResponse.json()

    expect(updateResponse.status).toBe(200)
    expect(updatedRequest.status).toBe('approved')

    // 5. Verify status history
    const historyResponse = await fetch(`http://localhost:3000/api/requests?id=${request.id}`)
    const { data } = await historyResponse.json()
    const requestWithHistory = data[0]

    expect(requestWithHistory.status_history).toHaveLength(2) // Initial + Update
    expect(requestWithHistory.status_history[0].status).toBe('approved')
  })

  test('User deletion with existing requests', async () => {
    // 1. Create user and request
    const request = await createTestRequest()
    const userId = request.customer_id

    // 2. Try to delete user
    const response = await fetch(`http://localhost:3000/api/users?id=${userId}`, {
      method: 'DELETE'
    })
    const data = await response.json()

    // 3. Verify deletion is prevented
    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot delete user with existing requests')
  })

  test('Request creation with invalid data', async () => {
    // 1. Try to create request with non-existent user
    const product = await createTestProduct()
    const invalidRequest = {
      customer_id: '00000000-0000-0000-0000-000000000000',
      product_id: product.id,
      quantity: 5,
      budget: 1000
    }

    const response = await fetch('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequest)
    })

    expect(response.status).toBe(500)
  })

  test('Request filtering and relations', async () => {
    // 1. Create test data
    const request = await createTestRequest()

    // 2. Test filtering by status
    const statusResponse = await fetch(`http://localhost:3000/api/requests?status=pending`)
    const { data: statusData } = await statusResponse.json()
    expect(statusData.some((r: RequestData) => r.id === request.id)).toBe(true)

    // 3. Test customer relation
    expect(statusData[0].customer).toBeDefined()
    expect(statusData[0].customer.email).toBeDefined()

    // 4. Test product relation
    expect(statusData[0].product).toBeDefined()
    expect(statusData[0].product.name).toBeDefined()
  })
}) 