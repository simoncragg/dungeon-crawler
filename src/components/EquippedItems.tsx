import React from "react";
import { Shield, Sword } from "lucide-react";
import EquippedSlot from "./EquippedSlot";

interface EquippedItemsProps {
  equippedItems: {
    weapon: string | null;
    armor: string | null;
  };
  isWalking: boolean;
  onInspect: (id: string) => void;
}

const EquippedItems: React.FC<EquippedItemsProps> = ({
  equippedItems,
  isWalking,
  onInspect,
}) => {
  return (
    <div className="flex gap-2 shrink-0 h-full p-1.5 bg-stone-900 rounded-lg border-2 border-stone-700 shadow-xl">
      <EquippedSlot
        type="Weapon"
        itemId={equippedItems.weapon}
        icon={Sword}
        isWalking={isWalking}
        onInspect={onInspect}
      />
      <EquippedSlot
        type="Armor"
        itemId={equippedItems.armor}
        icon={Shield}
        isWalking={isWalking}
        onInspect={onInspect}
      />
    </div>
  );
};

export default EquippedItems;
