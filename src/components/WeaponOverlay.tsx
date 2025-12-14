import React from "react";
import { ITEMS } from "../data/gameData";

interface WeaponOverlayProps {
  weaponId: string | null;
  brightness?: number;
}

const WeaponOverlay = ({ weaponId, brightness = 0.5 }: WeaponOverlayProps) => {
  const equippedWeaponId = weaponId;

  if (!equippedWeaponId) return null;

  const weaponItem = ITEMS[equippedWeaponId];
  if (!weaponItem || !weaponItem.image) return null;

  const config = weaponItem.overlayConfig || {
    width: "300px",
    right: "5%",
    bottom: "5%",
    rotation: "0deg",
  };

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 20,
    right: config.right,
    bottom: config.bottom,
    width: config.width,
    animation: "breathe 4s ease-in-out infinite",
  };

  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    display: "block",
    transform: `rotate(${config.rotation || "0deg"})`,
    transformOrigin: "bottom right",
    filter: `brightness(${brightness})`,
  };

  return (
    <div style={wrapperStyle}>
      <img
        src={weaponItem.image}
        alt={weaponItem.name}
        style={imageStyle}
        className="object-contain"
      />
    </div>
  );
}

export default WeaponOverlay;
