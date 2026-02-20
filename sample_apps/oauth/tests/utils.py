import os
import base64
import json
from typing import List, Dict, Any, Optional
import requests
from dotenv import load_dotenv

load_dotenv()


def get_scopes_from_token(token: str) -> List[str]:
    if not token or '.' not in token:
        return []

    try:
        parts = token.split('.')
        if len(parts) != 3:
            return []

        payload = parts[1]
        padding = 4 - (len(payload) % 4)
        if padding != 4:
            payload += '=' * padding

        payload = payload.replace('-', '+').replace('_', '/')
        decoded_payload = base64.b64decode(payload).decode('utf-8')
        payload_data = json.loads(decoded_payload)
        scope_string = payload_data.get('scope', '')

        if not scope_string or not isinstance(scope_string, str):
            return []

        return [s.strip() for s in scope_string.split() if s.strip()]
    except Exception as e:
        print(f'Error decoding token: {e}')
        return []


def has_scope(token: str, required_scope: str) -> bool:
    scopes = get_scopes_from_token(token)
    return required_scope in scopes


def get_org_id_from_token(token: str) -> Optional[str]:
    if not token or '.' not in token:
        return None

    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        payload = parts[1]
        padding = 4 - (len(payload) % 4)
        if padding != 4:
            payload += '=' * padding

        payload = payload.replace('-', '+').replace('_', '/')
        decoded_payload = base64.b64decode(payload).decode('utf-8')
        payload_data = json.loads(decoded_payload)
        return payload_data.get('org_id') or payload_data.get('orgId')
    except Exception:
        return None


def make_request(url: str, method: str = 'GET', headers: Optional[Dict[str, str]] = None,
                 body: Optional[str] = None) -> Dict[str, Any]:
    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers or {},
            data=body,
            timeout=10
        )

        try:
            data = response.json()
        except:
            data = response.text

        return {
            'status': response.status_code,
            'data': data
        }
    except requests.exceptions.ConnectionError:
        raise Exception(f'Connection refused to {url}. Is the backend running?')
    except Exception as e:
        raise Exception(f'Request failed: {str(e)}')


def get_env_var(key: str, default: str = '') -> str:
    return os.getenv(key, default)


BACKEND_URL = get_env_var('BACKEND_URL', 'http://localhost:3000').rstrip('/')
ACCESS_TOKEN = get_env_var('ACCESS_TOKEN', '')
