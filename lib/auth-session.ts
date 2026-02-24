import type { NextRequest } from "next/server"

export type SessionUser = {
  userId: string
  isAdmin: boolean
}

export type LoginCredential = {
  username: string
  code: string
}

const LOGIN_SLOT_COUNT = 9

function parseCredentialEntry(entry: string): LoginCredential | null {
  const separator = entry.indexOf(":")
  if (separator <= 0 || separator === entry.length - 1) return null

  const username = entry.slice(0, separator).trim()
  const code = entry.slice(separator + 1).trim()
  if (!username || !code) return null

  return { username, code }
}

function getCredentialsFromSlots(): LoginCredential[] {
  const credentials: LoginCredential[] = []
  for (let index = 1; index <= LOGIN_SLOT_COUNT; index += 1) {
    const username = process.env[`LOGIN_USER_${index}`]?.trim()
    const password = process.env[`LOGIN_PASSWORD_${index}`]?.trim()
    const code = (password || process.env[`LOGIN_CODE_${index}`] || "").trim()
    if (!username || !code) continue
    credentials.push({ username, code })
  }
  return credentials
}

export function getConfiguredCredentials(): LoginCredential[] {
  const slotCredentials = getCredentialsFromSlots()
  if (slotCredentials.length > 0) {
    return slotCredentials
  }

  const rawList = process.env.LOGIN_USERS?.trim()
  if (rawList) {
    return rawList
      .split(",")
      .map((entry) => parseCredentialEntry(entry.trim()))
      .filter((entry): entry is LoginCredential => Boolean(entry))
      .slice(0, LOGIN_SLOT_COUNT)
  }

  const username =
    process.env.LOGIN_USER ?? (process.env.NODE_ENV !== "production" ? "admin" : "")
  const code =
    process.env.LOGIN_CODE ?? (process.env.NODE_ENV !== "production" ? "1234" : "")

  if (!username || !code) return []
  return [{ username, code }]
}

export function getExpectedAdminUser(credentials: LoginCredential[] = getConfiguredCredentials()) {
  const configuredAdmin = process.env.LOGIN_ADMIN_USER?.trim()
  if (configuredAdmin) return configuredAdmin

  if (process.env.LOGIN_USER?.trim()) return process.env.LOGIN_USER.trim()
  return credentials[0]?.username ?? ""
}

export function encodeSessionToken(username: string, code: string) {
  return btoa(`${username}:${code}`)
}

function decodeSessionToken(token: string) {
  try {
    const decoded = atob(token)
    const separator = decoded.indexOf(":")
    if (separator <= 0 || separator === decoded.length - 1) return null

    const username = decoded.slice(0, separator).trim()
    const code = decoded.slice(separator + 1).trim()
    if (!username || !code) return null

    return { username, code }
  } catch {
    return null
  }
}

export function validateSessionToken(token: string, credentials: LoginCredential[]) {
  const parsed = decodeSessionToken(token)
  if (!parsed) return null

  return (
    credentials.find(
      (credential) =>
        credential.username === parsed.username &&
        credential.code === parsed.code,
    ) ?? null
  )
}

export function getSessionUser(request: NextRequest): SessionUser | null {
  const token = request.cookies.get("auth_session")?.value
  if (!token) return null

  const credentials = getConfiguredCredentials()
  const matched = validateSessionToken(token, credentials)
  if (!matched) return null

  return {
    userId: matched.username,
    isAdmin: matched.username === getExpectedAdminUser(credentials),
  }
}
