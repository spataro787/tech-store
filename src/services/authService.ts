import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  validatePassword,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import {
  createUserProfile,
  isValidBirthDate,
} from './userService'
import type { ProfileInput } from './userService'
import { isValidPassword } from '../utils/passwordValidation'

export { isValidBirthDate }

const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

function validateProfile(profile: ProfileInput): void {
  const firstName = profile.firstName.trim()
  const lastName = profile.lastName.trim()

  if (
    !firstName ||
    firstName.length > 80 ||
    !lastName ||
    lastName.length > 80
  ) {
    throw new Error(
      'Ingresá nombre y apellido de hasta 80 caracteres.',
    )
  }

  if (!isValidBirthDate(profile.birthDate)) {
    throw new Error(
      'Ingresá una fecha de nacimiento válida, no futura.',
    )
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  profile: ProfileInput,
) {
  validateProfile(profile)

  if (!isValidPassword(password)) {
    throw new FirebaseError(
      'auth/weak-password',
      'La contraseña no cumple los requisitos.',
    )
  }

  const validation = await validatePassword(auth, password)

  if (!validation.isValid) {
    throw new FirebaseError(
      'auth/weak-password',
      'La contraseña no cumple la política de Firebase.',
    )
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  )

  await createUserProfile(credential.user.uid, profile)

  return credential.user
}

export async function completeRegistrationProfile(
  profile: ProfileInput,
): Promise<void> {
  const user = auth.currentUser

  if (!user) {
    throw new Error(
      'Iniciá sesión antes de completar tus datos.',
    )
  }

  validateProfile(profile)

  await createUserProfile(user.uid, profile)
}

export function watchRegistrationProfile(
  userId: string,
  onChange: (exists: boolean) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, 'users', userId),
    { includeMetadataChanges: true },
    (snapshot) => {
      // Esperamos la confirmación del servidor.
      // Una escritura local todavía podría ser rechazada.
      if (
        snapshot.metadata.hasPendingWrites ||
        snapshot.metadata.fromCache
      ) {
        return
      }

      onChange(snapshot.exists())
    },
    onError,
  )
}

export async function loginWithEmail(
  email: string,
  password: string,
) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  )

  return credential.user
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(
    auth,
    googleProvider,
  )

  return credential.user
}

export async function logout(): Promise<void> {
  await signOut(auth)
}