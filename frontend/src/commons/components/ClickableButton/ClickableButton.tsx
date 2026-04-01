import "./ClickableButton.css";

interface ClickableButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ClickableButton = ({
  children,
  className,
  onClick,
}: ClickableButtonProps) => {
  return (
    <button className={"clickable-button " + className} onClick={onClick}>
      {children}
    </button>
  );
};

export default ClickableButton;
