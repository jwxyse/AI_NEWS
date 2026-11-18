# Notion 저장 설정 (Notion API + Internal integration)

뉴스 카드의 **"뉴스 저장"** 버튼을 누르면 기사가 Notion 데이터베이스 "AI 뉴스 북마크"에 페이지로 저장됩니다. 이 문서는 그 기능을 쓰는 데 필요한 설정을 정리합니다. (PRD v0.3, FR-9)

## 1. 저장이 동작하는 방식

```
[뉴스 저장 클릭] → Server Action saveToNotion → src/lib/notion.ts → Notion REST API → "AI 뉴스 북마크" DB
```

- 우리 서버가 앱 공용 Internal integration 토큰으로 Notion API(`Notion-Version: 2025-09-03`)를 직접 호출합니다. Claude는 거치지 않으므로 Claude 비용이 들지 않고 빠릅니다.
- 이 API 버전에서는 페이지의 부모가 데이터베이스가 아니라 **data source**입니다. 서버가 `GET /v1/databases/{NOTION_DATABASE_ID}`로 data source ID를 한 번 조회해 기억해 둡니다.
- 모든 사용자가 **같은 데이터베이스**에 저장합니다. "저장됨" 표시는 `user_articles.notionPageUrl`에 사용자별로 기록되므로, 다른 사용자가 저장한 기사도 나에게는 "뉴스 저장" 버튼으로 보입니다.

### 노션 MCP 서버를 쓰지 않는 이유

노션 MCP 서버(`mcp.notion.com`)는 OAuth 로그인으로 받은 토큰만 받습니다. Internal integration 토큰(`ntn_...`)은 쓸 수 없습니다. 사용자별 OAuth 연결(PRD FR-8)은 보류했기 때문에 지금은 Notion API를 직접 호출합니다. 프로젝트에 설치한 노션 MCP 서버(`.mcp.json`)는 개발 중에 Claude Code가 데이터베이스 구조를 확인하는 용도로 씁니다.

## 2. 환경 변수 (`.env.local`)

| 이름 | 값 |
|---|---|
| `NOTION_API_KEY` | Internal integration 토큰 (`ntn_...`). https://www.notion.so/profile/integrations 에서 발급합니다. |
| `NOTION_DATABASE_ID` | "AI 뉴스 북마크" 데이터베이스 ID (32자리 16진수). 데이터베이스 URL의 `?` 앞부분이며, `?` 뒤는 넣지 않습니다. |

둘 다 서버에서만 읽습니다. `NEXT_PUBLIC_`을 붙이지 마세요. 값을 바꾼 뒤에는 개발 서버를 다시 켜야 합니다.

## 3. Notion에서 해야 할 일

1. 데이터베이스 페이지를 열고 오른쪽 위 `…` → **연결(Connections)** → 위 토큰의 integration을 추가합니다. 추가하지 않으면 API가 404를 돌려주고, 화면에는 "Notion 데이터베이스에 접근할 수 없어요"가 뜹니다.
2. 데이터베이스 속성은 아래 이름과 형식을 그대로 둡니다. 이름을 바꾸면 `src/lib/notion.ts`도 함께 바꿔야 합니다.

| 속성 | 형식 | 넣는 값 |
|---|---|---|
| 제목 | 제목(title) | 한국어 제목 |
| 텍스트 | 텍스트 | 한국어 요약 (2000자까지) |
| 카테고리 | 선택(select) | 저장한 사용자의 카테고리 이름, 없으면 "미분류" |
| 출처 | 선택(select) | TechCrunch / The Verge |
| 발행일 | 날짜 | 기사 발행 시각 (없으면 비워 둠) |
| 원문링크 | URL | 원문 주소 |

선택 옵션은 미리 만들지 않아도 됩니다. 처음 보는 값이면 Notion이 옵션을 자동으로 만듭니다. 페이지 본문에는 요약 문단과 원문 북마크가 들어갑니다.

## 4. 화면 동작

- 기본: "뉴스 저장" 버튼
- 저장 중: 버튼 비활성화, "저장 중…"
- 저장됨: "저장됨 ✓" 배지. 누르면 Notion 페이지가 새 탭에서 열립니다.
- 이미 저장한 기사: 다시 저장하지 않고 기존 페이지 링크를 돌려줍니다.
- 실패: 버튼 옆에 오류 문구가 뜨고 버튼이 "다시 시도"로 바뀝니다. 자세한 원인은 서버 로그의 `[saveToNotion] 실패`에 남습니다.

## 5. 나중에: 사용자별 Notion 연결 (PRD FR-8, 보류)

사용자마다 자기 Notion에 저장해야 하면 OAuth 연결로 바꿉니다. 그때는 다음이 필요합니다.

- 노션 MCP 서버 또는 Notion 공개(public) integration의 OAuth (Authorization Code + PKCE)
- 사용자 토큰을 `TOKEN_ENCRYPTION_KEY`(32바이트, `openssl rand -base64 32`)로 AES-256-GCM 암호화해 `notion_connections`에 저장하고, 만료되면 갱신
- 첫 저장 때 사용자 워크스페이스에 데이터베이스를 만들고 그 ID를 `notion_connections.databaseId`에 보관
- 헤더에 Notion 연결 상태 표시 (ui.md 4.1)

`notion_connections` 테이블은 이 용도로 이미 만들어 두었고, 지금은 쓰지 않습니다.
