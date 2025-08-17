# 테스트용 임시 클라이언트 설정 가이드

## 개요

이 문서는 테스트용 임시 클라이언트에서 인증 시스템에 접근하는 방법을 설명합니다. 현재 시스템에는 기본적으로 3개의 클라이언트가 설정되어 있습니다:

1. **User SPA** (`user-spa`) - 일반 사용자용
2. **Admin SPA** (`admin-spa`) - 관리자용  
3. **Test Client** (`test-client`) - 테스트용

## 시스템 정보

### 인증 서버 정보
- **서버 URL**: `http://localhost:13000`
- **OIDC 메타데이터**: `http://localhost:13000/.well-known/openid-configuration`
- **JWKS URL**: `http://localhost:13000/jwks.json`

### 기본 클라이언트 정보

#### 1. User SPA 클라이언트
```json
{
  "clientId": "user-spa",
  "clientType": "PUBLIC",
  "redirectUris": ["http://localhost:5173/callback"],
  "scopes": ["openid", "profile", "email"],
  "grantTypes": ["AUTHORIZATION_CODE"]
}
```

#### 2. Admin SPA 클라이언트
```json
{
  "clientId": "admin-spa", 
  "clientType": "PUBLIC",
  "redirectUris": ["http://localhost:5174/callback"],
  "scopes": ["openid", "profile", "email", "admin"],
  "grantTypes": ["AUTHORIZATION_CODE"]
}
```

#### 3. Test Client (임시 클라이언트)
```json
{
  "clientId": "test-client",
  "clientSecret": "test-secret",
  "clientType": "CONFIDENTIAL",
  "redirectUris": [
    "http://localhost:3000/callback",
    "http://localhost:3001/callback"
  ],
  "scopes": ["openid", "profile", "email"],
  "grantTypes": ["AUTHORIZATION_CODE"]
}
```

## 테스트 클라이언트 설정 방법

### 1. 시스템 시작

먼저 Docker Compose를 사용하여 전체 시스템을 시작합니다:

```bash
# 프로젝트 루트 디렉토리에서
docker-compose up -d
```

이 명령어는 다음 서비스들을 시작합니다:
- **PostgreSQL DB** (포트: 15432)
- **Redis Cache** (포트: 16379)
- **Auth API** (포트: 13000)
- **User Web App** (포트: 5173)
- **Admin Web App** (포트: 5174)

### 2. 시스템 상태 확인

시스템이 정상적으로 시작되었는지 확인:

```bash
# 컨테이너 상태 확인
docker-compose ps

# 인증 서버 헬스체크
curl http://localhost:13000/.well-known/openid-configuration

# OIDC 메타데이터 확인
curl http://localhost:13000/.well-known/openid-configuration | jq
```

### 3. 테스트 클라이언트 생성 (필요시)

기본적으로 `test-client`는 자동으로 생성되지 않으므로, 필요시 수동으로 생성할 수 있습니다:

```bash
# OAuth 클라이언트 생성 API 호출
curl -X POST http://localhost:13000/oauth-clients \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-client",
    "name": "Test Client",
    "description": "테스트용 임시 클라이언트",
    "clientType": "CONFIDENTIAL",
    "redirectUris": [
      "http://localhost:3000/callback",
      "http://localhost:3001/callback"
    ],
    "scopes": ["openid", "profile", "email"],
    "grantTypes": ["AUTHORIZATION_CODE"],
    "supportsSLO": true
  }'
```

## OAuth 2.0 Authorization Code Flow 구현

### 1. Authorization Request

사용자를 인증 서버의 로그인 페이지로 리다이렉트합니다:

