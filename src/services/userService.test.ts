import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  createUserProfile,
  isValidBirthDate,
} from './userService'

const mocks = vi.hoisted(() => ({
  db: {},
  doc: vi.fn(),
  setDoc: vi.fn(),
}))

vi.mock('./firebase', () => ({
  db: mocks.db,
}))

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  setDoc: mocks.setDoc,
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()

  // Fijamos el día para que los tests no cambien con el tiempo.
  vi.setSystemTime(new Date(2026, 9, 2, 12))

  mocks.doc.mockReturnValue('profile-reference')
  mocks.setDoc.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('isValidBirthDate', () => {
  it.each([
    '1990-11-02',
    '2000-02-29',
    '2024-02-29',
    '2026-10-02',
  ])('acepta la fecha válida %s', (date) => {
    expect(isValidBirthDate(date)).toBe(true)
  })

  it.each([
    '',
    '02/11/1990',
    '1990-1-02',
    '2025-02-29',
    '2026-02-30',
    '2026-04-31',
    '2026-13-01',
    '2026-10-03',
    '2030-01-01',
    '0000-01-01',
  ])('rechaza la fecha inválida %s', (date) => {
    expect(isValidBirthDate(date)).toBe(false)
  })
})

describe('createUserProfile', () => {
  it('guarda los datos sin espacios sobrantes y con rol customer', async () => {
    await createUserProfile('customer-01', {
      firstName: '  Agustín  ',
      lastName: '  Spataro  ',
      birthDate: '1990-11-02',
    })

    expect(mocks.doc).toHaveBeenCalledExactlyOnceWith(
      mocks.db,
      'users',
      'customer-01',
    )

    expect(mocks.setDoc).toHaveBeenCalledExactlyOnceWith(
      'profile-reference',
      {
        uid: 'customer-01',
        firstName: 'Agustín',
        lastName: 'Spataro',
        birthDate: '1990-11-02',
        role: 'customer',
      },
    )
  })

  it.each([
    { firstName: '   ', lastName: 'Spataro' },
    { firstName: 'Agustín', lastName: '   ' },
    { firstName: 'A'.repeat(81), lastName: 'Spataro' },
    { firstName: 'Agustín', lastName: 'A'.repeat(81) },
  ])('rechaza nombres inválidos: %o', async (names) => {
    await expect(
      createUserProfile('customer-01', {
        ...names,
        birthDate: '1990-11-02',
      }),
    ).rejects.toThrow(
      'Ingresá nombre y apellido de hasta 80 caracteres.',
    )

    expect(mocks.setDoc).not.toHaveBeenCalled()
  })

  it('rechaza una fecha futura sin escribir en Firestore', async () => {
    await expect(
      createUserProfile('customer-01', {
        firstName: 'Agustín',
        lastName: 'Spataro',
        birthDate: '2030-01-01',
      }),
    ).rejects.toThrow(
      'Ingresá una fecha de nacimiento válida, no futura.',
    )

    expect(mocks.setDoc).not.toHaveBeenCalled()
  })

  it('informa cuando Firestore rechaza el guardado', async () => {
    mocks.setDoc.mockRejectedValue(
      new Error('No se pudo guardar el perfil'),
    )

    await expect(
      createUserProfile('customer-01', {
        firstName: 'Agustín',
        lastName: 'Spataro',
        birthDate: '1990-11-02',
      }),
    ).rejects.toThrow('No se pudo guardar el perfil')
  })
})