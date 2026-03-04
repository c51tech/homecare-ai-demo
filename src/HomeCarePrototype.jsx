import { useState, useEffect, useRef } from "react";

// ============================================================
// HomeCare AI — TRL 6 Prototype
// 방문의료 AI 통합 지원 플랫폼
// ============================================================

// --- Color Tokens ---
const C = {
  primary: "#0891B2",
  primaryDark: "#065666",
  accent: "#06B6D4",
  danger: "#EF4444",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  success: "#10B981",
  successBg: "#D1FAE5",
  bg: "#F0FDFA",
  white: "#FFFFFF",
  textDark: "#1E293B",
  textMed: "#475569",
  textLight: "#94A3B8",
  border: "#E2E8F0",
  tealBg: "#CCFBF1",
};

// --- Demo Patient Data ---
const PATIENTS = [
  {
    id: 1, name: "김영수", age: 78, gender: "남",
    address: "서울시 성북구 보문동 3가 12-5",
    time: "09:00", status: "예정",
    diagnoses: ["제2형 당뇨", "고혈압", "만성신장질환 3기", "골관절염"],
    medications: [
      { name: "메트포르민 500mg", freq: "1일 2회", category: "당뇨" },
      { name: "글리메피리드 2mg", freq: "1일 1회", category: "당뇨" },
      { name: "암로디핀 5mg", freq: "1일 1회", category: "혈압" },
      { name: "로사르탄 50mg", freq: "1일 1회", category: "혈압" },
      { name: "아스피린 100mg", freq: "1일 1회", category: "심혈관" },
      { name: "로라제팜 0.5mg", freq: "취침전", category: "수면" },
      { name: "클로르페니라민 4mg", freq: "필요시", category: "알레르기" },
      { name: "이부프로펜 400mg", freq: "필요시", category: "진통" },
    ],
    frailtyIndex: 18, frailtyTotal: 50,
    prevKMMSE: 25, prevPHQ9: 8,
    lastVisit: "2026-02-18",
    prevVitals: { sbp: 148, dbp: 88, hr: 78, temp: 36.4, glucose: 185, weight: 68.2, spo2: 96 },
    frailtyHistory: [22, 20, 19, 18, 18],
  },
  {
    id: 2, name: "이순자", age: 85, gender: "여",
    address: "서울시 동대문구 전농동 588-2",
    time: "10:30", status: "예정",
    diagnoses: ["알츠하이머 치매", "골다공증", "고혈압"],
    medications: [
      { name: "도네페질 10mg", freq: "1일 1회", category: "치매" },
      { name: "리세드로네이트 35mg", freq: "주 1회", category: "골다공증" },
      { name: "발사르탄 80mg", freq: "1일 1회", category: "혈압" },
    ],
    frailtyIndex: 28, frailtyTotal: 50,
    prevKMMSE: 18, prevPHQ9: 14,
    lastVisit: "2026-02-20",
    prevVitals: { sbp: 132, dbp: 78, hr: 72, temp: 36.2, glucose: 105, weight: 52.1, spo2: 97 },
    frailtyHistory: [24, 25, 26, 27, 28],
  },
  {
    id: 3, name: "박철호", age: 72, gender: "남",
    address: "서울시 중랑구 면목동 171-3",
    time: "14:00", status: "예정",
    diagnoses: ["COPD", "제2형 당뇨", "우울증"],
    medications: [
      { name: "티오트로피움 흡입", freq: "1일 1회", category: "호흡기" },
      { name: "메트포르민 1000mg", freq: "1일 2회", category: "당뇨" },
      { name: "에스시탈로프람 10mg", freq: "1일 1회", category: "우울" },
      { name: "살부타몰 흡입", freq: "필요시", category: "호흡기" },
    ],
    frailtyIndex: 14, frailtyTotal: 50,
    prevKMMSE: 27, prevPHQ9: 12,
    lastVisit: "2026-02-25",
    prevVitals: { sbp: 128, dbp: 82, hr: 84, temp: 36.6, glucose: 142, weight: 74.5, spo2: 93 },
    frailtyHistory: [16, 15, 15, 14, 14],
  },
];

