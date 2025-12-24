import { Backpack } from "lucide-react";
import { ITEMS } from "../data/gameData";

interface InventoryProps {
  items: (string | null)[];
  onInspect: (itemId: string) => void;
}

export default function Inventory({ items, onInspect }: InventoryProps) {
  return (
    <div className="flex w-58 h-full items-center justify-center bg-stone-900 rounded-lg border-2 border-stone-700 px-1.5 overflow-x-auto gap-1.5 md:gap-2 shadow-xl">
      {items.every(i => i === null) ? (
        <div className="w-full text-center text-xs text-stone-600 italic flex items-center justify-center gap-2">
          <Backpack size={16} className="opacity-50" /> Empty
        </div>
      ) : (
        items.map((itemId, index) => {
          if (!itemId) {
            return (
              <div key={index} className="shrink-0 h-12 w-12 rounded border border-stone-800 bg-stone-950" />
            );
          }
          const item = ITEMS[itemId];
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onInspect(itemId)}
              className="shrink-0 h-12 w-12 rounded border-2 flex flex-col items-center justify-center relative transition-all bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700 hover:text-amber-200 hover:border-amber-700/50 hover:scale-105 shadow-sm group overflow-hidden"
              title={item.name}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain p-1 opacity-80 group-hover:opacity-100 transition-all"
                  style={{
                    transform: item.slotStyle ? `
                      ${item.slotStyle.scale ? `scale(${item.slotStyle.scale})` : ''} 
                      ${item.slotStyle.rotation ? `rotate(${item.slotStyle.rotation})` : ''}
                    `.trim() : undefined
                  }}
                />
              ) : (
                Icon && <Icon size={18} />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
