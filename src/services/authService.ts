import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

export async function registerWithEmail(
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  )

  return credential.user
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

export async function logout() {
  await signOut(auth)
}