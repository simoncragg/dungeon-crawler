import type { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  isWalking?: boolean;
  onClick: () => void;
}

const ActionButton = ({ icon: Icon, label, disabled = false, danger = false, isWalking, onClick }: ActionButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled || isWalking}
    className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all active:scale-95 h-full shadow-md ${disabled || isWalking
      ? "bg-stone-900 border-stone-800 text-stone-700 cursor-not-allowed"
      : danger
        ? "bg-red-900 border-red-800 hover:bg-red-800 text-red-100"
        : "bg-stone-800 border-stone-600 hover:bg-stone-700 text-stone-200"
      }`}
  >
    <Icon size={20} className={disabled ? "opacity-30" : ""} />
    <span className="text-sm font-bold uppercase tracking-wider font-medieval">{label}</span>
  </button>
);

export default ActionButton;
