/**
 * Scope test runner: Org, Users, User Groups, Teams.
 *
 * What this file does:
 * - We call the backend API for each scope test. All those calls go through callScopeEndpoint().
 * - Test cases (which URL, which scope) live in scope-test-cases.ts.
 *
 * The rule we check:
 * - If the token has the required scope → backend may return 200, 201, 400, etc. (we treat 2xx and 4xx as OK).
 * - If the token does NOT have the scope → we expect 401 Unauthorized.
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
export {
  ORG_TEST_CASES,
  USERS_TEST_CASES,
  USER_GROUPS_TEST_CASES,
  TEAMS_TEST_CASES,
  SCOPE_TEST_CASES,
} from './scope-test-cases'

export interface ScopeTestResult {
  case: ScopeTestCase
  status: number
  passed: boolean
  message: string
}

// -----------------------------------------------------------------------------
// Helpers: get an id from the API response (backend may return string or ObjectId)
// -----------------------------------------------------------------------------

function toId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
    return (value as { toString: () => string }).toString()
  }
  return String(value)
}

/**
 * Backend list endpoints return different shapes: { data: [] }, { users: [] }, { teams: [] }, { userGroups: [] }.
 * We take the first item and return its id (or _id) so we can call GET-by-id or PUT with a real id.
 */
function firstIdFromList(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>
  const list = Array.isArray(data)
    ? data
    : (obj.data ?? obj.users ?? obj.teams ?? obj.userGroups) as unknown[] | undefined
  if (!Array.isArray(list) || list.length === 0) return null
  const first = list[0] as Record<string, unknown>
  const id = first?.id ?? first?._id
  return id ? toId(id) : null
}

// -----------------------------------------------------------------------------
// Fetch real IDs so paths like /api/v1/users/__USER_ID__ become /api/v1/users/abc123
// -----------------------------------------------------------------------------

export async function fetchRealIds(
  baseUrl: string,
  accessToken: string,
): Promise<{ userId: string | null; groupId: string | null; teamId: string | null }> {
  const headers = { Authorization: `Bearer ${accessToken}` }
  let userId: string | null = null
  let groupId: string | null = null
  let teamId: string | null = null

  try {
    const res = await makeRequest<unknown>(`${baseUrl}/api/v1/users`, { headers })
    if (res.status === 200) userId = firstIdFromList(res.data)
  } catch {}
  try {
    const res = await makeRequest<unknown>(`${baseUrl}/api/v1/userGroups`, { headers })
    if (res.status === 200) groupId = firstIdFromList(res.data)
  } catch {}
  try {
    const res = await makeRequest<unknown>(`${baseUrl}/api/v1/teams?page=1&limit=10`, { headers })
    if (res.status === 200) teamId = firstIdFromList(res.data)
  } catch {}

  return { userId, groupId, teamId }
}

// -----------------------------------------------------------------------------
// Build a map: __USER_ID__ → real id, __GROUP_ID__ → real id, etc.
// -----------------------------------------------------------------------------

export function buildPathReplace(ids: {
  userId: string | null
  groupId: string | null
  teamId: string | null
}): Record<string, string> {
  return {
    [PLACEHOLDER_USER_ID]: ids.userId ?? PLACEHOLDER_USER_ID,
    [PLACEHOLDER_GROUP_ID]: ids.groupId ?? PLACEHOLDER_GROUP_ID,
    [PLACEHOLDER_TEAM_ID]: ids.teamId ?? PLACEHOLDER_TEAM_ID,
  }
}

// -----------------------------------------------------------------------------
// Call the API (this is the only place we send HTTP requests for scope tests)
// -----------------------------------------------------------------------------

export async function callScopeEndpoint(
  baseUrl: string,
  accessToken: string,
  testCase: ScopeTestCase,
  pathReplace: Record<string, string>,
): Promise<{ status: number }> {
  // Replace __USER_ID__ etc. in the path with real ids
  let path = testCase.path
  for (const [placeholder, realId] of Object.entries(pathReplace)) {
    path = path.replace(placeholder, realId)
  }

  // Add query string if the test case needs it (e.g. ?page=1&limit=10 for list teams)
  const query = testCase.query
    ? '?' + Object.entries(testCase.query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
    : ''

  const url = `${baseUrl.replace(/\/$/, '')}${path}${query}`
  const body = testCase.method === 'GET' ? undefined : (testCase.body ?? '{}')

  const res = await makeRequest<unknown>(url, {
    method: testCase.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(testCase.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    body,
  })

  return { status: res.status }
}

/**
 * Decide if this test passed and what message to show.
 * - Token has scope: 2xx or 4xx = pass (4xx means auth worked but request was bad).
 * - Token missing scope: only 401 = pass (correctly denied).
 */
function getPassedAndMessage(hasScope: boolean, status: number): { passed: boolean; message: string } {
  if (hasScope) {
    if (status >= 200 && status < 300) return { passed: true, message: `OK (${status})` }
    if (status >= 400 && status < 500) return { passed: true, message: `Auth OK (${status})` }
    return { passed: false, message: `Unexpected ${status}` }
  }
  if (status === 401) return { passed: true, message: 'Correctly denied (401)' }
  return { passed: false, message: `Expected 401, got ${status}` }
}

// -----------------------------------------------------------------------------
// Run all scope tests (used by the /scope-tests page in the app)
// -----------------------------------------------------------------------------

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
      const { passed, message } = getPassedAndMessage(hasScope, status)
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

// -----------------------------------------------------------------------------
// Parse a scope string like "org:read user:write" into ["org:read", "user:write"]
// -----------------------------------------------------------------------------

export function parseScopes(scopeString: string): string[] {
  if (!scopeString?.trim()) return []
  return scopeString.split(/\s+/).map((s) => s.trim()).filter(Boolean)
}
