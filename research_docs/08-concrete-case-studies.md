# AI로 구축한 실제 프로젝트 사례 연구

> 조사 일자: 2026-03-04
> 출처: WebSearch 기반 실제 사례 수집

---

## 1. Claude Code로 구축한 프로젝트 사례

### 사례 1: Vulcan Technologies — 버지니아 주 규제 분석 플랫폼

- **개발자**: Aleksander Mekhanik, Tanner Jones (YC S25 배치)
- **프로젝트**: AI 기반 규제 검토 및 간소화 플랫폼
- **기술 스택**: Claude Code (agentic coding), AI 에이전트 수천 개 병렬 실행
- **창업 시점**: 2024년 12월
- **과정**:
  - 두 공동창업자 모두 전통적 엔지니어링 백그라운드 없음
  - 2025년 5월 1일까지 버지니아 주지사 사무소용 프로토타입 구축 완료
  - 기성 컨설팅 펌들을 제치고 계약 수주
  - Claude Code 런칭 이후 개발 속도 배가
  - 버지니아 주의 규제 중복 40% 제거에 기여
  - 그 결과 버지니아 신규 주택 평균 가격 $24,000 인하에 기여
  - 2025년 $10.9M 시드 라운드 조달
- **출처**:
  - [YC 런치 페이지](https://www.ycombinator.com/launches/O2B-vulcan-technologies-virginia-required-our-product-by-law)
  - [Anthropic 블로그 — YC 스타트업 3사 사례](https://claude.com/blog/building-companies-with-claude-code)
  - [버지니아 규제 AI 도입 뉴스](https://reason.com/2025/07/23/virginia-is-using-ai-to-identify-illegal-and-redundant-regulations/)

---

### 사례 2: HumanLayer — AI 에이전트 코딩 플랫폼

- **개발자**: HumanLayer 팀 (YC F24 배치)
- **프로젝트**: CodeLayer — 병렬 Claude 에이전트 세션 관리 플랫폼
- **기술 스택**: Claude Code, Claude Agent SDK, git worktrees, 원격 클라우드 워커
- **소요 기간**: 2024년 하반기~2025년
- **과정**:
  - 팀 전체가 "모든 것을 Claude Code로 작성"하는 방식 채택
  - 300,000 라인 규모의 Rust 코드베이스도 Claude Code로 처리
  - 하루 만에 일주일치 작업 분량 배포 달성
  - MRR 전월 대비 100% 성장
  - YC 스타트업 2곳(엔지니어링팀 50~100명 규모), 상장사 다수와 유료 파일럿 진행 중
- **출처**:
  - [Anthropic 블로그 — YC 스타트업 3사 사례](https://claude.com/blog/building-companies-with-claude-code)
  - [HumanLayer GitHub](https://github.com/humanlayer/humanlayer)

---

### 사례 3: 블로그 애그리게이터 — 1일 만에 프로덕션 앱 구축

- **개발자**: Wheeler (DEV Community 기고자)
- **프로젝트**: 개인 블로그 애그리게이터 웹사이트
- **기술 스택**: Vue.js, TypeScript, Claude Code
- **소요 시간**: 8시간 (1일)
- **과정**:
  - Google Drive에서 1년 넘게 방치된 요구사항 문서를 출발점으로 사용
  - Claude Code가 전체 파일 구조, 컴포넌트, 빌드 설정 파일 생성
  - TypeScript 완전 적용, 에러 핸들링, 로딩 상태 포함한 프로덕션 수준 앱 완성
  - "1년간의 미루기를 8시간의 집중 AI 개발로 해결"
- **출처**:
  - [DEV Community 원문](https://dev.to/wheeleruniverse/from-dusty-requirements-to-live-website-how-claude-code-built-my-blog-aggregator-in-a-single-day-3jbo)

---

### 사례 4: PM이 Claude Code로 iOS 앱 출시

- **개발자**: Ondrej Machart (프로덕트 매니저)
- **프로젝트**: App Store 출시 네이티브 iOS 앱
- **기술 스택**: Claude Code, Xcode, Swift
- **소요 시간**: 저녁·야간 2개월 학습 후 2025년 11월 출시
- **과정**:
  - 엔지니어링 배경 없는 PM이 Claude Code를 터미널에서 사용
  - Xcode 프로젝트와 직접 연동하여 네이티브 앱 개발
  - 13개 Claude Code 프로젝트를 통해 PM 역할 자체를 변화시킴
- **출처**:
  - [Medium 기고문](https://medium.com/@ondrej.machart/13-claude-code-projects-that-changed-my-product-manager-role-over-the-last-6-months-7057b9045d51)

---

## 2. Cursor / Windsurf로 구축한 프로젝트 사례

### 사례 1: EnrichLead — 영업 리드 SaaS (실패 사례 겸)

- **개발자**: Leo Acevedo
- **프로젝트**: 영업 리드 관리 SaaS
- **기술 스택**: Cursor AI (100% AI 생성 코드, 직접 작성 코드 없음)
- **과정**:
  - 공개적으로 "Cursor로만 만들었고, 직접 쓴 코드는 단 한 줄도 없다"고 자랑
  - 런칭 2일 후 보안 공격 발생
  - API 키가 프론트엔드 코드에 노출, 인증 통제 없음, DB 무보호
  - 구독 우회, API 키 남용, DB 임의 데이터 삽입 피해 발생
  - 결국 앱 전체 셧다운 — Cursor로 보안 패치도 실패
- **교훈**: AI 생성 코드의 보안 취약성 문제를 상징하는 대표 사례로 인용됨
- **출처**:
  - [Vibe Coding Trap 분석](https://ruinunes.com/vibe-coding-trap-ai-built-mvp/)
  - [FinalRound AI — Vibe Coding 5가지 실패 사례](https://www.finalroundai.com/blog/vibe-coding-failures-that-prove-ai-cant-replace-developers)

---

### 사례 2: TaskFlow — 소규모 비즈니스용 일정 관리 SaaS

- **개발자**: 익명 개인 개발자 (Medium 기고)
- **프로젝트**: 반복 작업 및 일정 알림 SaaS (소규모 비즈니스 타겟)
- **기술 스택**: v0 (UI 생성) + Cursor AI (개발), Next.js, React
- **출시**: 2024년 12월
- **과정**:
  - v0로 UI 디자인 생성 후 Cursor로 기능 구현
  - 달력, 반복 태스크, 주간 태스크 뷰 포함한 풀스택 앱
  - Cursor가 처음부터 끝까지 아키텍처 설계 및 구현 진행
- **출처**:
  - [Medium 케이스 스터디](https://medium.com/@johnpascualkumar077/case-study-building-a-small-saas-with-v0-and-cursor-ai-9eccfabd7c1e)

---

### 사례 3: Windsurf — 개발자 생산성 실측 데이터

- **개발자**: 익명 테크 스타트업 (WWT 리포트 인용)
- **프로젝트**: 기존 코드베이스에 Windsurf 도입
- **기술 스택**: Windsurf IDE (Cascade AI), SQLite, Node.js, React, Tailwind CSS
- **과정**:
  - Windsurf 도입 2주 내에 생산성 92% 향상 (한 테크 기업 사례)
  - 코드 신규 커밋 기준 생산성 최대 44.6% 향상
  - 코드 수락률 38% 증가
  - 800,000+ 활성 사용자, 1,000+ 엔터프라이즈 고객
  - 출시 2일 내 10,000명 사용자 달성
- **출처**:
  - [Windsurf 실세계 프로젝트 장점 분석](https://www.arsturn.com/blog/the-advantages-of-using-windsurf-in-real-projects)
  - [Keyhole Software Windsurf 리뷰](https://keyholesoftware.com/codeium-windsurf-game-changing-ide-experience-part-1/)

---

## 3. 대규모 / 엔터프라이즈 사례

### 사례 1: TELUS — 57,000명 임직원 대상 Claude 기반 AI 플랫폼

- **기업**: TELUS (캐나다 최대 통신·헬스케어 기업)
- **프로젝트**: Fuel iX 내부 AI 플랫폼
- **도입 규모**: 57,000명 임직원 전체
- **핵심 지표**:
  - 13,000개+ 커스텀 AI 솔루션 운영 중
  - 47개 대규모 솔루션이 $9,000만 이상 비즈니스 이익 창출
  - AI 인터랙션당 40분 절약
  - 누적 50만 시간 이상 절약
  - 개발팀 코드 배포 속도 30% 향상
  - 월 처리 토큰: 약 1,000억 개
- **기술 스택**: Claude (Anthropic), GitHub Copilot, Cline, Claude Code (VS Code 연동)
- **출처**:
  - [Anthropic 고객 사례 — TELUS](https://claude.com/customers/telus)
  - [Fuel iX 케이스 스터디](https://www.fuelix.ai/case-study/telus)

---

### 사례 2: GitHub Copilot + Accenture 대규모 엔터프라이즈 연구

- **대상**: Accenture 개발자 수백 명 (GitHub 공동 연구)
- **핵심 지표**:
  - 특정 작업에서 코딩 속도 최대 51% 향상
  - PR 수 8.69% 증가, PR 머지율 11% 증가
  - 성공적 빌드 84% 증가
  - GitHub Copilot 도입 후 PR 수 10.6%, 사이클 타임 3.5시간 감소 (별도 사례)
  - 개발자 96%가 Copilot 도입에 성공, 67%가 주 5일 이상 활용
  - 개발자 만족도: 90%가 업무 만족도 향상, 95%가 코딩이 더 즐거워졌다고 응답
  - 포춘 100대 기업의 90%가 GitHub Copilot 채택
  - 전체 사용자 수 1,500만 명+
- **출처**:
  - [GitHub 블로그 — Accenture 연구](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-in-the-enterprise-with-accenture/)
  - [Harness.io 케이스 스터디](https://www.harness.io/blog/the-impact-of-github-copilot-on-developer-productivity-a-case-study)

---

## 4. 오픈소스 AI 활용 사례

### 현황: AI가 작성하는 코드 비율

- **미국**: Python 함수의 29% AI 생성 (2024년 12월 기준 30.1%)
- **독일**: 24.3%, **프랑스**: 23.2%, **인도**: 21.6%, **러시아**: 15.4%, **중국**: 11.7%
- **출처**: Science 저널 논문 ["Who is using AI to code?"](https://www.science.org/doi/10.1126/science.adz9311)

### 오픈소스 프로젝트 Copilot 채택률

- 오픈소스 프로젝트의 50%가 GitHub Copilot을 사용하는 메인테이너 보유
- GitHub 신규 개발자의 80%가 첫 주 이내에 Copilot 활용
- AI 관련 공개 리포지토리: 1.13M+ (YoY 178% 증가)
- 2025년 상위 성장 오픈소스 프로젝트 중 60%가 AI 관련 프로젝트
- **출처**: [GitHub Octoverse 2025](https://octoverse.github.com/)

### 주목할 만한 AI 관련 오픈소스 프로젝트 (빠른 기여자 증가 기준)
- **vllm**: LLM 서빙 런타임
- **cline**: Claude Code 연동 AI 코딩 에이전트
- **ragflow**: RAG 오케스트레이션 프레임워크
- **sglang**: LLM 효율화 프레임워크
- **home-assistant**: AI 통합 홈 자동화

---

## 5. 실패 사례와 교훈

### 사례 1: EnrichLead 보안 사고 (상세)

- **날짜**: 2025년 3월
- **규모**: 런칭 직후 2일 내 공격, 앱 전체 셧다운
- **구체적 결함**:
  - API 키가 프론트엔드 코드에 평문 노출
  - 인증 및 권한 통제 부재
  - DB 접근 통제 없음
  - 구독 우회 취약점 존재
- **교훈**: AI 코드는 "기능적으로는 높은 완성도"이나 "보안 판단력은 체계적으로 결여"
- **출처**: [Kaspersky 보안 분석](https://www.kaspersky.com/blog/vibe-coding-2025-risks/54584/)

### 사례 2: 결제 게이트웨이 $200만 사기 사고

- **날짜**: 2025년 3월
- **내용**: Vibe 코딩으로 구축한 결제 게이트웨이에서 불충분한 입력 검증으로 $200만 규모 사기 거래 승인
- **출처**: [Pixelmojo 분석](https://www.pixelmojo.io/blogs/vibe-coding-technical-debt-crisis-2026-2027)

### AI 코드의 구조적 문제 통계

| 항목 | 수치 | 출처 |
|------|------|------|
| AI 생성 코드 내 보안 취약점 비율 | 15~25% | 복수 연구 |
| OWASP Top 10 취약점 포함 비율 | 45% | Veracode |
| Java AI 코드 보안 실패율 | 72%+ | Veracode |
| AI 코드 인간 코드 대비 취약성 | 30~40% 더 취약 | Snyk CEO 발언 |
| Vibe 코딩 스타트업 중 재구축 필요 비율 | 약 80% (8,000/10,000개) | Pixelmojo 추정 |
| 재구축 비용 | 건당 $50K~$500K | Pixelmojo 추정 |

### 핵심 교훈

1. **컨텍스트 윈도우 문제**: 대화가 길어질수록 AI가 초기 스펙을 잊어버리며 코드 품질 저하
2. **코드 중복 생성**: AI는 프로젝트의 유틸리티 라이브러리를 인식하지 못해 유사한 함수를 반복 생성
3. **보안은 자동 적용되지 않음**: 입력 검증, 인증, 권한 부여는 반드시 인간이 명시적으로 요구해야 함
4. **주니어 개발자 공동화**: 2025년 LeadDev 조사에서 엔지니어링 리더 54%가 AI 효율화로 인해 주니어 채용 축소 계획 — 미래 AI 코드 부채를 수정할 역량이 사라지는 악순환 예고
- **출처**:
  - [MIT Sloan Review — AI 코딩의 숨겨진 비용](https://sloanreview.mit.edu/article/the-hidden-costs-of-coding-with-generative-ai/)
  - [Vibe Coding Is Nothing But Tech Debt](https://uditgoenka.medium.com/vibe-coding-a1451c3ec0db)
  - [InfoWorld — Vibe Coding의 기술 부채](https://www.infoworld.com/article/4098925/is-vibe-coding-the-new-gateway-to-technical-debt.html)

---

## 6. 1인 개발자 AI 풀스택 개발 사례

### 사례 1: Danny Postma — AI 헤드샷 서비스로 월 $300K

- **개발자**: Danny Postma (네덜란드 출신, 발리 거주)
- **프로젝트**: HeadshotPro — AI 생성 프로페셔널 헤드샷 서비스
- **출시**: 2023년 3월 (AI 도구 적극 활용)
- **수익**: 월 $300,000 ($3.6M/년 수준)
- **이전 성과**: AI 라이팅 툴 Headlime를 런칭 8개월 만에 $1,000,000에 매각
- **전략**:
  - AI 도구로 빠른 프로토타이핑 후 SEO 집중
  - 문화적 트렌드를 정확히 포착한 타이밍
  - 성숙한 제품을 매각하고 다음 AI 웨이브로 이동
- **출처**:
  - [Starter Story 인터뷰](https://www.starterstory.com/stories/headshotpro-breakdown)
  - [SupaBird 프로파일](https://supabird.io/articles/danny-postma-how-a-solo-hacker-built-an-ai-empire-from-bali)

---

### 사례 2: 1인 개발자 SaaS 포트폴리오 월 $28,000

- **개발자**: Samuel (안경사 출신 자수성가 개발자)
- **프로젝트**: SaaS 제품 포트폴리오
- **월 수익**: $28,000
- **특징**:
  - 기술 백그라운드 없이 시작
  - AI 도구 활용으로 개발·마케팅 워크플로우 자동화
  - 사이드 프로젝트 형태로 시작, 점진적 성장
- **출처**:
  - [Indie Hackers 인터뷰](https://www.indiehackers.com/post/tech/learning-to-code-and-building-a-28k-mo-portfolio-of-saas-products-OA5p18fXtvHGxP9xTAwG)

---

### 사례 3: Senja.io — 2인 창업팀 AI 활용 소셜 증명 플랫폼

- **개발자**: Senja 팀 (2인 창업)
- **프로젝트**: Senja.io — 비즈니스 추천사(testimonial) 수집 플랫폼
- **수익**: 2025년 11월 기준 $1M ARR (월 $83,000) 돌파
- **특징**: AI 도구로 소규모 팀이 경쟁사 대비 빠른 개발 속도 유지
- **출처**:
  - [Successful Projects 케이스 스터디](https://www.thesuccessfulprojects.com/how-two-indie-hackers-built-a-successful-micro-saas-senja-io-1m-arr/)

---

### 시장 트렌드 요약

| 지표 | 수치 |
|------|------|
| AI로 개발·마케팅 70% 이상 처리하는 인디 SaaS 창업자 비율 | 33% (2025 Indie Hacker Trends Survey) |
| AI 도입 후 개발 사이클 단축율 | 최대 60% |
| 수익을 내는 SaaS 중 1인 창업 비율 | 44% (Stripe 2024 보고서) |
| 1인 개발자 월 수익 $500~$1K 구간 비율 | 46% (인디 런치 분석) |
| 인디 메이커 제안 중 AI 언급 비율 | 18% (313/1,702건) |

---

## 종합 인사이트

1. **"비개발자의 창업"이 현실이 됨**: Vulcan Technologies처럼 엔지니어링 배경 없는 팀이 정부 계약을 수주하는 것이 Claude Code 덕분에 가능해졌다.

2. **1인 개발 SaaS의 수익 상한이 올라감**: AI 도구 이전에는 혼자 월 수만 달러 SaaS를 운영하기 어려웠으나, Danny Postma($300K/월) 같은 사례가 현실화됨.

3. **AI 코드의 기술 부채는 산업 전체의 시한폭탄**: 10,000개 스타트업 중 8,000개가 재구축 필요 추정 — 이 비용은 2026~2027년에 집중적으로 터질 전망.

4. **엔터프라이즈 ROI는 측정 가능함**: TELUS의 $9,000만 이익, Copilot의 PR 수 8.69% 증가 등 구체적 수치가 나오면서 AI 개발 도구 도입이 의사결정 레벨에서 정당화됨.

5. **컨텍스트 엔지니어링이 바이브 코딩을 대체하는 추세**: 2025년 하반기부터 무계획적 프롬프팅("vibe coding")에서 체계적 컨텍스트 관리("context engineering")로 패러다임 이동 시작.

---

*이 문서는 WebSearch 기반으로 수집된 공개 자료를 바탕으로 작성되었습니다. 수치는 각 출처 발간 시점 기준이며, 이후 업데이트된 수치가 있을 수 있습니다.*
