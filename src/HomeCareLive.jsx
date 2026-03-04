import { useState, useEffect, useRef } from "react";

// ============================================================
// HomeCare AI — Live Demo (Claude API 연동)
// 실제 AI가 동작하는 간소화 버전
// ============================================================

const C = {
  primary: "#0891B2", primaryDark: "#065666", accent: "#06B6D4",
  danger: "#EF4444", warning: "#F59E0B", warningBg: "#FEF3C7",
  success: "#10B981", successBg: "#D1FAE5",
  bg: "#F0FDFA", white: "#FFFFFF",
  textDark: "#1E293B", textMed: "#475569", textLight: "#94A3B8",
  border: "#E2E8F0", tealBg: "#CCFBF1",
};

// --- Demo Patient ---
const PATIENT = {
  name: "김영수", age: 78, gender: "남",
  diagnoses: ["제2형 당뇨", "고혈압", "만성신장질환 3기", "골관절염"],
  medications: [
    "메트포르민 500mg 1일2회", "글리메피리드 2mg 1일1회",
    "암로디핀 5mg 1일1회", "로사르탄 50mg 1일1회",
    "아스피린 100mg 1일1회", "로라제팜 0.5mg 취침전",
    "클로르페니라민 4mg 필요시", "이부프로펜 400mg 필요시",
  ],
  labs: "HbA1c 8.2%, eGFR 38, 크레아티닌 1.8, 혈색소 11.2",
  frailtyIndex: "18/50 (경도 노쇠)",
  kmmse: "25/30", phq9: "8/27",
  lastVisit: "2026-02-18",
  lastIssues: "혈당 조절 불량 지속, 야간 수면장애, 좌측 무릎 부종 악화",
  vitals: "BP 152/90, HR 80, BT 36.5, SpO2 96%, 혈당(식후) 228, 체중 67.8kg",
  todayCGAFI: "21/50 (3점 상승)", todayKMMSE: "22/30 (3점 하락)", todayPHQ9: "10/27 (2점 상승)",
};

// --- Claude API Call ---
async function callClaude(apiKey, systemPrompt, userMessage, onChunk) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API 오류 (${res.status}): ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            full += parsed.delta.text;
            onChunk(full);
          }
        } catch {}
      }
    }
  }
  return full;
}

// --- System Prompts ---
const BRIEFING_SYSTEM = `당신은 재택의료 전문 AI 임상 보조 시스템입니다.
환자 정보를 분석하여 방문 전 브리핑을 생성합니다.

출력 형식 (반드시 이 구조를 따르세요):

■ 기본 정보
(환자 인적사항, ADL 수준 요약)

■ 질환 경과
(각 진단별 현재 상태, 추세 분석)

■ 현재 투약 분석
(Beer's Criteria 기준 약물 위험도 평가. 🔴 PIM, 🟠 약물-질병 상호작용, 🟡 용량/신기능 주의)

■ 최근 검사 결과
(주요 수치와 임상적 의미)

■ 이전 방문 이슈
(미해결 사안, 추적 필요 항목)

■ ⚠️ 금일 주의사항
(오늘 방문 시 반드시 확인할 사항 3-5개)

한국어로 작성하고, 임상적으로 정확하고 실용적인 정보를 제공하세요.`;

const SOAP_SYSTEM = `당신은 재택의료 전문 AI 진료기록 생성 시스템입니다.
환자의 방문 데이터를 기반으로 SOAP 노트를 자동 생성합니다.

출력 형식 (반드시 이 구조를 따르세요):

[S — Subjective]
(환자 주호소, 증상 호소, 자가 보고 내용)

[O — Objective]
(활력징후, 신체검사 소견, CGA-FI 점수, K-MMSE, PHQ-9, 검사 수치)

[A — Assessment]
(임상 평가: 각 질환별 현재 상태 분석, Beer's Criteria 약물 경고 포함)

[P — Plan]
(치료 계획: 약물 조정, 검사 의뢰, 비약물 중재, 다음 방문 일정)

한국어로 작성하고, ICD-10 코드를 각 진단에 포함하세요.
임상적으로 정확하고 실제 진료기록으로 사용 가능한 수준으로 작성하세요.`;

// ============================================================
// COMPONENTS
// ============================================================

