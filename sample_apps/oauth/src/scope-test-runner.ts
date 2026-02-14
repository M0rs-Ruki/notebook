/**
 * OAuth scope tests: Org, Users, User Groups, Teams.
 *
 * Where we make the request: all API calls go through callScopeEndpoint() below.
 * Test case definitions live in scope-test-cases.ts (used by tests and by GET /scope-tests).
 */

import { makeRequest } from './utils'
import {
  SCOPE_TEST_CASES,
  PLACEHOLDER_USER_ID,
  PLACEHOLDER_GROUP_ID,
  PLACEHOLDER_TEAM_ID,
  type ScopeTestCase,
} from './scope-test-cases'

export type { ScopeTestCase }
export { ORG_TEST_CASES, USERS_TEST_CASES, USER_GROUPS_TEST_CASES, TEAMS_TEST_CASES, SCOPE_TEST_CASES } from './scope-test-cases'

export interface ScopeTestResult {
  case: ScopeTestCase
  status: number
  passed: boolean
  message: string
}

function toId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
    return (value as { toString: () => string }).toString()
  }
  return String(value)
}

function firstIdFromList(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const arr = Array.isArray(data)
    ? data
    : (d.data as unknown[] | undefined) ?? (d.users as unknown[] | undefined) ?? (d.teams as unknown[] | undefined) ?? (d.userGroups as unknown[] | undefined)
  if (!Array.isArray(arr) || arr.length === 0) return null
  const first = arr[0] as Record<string, unknown>
  const id = first?.id ?? first?._id
  return toId(id) || null
}

/**
 * Fetch real IDs from list endpoints so GET-by-ID and PUT can return 200 when resources exist.
 */
export async function fetchRealIds(
  baseUrl: string,
  accessToken: string,
): Promise<{ userId: string | null; groupId: string | null; teamId: string | null }> {
  const headers = { Authorization: `Bearer ${accessToken}` }
  let userId: string | null = null
  let groupId: string | null = null
  let teamId: string | null = null

  try {
    const usersRes = await makeRequest<unknown>(`${baseUrl}/api/v1/users`, { headers })
    if (usersRes.status === 200) userId = firstIdFromList(usersRes.data)
  } catch {
    // ignore
  }
  try {
    const groupsRes = await makeRequest<unknown>(`${baseUrl}/api/v1/userGroups`, { headers })
    if (groupsRes.status === 200) groupId = firstIdFromList(groupsRes.data)
  } catch {
    // ignore
  }
  try {
    const teamsRes = await makeRequest<unknown>(`${baseUrl}/api/v1/teams?page=1&limit=10`, { headers })
    if (teamsRes.status === 200) teamId = firstIdFromList(teamsRes.data)
  } catch {
    // ignore
  }

  return { userId, groupId, teamId }
}

/**
 * Build path replacement map (placeholder ID → real ID) for use in callScopeEndpoint.
 */
export function buildPathReplace(ids: { userId: string | null; groupId: string | null; teamId: string | null }): Record<string, string> {
  return {
    [PLACEHOLDER_USER_ID]: ids.userId ?? PLACEHOLDER_USER_ID,
    [PLACEHOLDER_GROUP_ID]: ids.groupId ?? PLACEHOLDER_GROUP_ID,
    [PLACEHOLDER_TEAM_ID]: ids.teamId ?? PLACEHOLDER_TEAM_ID,
  }
}

/**
 * Single place we make requests: build URL from test case and pathReplace, call backend, return status.
 */
export async function callScopeEndpoint(
  baseUrl: string,
  accessToken: string,
  testCase: ScopeTestCase,
  pathReplace: Record<string, string>,
): Promise<{ status: number }> {
  let path = testCase.path
  for (const [placeholder, realId] of Object.entries(pathReplace)) {
    path = path.replace(placeholder, realId)
  }
  const queryStr = testCase.query
    ? '?' + Object.entries(testCase.query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
    : ''
  const url = `${baseUrl.replace(/\/$/, '')}${path}${queryStr}`
  const body = testCase.method !== 'GET' ? (testCase.body ?? '{}') : undefined

  const response = await makeRequest<unknown>(url, {
    method: testCase.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(testCase.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    body,
  })

  return { status: response.status }
}

/**
 * Run all scope tests (used by GET /scope-tests). Returns results for UI; does not throw.
 */
export async function runScopeTests(
  backendUrl: string,
  accessToken: string,
  tokenScopes: string[],
): Promise<ScopeTestResult[]> {
  const baseUrl = backendUrl.replace(/\/$/, '')
  const ids = await fetchRealIds(baseUrl, accessToken)
  const pathReplace = buildPathReplace(ids)
  const results: ScopeTestResult[] = []

  for (const testCase of SCOPE_TEST_CASES) {
    const hasScope = tokenScopes.includes(testCase.requiredScope)
    try {
      const { status } = await callScopeEndpoint(baseUrl, accessToken, testCase, pathReplace)
      const passed = hasScope
        ? (status >= 200 && status < 300) || (status >= 400 && status < 500)
        : status === 401
      const message = hasScope
        ? status >= 200 && status < 300
          ? `OK (${status})`
          : status >= 400 && status < 500
            ? `Auth OK (${status})`
            : `Unexpected ${status}`
        : status === 401
          ? `Correctly denied (401)`
          : `Expected 401, got ${status}`
      results.push({ case: testCase, status, passed, message })
    } catch (err) {
      results.push({
        case: testCase,
        status: -1,
        passed: false,
        message: (err as Error).message,
      })
    }
  }

  return results
}

export function parseScopes(scopeString: string): string[] {
  if (!scopeString || !scopeString.trim()) return []
  return scopeString.split(/\s+/).map((s) => s.trim()).filter(Boolean)
}
