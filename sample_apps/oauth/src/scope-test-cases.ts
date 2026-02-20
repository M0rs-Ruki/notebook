
export const PLACEHOLDER_USER_ID = '__USER_ID__'
export const PLACEHOLDER_GROUP_ID = '__GROUP_ID__'
export const PLACEHOLDER_TEAM_ID = '__TEAM_ID__'

export interface ScopeTestCase {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  requiredScope: string
  category: 'Organization' | 'Users' | 'User Groups' | 'Teams'
  query?: Record<string, string | number>
  body?: string
}

export const ORG_TEST_CASES: ScopeTestCase[] = [
  {
    id: 'org-get',
    name: 'Get Organization',
    method: 'GET',
    path: '/api/v1/org',
    requiredScope: 'org:read',
    category: 'Organization',
  },
  {
    id: 'org-put',
    name: 'Update Organization',
    method: 'PUT',
    path: '/api/v1/org',
    requiredScope: 'org:write',
    category: 'Organization',
  },
  {
    id: 'org-delete',
    name: 'Delete Organization',
    method: 'DELETE',
    path: '/api/v1/org',
    requiredScope: 'org:admin',
    category: 'Organization',
  },
]

export const USERS_TEST_CASES: ScopeTestCase[] = [
  {
    id: 'users-list',
    name: 'List Users',
    method: 'GET',
    path: '/api/v1/users',
    requiredScope: 'user:read',
    category: 'Users',
  },
  {
    id: 'users-get-id',
    name: 'Get User by ID',
    method: 'GET',
    path: `/api/v1/users/${PLACEHOLDER_USER_ID}`,
    requiredScope: 'user:read',
    category: 'Users',
  },
  {
    id: 'users-post',
    name: 'Create User (invite)',
    method: 'POST',
    path: '/api/v1/users',
    requiredScope: 'user:invite',
    category: 'Users',
    body: '{"fullName":"User","email":"user@example.com"}',
  },
  {
    id: 'users-put-id',
    name: 'Update User',
    method: 'PUT',
    path: `/api/v1/users/${PLACEHOLDER_USER_ID}`,
    requiredScope: 'user:write',
    category: 'Users',
    body: '{"fullName":"User Updated"}',
  },
  {
    id: 'users-delete-id',
    name: 'Delete User',
    method: 'DELETE',
    path: `/api/v1/users/${PLACEHOLDER_USER_ID}`,
    requiredScope: 'user:delete',
    category: 'Users',
  },
]

export const USER_GROUPS_TEST_CASES: ScopeTestCase[] = [
  {
    id: 'usergroups-list',
    name: 'List User Groups',
    method: 'GET',
    path: '/api/v1/userGroups',
    requiredScope: 'usergroup:read',
    category: 'User Groups',
  },
  {
    id: 'usergroups-post',
    name: 'Create User Group',
    method: 'POST',
    path: '/api/v1/userGroups',
    requiredScope: 'usergroup:write',
    category: 'User Groups',
    body: '{"name":"Group","type":"default"}',
  },
  {
    id: 'usergroups-put-id',
    name: 'Update User Group',
    method: 'PUT',
    path: `/api/v1/userGroups/${PLACEHOLDER_GROUP_ID}`,
    requiredScope: 'usergroup:write',
    category: 'User Groups',
    body: '{"name":"Group Updated","type":"default"}',
  },
]

export const TEAMS_TEST_CASES: ScopeTestCase[] = [
  {
    id: 'teams-list',
    name: 'List Teams',
    method: 'GET',
    path: '/api/v1/teams',
    requiredScope: 'team:read',
    category: 'Teams',
    query: { page: 1, limit: 10 },
  },
  {
    id: 'teams-post',
    name: 'Create Team',
    method: 'POST',
    path: '/api/v1/teams',
    requiredScope: 'team:write',
    category: 'Teams',
    body: '{"name":"Team"}',
  },
  {
    id: 'teams-put-id',
    name: 'Update Team',
    method: 'PUT',
    path: `/api/v1/teams/${PLACEHOLDER_TEAM_ID}`,
    requiredScope: 'team:write',
    category: 'Teams',
    body: '{"name":"Team Updated"}',
  },
]

export const SCOPE_TEST_CASES: ScopeTestCase[] = [
  ...ORG_TEST_CASES,
  ...USERS_TEST_CASES,
  ...USER_GROUPS_TEST_CASES,
  ...TEAMS_TEST_CASES,
]
