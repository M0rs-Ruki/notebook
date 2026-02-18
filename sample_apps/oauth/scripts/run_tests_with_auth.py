
import os
import sys
import time
import subprocess
import webbrowser
import requests
import re
from pathlib import Path
from dotenv import load_dotenv, set_key

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT / '.env'
SERVER_URL = 'http://localhost:8888'

def load_env():
    load_dotenv(ENV_FILE)
    return {
        'BACKEND_URL': os.getenv('BACKEND_URL', 'http://localhost:3000'),
        'CLIENT_ID': os.getenv('CLIENT_ID', ''),
        'CLIENT_SECRET': os.getenv('CLIENT_SECRET', ''),
    }

def start_server():
    print('🚀 Starting OAuth client server on port 8888...')
    process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        cwd=PROJECT_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    max_wait = 10
    for i in range(max_wait):
        try:
            response = requests.get(f'{SERVER_URL}/', timeout=1)
            if response.status_code == 200:
                print('✅ Server started successfully!')
                return process
        except:
            time.sleep(1)
    
    print('❌ Server failed to start')
    process.terminate()
    sys.exit(1)

def wait_for_token(max_wait=120):
    print('\n⏳ Waiting for you to complete OAuth login...')
    print('   (This will timeout after 2 minutes)')
    
    token_endpoint = f'{SERVER_URL}/api/token'
    
    for i in range(max_wait):
        try:
            response = requests.get(token_endpoint, timeout=2)
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                if token:
                    print(f'✅ Token received!')
                    return token
        except:
            pass
        
        try:
            response = requests.get(f'{SERVER_URL}/', timeout=2)
            if response.status_code == 200:
                html = response.text
                match = re.search(r'<div class="token">([^<]+)</div>', html)
                if match:
                    token = match.group(1).strip()
                    if token and len(token) > 50:
                        print(f'✅ Token received!')
                        return token
        except:
            pass
        
        time.sleep(1)
        if i % 10 == 0 and i > 0:
            print(f'   Still waiting... ({i}s elapsed)')
    
    print('❌ Timeout waiting for token')
    return None

def update_env_token(token):
    print(f'\n💾 Saving token to .env file...')
    
    env_content = ENV_FILE.read_text() if ENV_FILE.exists() else ''
    
    lines = env_content.split('\n')
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('ACCESS_TOKEN='):
            lines[i] = f'ACCESS_TOKEN={token}'
            updated = True
            break
    
    if not updated:
        lines.append(f'ACCESS_TOKEN={token}')
    
    ENV_FILE.write_text('\n'.join(lines))
    print('✅ Token saved to .env')

def run_tests():
    print('\n🧪 Running tests...\n')
    result = subprocess.run(
        ['pytest', '-v'],
        cwd=PROJECT_ROOT,
        text=True
    )
    return result.returncode

def main():
    print('=' * 60)
    print('OAuth Test Runner')
    print('=' * 60)
    
    if not ENV_FILE.exists():
        print('❌ .env file not found!')
        sys.exit(1)
    
    env = load_env()
    
    if not env['CLIENT_ID']:
        print('❌ CLIENT_ID not found in .env file!')
        sys.exit(1)
    
    server_process = None
    try:
        server_process = start_server()
        
        print(f'\n🌐 Opening browser for OAuth login...')
        login_url = f'{SERVER_URL}/login'
        webbrowser.open(login_url)
        print(f'   Please complete the login at: {login_url}')
        
        token = wait_for_token()
        
        if not token:
            print('\n❌ Failed to get token. Please try again.')
            sys.exit(1)
        
        update_env_token(token)
        
        test_result = run_tests()
        
        print('\n' + '=' * 60)
        if test_result == 0:
            print('✅ All tests passed!')
        else:
            print('❌ Some tests failed')
        print('=' * 60)
        
        sys.exit(test_result)
        
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
    except Exception as e:
        print(f'\n❌ Error: {e}')
        sys.exit(1)
    finally:
        # Stop server
        if server_process:
            print('\n🛑 Stopping server...')
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except:
                server_process.kill()

if __name__ == '__main__':
    main()
