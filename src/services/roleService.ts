import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import type { UserRole } from '../types/userProfile'

export function watchUserRole(
  userId: string,
  onChange: (role: UserRole | null) => void,
  onError: (error: Error) => void,
): () => void {
  const reference = doc(db, 'users', userId)

  return onSnapshot(
    reference,
    { includeMetadataChanges: true },
    (snapshot) => {
      // No usamos cambios locales ni datos de caché
      // para confirmar permisos administrativos.
      if (
        snapshot.metadata.hasPendingWrites ||
        snapshot.metadata.fromCache
      ) {
        return
      }

      if (!snapshot.exists()) {
        onChange(null)
        return
      }

      const role: unknown = snapshot.data().role

      if (role === 'customer' || role === 'admin') {
        onChange(role)
        return
      }

      onError(
        new Error('El perfil contiene un rol inválido.'),
      )
    },
    onError,
  )
}