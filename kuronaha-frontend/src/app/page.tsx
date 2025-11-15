import { PageHeader } from "@/components/PageHeader";
import { TopBar } from "@/components/TopBar";
import { EnginePredictor } from "@/components/EnginePredictor";
import { NavalPredictor } from "@/components/NavalPredictor";
import { ErrorTerminal } from "@/components/ErrorTerminal";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-12 text-black">
      <TopBar />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-28 sm:px-8">
        <PageHeader />
        <div className="grid gap-8 lg:grid-cols-2">
          <EnginePredictor />
          <NavalPredictor />
        </div>
        <ErrorTerminal />
      </main>
    </div>
  );
}
