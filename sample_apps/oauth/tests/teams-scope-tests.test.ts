/**
 * Teams scope tests. Mentor ask: team read, write — test separately, use asserts.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { loadEnvFile } from '../src/utils'
import {
  TEAMS_TEST_CASES,
  fetchRealIds,
  buildPathReplace,
  callScopeEndpoint,
  parseScopes,
} from '../src/scope-test-runner'

loadEnvFile()

const baseUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '')
const accessToken = process.env.ACCESS_TOKEN || ''
const tokenScopes = parseScopes(process.env.SCOPES || '')

describe('Teams scope tests (team read, write)', () => {
  let pathReplace: Record<string, string> = {}

  beforeAll(async () => {
    if (!accessToken) return
    const ids = await fetchRealIds(baseUrl, accessToken)
    pathReplace = buildPathReplace(ids)
  })

  it.each(TEAMS_TEST_CASES)('$requiredScope — $name: with scope returns 2xx or 4xx, without scope returns 401', async (testCase) => {
    if (!accessToken) return
    const { status } = await callScopeEndpoint(baseUrl, accessToken, testCase, pathReplace)
    const hasScope = tokenScopes.includes(testCase.requiredScope)
    if (hasScope) {
      expect(status, `${testCase.name}: with ${testCase.requiredScope} expect 2xx or 4xx`).toBeGreaterThanOrEqual(200)
      expect(status, `${testCase.name}: with ${testCase.requiredScope} expect < 500`).toBeLessThan(500)
    } else {
      expect(status, `${testCase.name}: without ${testCase.requiredScope} expect 401`).toBe(401)
    }
  })
})
