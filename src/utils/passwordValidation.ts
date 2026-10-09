export function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9\s]/.test(password),
    noSpaces: !/\s/.test(password),
  }
}

export function isValidPassword(password: string): boolean {
  const checks = getPasswordChecks(password)

  return Object.values(checks).every(Boolean)
}