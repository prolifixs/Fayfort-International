import { describe, expect, test, beforeAll, afterAll } from 'vitest'
import { createTestUser, createTestProduct, createTestRequest, cleanupDatabase } from '../utils/testUtils'

describe('Requests API', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  test('GET /api/requests should return paginated requests', async () => {
    const request = await createTestRequest()

    const response = await fetch('http://localhost:3000/api/requests')
    const { data, total, page, pageCount } = await response.json()

    expect(response.status).toBe(200)
    expect(data).toBeInstanceOf(Array)
    expect(data[0].id).toBe(request.id)
    expect(data[0].customer).toBeDefined()
    expect(data[0].product).toBeDefined()
    expect(total).toBeGreaterThan(0)
    expect(page).toBe(1)
    expect(pageCount).toBeGreaterThan(0)
  })

  test('GET /api/requests should support filtering by status', async () => {
    const request = await createTestRequest({ status: 'pending' })

    const response = await fetch('http://localhost:3000/api/requests?status=pending')
    const { data } = await response.json()

    expect(response.status).toBe(200)
    expect(data.some((r: { id: string }) => r.id === request.id)).toBe(true)
  })

  test('GET /api/requests should support date range filtering', async () => {
    const request = await createTestRequest()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 1) // Yesterday

    const response = await fetch(
      `http://localhost:3000/api/requests?startDate=${startDate.toISOString()}`
    )
    const { data } = await response.json()

    expect(response.status).toBe(200)
    expect(data.some((r: { id: string }) => r.id === request.id)).toBe(true)
  })

  test('POST /api/requests should create a request', async () => {
    const customer = await createTestUser()
    const product = await createTestProduct()

    const newRequest = {
      customer_id: customer.id,
      product_id: product.id,
      quantity: 5,
      budget: 1000,
      status: 'pending'
    }

    const response = await fetch('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.customer_id).toBe(customer.id)
    expect(data.product_id).toBe(product.id)
    expect(data.status).toBe('pending')
  })

  test('PUT /api/requests should update a request', async () => {
    const request = await createTestRequest()
    const updates = {
      id: request.id,
      status: 'approved',
      notes: 'Request approved'
    }

    const response = await fetch('http://localhost:3000/api/requests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe(updates.status)
  })

  test('DELETE /api/requests should delete a request', async () => {
    const request = await createTestRequest()

    const response = await fetch(`http://localhost:3000/api/requests?id=${request.id}`, {
      method: 'DELETE'
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Request and related records deleted successfully')
  })
}) 