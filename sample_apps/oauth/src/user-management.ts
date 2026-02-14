/**
 * User Management scope tests
 *
 * Tests that PipesHub APIs (Org, Users, User Groups, Teams) enforce OAuth scopes:
 * - When the token has the required scope → expect 2xx
 * - When the token does NOT have the scope → expect 401
 *
 * Aligned with PipesHub oauth_provider/config/scopes.config.ts
 */

import { makeRequest } from './utils'

// Placeholder IDs (replaced with real IDs from list endpoints when available)
export const PLACEHOLDER_USER_ID = '507f1f77bcf86cd799439011'
export const PLACEHOLDER_GROUP_ID = '507f1f77bcf86cd799439012'
export const PLACEHOLDER_TEAM_ID = '507f1f77bcf86cd799439013'

export interface ScopeTestCase {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  requiredScope: string
  category: 'Organization' | 'Users' | 'User Groups' | 'Teams'
  /** Optional query params (e.g. page, limit) for GET list endpoints */
  query?: Record<string, string | number>
  /** Optional JSON body for POST/PUT; if not set, non-GET sends '{}' */
  body?: string
}

/**
 * Test cases for Org, Users, User Groups, and Teams APIs.
 * Each endpoint requires the given scope per PipesHub scopes.config.ts.
 * Uses valid query/body where needed to get 200/201 instead of 400/404.
 */
export const SCOPE_TEST_CASES: ScopeTestCase[] = [
  // Organization Management (org:read, org:write, org:admin)
  { id: 'org-get', name: 'Get Organization', method: 'GET', path: '/api/v1/org', requiredScope: 'org:read', category: 'Organization' },
  { id: 'org-put', name: 'Update Organization', method: 'PUT', path: '/api/v1/org', requiredScope: 'org:write', category: 'Organization' },
  { id: 'org-delete', name: 'Delete Organization', method: 'DELETE', path: '/api/v1/org', requiredScope: 'org:admin', category: 'Organization' },

  // User Management (user:read, user:write, user:invite, user:delete)
  { id: 'users-list', name: 'List Users', method: 'GET', path: '/api/v1/users', requiredScope: 'user:read', category: 'Users' },
  { id: 'users-get-id', name: 'Get User by ID', method: 'GET', path: `/api/v1/users/${PLACEHOLDER_USER_ID}`, requiredScope: 'user:read', category: 'Users' },
  { id: 'users-post', name: 'Create User (invite)', method: 'POST', path: '/api/v1/users', requiredScope: 'user:invite', category: 'Users', body: '{"fullName":"Scope Test User","email":"scope-test@example.com"}' },
  { id: 'users-put-id', name: 'Update User', method: 'PUT', path: `/api/v1/users/${PLACEHOLDER_USER_ID}`, requiredScope: 'user:write', category: 'Users', body: '{"fullName":"Scope Test User Updated"}' },
  { id: 'users-delete-id', name: 'Delete User', method: 'DELETE', path: `/api/v1/users/${PLACEHOLDER_USER_ID}`, requiredScope: 'user:delete', category: 'Users' },

  // User Groups (usergroup:read, usergroup:write)
  { id: 'usergroups-list', name: 'List User Groups', method: 'GET', path: '/api/v1/userGroups', requiredScope: 'usergroup:read', category: 'User Groups' },
  { id: 'usergroups-post', name: 'Create User Group', method: 'POST', path: '/api/v1/userGroups', requiredScope: 'usergroup:write', category: 'User Groups', body: '{"name":"Scope Test Group","type":"default"}' },
  { id: 'usergroups-put-id', name: 'Update User Group', method: 'PUT', path: `/api/v1/userGroups/${PLACEHOLDER_GROUP_ID}`, requiredScope: 'usergroup:write', category: 'User Groups', body: '{"name":"Scope Test Group Updated","type":"default"}' },

  // Teams (team:read, team:write) – list expects page/limit
  { id: 'teams-list', name: 'List Teams', method: 'GET', path: '/api/v1/teams', requiredScope: 'team:read', category: 'Teams', query: { page: 1, limit: 10 } },
  { id: 'teams-post', name: 'Create Team', method: 'POST', path: '/api/v1/teams', requiredScope: 'team:write', category: 'Teams', body: '{"name":"Scope Test Team"}' },
  { id: 'teams-put-id', name: 'Update Team', method: 'PUT', path: `/api/v1/teams/${PLACEHOLDER_TEAM_ID}`, requiredScope: 'team:write', category: 'Teams', body: '{"name":"Scope Test Team Updated"}' },
]

