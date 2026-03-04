import { useState } from "react";
import HomeCarePrototype from "./HomeCarePrototype";
import HomeCareLive from "./HomeCareLive";

const tabs = [
  { id: "prototype", label: "UI 프로토타입", desc: "7화면 전체 플로우" },
  { id: "live", label: "AI 라이브 데모", desc: "GPT-5.2 API 실시간 연동" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("prototype");

  return (
    <div style={{ minHeight: "100vh", background: "#F0FDFA" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0891B2, #065666)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h1 style={{ margin: 0, color: "#fff", fontSize: "20px", fontWeight: 700 }}>
            HomeCare AI — TRL 6 Prototype
          </h1>
          <p style={{ margin: "4px 0 0", color: "#CCFBF1", fontSize: "13px" }}>
            AI 기반 방문진료 전주기 통합지원 시스템
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                background: activeTab === t.id ? "#fff" : "rgba(255,255,255,0.15)",
                color: activeTab === t.id ? "#0891B2" : "#fff",
                transition: "all 0.2s",
              }}
            >
              {t.label}
              <span style={{
                display: "block",
                fontSize: "10px",
                fontWeight: 400,
                opacity: 0.8,
                marginTop: "2px",
              }}>
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "prototype" ? <HomeCarePrototype /> : <HomeCareLive />}

      {/* Footer */}
      <div style={{
        textAlign: "center",
        padding: "16px",
        color: "#94A3B8",
        fontSize: "12px",
        borderTop: "1px solid #E2E8F0",
      }}>
        2026 바이오·의료 기술사업화 지원사업 — C51 · 업티어 · 고려대 안암병원
      </div>
    </div>
  );
}
