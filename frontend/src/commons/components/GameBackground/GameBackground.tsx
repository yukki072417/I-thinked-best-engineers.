import { useEffect, useState } from "react";
import PortraitLock from "@/commons/components/PortraitLock/";
import "./GameBackground.css";

const GameBackground = ({ children }: { children: React.ReactNode }) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < window.innerHeight);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100dvw",
          height: "100dvh",
          background: "#04081a",
          overflow: "hidden",
        }}
      >
        {/* <MatrixBackground /> */}

        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(80,160,255,0.07) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(rgba(80,180,255,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
          }}
        />

        {isPortrait && <PortraitLock />}

        <div className="background">{children}</div>
      </div>
    </>
  );
};

export default GameBackground;