// --- AI Briefing Text (pre-written for demo) ---
const AI_BRIEFING_TEXT = `[환자 상태 요약 — AI 분석 결과]

■ 기본 정보
김영수 (남/78세), 재택의료 등록 2024.06, 방문 12회차
주 돌봄자: 배우자 (김순이, 75세)
ADL 부분 의존 (입욕·이동 보조 필요)

■ 질환 경과
• 제2형 당뇨 (2015~): HbA1c 7.8% → 8.2% 악화 추세
• 고혈압 (2012~): 최근 3회 수축기 145-155mmHg, 목표 미달
• 만성신장질환 3기: eGFR 42 → 38 (3개월 내 감소)
• 골관절염: 좌측 무릎, 보행 시 통증 호소

■ 현재 투약 (8개 — Beer's Criteria 주의)
🔴 클로르페니라민: 강한 항콜린 작용 → 2세대 전환 권고
🟠 로라제팜 + 낙상 고위험: BZD 낙상위험 2배 → 비약물 수면관리
🟡 글리메피리드 + eGFR 38: 지연성 저혈당 위험 → 용량 감량 검토

■ 최근 검사 결과 (2026.02.15)
혈당(공복) 185 mg/dL ↑ | HbA1c 8.2% ↑
eGFR 38 mL/min ↓ | 크레아티닌 1.8 mg/dL
혈색소 11.2 g/dL (경도 빈혈)

■ 이전 방문 이슈 (2026.02.18)
• 혈당 조절 불량 지속 → 인슐린 전환 논의 필요
• 야간 수면장애 호소 → 로라제팜 의존 우려
• 좌측 무릎 부종 악화 → 정형외과 의뢰 검토

■ ⚠️ 금일 주의사항
1. 신기능 악화 추세 — eGFR/크레아티닌 재확인
2. 다약제 복용(8개) — Beer's Criteria 약물 재검토
3. 혈당 조절 실패 — 인슐린 전환 의사결정
4. 낙상 위험 — 환경 평가 + BZD 감량 논의`;

const SOAP_TEXT = {
  S: `[주관적 소견 — Subjective]
• 주호소: "무릎이 더 아파서 걷기가 힘들어요"
• 수면: 야간 2-3회 각성, 로라제팜 복용해도 효과 감소
• 식욕: 보통, 하루 2끼 (아침 거름)
• 혈당 자가측정: 불규칙하게 시행, 공복 170-200대
• 낙상: 최근 1주 내 없으나 어지러움 간헐적 호소
• 기분: "별로 할 것도 없고 그냥 그래요" (무기력감)`,

  O: `[객관적 소견 — Objective]
• V/S: BP 152/90 mmHg, HR 80 bpm, BT 36.5°C, SpO2 96%
• 체중: 67.8 kg (이전 68.2kg, -0.4kg/2주)
• 혈당(식후 2h): 228 mg/dL
• 좌측 무릎: 부종(+), 압통(+), ROM 제한(굴곡 100°)
• 보행: 독립 가능하나 절뚝임, 보조기구 미사용
• CGA-FI: 21/50 (이전 18/50, 3점 상승 — 주의)
• K-MMSE: 22/30 (이전 25/30, 3점 하락 — 경도인지장애 의심)
• PHQ-9: 10/27 (이전 8/27, 경도 우울 → 중등도)`,

  A: `[평가 — Assessment]
1. 제2형 당뇨: 혈당 조절 악화 (HbA1c 8.2%, 식후 228)
   → 경구약 한계, 기저 인슐린 도입 적응증
2. 고혈압: 목표 BP 미달 (152/90, 목표 <140/90)
   → 현 2제 요법 불충분, 3제 병합 또는 용량 증량 검토
3. 만성신장질환: eGFR 38로 악화 추세
   → NSAID(이부프로펜) 즉시 중단 필요 (신독성)
4. 다약제 — Beer's Criteria 경고 3건
   🔴 클로르페니라민 → 세티리진 전환 권고
   🟠 로라제팜 → 비약물 수면위생 + 점진적 감량
   🟡 글리메피리드 → 신기능 고려 용량 감량
5. 인지기능: K-MMSE 3점 하락 → 추적 관찰 필요
6. 우울: PHQ-9 10점 → 정신건강의학과 협진 검토`,

  P: `[계획 — Plan]
1. 약물 조정
   - 이부프로펜 중단 → 아세트아미노펜 500mg PRN 전환
   - 글리메피리드 2mg → 1mg 감량
   - 인슐린 글라진 도입 논의 (다음 방문 시 교육)
   - 클로르페니라민 → 세티리진 10mg 전환
   - 로라제팜 0.5mg → 0.25mg 점진적 감량 시작

2. 검사 의뢰
   - HbA1c 재검 (4주 후)
   - 신기능 패널 (eGFR, Cr, BUN) 2주 후
   - K-MMSE 정밀 평가 예약 (신경과 협진)

3. 비약물 중재
   - 수면 위생 교육 자료 제공
   - 무릎 관절 보호 운동법 안내
   - 혈당 자가측정 교육 (매일 공복 + 식후 2h)

4. 다음 방문
   - 방문주기: 2주 → 1주 단축 (Frailty Index 상승)
   - 다음 방문 일자: 2026.03.10 (월)
   - 확인 사항: 약물 변경 반응, 혈당 추이, 수면 상태`
};

