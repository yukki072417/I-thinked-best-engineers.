const EmptyCharacterState = () => {
  return (
    <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-8">
      <p className="text-sky-300/80 font-mono text-sm">
        まだキャラクター情報がありません。
      </p>
      <p className="text-sky-500/50 font-mono text-xs mt-2">
        先にキャラクターを生成してください。
      </p>
    </div>
  );
};

export default EmptyCharacterState;
