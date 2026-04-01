import "./PortraitLock.css";

const PortraitLock = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#04081a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
    }}
  >
    <div style={{ animation: "rotateHint 2s ease-in-out infinite" }}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect
          x="18"
          y="8"
          width="36"
          height="56"
          rx="6"
          stroke="rgba(80,180,255,0.6)"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="36" cy="55" r="3" fill="rgba(80,180,255,0.5)" />
        <path
          d="M52 28 Q64 28 64 40 Q64 52 52 52"
          stroke="rgba(80,180,255,0.4)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 3"
        />
        <path
          d="M58 46 L64 52 L58 58"
          stroke="rgba(80,180,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 15,
          color: "rgba(80,180,255,0.9)",
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        ROTATE DEVICE
      </p>
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 12,
          color: "rgba(80,180,255,0.4)",
          letterSpacing: 1,
        }}
      >
        横画面でプレイしてください
      </p>
    </div>
  </div>
);
export default PortraitLock;