// --- Simple Markdown Renderer ---
function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 11.5, lineHeight: 1.7, color: C.textDark }}>
      {lines.map((line, i) => {
        // Headers: ## or ■
        if (/^#{1,3}\s/.test(line) || line.startsWith("■")) {
          const label = line.replace(/^#{1,3}\s*/, "");
          return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: C.primaryDark, marginTop: i > 0 ? 12 : 0, marginBottom: 4 }}>{label}</div>;
        }
        // Warning line
        if (line.startsWith("⚠️") || line.includes("⚠️")) {
          return <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "#92400E", background: C.warningBg, padding: "4px 8px", borderRadius: 6, marginTop: 6, marginBottom: 2 }}>{line}</div>;
        }
        // Beer's alerts (colored pills)
        if (line.startsWith("🔴")) {
          return <div key={i} style={{ fontSize: 11, color: C.danger, fontWeight: 600, padding: "2px 0" }}>{renderInline(line)}</div>;
        }
        if (line.startsWith("🟠")) {
          return <div key={i} style={{ fontSize: 11, color: "#D97706", fontWeight: 600, padding: "2px 0" }}>{renderInline(line)}</div>;
        }
        if (line.startsWith("🟡")) {
          return <div key={i} style={{ fontSize: 11, color: "#CA8A04", fontWeight: 600, padding: "2px 0" }}>{renderInline(line)}</div>;
        }
        // Bullet points
        if (/^\s*[-•]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
          return <div key={i} style={{ paddingLeft: 8, padding: "1px 0 1px 8px" }}>{renderInline(line)}</div>;
        }
        // Empty line
        if (line.trim() === "") {
          return <div key={i} style={{ height: 6 }} />;
        }
        // Normal line
        return <div key={i} style={{ padding: "1px 0" }}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text) {
  // Bold: **text** or __text__
  const parts = text.split(/(\*\*[^*]+?\*\*|__[^_]+?__)/g);
  return parts.map((part, i) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={i} style={{ fontWeight: 700, color: C.textDark }}>{part.slice(2, -2)}</strong>;
    }
    // Also handle single *text* as bold (Claude often uses this)
    const subParts = part.split(/(\*[^*]+?\*)/g);
    if (subParts.length > 1) {
      return subParts.map((sp, j) => {
        if (sp.startsWith("*") && sp.endsWith("*") && sp.length > 2) {
          return <strong key={`${i}-${j}`} style={{ fontWeight: 600 }}>{sp.slice(1, -1)}</strong>;
        }
        return <span key={`${i}-${j}`}>{sp}</span>;
      });
    }
    return <span key={i}>{part}</span>;
  });
}

