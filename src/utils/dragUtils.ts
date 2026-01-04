import React from "react";
import { ITEMS } from "../data/gameData";

interface DragGhostOptions {
  width?: string;
  height?: string;
  offsetX?: number;
  offsetY?: number;
  source?: {
    type: "inventory" | "weapon" | "armor";
    index?: number;
  };
}

const initializeGhostContainer = (element: HTMLElement, width: string, height: string) => {
  element.className = "";
  element.style.cssText = `
      width: ${width};
      height: ${height};
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      position: fixed;
      top: -1000px;
      left: -1000px;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
  `;
};

const ensureChildVisibility = (element: HTMLElement) => {
  const img = element.querySelector('img');
  if (img) {
    img.style.cssText = (img.style.cssText || '') + "opacity: 1 !important; padding: 0 !important;";
  }

  const icon = element.querySelector('.lucide');
  if (icon) {
    (icon as HTMLElement).style.opacity = '1';
  }
};



export const handleItemDragStart = (
  e: React.DragEvent,
  itemId: string,
  options: DragGhostOptions = {}
) => {
  const {
    width = "56px",
    height = "56px",
    offsetX = 28,
    offsetY = 28,
    source,
  } = options;

  if (!e.dataTransfer) return;

  e.dataTransfer.setData("application/x-dungeon-item-id", itemId);

  const item = ITEMS[itemId];
  if (item) {
    e.dataTransfer.setData(`application/x-dungeon-type-${item.type}`, "true");
  }

  if (source) {
    e.dataTransfer.setData("application/x-dungeon-item-source", JSON.stringify(source));
  }
  e.dataTransfer.effectAllowed = "move";

  const target = e.currentTarget as HTMLElement;
  const dragImage = target.cloneNode(true) as HTMLElement;

  initializeGhostContainer(dragImage, width, height);
  ensureChildVisibility(dragImage);

  document.body.appendChild(dragImage);
  e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

  setTimeout(() => {
    document.body.removeChild(dragImage);
  }, 0);
};

export const isDraggingItemOfType = (e: React.DragEvent, type: "weapon" | "armor"): boolean => {
  return e.dataTransfer.types.includes(`application/x-dungeon-type-${type}`);
};
