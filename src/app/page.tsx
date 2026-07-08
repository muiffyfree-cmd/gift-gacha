import type { Metadata } from "next";
import { Suspense } from "react";
import GachaApp from "@/components/GachaApp";

export const metadata: Metadata = {
  title: "誕生日プレゼントを探す｜誕プレガチャ",
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Suspense>
        <GachaApp />
      </Suspense>
    </div>
  );
}
