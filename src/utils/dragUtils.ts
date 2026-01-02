import React from "react";

interface DragGhostOptions {
  width?: string;
  height?: string;
  hideSelectors?: string[];
  offsetX?: number;
  offsetY?: number;
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

const hideGhostElements = (element: HTMLElement, selectors: string[]) => {
  selectors.forEach(selector => {
    const el = element.querySelector(selector);
    if (el) {
      (el as HTMLElement).style.display = 'none';
    }
  });
};

export const handleItemDragStart = (
  e: React.DragEvent,
  itemId: string,
  options: DragGhostOptions = {}
) => {
  const {
    width = "56px",
    height = "56px",
    hideSelectors = [],
    offsetX = 28,
    offsetY = 28,
  } = options;

  if (!e.dataTransfer) return;

  e.dataTransfer.setData("application/x-dungeon-item-id", itemId);
  e.dataTransfer.effectAllowed = "move";

  const target = e.currentTarget as HTMLElement;
  const dragImage = target.cloneNode(true) as HTMLElement;

  initializeGhostContainer(dragImage, width, height);
  ensureChildVisibility(dragImage);
  hideGhostElements(dragImage, hideSelectors);

  document.body.appendChild(dragImage);
  e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);

  setTimeout(() => {
    document.body.removeChild(dragImage);
  }, 0);
};
