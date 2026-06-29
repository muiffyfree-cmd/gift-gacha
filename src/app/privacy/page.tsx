import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 誕プレガチャ",
  description: "誕プレガチャのプライバシーポリシーページです。",
};

export default function PrivacyPage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <Image
        src="/home-background.png"
        alt=""
        fill
        priority
        aria-hidden
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div className="relative max-w-2xl mx-auto px-6 py-12 text-zinc-800">
      <h1 className="text-2xl font-bold mb-8">プライバシーポリシー</h1>

      <section className="mb-8">
        <p className="text-sm text-zinc-500 mb-4">最終更新日：2026年6月29日</p>
        <p>
          むぃっふぃ（以下「当方」）が運営する「誕プレガチャ」（https://presentgacha.com、以下「当サイト」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">広告の配信について</h2>
        <p className="mb-3">
          当サイトはGoogle AdSenseを利用しており、Googleおよびそのパートナー企業が広告を配信しています。広告配信にはCookie（クッキー）が使用され、ユーザーの過去の当サイトや他サイトへのアクセス情報に基づいて広告が表示されます。
        </p>
        <p className="mb-3">
          Googleによる広告Cookieの使用は、
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Googleの広告ポリシー
          </a>
          に従って行われます。
        </p>
        <p>
          Cookieを無効にする方法や、広告のパーソナライズをオプトアウトする方法については
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            広告設定ページ
          </a>
          をご確認ください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">アクセス解析について</h2>
        <p>
          当サイトでは、サービス改善のためにアクセス解析を行う場合があります。取得するデータはIPアドレス、ブラウザ情報、閲覧ページ等の統計情報であり、個人を特定するものではありません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">個人情報の収集について</h2>
        <p>
          当サイトは、ユーザーに個人情報の入力を求めるフォーム等を設けておらず、個人情報を収集しておりません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">免責事項</h2>
        <p>
          当サイトのコンテンツ・情報について、できる限り正確な情報を提供するよう努めておりますが、正確性・安全性を保証するものではありません。当サイトの利用によって生じたいかなる損害についても、当方は一切の責任を負いません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">プライバシーポリシーの変更</h2>
        <p>
          当方は必要に応じて本ポリシーを変更することがあります。変更後のポリシーは当ページに掲載した時点で効力を生じるものとします。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">お問い合わせ</h2>
        <p>
          本ポリシーに関するお問い合わせは下記までご連絡ください。
        </p>
        <p className="mt-2">
          運営者：むぃっふぃ
          <br />
          メール：
          <a href="mailto:muiffy.free@gmail.com" className="text-blue-600 underline">
            muiffy.free@gmail.com
          </a>
        </p>
      </section>

      <div className="mt-10 border-t pt-6">
        <Link href="/" className="text-blue-600 underline text-sm">
          ← トップページに戻る
        </Link>
      </div>
    </div>
    </div>
  );
}
