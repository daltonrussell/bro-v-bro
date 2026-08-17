import Link from "next/link";
import { CreateChallengeForm } from "@/components/bro-v-bro/CreateChallengeForm";

export default function NewChallengePage() {
  return (
    <main className="min-h-screen bg-[#e9e3d8] px-4 py-6 text-[#11131a] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between border-b-2 border-[#11131a] pb-4">
          <Link href="/" className="text-lg font-black tracking-[-0.04em]">BRO / V / BRO</Link>
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-45">Challenge setup</span>
        </header>
        <CreateChallengeForm />
      </div>
    </main>
  );
}
