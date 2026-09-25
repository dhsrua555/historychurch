# 히스토리교회 홈페이지 (리뉴얼)

기독교대한감리회 히스토리교회 — 말씀의 역사로 믿음의 역사를 쓰는 교회
기존 사이트: https://historychurch.org · 새 사이트 미리보기: https://dhsrua555.github.io/historychurch/

> 글·사진을 올리는 분은 **[운영가이드.md](./운영가이드.md)** 만 보시면 됩니다.
> 이 문서는 사이트를 관리·설정하는 분을 위한 안내입니다.

## 무엇이 바뀌었나

| 예전 문제 | 이렇게 바꿨습니다 |
| --- | --- |
| 디자인이 오래되고 복잡함 | 로고의 초록·금색을 바탕으로 한 절제된 디자인. 로고의 십자가를 ‘빛의 십자가’ 모티프로 사용 |
| 글 확인·업로드가 불편함 | `/admin` 관리자 화면(한국어)에서 메뉴를 고르고 → 채우고 → 저장. 1~2분 뒤 자동 반영 |
| 사진 올리기가 불편함 | 여러 장을 한꺼번에 끌어다 놓기. 휴대폰 사진(HEIC 포함)도 올리는 순간 자동으로 WebP 로 줄여 저장 |
| 어떤 교회인지 알기 어려움 | 홈 화면에 교회 소개 한 문단 · 핵심 정보 · 3대 비전 · 담임목사 인사 · 표어 · 예배 시간을 차례로 배치 |
| 주일 설교를 매번 올려야 함 | 유튜브 채널을 매시간 확인해 새 예배 영상을 자동으로 추가. 홈 화면 ‘이번 주 설교’가 알아서 바뀜 |

## 구성

