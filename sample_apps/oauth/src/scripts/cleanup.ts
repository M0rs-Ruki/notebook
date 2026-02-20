/**
 * Cleanup Script for OAuth Sample App
 *
 * Usage:
 *   ADMIN_JWT_TOKEN=your_token CLIENT_ID=your_client_id npm run cleanup
 *
 * Or to just stop the server:
 *   npm run stop
 */

import { execSync } from 'child_process'
import type { OAuthApp, OAuthAppsResponse } from '../types'
import { makeRequest, maskSecret } from '../utils'

// Configuration
const BACKEND_URL: string = process.env.BACKEND_URL || 'http://localhost:3000'
const ADMIN_JWT_TOKEN: string | undefined = process.env.ADMIN_JWT_TOKEN
const CLIENT_ID: string | undefined = process.env.CLIENT_ID

/**
 * Find and get OAuth app ID by client ID
 */
async function getAppIdByClientId(clientId: string, token: string): Promise<string> {
    const response = await makeRequest<OAuthAppsResponse | OAuthApp[]>(
        `${BACKEND_URL}/api/v1/oauth-clients`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )

    if (response.status !== 200) {
        throw new Error(`Failed to list apps: ${JSON.stringify(response.data)}`)
    }

    // API returns { data: [...] } structure
    const apps: OAuthApp[] = Array.isArray(response.data)
        ? response.data
        : (response.data.data || response.data.apps || [])

    if (!Array.isArray(apps)) {
        throw new Error(`Unexpected response format: ${JSON.stringify(response.data)}`)
    }

    const app = apps.find((a: OAuthApp) => a.clientId === clientId)

    if (!app) {
        throw new Error(`OAuth app with clientId ${clientId} not found`)
    }

    return app.id || app._id || ''
}

/**
 * Delete OAuth application
 */
async function deleteOAuthApp(appId: string, token: string): Promise<boolean> {
    const response = await makeRequest(`${BACKEND_URL}/api/v1/oauth-clients/${appId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (response.status !== 200 && response.status !== 204) {
        throw new Error(`Failed to delete app: ${JSON.stringify(response.data)}`)
    }

    return true
}

/**
 * Stop the sample server
 */
function stopServer(): void {
    try {
        const platform = process.platform

        if (platform === 'darwin' || platform === 'linux') {
            try {
                execSync('lsof -ti:8888 | xargs kill -9 2>/dev/null', { stdio: 'ignore' })
                console.log('✓ Sample server stopped (port 8888)')
            } catch {
                console.log('ℹ No server running on port 8888')
            }
        } else if (platform === 'win32') {
            try {
                execSync('FOR /F "tokens=5" %a IN (\'netstat -aon ^| find ":8888"\') DO taskkill /F /PID %a', {
                    stdio: 'ignore',
                    shell: process.env.COMSPEC || 'cmd.exe',
                })
                console.log('✓ Sample server stopped (port 8888)')
            } catch {
                console.log('ℹ No server running on port 8888')
            }
        }
    } catch (error) {
        console.log('ℹ Could not stop server:', (error as Error).message)
    }
}

/**
 * Main cleanup function
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2)
    const stopOnly = args.includes('--stop-only') || args.includes('-s')

    console.log('🧹 OAuth Sample App Cleanup\n')

    // Always try to stop the server
    stopServer()

    if (stopOnly) {
        console.log('\n✅ Cleanup complete (server only)')
        return
    }

    // Delete OAuth app if credentials provided
    if (!ADMIN_JWT_TOKEN) {
        console.log('\nℹ ADMIN_JWT_TOKEN not provided - skipping OAuth app deletion')
        console.log('  To delete the OAuth app, run:')
        console.log('  ADMIN_JWT_TOKEN=xxx CLIENT_ID=xxx npm run cleanup')
        return
    }

    if (!CLIENT_ID) {
        console.log('\nℹ CLIENT_ID not provided - skipping OAuth app deletion')
        console.log('  To delete the OAuth app, run:')
        console.log('  ADMIN_JWT_TOKEN=xxx CLIENT_ID=xxx npm run cleanup')
        return
    }

    try {
        console.log(`\nDeleting OAuth app (clientId: ${maskSecret(CLIENT_ID)})...`)

        const appId = await getAppIdByClientId(CLIENT_ID, ADMIN_JWT_TOKEN)
        console.log(`  Found app ID: ${maskSecret(appId)}`)

        await deleteOAuthApp(appId, ADMIN_JWT_TOKEN)
        console.log('✓ OAuth application deleted')

        console.log('\n✅ Cleanup complete!')
    } catch (error) {
        console.error('✗ Failed to delete OAuth app:', (error as Error).message)
        process.exit(1)
    }
}

main()
