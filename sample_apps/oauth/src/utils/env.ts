/**
 * Environment configuration loader
 */

import fs from 'fs'
import path from 'path'

/**
 * Load environment variables from .env file
 * This is a simple .env loader for demonstration purposes
 * In production, consider using a library like 'dotenv'
 */
export function loadEnvFile(): void {
    const envPath = path.join(process.cwd(), '.env')

    if (!fs.existsSync(envPath)) {
        return
    }

    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach((line) => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=')
            if (eqIndex <= 0) return
            const key = trimmed.slice(0, eqIndex).trim()
            const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
            if (key && !process.env[key]) {
                process.env[key] = value
            }
        }
    })
}