```javascript
// PKCE 코드 생성
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

function generateCodeChallenge(verifier) {
  const hash = crypto.subtle.digestSync('SHA-256', new TextEncoder().encode(verifier));
  return base64URLEncode(hash);
}

// State 파라미터 생성 (CSRF 방지)
function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// Authorization URL 생성
const clientId = 'test-client';
const redirectUri = 'http://localhost:3000/callback';
const scope = 'openid profile email';
const responseType = 'code';
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);
const state = generateState();

// PKCE와 state를 로컬 스토리지에 저장
localStorage.setItem('code_verifier', codeVerifier);
localStorage.setItem('state', state);

const authUrl = new URL('http://localhost:13000/authorize');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('scope', scope);
authUrl.searchParams.set('response_type', responseType);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('state', state);

// 사용자를 인증 페이지로 리다이렉트
window.location.href = authUrl.toString();
```

### 2. Callback 처리

사용자가 인증을 완료하면 지정된 redirect URI로 리다이렉트됩니다:

```javascript
// Callback 페이지에서
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');
const error = urlParams.get('error');

// State 검증
const savedState = localStorage.getItem('state');
if (state !== savedState) {
  throw new Error('State mismatch - possible CSRF attack');
}

// 에러 처리
if (error) {
  console.error('Authorization error:', error);
  return;
}

// Authorization Code로 Token 요청
if (code) {
  exchangeCodeForToken(code);
}
```

### 3. Token Exchange

Authorization Code를 Access Token으로 교환합니다:

```javascript
async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('code_verifier');
  
  const tokenResponse = await fetch('http://localhost:13000/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'test-client',
      client_secret: 'test-secret', // Confidential 클라이언트만
      code: code,
      redirect_uri: 'http://localhost:3000/callback',
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Token exchange failed');
  }

  const tokenData = await tokenResponse.json();
  
  // 토큰 저장
  localStorage.setItem('access_token', tokenData.access_token);
  localStorage.setItem('refresh_token', tokenData.refresh_token);
  localStorage.setItem('id_token', tokenData.id_token);
  
  // PKCE 관련 데이터 정리
  localStorage.removeItem('code_verifier');
  localStorage.removeItem('state');
  
  console.log('Token received:', tokenData);
}
```

### 4. User Info 요청

Access Token을 사용하여 사용자 정보를 요청합니다:

```javascript
async function getUserInfo() {
  const accessToken = localStorage.getItem('access_token');
  
  const userInfoResponse = await fetch('http://localhost:13000/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to get user info');
  }

  const userInfo = await userInfoResponse.json();
  console.log('User info:', userInfo);
  return userInfo;
}
```

### 5. Token Refresh

Access Token이 만료되면 Refresh Token을 사용하여 새로운 토큰을 발급받습니다:

```javascript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const refreshResponse = await fetch('http://localhost:13000/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: 'test-client',
      client_secret: 'test-secret',
      refresh_token: refreshToken,
    }),
  });

  if (!refreshResponse.ok) {
    // Refresh Token도 만료된 경우 재로그인 필요
    localStorage.clear();
    window.location.href = '/login';
    return;
  }

  const tokenData = await refreshResponse.json();
  
  // 새로운 토큰 저장
  localStorage.setItem('access_token', tokenData.access_token);
  localStorage.setItem('refresh_token', tokenData.refresh_token);
  localStorage.setItem('id_token', tokenData.id_token);
}
```

## 완전한 예제 애플리케이션

### HTML 파일 (index.html)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth 테스트 클라이언트</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        .button:hover { background: #0056b3; }
        .info { background: #e9ecef; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>OAuth 테스트 클라이언트</h1>
    
    <div class="container">
        <h2>인증 상태</h2>
        <div id="authStatus" class="info">로그인되지 않음</div>
        <button class="button" onclick="login()">로그인</button>
        <button class="button" onclick="logout()">로그아웃</button>
    </div>

    <div class="container">
        <h2>사용자 정보</h2>
        <div id="userInfo" class="info">로그인 후 사용자 정보를 확인할 수 있습니다.</div>
        <button class="button" onclick="getUserInfo()">사용자 정보 조회</button>
    </div>

    <div class="container">
        <h2>토큰 정보</h2>
        <div id="tokenInfo" class="info">토큰 정보가 여기에 표시됩니다.</div>
        <button class="button" onclick="refreshToken()">토큰 갱신</button>
    </div>

    <script src="oauth-client.js"></script>
</body>
</html>
```

### JavaScript 파일 (oauth-client.js)

```javascript
// OAuth 설정
const OAUTH_CONFIG = {
  issuer: 'http://localhost:13000',
  clientId: 'test-client',
  clientSecret: 'test-secret',
  redirectUri: 'http://localhost:3000/callback',
  scope: 'openid profile email',
  responseType: 'code'
};

// 유틸리티 함수
function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(digest);
}

