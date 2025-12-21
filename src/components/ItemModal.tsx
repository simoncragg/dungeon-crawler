import React from "react";
import { X } from "lucide-react";
import { ITEMS } from "../data/gameData";

interface ItemModalProps {
  itemId: string;
  isEquipped?: boolean;
  onClose: () => void;
  onUse: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  onUnequip: (itemId: string) => void;
  onDrop: (itemId: string) => void;
  canUnequip: boolean;
}

const ItemModal: React.FC<ItemModalProps> = ({ itemId, isEquipped, onClose, onUse, onEquip, onUnequip, onDrop, canUnequip }) => {
  const item = ITEMS[itemId];
  const [isTall, setIsTall] = React.useState(false);

  React.useEffect(() => {
    setIsTall(false);
  }, [itemId]);

  if (!item) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-800 flex justify-between items-start bg-stone-800/50">
          <div className="flex gap-3">
            <div className="p-3 bg-stone-800 rounded-lg border border-stone-700 text-emerald-400">
              {item.icon && React.createElement(item.icon, { size: 28 })}
            </div>
            <div>
              <h3 className="font-bold text-xl text-stone-100">{item.name}</h3>
              <p className="text-xs text-stone-400 uppercase tracking-wide">{item.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Hero Image Area */}
        {item.image && (
          <div className="w-full h-64 bg-black/40 flex items-center justify-center overflow-hidden relative group border-y border-stone-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800/20 via-black/40 to-black/60" />
            <img
              src={item.image}
              alt={item.name}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalHeight > img.naturalWidth) {
                  setIsTall(true);
                }
              }}
              className={`max-w-full max-h-full m-auto transition-transform duration-700`}
              style={{
                transform: `
                  ${!item.modalRotation && isTall ? "rotate(-55deg) scale(1.35)" : ""}
                  ${item.modalScale ? `scale(${item.modalScale})` : ""}
                  ${item.modalRotation ? `rotate(${item.modalRotation})` : ""}
                `.trim(),
              }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          <div className="bg-stone-950/50 p-3 rounded-lg border border-stone-800 text-stone-300 text-lg leading-relaxed italic shadow-inner">
            {item.description}
          </div>

          {item.stats && (
            <div className="flex gap-2 flex-wrap">
              {item.stats.attack !== undefined && item.stats.attack > 0 && (
                <div className="px-2 py-1 bg-orange-950/30 border border-orange-900/50 rounded text-sm text-orange-400 font-bold">
                  +{item.stats.attack} Attack
                </div>
              )}
              {item.stats.defense !== undefined && item.stats.defense > 0 && (
                <div className="px-2 py-1 bg-blue-950/30 border border-blue-900/50 rounded text-sm text-blue-400 font-bold">
                  {item.stats.defense > 0 ? "+" : ""}{item.stats.defense} Defense Points
                </div>
              )}
              {item.stats.parryChance !== undefined && item.stats.parryChance > 0 && (
                <div className="px-2 py-1 bg-yellow-950/30 border border-yellow-900/50 rounded text-sm text-yellow-400 font-bold">
                  {Math.round(item.stats.parryChance * 100)}% Parry Chance
                </div>
              )}
              {("critChance" in item.stats) && item.stats.critChance > 0 && (
                <div className="px-2 py-1 bg-red-950/30 border border-red-900/50 rounded text-sm text-red-400 font-bold">
                  {Math.round(item.stats.critChance * 100)}% Crit. Chance
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950/50 border-t border-stone-800 flex gap-3">

          {(item.type === "consumable" || item.type === "key") && (
            <button
              onClick={() => {
                onUse(item.id);
                onClose();
              }}
              className="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider font-medieval bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/20"
            >
              Use {item.type === "key" ? "Key" : "Item"}
            </button>
          )}

          {["weapon", "armor"].includes(item.type) && (
            isEquipped ? (
              <button
                onClick={() => {
                  onUnequip(item.id);
                  onClose();
                }}
                disabled={!canUnequip}
                className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider font-medieval transition-colors shadow-lg ${!canUnequip
                  ? "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                  : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20"
                  }`}
                title={!canUnequip ? "Inventory Full" : ""}
              >
                Unequip
              </button>
            ) : (
              <button
                onClick={() => {
                  onEquip(item.id);
                  onClose();
                }}
                className="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider font-medieval bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 transition-colors"
              >
                Equip
              </button>
            )
          )}

          <button
            onClick={() => {
              onDrop(item.id);
              onClose();
            }}
            className="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider font-medieval bg-stone-800 hover:bg-red-900/50 border border-stone-700 hover:border-red-800 text-stone-300 hover:text-red-200 transition-colors flex items-center justify-center gap-2"
          >
            Drop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
