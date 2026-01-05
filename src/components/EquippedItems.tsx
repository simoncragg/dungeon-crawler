import { useGameStore } from "../store/useGameStore";
import { Shield, Sword } from "lucide-react";
import EquippedSlot from "./EquippedSlot";

interface EquippedItemsProps {
  onInspect: (id: string) => void;
  onEquipFromInventory: (inventoryIndex: number, slotType: "weapon" | "armor") => void;
}

const EquippedItems: React.FC<EquippedItemsProps> = ({
  onInspect,
  onEquipFromInventory
}) => {
  const equippedItems = useGameStore(state => state.gameState.equippedItems);
  return (
    <div className="flex gap-2 shrink-0 h-full p-1.5 bg-stone-900 rounded-lg border-2 border-stone-700 shadow-xl">
      <EquippedSlot
        type="Weapon"
        itemId={equippedItems.weapon}
        icon={Sword}
        onInspect={onInspect}
        onEquipFromInventory={onEquipFromInventory}
      />
      <EquippedSlot
        type="Armor"
        itemId={equippedItems.armor}
        icon={Shield}
        onInspect={onInspect}
        onEquipFromInventory={onEquipFromInventory}
      />
    </div>
  );
};

export default EquippedItems;
