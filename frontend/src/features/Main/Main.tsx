import { useEffect, useMemo, useState } from "react";
import { getMyCharacter } from "../../api/backendApi";
import type { Character } from "../../api/backendApi";
import { useAuthToken } from "../../commons/hooks/useAuthToken";
import CharacterStatusCard from "./components/CharacterStatusCard/CharacterStatusCard";
import EmptyCharacterState from "./components/EmptyCharacterState";

const CHARACTER_KEY = "generated_character";

const Main = () => {
  const { token } = useAuthToken();
  const initialCharacter = useMemo<Character | null>(() => {
    const raw = sessionStorage.getItem(CHARACTER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as Character;
    } catch {
      return null;
    }
  }, []);

  const [character, setCharacter] = useState<Character | null>(
    initialCharacter,
  );
  const [hasLoaded, setHasLoaded] = useState<boolean>(
    Boolean(initialCharacter) || !token,
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (character || !token || hasLoaded) {
      return;
    }

    getMyCharacter(token)
      .then((data) => {
        sessionStorage.setItem(CHARACTER_KEY, JSON.stringify(data));
        setCharacter(data);
        setHasLoaded(true);
      })
      .catch((e: unknown) => {
        const message =
          e instanceof Error ? e.message.toLowerCase() : "unknown error";
        if (message.includes("not found") || message.includes("http 404")) {
          setHasLoaded(true);
          return;
        }
        setHasError(true);
        setHasLoaded(true);
      });
  }, [character, hasLoaded, token]);

  if (!character && token && !hasLoaded && !hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-8">
          <p className="text-sky-300/80 font-mono text-sm">
            キャラクター情報を読み込み中です...
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
          <p className="text-red-300 font-mono text-sm">
            キャラクター情報の取得に失敗しました。
          </p>
          <p className="text-red-200/80 font-mono text-xs mt-2">
            しばらくして再度お試しください。
          </p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <EmptyCharacterState />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-3">
      <CharacterStatusCard character={character} />
    </div>
  );
};

export default Main;
