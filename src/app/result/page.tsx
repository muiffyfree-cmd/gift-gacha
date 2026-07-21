import { Suspense } from "react";
import ResultScreen from "@/components/ResultScreen";

export default function ResultPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <Suspense>
        <ResultScreen />
      </Suspense>
    </div>
  );
}
