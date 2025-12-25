# Background Jobs 설계

## 1. 작업 유형

### A. 마감 리마인더 (Deadline Reminder)
- **목적**: 캠페인 마감일 하루 전(D-1) 알림 발송
- **대상**: RUNNING 또는 MATCHING 상태인 캠페인 중 deadlineDate가 내일인 것
- **동작**:
  1. 대상 캠페인 조회
  2. 관련 인플루언서에게 이메일 발송
  3. events 컬렉션에 "deadline_reminder" 이벤트 기록

**스케줄**: 매일 오전 9시 (KST)

---

### B. 지연 감지 (Overdue Detection)
- **목적**: 마감일을 초과한 캠페인 감지 및 상태 업데이트
- **대상**: deadlineDate가 과거이고 제출이 없는 캠페인
- **동작**:
  1. 지연된 캠페인 조회
  2. 인플루언서에게 경고 및 페널티 기록
  3. 광고주에게 알림
  4. events 컬렉션에 "deadline_overdue" 이벤트 기록

**스케줄**: 매일 오전 9시 (마감 리마인더 이후)

---

### C. 리포트 자동 생성 (Auto Report Generation)
- **목적**: 완료된 캠페인의 리포트 자동 생성
- **대상**: status가 "COMPLETED"이고 리포트가 없는 캠페인
- **동작**:
  1. 완료된 캠페인 조회
  2. 제출된 모든 submissions 데이터 수집
  3. KPI 계산 및 요약
  4. LLM을 사용하여 문장 형태 해석 생성
  5. reports 컬렉션에 저장
  6. 광고주에게 리포트 완료 알림

**스케줄**: 매일 오후 6시 (KST)

---

### D. 상태 자동 전환 (Status Auto Transition)
- **목적**: 특정 조건에서 자동으로 상태 변경
- **예시**:
  - APPROVED → OPEN (자동으로 24시간 후)
  - RUNNING → COMPLETED (모든 제출이 APPROVED되고 마감일 경과)
- **동작**: 조건에 맞는 캠페인 찾아서 상태 업데이트

**스케줄**: 매시간

---

## 2. 구현 방식 (MVP)

### 옵션 A: Vercel Cron (권장)
- **장점**: Vercel 배포 시 간단하게 설정 가능
- **단점**: 무료 플랜은 일일 실행 제한

**설정 방법**:
1. `vercel.json`에 cron 작업 정의
2. API Route로 작업 핸들러 생성
3. Vercel 대시보드에서 cron 활성화

### 옵션 B: Firebase Cloud Functions + Cloud Scheduler
- **장점**: 더 세밀한 스케줄링, 무료 할당량 넉넉
- **단점**: 추가 설정 필요

**MVP에서는 Vercel Cron 사용**

---

## 3. API Route 구조

### /api/cron/deadline-reminder
마감 리마인더 작업

**요청**: 
- Vercel Cron에서 자동 호출
- Secret 헤더로 인증: `x-cron-secret`

**동작**:
1. Secret 검증
2. 대상 캠페인 조회
3. 이메일 발송 (추후 구현, MVP는 이벤트만 기록)
4. 이벤트 기록

---

### /api/cron/overdue-detection
지연 감지 작업

**동작**:
1. Secret 검증
2. 지연된 캠페인 조회
3. 페널티 기록 생성 (penalties 컬렉션)
4. 이벤트 기록

---

### /api/cron/generate-reports
리포트 자동 생성 작업

**동작**:
1. Secret 검증
2. 완료된 캠페인 조회
3. 리포트 생성 (LLM 호출)
4. reports 컬렉션에 저장
5. 이벤트 기록

---

### /api/cron/status-transition
상태 자동 전환 작업

**동작**:
1. Secret 검증
2. 조건에 맞는 캠페인 조회 및 상태 업데이트
3. 이벤트 기록

---

## 4. 환경변수

```env
CRON_SECRET=your-secret-key-here  # Cron 작업 인증용
```

---

## 5. 에러 처리

- 작업 실패 시: 에러 로그 기록 (Firestore 또는 외부 로깅 서비스)
- 부분 실패: 성공한 항목은 처리하고 실패한 항목만 재시도 큐에 추가 (추후 구현)
- MVP: 에러 발생 시 로그만 기록

---

## 6. 모니터링

- 각 작업 실행 시 events 컬렉션에 작업 시작/완료 이벤트 기록
- Admin 대시보드에서 최근 작업 실행 내역 확인 가능

---

## 7. vercel.json 설정 예시

```json
{
  "crons": [
    {
      "path": "/api/cron/deadline-reminder",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/overdue-detection",
      "schedule": "5 9 * * *"
    },
    {
      "path": "/api/cron/generate-reports",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/status-transition",
      "schedule": "0 * * * *"
    }
  ]
}
```

참고: Cron 표현식은 UTC 기준

