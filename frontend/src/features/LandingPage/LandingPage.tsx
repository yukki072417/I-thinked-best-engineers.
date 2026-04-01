import FormCard from "@/commons/components/FormCard";

const LandingPage = () => {
  return (
    <FormCard>
      <div className="mb-8">
        <p className="text-xs text-sky-400/60 tracking-widest mb-2 font-mono uppercase">
          Login
        </p>
        <h1 className="text-2xl font-bold text-sky-100 tracking-wide">
          ログイン
        </h1>
        <div className="mt-3 h-px bg-gradient-to-r from-sky-500/50 to-transparent" />
      </div>
    </FormCard>
  );
};

export default LandingPage;
