import {
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]

  if (!value || !value.trim()) {
    throw new Error(
      `Falta configurar la variable de entorno ${name}.`,
    )
  }

  return value
}

function getFirebaseAdminApp() {
  const existingApp = getApps().find(
    (app) => app.name === 'tech-store-server',
  )

  if (existingApp) {
    return existingApp
  }

  return initializeApp(
    {
      credential: cert({
        projectId: requireEnvironmentVariable(
          'FIREBASE_ADMIN_PROJECT_ID',
        ),
        clientEmail: requireEnvironmentVariable(
          'FIREBASE_ADMIN_CLIENT_EMAIL',
        ),
        privateKey: requireEnvironmentVariable(
          'FIREBASE_ADMIN_PRIVATE_KEY',
        ).replace(/\\n/g, '\n'),
      }),
    },
    'tech-store-server',
  )
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp())
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp())
}