// --- CGA-FI 8 Domains ---
const CGA_DOMAINS = [
  { id: 1, name: "병력", icon: "📋", points: 20, questions: [
    { q: "고혈압 진단 여부", type: "toggle", value: true },
    { q: "당뇨병 진단 여부", type: "toggle", value: true },
    { q: "만성신장질환 여부", type: "toggle", value: true },
    { q: "골관절염 여부", type: "toggle", value: true },
    { q: "뇌졸중 병력", type: "toggle", value: false },
  ]},
  { id: 2, name: "낙상", icon: "⚠️", points: 1, questions: [
    { q: "최근 1년 내 낙상 경험", type: "toggle", value: false },
    { q: "낙상 공포감 (외출 꺼림)", type: "toggle", value: true },
    { q: "보행 보조기구 사용", type: "toggle", value: false },
  ]},
  { id: 3, name: "다약제", icon: "💊", points: 1, questions: [
    { q: "현재 복용 약물 수", type: "number", value: 8 },
    { q: "최근 약물 변경 여부", type: "toggle", value: false },
    { q: "약물 부작용 경험", type: "toggle", value: true },
  ]},
  { id: 4, name: "ADL/IADL", icon: "🏠", points: 14, questions: [
    { q: "식사하기", type: "select", value: "자립", options: ["자립", "부분도움", "전적도움"] },
    { q: "옷 입기", type: "select", value: "자립", options: ["자립", "부분도움", "전적도움"] },
    { q: "입욕하기", type: "select", value: "부분도움", options: ["자립", "부분도움", "전적도움"] },
    { q: "이동하기", type: "select", value: "부분도움", options: ["자립", "부분도움", "전적도움"] },
  ]},
  { id: 5, name: "영양", icon: "🍽️", points: 1, questions: [
    { q: "최근 3개월 체중 감소", type: "toggle", value: true },
    { q: "식욕 저하", type: "toggle", value: false },
    { q: "하루 식사 횟수", type: "select", value: "2끼", options: ["3끼", "2끼", "1끼 이하"] },
  ]},
  { id: 6, name: "우울", icon: "😔", points: 1, questions: [
    { q: "지난 2주간 우울감", type: "select", value: "가끔", options: ["없음", "가끔", "자주", "거의매일"] },
    { q: "흥미/즐거움 감소", type: "select", value: "가끔", options: ["없음", "가끔", "자주", "거의매일"] },
    { q: "수면 문제", type: "select", value: "자주", options: ["없음", "가끔", "자주", "거의매일"] },
  ]},
  { id: 7, name: "인지", icon: "🧠", points: 1, questions: [
    { q: "오늘 날짜를 알고 계십니까?", type: "select", value: "정확", options: ["정확", "부분정확", "모름"] },
    { q: "최근 기억력 문제 호소", type: "toggle", value: true },
    { q: "길 찾기 어려움", type: "toggle", value: false },
  ]},
  { id: 8, name: "신체활동", icon: "🏃", points: 7, questions: [
    { q: "0.5kg 물건 들기", type: "select", value: "가능", options: ["가능", "어려움", "불가능"] },
    { q: "계단 오르기", type: "select", value: "어려움", options: ["가능", "어려움", "불가능"] },
    { q: "400m 보행", type: "select", value: "어려움", options: ["가능", "어려움", "불가능"] },
  ]},
];

// --- Beer's Criteria Alerts ---
const BEERS_ALERTS = [
  { layer: 1, color: C.danger, label: "PIM", drug: "클로르페니라민 4mg", reason: "강한 항콜린 작용 → 인지기능 저하, 변비, 요저류 위험", action: "세티리진 10mg으로 전환 권고" },
  { layer: 2, color: C.warning, label: "약물-질병", drug: "로라제팜 0.5mg + 낙상 고위험", reason: "벤조디아제핀 → 낙상 위험 2배 증가", action: "비약물 수면위생 + 점진적 감량" },
  { layer: 3, color: "#EAB308", label: "용량/신기능", drug: "글리메피리드 2mg + eGFR 38", reason: "장기작용 SU + 신기능 저하 → 지연성 저혈당", action: "1mg 감량 또는 단기작용 약물 전환" },
];

// --- Typing Animation Hook ---
function useTypingAnimation(text, speed = 20, trigger = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!trigger) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [trigger, text, speed]);
  return { displayed, done };
}

// ============================================================
// COMPONENTS
// ============================================================

