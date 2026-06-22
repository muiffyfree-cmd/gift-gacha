export default function IntroBanner() {
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 pt-6">
      <div className="intro-banner-text relative flex flex-col gap-2 rounded-xl border-2 border-amber-400 px-[6%] py-[5%] text-xs leading-relaxed text-gray-700 shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-amber-200/60 ring-offset-2 sm:text-sm">
        <p>
          <span className="text-base font-bold text-pink-600 sm:text-lg">
            誕プレ
          </span>
          、それは友情、愛情の印。ただし相手に喜んでもらえるか不安ですよね？心配ですよね？？正直何あげたらいいかわかんないですよね？？
        </p>
        <p className="text-center">
          そんな時はこの
          <span className="text-base font-bold text-pink-600 sm:text-lg">
            「誕プレガチャ」
          </span>
          を使いましょう！
        </p>
        <p>
          一人で何回も回して気に入ったものを探すもよし、友達と一緒にガチャを回すことでわくわく感を共有するもよし、
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
