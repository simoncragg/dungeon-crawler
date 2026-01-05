import React, { useState, useRef } from "react";
import { ITEMS } from "../data/gameData";
import { getPreloadedUrl } from "../utils/assetLoader";
import { handleItemDragStart } from "../utils/dragUtils";

interface InventorySlotProps {
  itemId: string | null;
  index: number;
  onInspect: (itemId: string) => void;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onUnequipToInventory: (slotType: "weapon" | "armor", inventoryIndex: number) => void;
}

const InventorySlot: React.FC<InventorySlotProps> = ({
  itemId,
  index,
  onInspect,
  onMoveItem,
  onUnequipToInventory
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsHovered(true);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsHovered(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsHovered(false);
    const sourceData = e.dataTransfer.getData("application/x-dungeon-item-source");
    if (!sourceData) return;

    try {
      const source = JSON.parse(sourceData);
      if (source.type === "inventory") {
        if (source.index !== undefined && source.index !== index) {
          onMoveItem(source.index, index);
        }
      } else if (source.type === "weapon" || source.type === "armor") {
        onUnequipToInventory(source.type, index);
      }
    } catch (err) {
      console.error("Failed to parse drop source data:", err);
    }
  };

  const commonClasses = "shrink-0 h-10 w-10 md:h-12 md:w-12 relative h-full w-full rounded border";

  if (!itemId) {
    return (
      <div
        className="shrink-0 h-10 w-10 md:h-12 md:w-12 relative"
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={`${commonClasses} ${isHovered
            ? "bg-amber-900/40 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            : "border-stone-800 bg-stone-950 transition-colors duration-200"
            }`}
        />
      </div>
    );
  }

  const item = ITEMS[itemId];
  const Icon = item.icon;

  return (
    <div
      className="shrink-0 h-10 w-10 md:h-12 md:w-12 relative"
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        onClick={() => onInspect(itemId)}
        draggable={true}
        onDragStart={(e) => {
          e.stopPropagation();
          handleItemDragStart(e, itemId, {
            source: { type: "inventory", index }
          });
        }}
        className={`w-full h-full rounded border-2 flex flex-col items-center justify-center relative shadow-sm group overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing ${isHovered
          ? "bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-100"
          : "bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700 hover:text-amber-200 hover:border-amber-700/50 hover:scale-105 transition-all duration-200"
          }`}
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
    </div>
  );
};

import { useGameStore } from "../store/useGameStore";

interface InventoryProps {
  onInspect: (itemId: string) => void;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onUnequipToInventory: (slotType: "weapon" | "armor", inventoryIndex: number) => void;
}

export default function Inventory({
  onInspect,
  onMoveItem,
  onUnequipToInventory
}: InventoryProps) {
  const items = useGameStore(state => state.gameState.inventory.items);
  return (
    <div className="flex w-58 h-full items-center justify-center bg-stone-900 rounded-lg border-2 border-stone-700 px-1.5 overflow-x-auto gap-1.5 md:gap-2 shadow-xl select-none">
      {items.map((itemId, index) => (
        <InventorySlot
          key={index}
          itemId={itemId}
          index={index}
          onInspect={onInspect}
          onMoveItem={onMoveItem}
          onUnequipToInventory={onUnequipToInventory}
        />
      ))}
    </div>
  );
}
