import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Main from "./features/Main/Main";
import Footer from "@/commons/components/Footer/Footer";
import Header from "@/commons/components/Header/Header";
import GameBackground from "@/commons/components/GameBackground";
import CreateCharacter from "./features/CreateCharacter/CreateCharacter";

// ヘッダー・フッターを非表示にするパス一覧
const FULLSCREEN_PATHS = ["/", "/create-character"];

const Layout = () => {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PATHS.includes(location.pathname);

  return (
    <>
      {!isFullscreen && <Header />}
      <Routes>
        <Route path="/base" element={<Main />} />
        <Route path="/" element={<CreateCharacter />} />
        <Route path="/create-character" element={<CreateCharacter />} />
      </Routes>
      {!isFullscreen && <Footer />}
    </>
  );
};

function App() {
  return (
    <GameBackground>
      <Router>
        <Layout />
      </Router>
    </GameBackground>
  );
}

export default App;
