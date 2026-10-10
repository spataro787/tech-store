import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const majorVersion = Number(process.versions.node.split('.')[0])

assert.ok(
  majorVersion >= 24,
  `Firebase Admin runtime smoke check requires Node.js 24+, received ${process.version}.`,
)

const require = createRequire(import.meta.url)
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const jwksRsa = require('jwks-rsa')

assert.equal(typeof getAuth, 'function')
assert.equal(typeof getFirestore, 'function')
assert.equal(typeof jwksRsa, 'function')

console.log(
  `Firebase Admin CommonJS runtime modules loaded successfully on Node.js ${process.version}.`,
)
