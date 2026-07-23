import type { Metadata } from "next";
import { Suspense } from "react";
import GachaApp from "@/components/GachaApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "誕生日プレゼントがわからない・決まらない人へ｜おすすめ誕プレをガチャで",
  description:
    "何をあげればいいかわからない、決まらない、思いつかない…そんな時は「誕プレガチャ」。ボタンを押すだけで誕生日プレゼント候補が出てきます。",
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
