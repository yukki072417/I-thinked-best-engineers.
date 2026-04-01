import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormCard from "../../commons/components/FormCard";
import { useAuthToken } from "../../commons/hooks/useAuthToken";
import {
  createCharacter,
  rescanCharacter,
  syncMyAccount,
} from "../../api/backendApi";
import type { Character } from "../../api/backendApi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4567";
const CHARACTER_KEY = "generated_character";

type Status = "idle" | "loading" | "done" | "error";

const TENDENCY_LABEL: Record<Character["tendency"], string> = {
  implementation: "実装特化型",
  planning: "設計特化型",
  balanced: "バランス型",
};

const TENDENCY_COLOR: Record<Character["tendency"], string> = {
  implementation: "text-orange-300 border-orange-400/40 bg-orange-400/10",
  planning: "text-violet-300 border-violet-400/40 bg-violet-400/10",
  balanced: "text-sky-300   border-sky-400/40    bg-sky-400/10",
};

// ---- サブコンポーネント ----

function SkillStat({
  label,
  score,
  tone,
  description,
}: {
  label: string;
  score: number;
  tone: string;
  description: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono tracking-widest uppercase opacity-70">
            {label}
          </p>
          <p className="mt-2 text-xs font-mono opacity-60">{description}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono tracking-widest uppercase opacity-60">
            Score
          </p>
          <p className="text-2xl font-bold font-mono leading-none">{score}</p>
        </div>
      </div>
    </div>
  );
}

function TechBadge({ lang, primary }: { lang: string; primary: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-lg font-mono text-xs border ${
        primary
          ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
          : "bg-white/5 border-white/10 text-sky-400/60"
      }`}
    >
      {primary && <span className="mr-1 text-sky-400">★</span>}
      {lang}
    </span>
  );
}

// ---- キャラクターカード ----

function CharacterCard({
  character,
  token,
  onRescan,
  onReset,
}: {
  character: Character;
  token: string;
  onRescan: (c: Character) => void;
  onReset: () => void;
}) {
  const [rescanning, setRescanning] = useState(false);
  const [rescanError, setRescanError] = useState("");

  const handleRescan = () => {
    setRescanning(true);
    setRescanError("");
    rescanCharacter(token)
      .then(onRescan)
      .catch((e: unknown) =>
        setRescanError(e instanceof Error ? e.message : "エラーが発生しました"),
      )
      .finally(() => setRescanning(false));
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
        {/* ヘッダー */}
        <div className="mb-6">
          <p className="text-xs text-sky-400/60 tracking-widest mb-2 font-mono uppercase">
            Character Created
          </p>
          <h1 className="text-2xl font-bold text-sky-100 tracking-wide">
            キャラクター作成完了
          </h1>
          <div className="mt-3 h-px bg-gradient-to-r from-sky-500/50 to-transparent" />
        </div>

        {/* プロフィール */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={character.avatar_url}
            alt={character.github_login}
            className="w-16 h-16 rounded-full border-2 border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sky-100 font-mono font-bold text-lg truncate">
              {character.name ?? character.github_login}
            </p>
            <p className="text-sky-400/60 font-mono text-xs">
              @{character.github_login}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-full border ${TENDENCY_COLOR[character.tendency]}`}
              >
                {TENDENCY_LABEL[character.tendency]}
              </span>
              <span className="text-xs font-mono text-sky-400/50">
                DECK{" "}
                <span className="text-sky-300 font-bold">
                  {character.deck_score}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* スキル */}
        <div className="mb-6 bg-sky-950/30 border border-sky-500/10 rounded-xl p-4">
          <p className="text-xs text-sky-400/60 font-mono tracking-widest uppercase mb-3">
            Skills
          </p>
          <div className="grid gap-3">
          <SkillStat
            label="実装力"
            score={character.skills.implementation}
            tone="border-orange-400/20 bg-orange-400/10 text-orange-100"
            description="コミットと開発量から算出"
          />
          <SkillStat
            label="企画力"
            score={character.skills.planning}
            tone="border-violet-400/20 bg-violet-400/10 text-violet-100"
            description="設計・ドキュメント活動から算出"
          />
          <SkillStat
            label="開発速度"
            score={character.skills.speed}
            tone="border-sky-400/20 bg-sky-400/10 text-sky-100"
            description="直近1年の出力量から算出"
          />
          </div>
        </div>

        {/* 技術 */}
        <div className="mb-6">
          <p className="text-xs text-sky-400/60 font-mono tracking-widest uppercase mb-3">
            Technologies
          </p>
          <div className="flex flex-wrap gap-2">
            {character.tech.primary.map((lang) => (
              <TechBadge key={lang} lang={lang} primary />
            ))}
            {character.tech.all
              .filter((lang) => !character.tech.primary.includes(lang))
              .map((lang) => (
                <TechBadge key={lang} lang={lang} primary={false} />
              ))}
          </div>
          <p className="mt-2 text-xs text-sky-500/40 font-mono">
            ★ 主要技術（大会マッチ時 全スキル +3%）
          </p>
        </div>

        {rescanError && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 font-mono text-xs">{rescanError}</p>
          </div>
        )}

        {/* アクション */}
        <div className="flex gap-3">
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="flex-1 py-3 rounded-xl font-mono text-sm tracking-widest font-bold transition-all border border-sky-500/30 text-sky-300/70 hover:border-sky-400/60 hover:text-sky-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {rescanning ? "スキャン中..." : "GitHub を再スキャン"}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-3 rounded-xl font-mono text-sm text-sky-500/40 hover:text-sky-400/70 transition-all"
          >
            やり直す
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----

