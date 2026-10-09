import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import uploadImageHandler from '../api/upload-image.js'
import productImageHandler from '../api/product-image.js'

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getAdminDb: vi.fn(),
  getS3Client: vi.fn(),
  getS3Bucket: vi.fn(),
  createPresignedPost: vi.fn(),
}))

vi.mock('../server/firebaseAdmin.js', () => ({
  getAdminAuth: () => ({ verifyIdToken: mocks.verifyIdToken }),
  getAdminDb: mocks.getAdminDb,
}))

vi.mock('../server/s3.js', () => ({
  getS3Client: mocks.getS3Client,
  getS3Bucket: mocks.getS3Bucket,
}))

vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: mocks.createPresignedPost,
}))

vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: class {
    readonly input: unknown

    constructor(input: unknown) {
      this.input = input
    }
  },
}))

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
    setHeader: vi.fn(),
  }
  response.status.mockReturnValue(response)

  return response
}

function createRequest(
  overrides: Partial<VercelRequest>,
): VercelRequest {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
    body: { contentType: 'image/png', size: 120 },
    query: {},
    ...overrides,
  } as VercelRequest
}

function setUserRole(role: string) {
  mocks.getAdminDb.mockReturnValue({
    collection: () => ({
      doc: () => ({
        get: async () => ({ data: () => ({ role }) }),
      }),
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.verifyIdToken.mockResolvedValue({ uid: 'admin-1' })
  setUserRole('admin')
  mocks.getS3Client.mockReturnValue({
    send: vi.fn().mockResolvedValue({
      Body: {
        transformToByteArray: async () =>
          new Uint8Array([1, 2, 3]),
      },
      ContentType: 'image/png',
      ContentLength: 3,
    }),
  })
  mocks.getS3Bucket.mockReturnValue('private-product-images')
  mocks.createPresignedPost.mockResolvedValue({
    url: 'https://private-product-images.s3.us-east-1.amazonaws.com',
    fields: { key: 'products/key.png' },
  })
})

describe('upload-image endpoint', () => {
  it('requires an authenticated administrator', async () => {
    const response = createResponse()

    await uploadImageHandler(
      createRequest({
        headers: {},
      }),
      response as unknown as VercelResponse,
    )

    expect(response.status).toHaveBeenCalledWith(401)
    expect(mocks.createPresignedPost).not.toHaveBeenCalled()
  })

  it('rejects an authenticated customer', async () => {
    setUserRole('customer')
    const response = createResponse()

    await uploadImageHandler(
      createRequest({}),
      response as unknown as VercelResponse,
    )

    expect(response.status).toHaveBeenCalledWith(403)
    expect(mocks.createPresignedPost).not.toHaveBeenCalled()
  })

  it('constrains a signed upload to an allowed image type and size', async () => {
    const response = createResponse()

    await uploadImageHandler(
      createRequest({}),
      response as unknown as VercelResponse,
    )

    expect(mocks.createPresignedPost).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        Bucket: 'private-product-images',
        Key: expect.stringMatching(
          /^products\/[a-f0-9-]+\.png$/,
        ),
        Expires: 60,
        Conditions: expect.arrayContaining([
          ['content-length-range', 1, 5 * 1024 * 1024],
          ['eq', '$Content-Type', 'image/png'],
        ]),
      }),
    )
    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('rejects unsupported formats before signing an upload', async () => {
    const response = createResponse()

    await uploadImageHandler(
      createRequest({
        body: { contentType: 'image/svg+xml', size: 120 },
      }),
      response as unknown as VercelResponse,
    )

    expect(response.status).toHaveBeenCalledWith(400)
    expect(mocks.createPresignedPost).not.toHaveBeenCalled()
  })
})

describe('product-image endpoint', () => {
  it('serves allowed objects from the private bucket with safe headers', async () => {
    const response = createResponse()

    await productImageHandler(
      createRequest({
        method: 'GET',
        query: {
          key: 'products/123e4567-e89b-12d3-a456-426614174000.png',
        },
      }),
      response as unknown as VercelResponse,
    )

    expect(mocks.getS3Client).toHaveBeenCalled()
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'image/png',
    )
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    )
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.send).toHaveBeenCalledWith(Buffer.from([1, 2, 3]))
  })

  it('rejects keys outside the product image namespace', async () => {
    const response = createResponse()

    await productImageHandler(
      createRequest({
        method: 'GET',
        query: { key: '../private-key.png' },
      }),
      response as unknown as VercelResponse,
    )

    expect(response.status).toHaveBeenCalledWith(400)
    expect(mocks.getS3Client).not.toHaveBeenCalled()
  })

  it('returns 404 when the private object does not exist', async () => {
    const send = vi.fn().mockRejectedValue(
      Object.assign(new Error('missing'), { name: 'NoSuchKey' }),
    )
    mocks.getS3Client.mockReturnValue({ send })
    const response = createResponse()

    await productImageHandler(
      createRequest({
        method: 'GET',
        query: {
          key: 'products/123e4567-e89b-12d3-a456-426614174000.png',
        },
      }),
      response as unknown as VercelResponse,
    )

    expect(response.status).toHaveBeenCalledWith(404)
  })
})
