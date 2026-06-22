import { Suspense } from "react";
import GachaApp from "@/components/GachaApp";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Suspense>
        <GachaApp />
      </Suspense>
    </div>
  );
}