// --- SOAP Section Markdown Renderer ---
function SoapMarkdown({ text }) {
  if (!text) return null;
  const sectionColors = {
    "S": "#3B82F6", "O": "#10B981", "A": "#F59E0B", "P": "#8B5CF6"
  };
  const sectionLabels = {
    "S": "Subjective (주관적)", "O": "Objective (객관적)",
    "A": "Assessment (평가)", "P": "Plan (계획)"
  };

  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 11.5, lineHeight: 1.7, color: C.textDark }}>
      {lines.map((line, i) => {
        // SOAP section headers
        for (const [key, color] of Object.entries(sectionColors)) {
          if (line.includes(`[${key} —`) || line.includes(`[${key}]`) || (line.startsWith(`## ${key}`) && line.includes("—"))) {
            return (
              <div key={i} style={{ fontSize: 13, fontWeight: 700, color, marginTop: i > 0 ? 14 : 0, marginBottom: 4, padding: "4px 8px", background: color + "12", borderRadius: 6, borderLeft: `3px solid ${color}` }}>
                {line.replace(/[\[\]#]/g, "").trim()}
              </div>
            );
          }
        }
        // Beer's / emoji alerts
        if (line.startsWith("🔴")) return <div key={i} style={{ fontSize: 11, color: C.danger, fontWeight: 600, padding: "2px 0" }}>{renderInline(line)}</div>;
        if (line.startsWith("🟠")) return <div key={i} style={{ fontSize: 11, color: "#D97706", fontWeight: 600, padding: "2px 0" }}>{renderInline(line)}</div>;
        if (line.startsWith("🟡")) return <div key={i} style={{ fontSize: 11, color: "#CA8A04", fontWeight: 600, padding: "2px 0" }}>{renderInline(line)}</div>;
        // Numbered items (e.g., "1. 제2형 당뇨:")
        if (/^\d+\.\s/.test(line.trim())) return <div key={i} style={{ fontWeight: 600, marginTop: 4, padding: "1px 0" }}>{renderInline(line)}</div>;
        // Bullets
        if (/^\s*[-•→]\s/.test(line)) return <div key={i} style={{ paddingLeft: 10, padding: "1px 0 1px 10px" }}>{renderInline(line)}</div>;
        // Empty
        if (line.trim() === "") return <div key={i} style={{ height: 4 }} />;
        // Default
        return <div key={i} style={{ padding: "1px 0" }}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ height: 44, background: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", color: C.white, fontSize: 12 }}>
      <span style={{ fontWeight: 600 }}>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: C.success }} />
        <span style={{ fontSize: 10 }}>HomeCare AI Live</span>
      </div>
      <span>🔋</span>
    </div>
  );
}

// --- API Key Screen ---
function ApiKeyScreen({ onSubmit }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!key.startsWith("sk-ant-")) {
      setError("올바른 Claude API 키를 입력해주세요 (sk-ant-로 시작)");
      return;
    }
    onSubmit(key);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.primaryDark }}>HomeCare AI</div>
        <div style={{ fontSize: 13, color: C.textMed, marginTop: 4 }}>Live Demo — Claude API 연동</div>
      </div>

      <div style={{ background: C.white, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textDark, marginBottom: 8 }}>Claude API Key</div>
        <input
          type="password"
          value={key}
          onChange={e => { setKey(e.target.value); setError(""); }}
          placeholder="sk-ant-api03-..."
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${error ? C.danger : C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
        {error && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{error}</div>}
      </div>

      <button onClick={handleSubmit} style={{ width: "100%", padding: 14, background: C.primary, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        시작하기
      </button>

      <div style={{ fontSize: 10, color: C.textLight, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
        API 키는 브라우저에서 직접 Anthropic 서버로 전송되며<br />
        별도로 저장되지 않습니다
      </div>
    </div>
  );
}

// --- Home Screen ---
function HomeScreen({ onSelect }) {
  const p = PATIENT;
  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.bg, padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.textDark, marginBottom: 4 }}>오늘의 방문</div>
      <div style={{ fontSize: 12, color: C.textMed, marginBottom: 16 }}>2026.03.03 (월) · AI 브리핑 준비 완료</div>

      <button onClick={onSelect} style={{ display: "block", width: "100%", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, cursor: "pointer", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.textDark }}>{p.name} ({p.gender}/{p.age}세)</span>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: C.tealBg, color: C.primary, fontWeight: 600 }}>09:00</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {p.diagnoses.map((d, i) => (
            <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "#F1F5F9", color: C.textMed }}>{d}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 11, color: C.textLight }}>
          <span>💊 {p.medications.length}개 약물</span>
          <span>📊 Frailty {p.frailtyIndex}</span>
          <span>🧠 K-MMSE {p.kmmse}</span>
        </div>
        <div style={{ marginTop: 10, padding: "8px 0", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>AI 브리핑 보기 →</span>
        </div>
      </button>
    </div>
  );
}

