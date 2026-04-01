interface FormCardProps {
  children: React.ReactNode;
}

const FormCard = ({ children }: FormCardProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
        {children}
      </div>
    </div>
  );
};

export default FormCard;
