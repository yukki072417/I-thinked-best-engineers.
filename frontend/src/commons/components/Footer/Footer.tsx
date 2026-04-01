import "./style.css";
import { deckImg, profileImg, hackasonImg, scoutImg, baseImg } from "@/icons";
import ClickableButton from "@/commons/components/ClickableButton";
import { borderGradient } from "@/commons/styles/colors";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { icon: baseImg, label: "拠点", path: "/base" },
  { icon: profileImg, label: "プロフィール", path: "/profile" },
  { icon: scoutImg, label: "スカウト", path: "/scout" },
  { icon: deckImg, label: "デッキ", path: "/deck" },
  { icon: hackasonImg, label: "ハッカソン", path: "/hackathon" },
];

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <footer className="footer-root">
        <div className="footer-list">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <div key={index} className="footer-item">
                <div
                  className={`footer-line footer-line-top ${borderGradient}`}
                  style={
                    active
                      ? { boxShadow: "0 0 8px rgba(80,180,255,0.7)" }
                      : { opacity: 0.25 }
                  }
                />

                <div
                  className="footer-icon-wrap"
                  style={{
                    filter: active
                      ? "drop-shadow(0 0 8px rgba(80,180,255,0.9)) drop-shadow(0 0 18px rgba(80,180,255,0.5))"
                      : "brightness(0.5) saturate(0.6)",
                    margin: "clamp(2px,0.6vh,6px) 0",
                  }}
                >
                  <ClickableButton onClick={() => navigate(item.path)}>
                    <img src={item.icon} alt={item.label} />
                  </ClickableButton>
                </div>

                <span
                  className="footer-label"
                  style={{
                    backgroundImage: active
                      ? "linear-gradient(90deg, #7dd3fc, #38bdf8, #7dd3fc)"
                      : "linear-gradient(90deg, #2a3a4a, #374858, #2a3a4a)",
                  }}
                >
                  {item.label}
                </span>

                <div
                  className={`footer-line footer-line-bottom ${borderGradient}`}
                  style={
                    active
                      ? { boxShadow: "0 0 8px rgba(80,180,255,0.7)" }
                      : { opacity: 0.25 }
                  }
                />
              </div>
            );
          })}
        </div>
      </footer>
      <div style={{ height: "clamp(64px, 13vh, 110px)" }} />
    </>
  );
};

export default Footer;
