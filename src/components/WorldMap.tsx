import { useEffect, useRef } from "react";
import { WORLD } from "../data/gameData";

const WorldMap = ({ currentRoomId, visitedRooms }: { currentRoomId: string, visitedRooms: string[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 35;
    const spacing = 75;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const seenRooms = new Set(visitedRooms);
    visitedRooms.forEach(id => {
      const room = WORLD[id];
      if (room) {
        Object.values(room.exits).forEach(exitId => seenRooms.add(exitId));
      }
    });

    const currentRoom = WORLD[currentRoomId];
    const offsetX = currentRoom ? -currentRoom.coordinates.x * spacing : 0;
    const offsetY = currentRoom ? currentRoom.coordinates.y * spacing : 0;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 3;
    ctx.beginPath();
    visitedRooms.forEach(id => {
      const room = WORLD[id];
      if (!room) return;

      const rX = centerX + offsetX + (room.coordinates.x * spacing);
      const rY = centerY + offsetY - (room.coordinates.y * spacing);

      Object.values(room.exits).forEach((targetId) => {
        if (seenRooms.has(targetId)) {
          const target = WORLD[targetId];
          const tX = centerX + offsetX + (target.coordinates.x * spacing);
          const tY = centerY + offsetY - (target.coordinates.y * spacing);

          const dx = tX - rX;
          const dy = tY - rY;
          const angle = Math.atan2(dy, dx);

          const startX = rX + (Math.cos(angle) * gridSize / 2);
          const startY = rY + (Math.sin(angle) * gridSize / 2);
          const endX = tX - (Math.cos(angle) * gridSize / 2);
          const endY = tY - (Math.sin(angle) * gridSize / 2);

          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
      });
    });
    ctx.stroke();

    seenRooms.forEach(id => {
      const room = WORLD[id];
      if (!room) return;

      const x = centerX + offsetX + (room.coordinates.x * spacing);
      const y = centerY + offsetY - (room.coordinates.y * spacing);

      const isCurrent = id === currentRoomId;
      const isVisited = visitedRooms.includes(id);

      if (isCurrent) {
        ctx.fillStyle = "#10b981";
        ctx.fillRect(x - gridSize / 2, y - gridSize / 2, gridSize, gridSize);
      } else if (isVisited) {
        ctx.fillStyle = "#475569";
        ctx.fillRect(x - gridSize / 2, y - gridSize / 2, gridSize, gridSize);
      } else {
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - gridSize / 2, y - gridSize / 2, gridSize, gridSize);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(x - gridSize / 2 + 2, y - gridSize / 2 + 2, gridSize - 4, gridSize - 4);
      }

      if (room.shortName) {
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = isCurrent ? "#10b981" : "#94a3b8";
        ctx.fillText(room.shortName, x, y + gridSize / 2 + 14);
      }
    });

  }, [currentRoomId, visitedRooms]);

  return (
    <div className="h-full aspect-square rounded-xl overflow-hidden relative shadow-inner">
      <canvas ref={canvasRef} width={240} height={240} className="h-full aspect-square" />
    </div>
  );
};

export default WorldMap;
