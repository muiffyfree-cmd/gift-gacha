export default function IntroBanner() {
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 pt-6">
      <div className="intro-banner-text relative flex flex-col gap-2 rounded-xl border-2 border-amber-400 px-[6%] py-[5%] text-xs leading-relaxed text-gray-700 shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
        <h1 className="text-sm font-bold text-gray-800 sm:text-base">
          誕生日プレゼントが決まらないときは誕プレガチャ
        </h1>
        <p>
          <span className="text-base font-bold text-pink-600 sm:text-lg">
            誕生日プレゼントが決まらない
          </span>
          、何をあげたらいいかわからない。
          <br />
          彼氏・彼女・友達・家族へのプレゼント選びで悩んでいませんか？
        </p>
        <p className="text-center">
          そんな時はこの
          <span className="text-base font-bold text-pink-600 sm:text-lg">
            「誕プレガチャ」
          </span>
          を使いましょう！
        </p>
        <p>
          ボタンを押すだけで、おすすめの誕生日プレゼント候補がランダムに出てきます。
          <br />
          中学生・高校生・大学生・社会人まで、どんな相手にも使えます。
        </p>
        <p>
          一人で何回も回して気に入ったものを探すもよし、
          <br />
          友達と一緒にガチャを回してわくわく感を共有するもよし。
        </p>
        <p>
          なにが出ても文句なし、
          <span className="text-base font-bold text-pink-600 sm:text-lg">
            「購入する」
          </span>
          で即買えちゃいます。
        </p>
        <p>それではlet&apos;s try!!!</p>
      </div>
    </div>
  );
}