function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// 로그인 함수
async function login() {
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // PKCE와 state 저장
    localStorage.setItem('code_verifier', codeVerifier);
    localStorage.setItem('state', state);

    // Authorization URL 생성
    const authUrl = new URL(`${OAUTH_CONFIG.issuer}/authorize`);
    authUrl.searchParams.set('client_id', OAUTH_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', OAUTH_CONFIG.redirectUri);
    authUrl.searchParams.set('scope', OAUTH_CONFIG.scope);
    authUrl.searchParams.set('response_type', OAUTH_CONFIG.responseType);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);

    // 인증 페이지로 리다이렉트
    window.location.href = authUrl.toString();
  } catch (error) {
    showError('로그인 중 오류가 발생했습니다: ' + error.message);
  }
}

// Callback 처리
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');

  if (error) {
    showError('인증 오류: ' + error);
    return;
  }

  if (code && state) {
    const savedState = localStorage.getItem('state');
    if (state !== savedState) {
      showError('State 불일치 - CSRF 공격 가능성');
      return;
    }

    try {
      await exchangeCodeForToken(code);
      showSuccess('로그인 성공!');
      updateAuthStatus();
      // URL에서 코드 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      showError('토큰 교환 실패: ' + error.message);
    }
  }
}

// 토큰 교환
async function exchangeCodeForToken(code) {
  const codeVerifier = localStorage.getItem('code_verifier');
  
  const response = await fetch(`${OAUTH_CONFIG.issuer}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokenData = await response.json();
  
  // 토큰 저장
  localStorage.setItem('access_token', tokenData.access_token);
  localStorage.setItem('refresh_token', tokenData.refresh_token);
  localStorage.setItem('id_token', tokenData.id_token);
  
  // PKCE 관련 데이터 정리
  localStorage.removeItem('code_verifier');
  localStorage.removeItem('state');
}

// 사용자 정보 조회
async function getUserInfo() {
  const accessToken = localStorage.getItem('access_token');
  
  if (!accessToken) {
    showError('Access Token이 없습니다. 먼저 로그인하세요.');
    return;
  }

  try {
    const response = await fetch(`${OAUTH_CONFIG.issuer}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`User info request failed: ${response.status}`);
    }

    const userInfo = await response.json();
    document.getElementById('userInfo').innerHTML = `
      <h3>사용자 정보</h3>
      <pre>${JSON.stringify(userInfo, null, 2)}</pre>
    `;
  } catch (error) {
    showError('사용자 정보 조회 실패: ' + error.message);
  }
}

