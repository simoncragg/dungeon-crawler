import { ITEMS } from "../data/gameData";
import { getPreloadedUrl } from "../utils/assetLoader";
import { handleItemDragStart, isDraggingItemOfType } from "../utils/dragUtils";
import React, { useState, useRef } from "react";

interface EquippedSlotProps {
  type: string;
  itemId: string | null;
  icon: React.ElementType;
  onInspect: (id: string) => void;
  onEquipFromInventory: (inventoryIndex: number, slotType: "weapon" | "armor") => void;
}

const EquippedSlot = ({
  type,
  itemId,
  icon: PlaceholderIcon,
  onInspect,
  onEquipFromInventory
}: EquippedSlotProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const slotType = type.toLowerCase() as "weapon" | "armor";
  const item = itemId ? ITEMS[itemId] : null;
  const ItemIcon = item ? item.icon : null;

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (isDraggingItemOfType(e, slotType)) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const sourceData = e.dataTransfer.getData("application/x-dungeon-item-source");
    if (!sourceData) return;
    try {
      const source = JSON.parse(sourceData);
      if (source.type === "inventory" && source.index !== undefined) {
        onEquipFromInventory(source.index, slotType);
      }
    } catch (err) {
      console.error("Failed to parse drop source data:", err);
    }
  };

  const commonClasses = `w-full h-full rounded-lg border-2 flex flex-col items-center justify-center relative shadow-sm`;
  const highlightClasses = isDragOver
    ? "bg-emerald-900/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
    : "bg-stone-950 border-stone-800 text-stone-700 transition-all duration-200";
  const occupiedClasses = isDragOver
    ? "bg-emerald-900/40 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
    : "bg-stone-800 border-stone-600 text-emerald-400 hover:bg-stone-700 hover:border-emerald-500/50 hover:scale-105 transition-all duration-200";

  return (
    <div
      className="w-12 h-full relative"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!itemId ? (
        <div
          className={`${commonClasses} ${highlightClasses}`}
          title={`Empty ${type} Slot`}
        >
          <PlaceholderIcon size={20} className="opacity-30" />
        </div>
      ) : (
        <button
          onClick={() => onInspect(itemId)}
          draggable={true}
          onDragStart={(e) => {
            handleItemDragStart(e, itemId, {
              hideSelectors: [".absolute.top-0\\.5"],
              source: { type: slotType }
            });
          }}
          className={`${commonClasses} ${occupiedClasses} group overflow-hidden cursor-grab active:cursor-grabbing ${isDragOver ? 'scale-100' : ''}`}
          title={item?.name}
        >
          {item?.image ? (
            <img
              src={getPreloadedUrl(item.image)}
              alt={item.name}
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
            ItemIcon && <div draggable={false} className="pointer-events-none"><ItemIcon size={20} /></div>
          )}
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50 z-10 pointer-events-none"></div>
        </button>
      )}
    </div>
  );
};

export default EquippedSlot;