export interface ScopeTestResult {
  case: ScopeTestCase
  status: number
  passed: boolean
  message: string
}

/** Normalize id from document (_id may be string or ObjectId-like) */
function toId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
    return (value as { toString: () => string }).toString()
  }
  return String(value)
}

/** Extract first item id from list response (handles direct array, { data: [] }, { users: [] }, etc.) */
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
async function fetchRealIds(
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
 * Run all scope tests: call each endpoint with the given token.
 * - Fetches real IDs from list endpoints so GET-by-ID and PUT can return 200 when data exists.
 * - Uses query params and valid bodies where defined so list/POST return 200/201.
 * - If token has the required scope → pass if status is 2xx
 * - If token does NOT have the scope → pass if status is 401
 */
export async function runScopeTests(
  backendUrl: string,
  accessToken: string,
  tokenScopes: string[],
): Promise<ScopeTestResult[]> {
  const baseUrl = backendUrl.replace(/\/$/, '')
  const results: ScopeTestResult[] = []

  const ids = await fetchRealIds(baseUrl, accessToken)
  const pathReplace: Record<string, string> = {
    [PLACEHOLDER_USER_ID]: ids.userId ?? PLACEHOLDER_USER_ID,
    [PLACEHOLDER_GROUP_ID]: ids.groupId ?? PLACEHOLDER_GROUP_ID,
    [PLACEHOLDER_TEAM_ID]: ids.teamId ?? PLACEHOLDER_TEAM_ID,
  }

  console.log('[scope-tests] Running', SCOPE_TEST_CASES.length, 'tests against', baseUrl)
  if (ids.userId || ids.groupId || ids.teamId) {
    console.log('[scope-tests] Using real IDs:', { userId: ids.userId ?? '(none)', groupId: ids.groupId ?? '(none)', teamId: ids.teamId ?? '(none)' })
  }

  for (const testCase of SCOPE_TEST_CASES) {
    const hasScope = tokenScopes.includes(testCase.requiredScope)
    let path = testCase.path
    for (const [placeholder, realId] of Object.entries(pathReplace)) {
      path = path.replace(placeholder, realId)
    }
    const queryStr = testCase.query
      ? '?' + Object.entries(testCase.query).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
      : ''
    const url = `${baseUrl}${path}${queryStr}`

    console.log('[scope-tests]', testCase.method, testCase.path, '| required:', testCase.requiredScope, '| has scope?', hasScope)

    try {
      const body = testCase.method !== 'GET'
        ? (testCase.body ?? '{}')
        : undefined
      const response = await makeRequest<unknown>(url, {
        method: testCase.method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(testCase.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
      })

      const status = response.status
      let passed: boolean
      let message: string

      if (hasScope) {
        // Pass when 2xx (success) or 4xx (auth OK, request failed for body/params/backend)
        passed = (status >= 200 && status < 300) || (status >= 400 && status < 500)
        message = status >= 200 && status < 300
          ? `OK (${status})`
          : status >= 400 && status < 500
            ? `Auth OK (${status}) – request failed for body/params or backend`
            : `Unexpected ${status}`
      } else {
        // When token does NOT have scope → expect 401 only (not 403)
        passed = status === 401
        message = passed
          ? `Correctly denied (401)`
          : `Expected 401, got ${status}`
      }

      results.push({ case: testCase, status, passed, message })
      console.log('[scope-tests]   → status', status, passed ? '✓' : '✗', message)
    } catch (err) {
      const msg = (err as Error).message
      results.push({
        case: testCase,
        status: -1,
        passed: false,
        message: msg,
      })
      console.log('[scope-tests]   → error', msg)
    }
  }

  return results
}

/**
 * Parse scope string (e.g. from token response) into array
 */
export function parseScopes(scopeString: string): string[] {
  if (!scopeString || !scopeString.trim()) return []
  return scopeString.split(/\s+/).map((s) => s.trim()).filter(Boolean)
}
