import Game from "./components/Game"

function App() {

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <header className="flex justify-center items-center p-2 bg-slate-900 border-b border-slate-800 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-2 text-emerald-400 text-xl">
          <span className="font-serif mt-1 font-bold tracking-widest">
            DUNGEON CRAWLER
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <Game />
      </div>
    </div>
  )
}

export default App
