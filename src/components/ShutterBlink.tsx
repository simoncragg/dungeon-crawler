export default function ShutterBlink({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <>
      <div className="absolute top-0 left-0 w-full bg-black/90 backdrop-blur-xl blur-xl z-[100] animate-eyelid" />
      <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl blur-xl z-[100] animate-eyelid" />
    </>
  );
}
