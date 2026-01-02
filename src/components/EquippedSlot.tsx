import { ITEMS } from "../data/gameData";
import { getPreloadedUrl } from "../utils/assetLoader";
import { handleItemDragStart } from "../utils/dragUtils";

interface EquippedSlotProps {
  type: string;
  itemId: string | null;
  icon: React.ElementType;
  onInspect: (id: string) => void;
}

const EquippedSlot = ({ type, itemId, icon: PlaceholderIcon, onInspect }: EquippedSlotProps) => {
  const item = itemId ? ITEMS[itemId] : null;
  const ItemIcon = item ? item.icon : null;
  if (!itemId) {
    return (
      <div
        className="w-12 h-full rounded-lg border-2 flex flex-col items-center justify-center relative transition-colors shadow-sm bg-stone-950 border-stone-800 text-stone-700"
        title={`Empty ${type} Slot`}
      >
        <PlaceholderIcon size={20} className="opacity-30" />
      </div>
    );
  }

  return (
    <button
      onClick={() => onInspect(itemId)}
      draggable={true}
      onDragStart={(e) => {
        handleItemDragStart(e, itemId, {
          hideSelectors: [".absolute.top-0\\.5"]
        });
      }}
      className="w-12 h-full rounded-lg border-2 flex flex-col items-center justify-center relative transition-all shadow-sm bg-stone-800 border-stone-600 text-emerald-400 hover:bg-stone-700 hover:border-emerald-500/50 hover:scale-105 group overflow-hidden cursor-grab active:cursor-grabbing"
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
  );
};

export default EquippedSlot;
