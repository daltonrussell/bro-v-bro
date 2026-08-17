import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f1ede4] px-5 py-8 text-[#11131a] sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col rounded-[34px] border-2 border-[#11131a] bg-[#f1ede4] p-6 shadow-[10px_10px_0_#8d82ff] sm:p-10">
        <nav className="flex items-center justify-between border-b-2 border-[#11131a] pb-5">
          <div className="font-black uppercase tracking-[-0.04em]">BRO / V / BRO</div>
          <span className="rounded-full bg-[#11131a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#f1ede4]">Prototype 0.1</span>
        </nav>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-5 inline-flex rotate-[-2deg] bg-[#f2b84b] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-[3px_3px_0_#11131a]">Cross-game 1v1s</div>
            <h1 className="max-w-4xl text-6xl font-black leading-[.86] tracking-[-0.075em] sm:text-8xl lg:text-9xl">SETTLE IT<br />ACROSS<br /><span className="text-[#6c5ce7]">EVERY GAME.</span></h1>
            <p className="mt-7 max-w-xl text-base font-semibold leading-7 opacity-65 sm:text-lg">Flip for first pick. Play a game. Record the winner. The loser picks next. First to the target score takes the Bro v Bro.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/challenge/new" className="rounded-2xl bg-[#11131a] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#f1ede4] shadow-[4px_4px_0_#8d82ff]">Start a Bro v Bro</Link>
              <Link href="/challenge/demo" className="rounded-2xl border-2 border-[#11131a] px-6 py-4 text-sm font-black uppercase tracking-[0.14em]">Try solo demo</Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -left-5 -top-6 rotate-[-7deg] rounded-xl bg-[#8d82ff] px-4 py-2 text-sm font-black text-white shadow-[4px_4px_0_#11131a]">LOSER PICKS NEXT</div>
            <div className="rounded-[30px] border-2 border-[#11131a] bg-[#11131a] p-5 text-[#f1ede4] shadow-[9px_9px_0_#f2b84b]">
              <div className="flex justify-between border-b border-white/15 pb-4 text-xs font-black uppercase tracking-[0.18em] text-white/50"><span>Live match</span><span>First to 5</span></div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center py-8 text-center"><div><div className="text-xl font-black">You</div><div className="mt-4 text-6xl font-black">3</div></div><div className="px-4 text-sm font-black text-[#f2b84b]">VS</div><div><div className="text-xl font-black">Rival</div><div className="mt-4 text-6xl font-black">2</div></div></div>
              <div className="rounded-2xl bg-white/[.06] p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Next pick</div><div className="mt-1 text-xl font-black">Rival chooses a game</div></div>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-2 border-t-2 border-[#11131a] pt-5 text-xs font-bold uppercase tracking-[0.16em] opacity-50"><span>Coin flip → game → result → counter-pick</span><span>Web-first modular monolith</span></footer>
      </div>
    </main>
  );
}