// 토큰 갱신
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    showError('Refresh Token이 없습니다.');
    return;
  }

  try {
    const response = await fetch(`${OAUTH_CONFIG.issuer}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      // Refresh Token 만료 시 재로그인
      logout();
      showError('Refresh Token이 만료되었습니다. 다시 로그인하세요.');
      return;
    }

    const tokenData = await response.json();
    
    // 새로운 토큰 저장
    localStorage.setItem('access_token', tokenData.access_token);
    localStorage.setItem('refresh_token', tokenData.refresh_token);
    localStorage.setItem('id_token', tokenData.id_token);
    
    showSuccess('토큰이 성공적으로 갱신되었습니다.');
    updateTokenInfo();
  } catch (error) {
    showError('토큰 갱신 실패: ' + error.message);
  }
}

// 로그아웃
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('code_verifier');
  localStorage.removeItem('state');
  
  updateAuthStatus();
  document.getElementById('userInfo').innerHTML = '로그인 후 사용자 정보를 확인할 수 있습니다.';
  document.getElementById('tokenInfo').innerHTML = '토큰 정보가 여기에 표시됩니다.';
  
  showSuccess('로그아웃되었습니다.');
}

// 상태 업데이트
function updateAuthStatus() {
  const accessToken = localStorage.getItem('access_token');
  const statusElement = document.getElementById('authStatus');
  
  if (accessToken) {
    statusElement.innerHTML = '<span style="color: green;">✓ 로그인됨</span>';
    statusElement.className = 'success';
  } else {
    statusElement.innerHTML = '<span style="color: red;">✗ 로그인되지 않음</span>';
    statusElement.className = 'error';
  }
}

function updateTokenInfo() {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const idToken = localStorage.getItem('id_token');
  
  const tokenInfoElement = document.getElementById('tokenInfo');
  
  if (accessToken) {
    tokenInfoElement.innerHTML = `
      <h3>토큰 정보</h3>
      <p><strong>Access Token:</strong> ${accessToken.substring(0, 50)}...</p>
      <p><strong>Refresh Token:</strong> ${refreshToken ? refreshToken.substring(0, 50) + '...' : '없음'}</p>
      <p><strong>ID Token:</strong> ${idToken ? idToken.substring(0, 50) + '...' : '없음'}</p>
    `;
  } else {
    tokenInfoElement.innerHTML = '토큰 정보가 여기에 표시됩니다.';
  }
}

// UI 헬퍼 함수
function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'success';
  div.textContent = message;
  document.body.insertBefore(div, document.body.firstChild);
  
  setTimeout(() => div.remove(), 5000);
}

function showError(message) {
  const div = document.createElement('div');
  div.className = 'error';
  div.textContent = message;
  document.body.insertBefore(div, document.body.firstChild);
  
  setTimeout(() => div.remove(), 5000);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  updateAuthStatus();
  updateTokenInfo();
  
  // Callback 처리
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('code')) {
    handleCallback();
  }
});
```

## 테스트 방법

### 1. 로컬 서버 실행

간단한 HTTP 서버를 실행하여 테스트 클라이언트를 호스팅합니다:

```bash
# Python 3 사용
python3 -m http.server 3000

# 또는 Node.js 사용
npx http-server -p 3000
```

### 2. 브라우저에서 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. "로그인" 버튼 클릭
3. 인증 서버의 로그인 페이지에서 계정 생성 또는 로그인
4. 인증 완료 후 테스트 클라이언트로 리다이렉트
5. "사용자 정보 조회" 버튼으로 사용자 정보 확인
6. "토큰 갱신" 버튼으로 토큰 갱신 테스트

## 문제 해결

### 일반적인 문제들

1. **CORS 오류**: 인증 서버가 CORS를 허용하도록 설정되어 있는지 확인
2. **리다이렉트 URI 불일치**: 클라이언트 설정의 redirect URI와 실제 사용하는 URI가 정확히 일치해야 함
3. **PKCE 오류**: code_verifier와 code_challenge가 올바르게 생성되고 전달되는지 확인
4. **State 불일치**: CSRF 방지를 위한 state 파라미터가 올바르게 검증되는지 확인

### 디버깅 팁

1. 브라우저 개발자 도구의 Network 탭에서 요청/응답 확인
2. 브라우저 개발자 도구의 Console 탭에서 JavaScript 오류 확인
3. 인증 서버 로그 확인: `docker-compose logs auth-api`
4. 데이터베이스에서 클라이언트 정보 확인

## 보안 고려사항

1. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS 사용
2. **토큰 보안**: Access Token은 메모리에 저장, Refresh Token은 HttpOnly 쿠키에 저장
3. **PKCE 필수**: SPA에서는 반드시 PKCE 사용
4. **State 파라미터**: CSRF 공격 방지를 위해 state 파라미터 사용
5. **토큰 만료 처리**: Access Token 만료 시 자동으로 Refresh Token 사용하여 갱신

## 추가 리소스

- [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-4.1)
- [PKCE (Proof Key for Code Exchange)](https://tools.ietf.org/html/rfc7636)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html) 