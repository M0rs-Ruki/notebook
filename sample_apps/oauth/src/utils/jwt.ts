export function getScopesFromToken(token: string): string[] {
  if (!token || !token.includes('.')) {
    return []
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return []
    }

    const payload = parts[1]
    
    const paddingNeeded = (4 - (payload.length % 4)) % 4
    const paddedPayload = payload + '='.repeat(paddingNeeded)
    
    const base64Payload = paddedPayload.replace(/-/g, '+').replace(/_/g, '/')
    
    const decodedPayload = Buffer.from(base64Payload, 'base64').toString('utf-8')
    
    const payloadData = JSON.parse(decodedPayload) as Record<string, unknown>
    
    const scopeString = payloadData.scope as string | undefined
    
    if (!scopeString || typeof scopeString !== 'string') {
      return []
    }
    
    return scopeString.split(/\s+/).filter(Boolean)
  } catch (error) {
    console.error('Error decoding token:', error)
    return []
  }
}

export function hasScope(token: string, requiredScope: string): boolean {
  const scopes = getScopesFromToken(token)
  
  return scopes.includes(requiredScope)
}
