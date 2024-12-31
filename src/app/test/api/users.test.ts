import { describe, expect, test, beforeAll, afterAll } from 'vitest'
import { createTestUser, cleanupDatabase } from '../utils/testUtils'

describe('Users API', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  test('GET /api/users should return paginated users', async () => {
    const user = await createTestUser()

    const response = await fetch('http://localhost:3000/api/users')
    const { data, total, page, pageCount } = await response.json()

    expect(response.status).toBe(200)
    expect(data).toBeInstanceOf(Array)
    expect(data[0].id).toBe(user.id)
    expect(data[0].email).toBe(user.email)
    expect(total).toBeGreaterThan(0)
    expect(page).toBe(1)
    expect(pageCount).toBeGreaterThan(0)
  })

  test('GET /api/users should support search', async () => {
    const user = await createTestUser()
    const searchTerm = user.email.split('@')[0]

    const response = await fetch(`http://localhost:3000/api/users?search=${searchTerm}`)
    const { data } = await response.json()

    expect(response.status).toBe(200)
    expect(data.some((u: { id: string }) => u.id === user.id)).toBe(true)
  })

  test('POST /api/users should create a user', async () => {
    const newUser = {
      email: 'test.new@example.com',
      name: 'Test User',
      role: 'customer',
      status: 'active'
    }

    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.email).toBe(newUser.email)
    expect(data.name).toBe(newUser.name)
    expect(data.role).toBe(newUser.role)
  })

  test('POST /api/users should prevent duplicate emails', async () => {
    const user = await createTestUser()
    
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: 'Another User',
        role: 'customer'
      })
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email already exists')
  })

  test('PUT /api/users should update a user', async () => {
    const user = await createTestUser()
    const updates = {
      id: user.id,
      name: 'Updated Name',
      status: 'inactive'
    }

    const response = await fetch('http://localhost:3000/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe(updates.name)
    expect(data.status).toBe(updates.status)
  })

  test('DELETE /api/users should delete a user', async () => {
    const user = await createTestUser()

    const response = await fetch(`http://localhost:3000/api/users?id=${user.id}`, {
      method: 'DELETE'
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('User deleted successfully')
  })

  test('DELETE /api/users should prevent deletion with related requests', async () => {
    // This test would need a request to be created first
    // We'll implement this when we have the requests API
  })
}) 