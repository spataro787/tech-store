type DocumentData = Record<string, unknown>

type DocumentReference = {
  collection: string
  id: string
  path: string
}

type Snapshot = {
  exists: boolean
  data: () => DocumentData | undefined
}

type Write =
  | {
      operation: 'update' | 'set' | 'create'
      reference: DocumentReference
      data: DocumentData
    }

type Transaction = {
  get: (reference: DocumentReference) => Promise<Snapshot>
  getAll: (...references: DocumentReference[]) => Promise<Snapshot[]>
  update: (reference: DocumentReference, data: DocumentData) => void
  set: (reference: DocumentReference, data: DocumentData) => void
  create: (reference: DocumentReference, data: DocumentData) => void
}

export function createFakeAdminDb(
  initialDocuments: Record<string, DocumentData>,
) {
  const documents = new Map(Object.entries(initialDocuments))
  let transactionQueue = Promise.resolve()

  function createReference(
    collection: string,
    id: string,
  ): DocumentReference {
    return { collection, id, path: `${collection}/${id}` }
  }

  function read(reference: DocumentReference): Snapshot {
    const value = documents.get(reference.path)

    return {
      exists: value !== undefined,
      data: () => value,
    }
  }

  return {
    collection(collection: string) {
      return {
        doc(id: string) {
          return createReference(collection, id)
        },
      }
    },
    async runTransaction<T>(
      callback: (transaction: Transaction) => Promise<T>,
    ): Promise<T> {
      const previous = transactionQueue
      let release!: () => void
      transactionQueue = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous

      const writes: Write[] = []
      const transaction: Transaction = {
        get: async (reference) => read(reference),
        getAll: async (...references) => references.map(read),
        update: (reference, data) => {
          writes.push({ operation: 'update', reference, data })
        },
        set: (reference, data) => {
          writes.push({ operation: 'set', reference, data })
        },
        create: (reference, data) => {
          writes.push({ operation: 'create', reference, data })
        },
      }

      try {
        const result = await callback(transaction)

        for (const write of writes) {
          if (write.operation === 'update') {
            documents.set(write.reference.path, {
              ...documents.get(write.reference.path),
              ...write.data,
            })
          } else {
            documents.set(write.reference.path, write.data)
          }
        }

        return result
      } finally {
        release()
      }
    },
    readDocument(collection: string, id: string) {
      return documents.get(`${collection}/${id}`)
    },
    listDocuments(collection: string) {
      const prefix = `${collection}/`

      return [...documents.entries()]
        .filter(([path]) => path.startsWith(prefix))
        .map(([, data]) => data)
    },
  }
}