// --- Status Bar ---
function StatusBar() {
  return (
    <div style={{ height: 44, background: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", color: C.white, fontSize: 12 }}>
      <span style={{ fontWeight: 600 }}>9:41</span>
      <span style={{ fontSize: 10, opacity: 0.8 }}>HomeCare AI</span>
      <span>🔋 85%</span>
    </div>
  );
}

// --- Bottom Nav ---
function BottomNav({ screen, onNav }) {
  const items = [
    { key: "home", icon: "🏠", label: "홈" },
    { key: "questionnaire", icon: "📋", label: "문진" },
    { key: "records", icon: "📄", label: "기록" },
    { key: "settings", icon: "⚙️", label: "설정" },
  ];
  return (
    <div style={{ height: 56, background: C.white, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
      {items.map(it => (
        <button key={it.key} onClick={() => onNav(it.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: screen === it.key ? C.primary : C.textLight, fontSize: 18 }}>
          <span>{it.icon}</span>
          <span style={{ fontSize: 10, fontWeight: screen === it.key ? 700 : 400 }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// --- Stage Indicator ---
function StageIndicator({ stage }) {
  const stages = [
    { n: 1, label: "방문 전", color: C.primaryDark },
    { n: 2, label: "방문 시", color: C.primary },
    { n: 3, label: "방문 후", color: C.accent },
  ];
  return (
    <div style={{ display: "flex", padding: "8px 16px", gap: 4, background: C.white, borderBottom: `1px solid ${C.border}` }}>
      {stages.map(s => (
        <div key={s.n} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 20, background: stage === s.n ? s.color : "#F1F5F9", color: stage === s.n ? C.white : C.textLight, fontSize: 11, fontWeight: stage === s.n ? 700 : 400, transition: "all 0.3s" }}>
          Stage {s.n}: {s.label}
        </div>
      ))}
    </div>
  );
}

// --- Scrollable Content Wrapper ---
function Content({ children }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.bg }}>
      {children}
    </div>
  );
}

// ============================================================
// SCREENS
// ============================================================

// --- 1. Home Screen ---
function HomeScreen({ onSelect }) {
  return (
    <Content>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.textDark, marginBottom: 4 }}>오늘의 방문 일정</div>
        <div style={{ fontSize: 13, color: C.textMed, marginBottom: 16 }}>2026년 3월 3일 (월) · 3명 예정</div>
        {PATIENTS.map(p => (
          <button key={p.id} onClick={() => onSelect(p)} style={{ display: "block", width: "100%", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10, cursor: "pointer", textAlign: "left", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.textDark }}>{p.name} ({p.gender}/{p.age}세)</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: C.tealBg, color: C.primary, fontWeight: 600 }}>{p.time}</span>
            </div>
            <div style={{ fontSize: 12, color: C.textMed, marginBottom: 4 }}>{p.address}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {p.diagnoses.slice(0, 3).map((d, i) => (
                <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#F1F5F9", color: C.textMed }}>{d}</span>
              ))}
              {p.medications.length >= 5 && (
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#FEF2F2", color: C.danger, fontWeight: 600 }}>💊 {p.medications.length}개 약물</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 6 }}>Frailty Index: {p.frailtyIndex}/{p.frailtyTotal} · 마지막 방문: {p.lastVisit}</div>
          </button>
        ))}
      </div>
    </Content>
  );
}

// --- 2. AI Briefing Screen ---
function BriefingScreen({ patient, onStart }) {
  const [generating, setGenerating] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const { displayed, done } = useTypingAnimation(AI_BRIEFING_TEXT, 8, showBriefing);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setShowBriefing(true); }, 2000);
  };

  return (
    <Content>
      <div style={{ padding: 16 }}>
        {/* Patient Profile Card */}
        <div style={{ background: C.primaryDark, borderRadius: 12, padding: 14, marginBottom: 12, color: C.white }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{patient.name}</span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{patient.gender}/{patient.age}세</span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {patient.diagnoses.map((d, i) => (
              <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.15)", color: "#A5F3FC" }}>{d}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>약물 {patient.medications.length}개 · Frailty {patient.frailtyIndex}/{patient.frailtyTotal} · K-MMSE {patient.prevKMMSE}/30</div>
        </div>

        {/* AI Generate Button */}
        {!showBriefing && !generating && (
          <button onClick={handleGenerate} style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ✨ AI 환자 브리핑 생성
          </button>
        )}

        {/* Loading */}
        {generating && (
          <div style={{ background: C.white, borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 8, animation: "spin 1s linear infinite" }}>🔄</div>
            <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>AI 분석 중...</div>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>EMR 데이터 기반 환자 상태를 분석하고 있습니다</div>
          </div>
        )}

        {/* AI Briefing Result */}
        {showBriefing && (
          <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.accent}`, boxShadow: `0 0 0 1px ${C.accent}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 14, padding: "2px 8px", borderRadius: 6, background: C.tealBg, color: C.primary, fontWeight: 700 }}>✨ AI 브리핑</span>
              {!done && <span style={{ fontSize: 10, color: C.textLight }}>생성 중...</span>}
              {done && <span style={{ fontSize: 10, color: C.success }}>✓ 완료</span>}
            </div>
            <pre style={{ fontSize: 11, lineHeight: 1.6, color: C.textDark, whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
              {displayed}{!done && <span style={{ animation: "blink 1s infinite" }}>▌</span>}
            </pre>
          </div>
        )}

        {/* Observation Recommendations */}
        {done && (
          <>
            <div style={{ background: C.warningBg, borderRadius: 10, padding: 12, marginBottom: 12, border: "1px solid #FDE68A" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>🔍 AI 권장 관찰항목</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["신기능 재확인", "혈당 추이 확인", "약물 부작용 모니터링", "낙상 위험 평가"].map((item, i) => (
                  <span key={i} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: C.white, color: "#92400E", fontWeight: 500 }}>{item}</span>
                ))}
              </div>
            </div>

            <div style={{ background: C.white, borderRadius: 10, padding: 12, marginBottom: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>📦 방문 준비 리스트</div>
              {[
                { cat: "필수 장비", items: "혈압계, 혈당측정기, 체온계, SpO2" },
                { cat: "약물/주사", items: "인슐린 교육 키트, 처방전 사본" },
                { cat: "서류", items: "정형외과 의뢰서, 수면위생 교육자료" },
              ].map((g, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.primary }}>{g.cat}</div>
                  <div style={{ fontSize: 11, color: C.textMed }}>{g.items}</div>
                </div>
              ))}
            </div>

            <button onClick={onStart} style={{ width: "100%", padding: 14, background: C.primary, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              방문 시작 →
            </button>
          </>
        )}
      </div>
    </Content>
  );
}

// --- 3. CGA-FI Questionnaire Screen ---
function QuestionnaireScreen({ patient, onNext }) {
  const [domainIdx, setDomainIdx] = useState(0);
  const domain = CGA_DOMAINS[domainIdx];

  return (
    <Content>
      <div style={{ padding: 16 }}>
        {/* Previous Frailty Index */}
        <div style={{ background: C.white, borderRadius: 10, padding: 10, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontSize: 11, color: C.textLight }}>이전 Frailty Index</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>{patient.frailtyIndex}<span style={{ fontSize: 12, fontWeight: 400, color: C.textMed }}>/{patient.frailtyTotal}</span></div>
          </div>
          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: C.warningBg, color: "#92400E", fontWeight: 600 }}>경도 노쇠</span>
        </div>

        {/* Domain Progress */}
        <div style={{ display: "flex", gap: 3, marginBottom: 12, overflowX: "auto" }}>
          {CGA_DOMAINS.map((d, i) => (
            <button key={d.id} onClick={() => setDomainIdx(i)} style={{ flex: "0 0 auto", padding: "6px 8px", borderRadius: 8, border: domainIdx === i ? `2px solid ${C.primary}` : `1px solid ${C.border}`, background: i < domainIdx ? C.successBg : domainIdx === i ? C.tealBg : C.white, cursor: "pointer", fontSize: 10, fontWeight: domainIdx === i ? 700 : 400, color: domainIdx === i ? C.primary : C.textMed, minWidth: 42, textAlign: "center" }}>
              <div>{d.icon}</div>
              <div>{d.name}</div>
            </button>
          ))}
        </div>

        {/* Current Domain Card */}
        <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark, marginBottom: 4 }}>
            {domain.icon} #{domain.id}: {domain.name} 평가
          </div>
          <div style={{ fontSize: 11, color: C.textLight, marginBottom: 12 }}>배점: {domain.points}점</div>

          {domain.questions.map((q, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < domain.questions.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 12, color: C.textDark, marginBottom: 6 }}>{q.q}</div>
              {q.type === "toggle" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: q.value ? C.primary : "#F1F5F9", color: q.value ? C.white : C.textLight, cursor: "pointer" }}>예</span>
                  <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: !q.value ? C.primary : "#F1F5F9", color: !q.value ? C.white : C.textLight, cursor: "pointer" }}>아니오</span>
                </div>
              )}
              {q.type === "number" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" defaultValue={q.value} style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: q.value >= 5 ? C.danger : C.textDark }} readOnly />
                  {q.value >= 5 && <span style={{ fontSize: 10, color: C.danger, fontWeight: 600 }}>⚠️ 5개 이상 → Beer's 분석 실행</span>}
                </div>
              )}
              {q.type === "select" && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {q.options.map((opt, oi) => (
                    <span key={oi} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: q.value === opt ? C.primary : "#F1F5F9", color: q.value === opt ? C.white : C.textLight, cursor: "pointer" }}>{opt}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Beer's Criteria Alert (always show on domain 3) */}
        {domainIdx === 2 && (
          <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #FECACA" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.danger, marginBottom: 10 }}>⚠️ Beer's Criteria 약물 경고</div>
            {BEERS_ALERTS.map((a, i) => (
              <div key={i} style={{ background: C.white, borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: `4px solid ${a.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: a.color, color: C.white, fontWeight: 700 }}>Layer {a.layer}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: a.color }}>{a.label}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textDark }}>{a.drug}</div>
                <div style={{ fontSize: 10, color: C.textMed, marginTop: 2 }}>{a.reason}</div>
                <div style={{ fontSize: 10, color: C.primary, fontWeight: 600, marginTop: 4 }}>→ {a.action}</div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 8 }}>
          {domainIdx > 0 && (
            <button onClick={() => setDomainIdx(domainIdx - 1)} style={{ flex: 1, padding: 12, background: C.white, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ← 이전 영역
            </button>
          )}
          {domainIdx < CGA_DOMAINS.length - 1 ? (
            <button onClick={() => setDomainIdx(domainIdx + 1)} style={{ flex: 1, padding: 12, background: C.primary, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              다음 영역 →
            </button>
          ) : (
            <button onClick={onNext} style={{ flex: 1, padding: 12, background: C.success, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✓ 문진 완료 → 활력징후
            </button>
          )}
        </div>
      </div>
    </Content>
  );
}

// --- 4. Vitals Screen ---
function VitalsScreen({ patient, onNext }) {
  const vitals = [
    { label: "수축기 혈압", unit: "mmHg", value: 152, prev: patient.prevVitals.sbp, high: 140 },
    { label: "이완기 혈압", unit: "mmHg", value: 90, prev: patient.prevVitals.dbp, high: 90 },
    { label: "맥박", unit: "bpm", value: 80, prev: patient.prevVitals.hr, high: 100 },
    { label: "체온", unit: "°C", value: 36.5, prev: patient.prevVitals.temp, high: 37.5 },
    { label: "혈당 (식후2h)", unit: "mg/dL", value: 228, prev: patient.prevVitals.glucose, high: 180 },
    { label: "SpO2", unit: "%", value: 96, prev: patient.prevVitals.spo2, low: 95 },
  ];

  return (
    <Content>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.textDark, marginBottom: 12 }}>활력징후 측정</div>

        {vitals.map((v, i) => {
          const isHigh = v.high && v.value >= v.high;
          const isLow = v.low && v.value < v.low;
          const abnormal = isHigh || isLow;
          return (
            <div key={i} style={{ background: C.white, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${abnormal ? C.danger + "44" : C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: C.textMed }}>{v.label}</div>
                <div style={{ fontSize: 10, color: C.textLight }}>이전: {v.prev} {v.unit}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: abnormal ? C.danger : C.textDark }}>{v.value}</span>
                <span style={{ fontSize: 11, color: C.textMed }}> {v.unit}</span>
                {abnormal && <div style={{ fontSize: 10, color: C.danger, fontWeight: 600 }}>⚠️ 비정상</div>}
              </div>
            </div>
          );
        })}

        <button style={{ width: "100%", padding: 10, background: "#F1F5F9", color: C.textMed, border: `1px dashed ${C.border}`, borderRadius: 10, fontSize: 12, cursor: "pointer", marginBottom: 12 }}>
          📶 BLE 기기 자동연동 (시뮬레이션)
        </button>

        <button onClick={onNext} style={{ width: "100%", padding: 14, background: C.primary, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          다음 → 인지/우울 평가
        </button>
      </div>
    </Content>
  );
}

// --- 5. K-MMSE / PHQ-9 Results ---
function CognitiveScreen({ patient, onNext }) {
  const kmmse = 22;
  const phq9 = 10;

  return (
    <Content>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.textDark, marginBottom: 12 }}>인지·정신건강 AI 평가</div>

        {/* K-MMSE */}
        <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>🧠 K-MMSE (인지기능)</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: C.warningBg, color: "#92400E", fontWeight: 600 }}>경도인지장애 의심</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: C.warning }}>{kmmse}</span>
            <span style={{ fontSize: 14, color: C.textMed }}>/30점</span>
          </div>
          <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ width: `${(kmmse / 30) * 100}%`, height: "100%", background: C.warning, borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: C.danger, fontWeight: 600 }}>이전 {patient.prevKMMSE}/30 → 현재 {kmmse}/30 (3점 하락 ↓)</div>
          <div style={{ fontSize: 10, color: C.textMed, marginTop: 4 }}>
            시간지남력 4/5 · 장소지남력 4/5 · 기억등록 3/3 · 주의집중 3/5 · 기억회상 1/3 · 언어기능 7/9
          </div>
        </div>

        {/* PHQ-9 */}
        <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>😔 PHQ-9 (우울)</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#FEF2F2", color: C.danger, fontWeight: 600 }}>중등도 우울</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: C.warning }}>{phq9}</span>
            <span style={{ fontSize: 14, color: C.textMed }}>/27점</span>
          </div>
          <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ width: `${(phq9 / 27) * 100}%`, height: "100%", background: C.warning, borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: C.danger, fontWeight: 600 }}>이전 {patient.prevPHQ9}/27 → 현재 {phq9}/27 (2점 상승 ↑)</div>
        </div>

        {/* NLP Sentiment */}
        <div style={{ background: "#F5F3FF", borderRadius: 10, padding: 12, marginBottom: 12, border: "1px solid #DDD6FE" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5B21B6", marginBottom: 6 }}>🔬 NLP 감성 분석 결과</div>
          <div style={{ fontSize: 11, color: "#6D28D9" }}>
            부정 표현 빈도: 38% (이전 25%) ↑<br />
            무기력/무관심 키워드: 5회 감지<br />
            PHQ-9 점수와 NLP 결과 일치 → 신뢰도 높음
          </div>
        </div>

        {/* Recommendation */}
        <div style={{ background: C.warningBg, borderRadius: 10, padding: 12, marginBottom: 12, border: "1px solid #FDE68A" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>💡 AI 종합 권고</div>
          <div style={{ fontSize: 11, color: "#78350F" }}>
            • K-MMSE 3점 하락 → 신경과 정밀 평가 의뢰 권고<br />
            • PHQ-9 중등도 우울 → 정신건강의학과 협진 검토<br />
            • 항콜린 약물(클로르페니라민) 인지기능 영향 가능성
          </div>
        </div>

        <button onClick={onNext} style={{ width: "100%", padding: 14, background: C.accent, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          방문 완료 → SOAP 생성
        </button>
      </div>
    </Content>
  );
}

// --- 6. SOAP Note Generation Screen ---
function SoapScreen({ onNext }) {
  const [generating, setGenerating] = useState(false);
  const [showSoap, setShowSoap] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const sections = ["S", "O", "A", "P"];
  const sectionLabels = { S: "Subjective (주관적)", O: "Objective (객관적)", A: "Assessment (평가)", P: "Plan (계획)" };
  const sectionColors = { S: "#3B82F6", O: "#10B981", A: "#F59E0B", P: "#8B5CF6" };

  const { displayed: sText, done: sDone } = useTypingAnimation(SOAP_TEXT.S, 6, showSoap && currentSection >= 0);
  const { displayed: oText, done: oDone } = useTypingAnimation(SOAP_TEXT.O, 6, showSoap && currentSection >= 1);
  const { displayed: aText, done: aDone } = useTypingAnimation(SOAP_TEXT.A, 6, showSoap && currentSection >= 2);
  const { displayed: pText, done: pDone } = useTypingAnimation(SOAP_TEXT.P, 6, showSoap && currentSection >= 3);
  const texts = [sText, oText, aText, pText];
  const dones = [sDone, oDone, aDone, pDone];

  useEffect(() => {
    if (showSoap && currentSection < 3) {
      if (dones[currentSection]) {
        const timer = setTimeout(() => setCurrentSection(currentSection + 1), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [showSoap, currentSection, dones]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setShowSoap(true); setCurrentSection(0); }, 2500);
  };

  const allDone = dones[3];

  return (
    <Content>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.textDark, marginBottom: 12 }}>SOAP 진료기록 AI 자동생성</div>

        {!showSoap && !generating && (
          <button onClick={handleGenerate} style={{ width: "100%", padding: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.primary})`, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ✨ AI SOAP 노트 생성
          </button>
        )}

        {generating && (
          <div style={{ background: C.white, borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
            <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>AI SOAP 노트 생성 중...</div>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>문진 + CGA-FI + 활력징후 + 인지분석 데이터를 종합하고 있습니다</div>
            <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
              <div style={{ width: "60%", height: "100%", background: C.primary, borderRadius: 2, animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        )}

        {showSoap && sections.map((sec, i) => {
          if (i > currentSection && !dones[i]) return null;
          return (
            <div key={sec} style={{ background: C.white, borderRadius: 12, padding: 12, marginBottom: 10, borderLeft: `4px solid ${sectionColors[sec]}`, border: `1px solid ${C.border}`, borderLeftWidth: 4, borderLeftColor: sectionColors[sec] }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: sectionColors[sec] }}>{sectionLabels[sec]}</span>
                {dones[i] && <span style={{ fontSize: 9, color: C.textLight }}>✏️ 편집 가능</span>}
              </div>
              <pre style={{ fontSize: 10, lineHeight: 1.5, color: C.textDark, whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                {texts[i]}{i === currentSection && !dones[i] && <span style={{ animation: "blink 1s infinite" }}>▌</span>}
              </pre>
            </div>
          );
        })}

        {allDone && (
          <>
            <div style={{ background: C.tealBg, borderRadius: 10, padding: 10, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.primaryDark }}>📌 ICD-10: E11.9 (2형당뇨), I10 (고혈압), N18.3 (CKD 3기), M17.1 (골관절염)</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: 12, background: C.white, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ✏️ 수정
              </button>
              <button onClick={onNext} style={{ flex: 1, padding: 12, background: C.success, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✓ 승인
              </button>
            </div>
          </>
        )}
      </div>
    </Content>
  );
}

// --- 7. Visit Summary Screen ---
function SummaryScreen({ patient, onHome }) {
  const frailtyData = patient.frailtyHistory;

  return (
    <Content>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.textDark, marginBottom: 12 }}>방문 완료 요약</div>

        {/* Success Banner */}
        <div style={{ background: C.successBg, borderRadius: 10, padding: 14, marginBottom: 12, textAlign: "center", border: "1px solid #A7F3D0" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#065F46" }}>진료기록이 저장되었습니다</div>
          <div style={{ fontSize: 11, color: "#047857" }}>SOAP 노트 승인 완료 · EMR 전송 대기</div>
        </div>

        {/* Frailty Trend */}
        <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark, marginBottom: 10 }}>📊 Frailty Index 추이 (최근 5회)</div>
          <div style={{ display: "flex", alignItems: "end", gap: 8, height: 100, padding: "0 8px" }}>
            {frailtyData.map((val, i) => {
              const h = (val / 50) * 90;
              const isLast = i === frailtyData.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: isLast ? C.danger : C.textMed }}>{val}</span>
                  <div style={{ width: "100%", height: h, background: isLast ? C.danger : C.primary, borderRadius: 4, opacity: isLast ? 1 : 0.4 + i * 0.15 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 8px" }}>
            {["1회전", "2회전", "3회전", "4회전", "금일"].map((l, i) => (
              <span key={i} style={{ fontSize: 9, color: C.textLight, flex: 1, textAlign: "center" }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.danger, fontWeight: 600, marginTop: 8 }}>⚠️ 금일 21점 (이전 18점 대비 3점 상승)</div>
        </div>

        {/* AI Visit Interval */}
        <div style={{ background: C.warningBg, borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #FDE68A" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>🤖 AI 방문주기 권고</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#DC2626" }}>1주</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>방문주기 단축 권고</div>
              <div style={{ fontSize: 10, color: "#78350F" }}>
                Frailty Index 3점 상승 + 혈당 조절 실패 + 인지기능 하락
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#92400E", marginTop: 8 }}>다음 방문 권장일: 2026.03.10 (월)</div>
        </div>

        {/* Alert Status */}
        <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>🚨 긴급 알림 상태</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: C.warning }} />
              <span style={{ fontSize: 11, color: C.textMed }}>Frailty Index 3점 상승 — 48시간 내 추가 모니터링</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: C.warning }} />
              <span style={{ fontSize: 11, color: C.textMed }}>K-MMSE 3점 하락 — 신경과 협진 의뢰</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: C.danger }} />
              <span style={{ fontSize: 11, color: C.textMed }}>Beer's Layer 1 — 클로르페니라민 즉시 전환 필요</span>
            </div>
          </div>
        </div>

        {/* Report Buttons */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["전문의 의뢰서", "기관 리포트", "보호자 알림"].map((label, i) => (
            <button key={i} style={{ flex: 1, padding: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, fontWeight: 600, color: C.primary, cursor: "pointer" }}>
              📤 {label}
            </button>
          ))}
        </div>

        <button onClick={onHome} style={{ width: "100%", padding: 14, background: C.primaryDark, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          🏠 홈으로 돌아가기
        </button>
      </div>
    </Content>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function HomeCareAI() {
  const [screen, setScreen] = useState("home");
  const [patient, setPatient] = useState(PATIENTS[0]);
  const [stage, setStage] = useState(0);

  const navigate = (s, stg) => { setScreen(s); if (stg !== undefined) setStage(stg); };

  const handleNavBar = (key) => {
    if (key === "home") navigate("home", 0);
    if (key === "questionnaire" && patient) navigate("questionnaire", 2);
    if (key === "records") navigate("soap", 3);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#E2E8F0", padding: 16 }}>
      <div style={{ width: 390, height: 844, background: C.bg, borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", position: "relative", border: "8px solid #1E293B" }}>
        <StatusBar />
        {stage > 0 && <StageIndicator stage={stage} />}

        {screen === "home" && (
          <HomeScreen onSelect={(p) => { setPatient(p); navigate("briefing", 1); }} />
        )}
        {screen === "briefing" && (
          <BriefingScreen patient={patient} onStart={() => navigate("questionnaire", 2)} />
        )}
        {screen === "questionnaire" && (
          <QuestionnaireScreen patient={patient} onNext={() => navigate("vitals", 2)} />
        )}
        {screen === "vitals" && (
          <VitalsScreen patient={patient} onNext={() => navigate("cognitive", 2)} />
        )}
        {screen === "cognitive" && (
          <CognitiveScreen patient={patient} onNext={() => navigate("soap", 3)} />
        )}
        {screen === "soap" && (
          <SoapScreen onNext={() => navigate("summary", 3)} />
        )}
        {screen === "summary" && (
          <SummaryScreen patient={patient} onHome={() => navigate("home", 0)} />
        )}

        <BottomNav screen={screen === "home" ? "home" : screen === "questionnaire" || screen === "vitals" || screen === "cognitive" ? "questionnaire" : screen === "soap" || screen === "summary" ? "records" : "home"} onNav={handleNavBar} />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { width: 20%; } 50% { width: 80%; } 100% { width: 20%; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      `}</style>
    </div>
  );
}
