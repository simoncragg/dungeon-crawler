import { useState, useEffect } from "react";
import Game from "./components/Game";
import TitleScreen from "./components/TitleScreen";
import { useAssetLoader } from "./hooks/useAssetLoader";

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { progress, loaded, startLoading } = useAssetLoader();

  useEffect(() => {
    startLoading();
  }, [startLoading]);

  const handleStart = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      setHasStarted(true);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 300);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-950 text-slate-100 relative">
      {!hasStarted && <TitleScreen onStart={handleStart} progress={progress} loaded={loaded} />}

      {hasStarted && (
        <>
          <header className="flex justify-center items-center p-2 bg-slate-900 border-b border-slate-800 shadow-md z-10 shrink-0">
            <div
              className="flex items-center gap-2 text-emerald-400 text-xl cursor-pointer hover:text-emerald-300 transition-colors"
              onClick={() => window.location.reload()}
              role="button"
              title="Reload Game"
            >
              <span className="font-medieval mt-1 font-bold tracking-widest">
                DUNGEON CRAWLER
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
            <Game />
          </main>
        </>
      )}

      {/* Transition Overlay */}
      <div
        className={`absolute inset-0 bg-black z-[100] pointer-events-none transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export default App;
