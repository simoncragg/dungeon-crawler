
import type { LucideIcon } from "lucide-react";

interface StatChipProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: string;
}

const StatChip = ({ icon: Icon, value, label, color }: StatChipProps) => (
  <div className={`flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-700 ${color}`}>
    <Icon size={16} />
    <div className="flex flex-col leading-none">
      <span className="text-xs font-bold">{value}</span>
      <span className="text-[10px] opacity-70 uppercase">{label}</span>
    </div>
  </div>
);

export default StatChip;
