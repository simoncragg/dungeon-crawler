export default function ShutterBlink({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {/* Progressive Blur Overlay (Thickens at midpoint) */}
      <div className="absolute inset-0 animate-progressive-blur" />

      {/* Eyelid Shutters (Blurred bars) */}
      <div className="absolute top-0 left-0 w-full bg-black/95 backdrop-blur-xl blur-lg z-10 animate-eyelid" />
      <div className="absolute bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl blur-lg z-10 animate-eyelid" />
    </div>
  );
}
