export function generateSessionCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function normalizeSessionCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function isValidSessionCode(value: string) {
  return /^\d{6}$/.test(value)
}

export function isValidSessionPassword(value: string) {
  return isValidSessionCode(value)
}

