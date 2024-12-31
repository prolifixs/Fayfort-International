import { describe, expect, test, beforeAll, afterAll } from 'vitest'
import { createTestCategory, cleanupDatabase } from '../utils/testUtils'

describe('Categories API', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
  })

  test('GET /api/categories should return paginated categories', async () => {
    const category = await createTestCategory()

    const response = await fetch('http://localhost:3000/api/categories')
    const { data, total, page, pageCount } = await response.json()

    expect(response.status).toBe(200)
    expect(data).toBeInstanceOf(Array)
    expect(data[0].id).toBe(category.id)
    expect(data[0].name).toBe(category.name)
    expect(total).toBeGreaterThan(0)
    expect(page).toBe(1)
    expect(pageCount).toBeGreaterThan(0)
  })

  test('GET /api/categories should support search', async () => {
    const category = await createTestCategory()
    const searchTerm = category.name.substring(0, 3)

    const response = await fetch(`http://localhost:3000/api/categories?search=${searchTerm}`)
    const { data } = await response.json()

    expect(response.status).toBe(200)
    expect(data.some((c: { id: string }) => c.id === category.id)).toBe(true)
  })

  test('POST /api/categories should create a category', async () => {
    const newCategory = {
      name: 'New Test Category',
      description: 'New Test Description'
    }

    const response = await fetch('http://localhost:3000/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory)
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.name).toBe(newCategory.name)
    expect(data.description).toBe(newCategory.description)
  })

  test('POST /api/categories should prevent duplicate names', async () => {
    const category = await createTestCategory()
    
    const response = await fetch('http://localhost:3000/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: category.name })
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Category name already exists')
  })

  test('PUT /api/categories should update a category', async () => {
    const category = await createTestCategory()
    const updates = {
      id: category.id,
      name: 'Updated Category Name',
      description: 'Updated Description'
    }

    const response = await fetch('http://localhost:3000/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe(updates.name)
    expect(data.description).toBe(updates.description)
  })

  test('DELETE /api/categories should delete a category', async () => {
    const category = await createTestCategory()

    const response = await fetch(`http://localhost:3000/api/categories?id=${category.id}`, {
      method: 'DELETE'
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Category deleted successfully')
  })

  test('DELETE /api/categories should prevent deletion with related products', async () => {
    // This test would need a product to be created first
    // We'll implement this when we have the products API
  })
})
