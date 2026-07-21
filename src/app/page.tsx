import type { Metadata } from "next";
import { Suspense } from "react";
import GachaApp from "@/components/GachaApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "誕生日プレゼントがわからない・決まらない人へ｜おすすめ誕プレをガチャで",
  description:
    "何をあげればいいかわからない、決まらない、思いつかない…そんな時は「誕プレガチャ」。ボタンを押すだけで誕生日プレゼント候補が出てきます。",
};

const HOME_SEO_TEXT = `「誕生日プレゼント、どれがいいかわからない」「なかなか決まらない」「思いつかない」——そんなときは誕プレガチャにおまかせください。誕プレガチャは、ボタンを押すだけで誕生日プレゼントの候補がランダムに出てくる、シンプルで使いやすいツールです。相手のことをよく考えて選びたいけれど、何をあげればいいのか決まらない、という経験は誰にでもあるはず。そんなときにガチャを回せば、思いつかなかったアイデアに出会えるかもしれません。対象は中学生・高校生・大学生・社会人まで幅広く対応しており、彼氏・彼女・友達・家族への誕生日プレゼント選びに、そのままお使いいただけます。一度で決まらなくても心配はいりません。気に入る候補が出るまで、何度でも気軽に回して探せます。おすすめの誕生日プレゼントが、ボタン一つできっと見つかります。`;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Suspense>
        <GachaApp />
      </Suspense>

      <section className="mx-auto w-full max-w-xl px-4 pb-10">
        <h1 className="text-lg font-bold text-gray-700">
          誕生日プレゼントがわからない・決まらないときは誕プレガチャ
        </h1>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-500">
          {HOME_SEO_TEXT}
        </p>
      </section>
    </div>
  );
}
