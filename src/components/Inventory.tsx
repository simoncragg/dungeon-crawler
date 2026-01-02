import { Backpack } from "lucide-react";
import { ITEMS } from "../data/gameData";
import { getPreloadedUrl } from "../utils/assetLoader";
import { handleItemDragStart } from "../utils/dragUtils";

interface InventoryProps {
  items: (string | null)[];
  onInspect: (itemId: string) => void;
}

export default function Inventory({ items, onInspect }: InventoryProps) {
  return (
    <div className="flex w-58 h-full items-center justify-center bg-stone-900 rounded-lg border-2 border-stone-700 px-1.5 overflow-x-auto gap-1.5 md:gap-2 shadow-xl select-none">
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
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                handleItemDragStart(e, itemId);
              }}
              className="shrink-0 h-12 w-12 rounded border-2 flex flex-col items-center justify-center relative transition-all bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700 hover:text-amber-200 hover:border-amber-700/50 hover:scale-105 shadow-sm group overflow-hidden pointer-events-auto cursor-pointer cursor-grab active:cursor-grabbing"
              title={item.name}
            >
              {item.image ? (
                <img
                  src={getPreloadedUrl(item.image)}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain p-1 opacity-80 group-hover:opacity-100 transition-all pointer-events-none"
                  style={{
                    transform: item.slotStyle ? `
                      ${item.slotStyle.scale ? `scale(${item.slotStyle.scale})` : ''} 
                      ${item.slotStyle.rotation ? `rotate(${item.slotStyle.rotation})` : ''}
                    `.trim() : undefined
                  }}
                />
              ) : (
                Icon && (
                  <div draggable={false} className="pointer-events-none">
                    <Icon size={18} />
                  </div>
                )
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
