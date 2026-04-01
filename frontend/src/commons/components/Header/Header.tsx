import { moneyImg } from "@/icons";
import "./style.css";
import { mainColor, borderGradient } from "@/commons/styles/colors";

const Header = () => {
  return (
    <>
      <div className="header-root">
        <div className="header-inner">
          <img src={moneyImg} className="header-money-img" alt="money" />
          <p className={`header-money-text ${mainColor}`}>100,000,000</p>
        </div>
        <div className={`header-border ${borderGradient}`} />
      </div>

      <div style={{ height: "clamp(40px, 6vh, 60px)" }} />
    </>
  );
};

export default Header;