const CreateCharacter = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [withPrivate, setWithPrivate] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [character, setCharacter] = useState<Character | null>(null);
  const { token, setToken } = useAuthToken();

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const error = searchParams.get("error");

    const handleSerErrorMsg = async (msg: string) => {
      setErrorMsg(msg);
      setStatus("error");
      setSearchParams({}, { replace: true });
    };

    const handleSetStatus = async (s: Status) => {
      setStatus(s);
      setSearchParams({}, { replace: true });
    };

    if (error) {
      handleSerErrorMsg(error);
      handleSetStatus("error");
      setSearchParams({}, { replace: true });
      return;
    }

    if (!urlToken) return;

    setSearchParams({}, { replace: true });
    setToken(urlToken);
    handleSetStatus("loading");

    syncMyAccount(urlToken)
      .then(() => createCharacter(urlToken))
      .then((data) => {
        sessionStorage.setItem(CHARACTER_KEY, JSON.stringify(data));
        setCharacter(data);
        setStatus("done");
        navigate("/base");
      })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : "Unknown error");
        setStatus("error");
      });
  }, [navigate, searchParams, setSearchParams, setToken]);

  if (status === "loading") {
    return (
      <FormCard>
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="w-10 h-10 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sky-300/80 font-mono text-sm">
              GitHub データを解析中...
            </p>
            <p className="text-sky-500/40 font-mono text-xs mt-1">
              リポジトリ・コントリビューションを取得しています
            </p>
          </div>
        </div>
      </FormCard>
    );
  }

  if (status === "done" && character && token) {
    return (
      <CharacterCard
        character={character}
        token={token}
        onRescan={setCharacter}
        onReset={() => setStatus("idle")}
      />
    );
  }

  return (
    <FormCard>
      <div className="mb-8">
        <p className="text-xs text-sky-400/60 tracking-widest mb-2 font-mono uppercase">
          Character Setup
        </p>
        <h1 className="text-2xl font-bold text-sky-100 tracking-wide">
          キャラクター作成
        </h1>
        <div className="mt-3 h-px bg-gradient-to-r from-sky-500/50 to-transparent" />
      </div>

      <div className="mb-6 bg-sky-950/30 border border-sky-500/10 rounded-xl p-4 space-y-2">
        <p className="text-xs text-sky-400/60 font-mono tracking-widest uppercase">
          生成される情報
        </p>
        {[
          { label: "実装力", desc: "総コントリビューション数をもとに算出" },
          { label: "企画力", desc: "README・wiki の充実度をもとに算出" },
          { label: "開発速度", desc: "直近1年のコミット数・PRをもとに算出" },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-start gap-2">
            <span className="text-sky-400/50 font-mono text-xs mt-0.5">▸</span>
            <div>
              <span className="text-sky-200 font-mono text-xs font-bold">
                {label}
              </span>
              <span className="text-sky-500/50 font-mono text-xs ml-2">
                {desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      {status === "error" && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 font-mono text-xs">{errorMsg}</p>
        </div>
      )}

      <div className="mb-6">
        <button
          type="button"
          onClick={() => setWithPrivate((v) => !v)}
          className="flex items-start gap-3 w-full text-left group"
        >
          <div
            className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border flex items-center justify-center transition-all ${
              withPrivate
                ? "bg-sky-500/30 border-sky-400/80 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                : "bg-sky-950/40 border-sky-500/25 group-hover:border-sky-400/50"
            }`}
          >
            {withPrivate && (
              <svg
                className="w-3 h-3 text-sky-300"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <div>
            <p
              className={`text-sm font-mono transition-colors ${withPrivate ? "text-sky-200" : "text-sky-300/60 group-hover:text-sky-300/80"}`}
            >
              プライベートリポジトリのアクセスを許可する
            </p>
            <p className="text-xs text-sky-500/40 font-mono mt-0.5">
              業務コード・非公開活動を含めてより正確なスキル値を算出します
            </p>
          </div>
        </button>
      </div>

      <button
        onClick={() => {
          window.location.href = `${BACKEND_URL}/auth/github?private=${withPrivate}`;
        }}
        className="w-full py-3 rounded-xl font-mono text-sm tracking-widest font-bold transition-all bg-sky-500/80 hover:bg-sky-400/90 text-white shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:-translate-y-0.5 active:translate-y-0"
      >
        GitHub で認証してキャラクターを生成
      </button>
    </FormCard>
  );
};

export default CreateCharacter;