// --- AI Briefing Screen (Real API) ---
function BriefingScreen({ apiKey, onNext }) {
  const [status, setStatus] = useState("idle"); // idle, loading, streaming, done, error
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const handleGenerate = async () => {
    setStatus("loading");
    setResult("");
    setError("");

    const p = PATIENT;
    const userMsg = `다음 환자의 방문 전 브리핑을 생성해주세요.

환자: ${p.name} (${p.gender}/${p.age}세)
진단: ${p.diagnoses.join(", ")}
현재 약물: ${p.medications.join(" / ")}
최근 검사: ${p.labs}
Frailty Index: ${p.frailtyIndex}
K-MMSE: ${p.kmmse}, PHQ-9: ${p.phq9}
마지막 방문: ${p.lastVisit}
이전 방문 이슈: ${p.lastIssues}`;

    try {
      setStatus("streaming");
      await callClaude(apiKey, BRIEFING_SYSTEM, userMsg, (text) => {
        setResult(text);
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: 0 }}>
      {/* Stage Indicator */}
      <div style={{ display: "flex", padding: "8px 16px", gap: 4, background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {[{ n: 1, l: "방문 전", active: true }, { n: 2, l: "방문 시" }, { n: 3, l: "방문 후" }].map(s => (
          <div key={s.n} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 20, background: s.active ? C.primaryDark : "#F1F5F9", color: s.active ? C.white : C.textLight, fontSize: 11, fontWeight: s.active ? 700 : 400 }}>
            Stage {s.n}: {s.l}
          </div>
        ))}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
        {/* Patient Card */}
        <div style={{ background: C.primaryDark, borderRadius: 12, padding: 14, marginBottom: 12, color: C.white }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{PATIENT.name} ({PATIENT.gender}/{PATIENT.age}세)</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
            {PATIENT.diagnoses.map((d, i) => (
              <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.15)", color: "#A5F3FC" }}>{d}</span>
            ))}
          </div>
          <div style={{ fontSize: 10, opacity: 0.7 }}>약물 {PATIENT.medications.length}개 · Frailty {PATIENT.frailtyIndex} · K-MMSE {PATIENT.kmmse}</div>
        </div>

        {/* Generate Button */}
        {status === "idle" && (
          <button onClick={handleGenerate} style={{ width: "100%", padding: 14, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ✨ AI 환자 브리핑 생성 (Claude API)
          </button>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div style={{ background: C.white, borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 8, display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</div>
            <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>Claude API 호출 중...</div>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>실제 AI가 환자 데이터를 분석하고 있습니다</div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #FECACA" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 4 }}>❌ API 호출 실패</div>
            <div style={{ fontSize: 11, color: C.textMed }}>{error}</div>
            <button onClick={handleGenerate} style={{ marginTop: 8, padding: "6px 12px", background: C.danger, color: C.white, border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
              다시 시도
            </button>
          </div>
        )}

        {/* Streaming Result */}
        {(status === "streaming" || status === "done") && (
          <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.accent}`, boxShadow: `0 0 0 1px ${C.accent}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: C.tealBg, color: C.primary, fontWeight: 700 }}>✨ AI 브리핑</span>
              {status === "streaming" && <span style={{ fontSize: 10, color: C.warning, fontWeight: 600 }}>● 실시간 생성 중</span>}
              {status === "done" && <span style={{ fontSize: 10, color: C.success, fontWeight: 600 }}>✓ 생성 완료</span>}
            </div>
            <MarkdownText text={result} />
            {status === "streaming" && <span style={{ animation: "blink 1s infinite", color: C.primary }}>▌</span>}
          </div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      {status === "done" && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
          <button onClick={onNext} style={{ width: "100%", padding: 14, background: C.primary, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            방문 완료 → SOAP 생성
          </button>
        </div>
      )}
    </div>
  );
}

// --- SOAP Generation Screen (Real API) ---
function SoapScreen({ apiKey, onDone }) {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const handleGenerate = async () => {
    setStatus("loading");
    setResult("");
    setError("");

    const p = PATIENT;
    const userMsg = `다음 환자의 금일 방문 데이터를 기반으로 SOAP 진료기록을 생성해주세요.

[환자 기본 정보]
${p.name} (${p.gender}/${p.age}세)
진단: ${p.diagnoses.join(", ")}
현재 약물 (${p.medications.length}개): ${p.medications.join(" / ")}

[금일 활력징후]
${p.vitals}

[CGA-FI 평가]
금일: ${p.todayCGAFI}
이전: ${p.frailtyIndex}

[인지/정신건강 평가]
K-MMSE: 금일 ${p.todayKMMSE}
PHQ-9: 금일 ${p.todayPHQ9}

[최근 검사]
${p.labs}

[이전 방문 이슈]
${p.lastIssues}

[환자 주호소]
"무릎이 더 아파서 걷기가 힘들어요"
야간 2-3회 각성, 수면제 효과 감소
공복 혈당 170-200대, 자가측정 불규칙
간헐적 어지러움 호소
"별로 할 것도 없고 그냥 그래요" (무기력감)`;

    try {
      setStatus("streaming");
      await callClaude(apiKey, SOAP_SYSTEM, userMsg, (text) => {
        setResult(text);
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  // (colorize removed — using SoapMarkdown instead)

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, minHeight: 0 }}>
      {/* Stage Indicator */}
      <div style={{ display: "flex", padding: "8px 16px", gap: 4, background: C.white, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {[{ n: 1, l: "방문 전" }, { n: 2, l: "방문 시" }, { n: 3, l: "방문 후", active: true }].map(s => (
          <div key={s.n} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 20, background: s.active ? C.accent : "#F1F5F9", color: s.active ? C.white : C.textLight, fontSize: 11, fontWeight: s.active ? 700 : 400 }}>
            Stage {s.n}: {s.l}
          </div>
        ))}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.textDark, marginBottom: 12 }}>SOAP 진료기록 AI 자동생성</div>

        {/* Visit Summary Card */}
        <div style={{ background: C.white, borderRadius: 10, padding: 12, marginBottom: 12, border: `1px solid ${C.border}`, fontSize: 11, color: C.textMed }}>
          <div style={{ fontWeight: 700, color: C.textDark, marginBottom: 4 }}>금일 방문 데이터 요약</div>
          <div>V/S: {PATIENT.vitals}</div>
          <div>CGA-FI: {PATIENT.todayCGAFI} | K-MMSE: {PATIENT.todayKMMSE} | PHQ-9: {PATIENT.todayPHQ9}</div>
        </div>

        {/* Generate Button */}
        {status === "idle" && (
          <button onClick={handleGenerate} style={{ width: "100%", padding: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.primary})`, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            ✨ AI SOAP 노트 생성 (Claude API)
          </button>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div style={{ background: C.white, borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 8, display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</div>
            <div style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>Claude API로 SOAP 노트 생성 중...</div>
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>문진·활력징후·CGA-FI·인지평가를 종합 분석합니다</div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #FECACA" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 4 }}>❌ API 호출 실패</div>
            <div style={{ fontSize: 11, color: C.textMed }}>{error}</div>
            <button onClick={handleGenerate} style={{ marginTop: 8, padding: "6px 12px", background: C.danger, color: C.white, border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>다시 시도</button>
          </div>
        )}

        {/* Streaming Result */}
        {(status === "streaming" || status === "done") && (
          <div style={{ background: C.white, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${C.accent}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: C.tealBg, color: C.primary, fontWeight: 700 }}>📝 SOAP 노트</span>
              {status === "streaming" && <span style={{ fontSize: 10, color: C.warning, fontWeight: 600 }}>● 실시간 생성 중</span>}
              {status === "done" && <span style={{ fontSize: 10, color: C.success, fontWeight: 600 }}>✓ 생성 완료</span>}
            </div>
            <SoapMarkdown text={result} />
            {status === "streaming" && <span style={{ animation: "blink 1s infinite", color: C.primary }}>▌</span>}
          </div>
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      {status === "done" && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.white, flexShrink: 0, display: "flex", gap: 8 }}>
          <button onClick={() => { setStatus("idle"); setResult(""); }} style={{ flex: 1, padding: 12, background: C.white, color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            🔄 재생성
          </button>
          <button onClick={onDone} style={{ flex: 1, padding: 12, background: C.success, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ✓ 승인 완료
          </button>
        </div>
      )}
    </div>
  );
}

// --- Complete Screen ---
function CompleteScreen({ onRestart }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 24, background: C.bg }}>
      <div style={{ background: C.successBg, borderRadius: 16, padding: 24, textAlign: "center", border: "1px solid #A7F3D0", width: "100%" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#065F46" }}>진료기록 저장 완료</div>
        <div style={{ fontSize: 13, color: "#047857", marginTop: 8 }}>
          AI 브리핑 생성 + SOAP 노트 자동생성<br />
          모두 실제 Claude API로 처리되었습니다
        </div>
      </div>

      <div style={{ background: C.white, borderRadius: 12, padding: 14, marginTop: 16, width: "100%", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>이 데모에서 확인한 것</div>
        <div style={{ fontSize: 11, color: C.textMed, lineHeight: 1.8 }}>
          ✅ Stage 1: 실제 LLM이 환자 EMR 데이터를 분석하여 브리핑 생성<br />
          ✅ Stage 3: 방문 데이터(활력징후, CGA-FI, K-MMSE, PHQ-9)를 종합하여 SOAP 자동 생성<br />
          ✅ Beer's Criteria 기반 약물 경고 포함<br />
          ✅ 스트리밍 방식으로 실시간 생성 확인
        </div>
      </div>

      <button onClick={onRestart} style={{ width: "100%", marginTop: 16, padding: 14, background: C.primaryDark, color: C.white, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        🏠 처음으로
      </button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function HomeCareAILive() {
  const [apiKey, setApiKey] = useState("");
  const [screen, setScreen] = useState("apikey");

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#E2E8F0", padding: 16 }}>
      <div style={{ width: 390, height: 844, background: C.bg, borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", border: "8px solid #1E293B" }}>
        <StatusBar />

        {screen === "apikey" && (
          <ApiKeyScreen onSubmit={(k) => { setApiKey(k); setScreen("home"); }} />
        )}
        {screen === "home" && (
          <HomeScreen onSelect={() => setScreen("briefing")} />
        )}
        {screen === "briefing" && (
          <BriefingScreen apiKey={apiKey} onNext={() => setScreen("soap")} />
        )}
        {screen === "soap" && (
          <SoapScreen apiKey={apiKey} onDone={() => setScreen("complete")} />
        )}
        {screen === "complete" && (
          <CompleteScreen onRestart={() => setScreen("home")} />
        )}
      </div>

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      `}</style>
    </div>
  );
}
