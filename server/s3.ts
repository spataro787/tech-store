import { S3Client } from '@aws-sdk/client-s3'

let client: S3Client | undefined

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Falta configurar la variable ${name}.`)
  }

  return value
}

export function getS3Bucket(): string {
  return requireEnvironment('AWS_S3_BUCKET')
}

export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: requireEnvironment('AWS_REGION'),
      credentials: {
        accessKeyId: requireEnvironment('AWS_ACCESS_KEY_ID'),
        secretAccessKey: requireEnvironment('AWS_SECRET_ACCESS_KEY'),
      },
    })
  }

  return client
}