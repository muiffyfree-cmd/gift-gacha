"use client";

const THUMB_CLASSES =
  "absolute left-0 top-0 m-0 h-2 w-full appearance-none bg-transparent pointer-events-none " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full " +
  "[&::-webkit-slider-thumb]:bg-pink-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white " +
  "[&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 " +
  "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full " +
  "[&::-moz-range-thumb]:bg-pink-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white " +
  "[&::-moz-range-thumb]:shadow [&::-moz-range-thumb]:cursor-pointer";

export default function PriceRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const [low, high] = value;
  const span = Math.max(max - min, 1);
  const lowPercent = ((low - min) / span) * 100;
  const highPercent = ((high - min) / span) * 100;

  function handleLowChange(next: number) {
    onChange([Math.min(next, high), high]);
  }

  function handleHighChange(next: number) {
    onChange([low, Math.max(next, low)]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-5">
        <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-pink-400"
          style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => handleLowChange(Number(e.target.value))}
          className={THUMB_CLASSES}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => handleHighChange(Number(e.target.value))}
          className={THUMB_CLASSES}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>¥{low.toLocaleString()}</span>
        <span>¥{high.toLocaleString()}</span>
      </div>
    </div>
  );
}