- **[Astro](https://astro.build)** — 정적 사이트 생성기. 글은 `src/content/` 의 마크다운 파일입니다.
- **[Sveltia CMS](https://sveltiacms.app)** — `/admin` 관리자 화면. 저장하면 이 저장소에 커밋됩니다.
- **GitHub Pages** — `main` 에 커밋될 때마다 GitHub Actions 가 빌드해서 배포합니다 (`.github/workflows/deploy.yml`).
- **설교 자동 동기화** — 매시간 유튜브 RSS 를 확인합니다 (`.github/workflows/sync-sermons.yml`, `scripts/sync-sermons.mjs`).

```
src/
  content/
    sermons/     설교 (유튜브에서 자동 생성 + CMS 에서 수정)
    bulletins/   주보
    columns/     목회서신
    notices/     공지 · 교회 소식
    albums/      앨범
  data/
    site.json    교회 기본 정보 · 예배 시간 · 헌금 계좌 · 표어
    about.json   교회 소개 · 비전 · 담임목사 인사말
  pages/         화면 (index, about, worship, sermons, news, album, give)
  components/    헤더, 푸터, 로고, 영상 플레이어 등
  styles/global.css  디자인 토큰(색·글꼴·간격)
public/
  admin/         관리자 화면 (config.yml 에 메뉴 구성)
  uploads/       CMS 로 올린 사진·파일
scripts/
  sync-sermons.mjs      유튜브 → 설교 글 자동 생성
  import-wordpress.mjs  기존 워드프레스 글·사진 가져오기
```

## 처음 설정 (한 번만)

### 1) GitHub Pages 켜기

저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions** 로 설정합니다.
그다음 **Actions → 사이트 배포 → Run workflow** 를 한 번 실행하면 미리보기 주소가 열립니다.

### 2) 관리자 로그인 설정

글을 올리는 사람은 GitHub 계정이 있어야 하고, 이 저장소의 **Collaborator** 로 초대되어 있어야 합니다.
(Settings → Collaborators → Add people)

**지금 방식 — 토큰으로 로그인 (설정 없이 바로 사용)**

1. `/admin` 에서 **액세스 토큰으로 로그인** 을 누릅니다.
2. 안내 창의 링크를 누르면 GitHub 토큰 만드는 화면이 열립니다. 권한이 미리 골라져 있으니 만료일만 정하고 만듭니다.
   - 직접 만든다면: Fine-grained token → 이 저장소만 선택 → Repository permissions **Contents: Read and write**
3. 만든 토큰을 붙여 넣으면 로그인됩니다. 같은 브라우저에서는 계속 로그인 상태가 유지됩니다.
4. 휴대폰은 컴퓨터 관리자 화면의 계정 메뉴 → **Sign In with Mobile** QR 코드로 로그인하면 편합니다.

**나중에 — ‘GitHub로 로그인’ 버튼 (여러 사람이 쓸 때 권장)**

토큰 없이 버튼 하나로 로그인하려면 무료 인증 서버가 필요합니다 (약 10분).

1. [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) 안내대로 Cloudflare Workers 에 배포합니다.
2. GitHub **Settings → Developer settings → OAuth Apps** 에서 앱을 만들고, Callback URL 에 `https://<워커 주소>/callback` 을 넣습니다.
3. 발급된 Client ID / Secret 을 워커 환경 변수에 넣습니다.
4. `public/admin/config.yml` 의 `backend` 에 아래처럼 추가합니다.

   ```yaml
   backend:
     name: github
     repo: dhsrua555/historychurch
     branch: main
     base_url: https://<워커 주소>
     auth_methods: [oauth, token]
   ```

## 설교 자동 업데이트

- `sync-sermons.yml` 이 **매시간** 히스토리교회 유튜브 채널(RSS)을 확인합니다.
- 제목에 `주일예배` / `수요` / `금요` 가 들어간 새 영상이 있으면 `src/content/sermons/날짜-sunday.md` 같은 파일을 만들고 커밋 → 사이트를 다시 배포합니다.
- 영상 설명의 `✜ 본 문 : 잠언 20:5-12` 와 그 아래 성경 구절, `잠언 (16)` 같은 시리즈 이름도 자동으로 가져옵니다.
- 예배 날짜는 업로드 시각(한국 시간)을 기준으로 가장 가까운 주일/수요일/금요일로 정합니다. (제목의 날짜 오타에 영향받지 않음)
- 이미 있는 영상은 건너뛰므로 CMS 에서 고친 내용은 덮어쓰지 않습니다.
- 바로 확인하고 싶으면 **Actions → 설교 영상 자동 가져오기 → Run workflow**.
- 인식 규칙을 바꾸려면 `scripts/sync-sermons.mjs` 의 `RULES` 를 고치세요.

> GitHub 는 60일 동안 저장소에 변화가 없으면 예약 작업을 멈춥니다. 매주 설교가 자동으로 커밋되므로 보통은 문제없지만,
> 유튜브 업로드가 오래 멈추면 Actions 화면에서 다시 켜 주세요.

## 실제 도메인(historychurch.org)으로 옮기기

1. **남은 옛 글 가져오기** — 워드프레스를 끄기 전에 실행합니다. (현재는 목회서신 전체, 2026년 주보, 최근 앨범 8개, 공지 4개만 옮겨져 있습니다)

   ```bash
   npm install
   npm run import:wordpress -- --only=bulletins,albums --bulletins-since=2021-01-01 --albums=40
   ```

   사진 용량이 커지므로(앨범 하나에 수 MB) 꼭 필요한 만큼만 가져오기를 권합니다.
2. **도메인 연결** — Settings → Pages → Custom domain 에 `historychurch.org` 입력.
   도메인 관리 업체(DNS)에서 `A` 레코드 4개를 GitHub Pages 주소로 바꿉니다:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (`www` 는 `CNAME` → `dhsrua555.github.io`). 연결 후 **Enforce HTTPS** 를 켭니다.
3. `public/admin/config.yml` 의 `site_url` 을 `https://historychurch.org/` 로 바꿉니다.
4. 나머지는 자동입니다. 빌드가 새 주소를 알아서 쓰고, 미리보기에서 막아 두었던 검색엔진 노출(`noindex`)도 풀립니다.
   예전 주소 `/greeting`, `/maps`, `/sermon`, `/history` 는 새 페이지로 자동 이동합니다 (`astro.config.mjs` 의 `redirects`).

## 내 컴퓨터에서 고치기

[Node.js](https://nodejs.org) 22.12 이상이 필요합니다.

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # dist/ 에 결과물
npm run sync:sermons # 유튜브에서 새 설교 가져오기
```

개발 서버를 켠 채로 Chrome/Edge 에서 `http://localhost:4321/admin/` 을 열고 **로컬 저장소로 작업** 을 누르면,
로그인 없이 내 컴퓨터의 파일을 바로 고칠 수 있습니다.

### 디자인 바꾸기

- 색·글꼴·간격: `src/styles/global.css` 맨 위의 `:root` 변수
- 로고: `src/lib/logo-paths.ts` (기존 로고 PNG 를 그대로 벡터로 옮긴 것 — 모양을 바꾸지 마세요), 원본 PNG 는 `public/images/`
- 글꼴: 본문 Pretendard, 성경 구절·표어 Noto Serif KR, 로고 글자 Black Han Sans (`src/layouts/Base.astro`)
