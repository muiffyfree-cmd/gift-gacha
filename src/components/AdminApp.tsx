"use client";

import { useEffect, useState } from "react";
import type { Prize, Rarity } from "@/types/gacha";
import {
  exportAllData,
  importAllData,
  loadAdminPassword,
  loadEffects,
  loadPurchaseCounts,
  loadVisitStats,
  saveAdminPassword,
  saveEffects,
  type BackupData,
  type PurchaseCount,
  type RarityEffects,
  type VisitStats,
} from "@/lib/storage";
import { createItem, deleteItem, fetchItems, updateItem } from "@/lib/items";
import { RARITY_BADGE_CLASSES, RARITY_LABELS, RARITY_OPTIONS } from "@/lib/rarity";

function emptyForm(): Omit<Prize, "id"> {
  return {
    name: "",
    rarity: "N",
    price: undefined,
    description: "",
    affiliateUrl: "",
    affiliateHtml: "",
  };
}

export default function AdminApp() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Prize, "id">>(emptyForm());
  const [purchaseCounts, setPurchaseCounts] = useState<PurchaseCount[]>([]);
  const [effects, setEffects] = useState<RarityEffects>({});
  const [newEffectUrls, setNewEffectUrls] = useState<Partial<Record<Rarity, string>>>({});
  const [adminPassword, setAdminPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newPasswordMemo, setNewPasswordMemo] = useState("");
  const [visitStats, setVisitStats] = useState<VisitStats>({});
  const [backupMessage, setBackupMessage] = useState("");
  const [prizesError, setPrizesError] = useState("");

  useEffect(() => {
    fetchItems()
      .then(setPrizes)
      .catch((err) => setPrizesError(err instanceof Error ? err.message : "候補一覧の取得に失敗しました。"));
    setPurchaseCounts(loadPurchaseCounts());
    setEffects(loadEffects());
    setAdminPassword(loadAdminPassword());
    setVisitStats(loadVisitStats());
  }, []);

  function handleUnlock() {
    if (passwordInput === adminPassword) {
      setUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("パスワードが違います。");
    }
  }

  function handleSetPassword() {
    const next = newPasswordMemo.trim();
    if (!next) return;
    saveAdminPassword(next);
    setAdminPassword(next);
    setNewPasswordMemo("");
  }

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gacha-gift-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as BackupData;
        importAllData(data);
        setEffects(loadEffects());
        setPurchaseCounts(loadPurchaseCounts());
        setVisitStats(loadVisitStats());
        setBackupMessage("バックアップを読み込みました。");
      } catch {
        setBackupMessage("ファイルの読み込みに失敗しました。");
      }
    };
    reader.readAsText(file);
  }

  function addEffect(rarity: Rarity) {
    const url = (newEffectUrls[rarity] ?? "").trim();
    if (!url) return;
    setEffects((prev) => {
      const next = { ...prev, [rarity]: [...(prev[rarity] ?? []), url] };
      saveEffects(next);
      return next;
    });
    setNewEffectUrls((prev) => ({ ...prev, [rarity]: "" }));
  }

  function removeEffect(rarity: Rarity, index: number) {
    setEffects((prev) => {
      const next = {
        ...prev,
        [rarity]: (prev[rarity] ?? []).filter((_, i) => i !== index),
      };
      saveEffects(next);
      return next;
    });
  }

  function startAdd() {
    setEditingId("new");
    setForm(emptyForm());
  }

  function startEdit(prize: Prize) {
    setEditingId(prize.id);
    setForm({
      name: prize.name,
      rarity: prize.rarity,
      price: prize.price,
      description: prize.description ?? "",
      affiliateUrl: prize.affiliateUrl ?? "",
      affiliateHtml: prize.affiliateHtml ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) return;
    const price = form.price !== undefined && !Number.isNaN(form.price) ? form.price : undefined;
    const description = form.description?.trim() || undefined;
    const affiliateUrl = form.affiliateUrl?.trim() || undefined;
    const affiliateHtml = form.affiliateHtml?.trim() || undefined;
    const payload = { name, rarity: form.rarity, price, description, affiliateUrl, affiliateHtml };

    try {
      if (editingId === "new") {
        const created = await createItem(payload);
        setPrizes((prev) => [...prev, created]);
      } else if (editingId) {
        const updated = await updateItem(editingId, payload);
        setPrizes((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      }
      setPrizesError("");
      cancelEdit();
    } catch (err) {
      setPrizesError(err instanceof Error ? err.message : "保存に失敗しました。");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem(id);
      setPrizes((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) cancelEdit();
      setPrizesError("");
    } catch (err) {
      setPrizesError(err instanceof Error ? err.message : "削除に失敗しました。");
    }
  }

  if (!adminPassword) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-20">
        <h1 className="text-xl font-bold text-gray-800">パスワードの設定</h1>
        <p className="text-sm text-gray-500">
          管理者画面に入るためのパスワードをメモに記述してください。次回以降の入室時に使います。
        </p>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          パスワード（メモ）
          <input
            type="text"
            value={newPasswordMemo}
            onChange={(e) => setNewPasswordMemo(e.target.value)}
            placeholder="ここにパスワードを記述"
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
          />
        </label>
        <button
          onClick={handleSetPassword}
          disabled={!newPasswordMemo.trim()}
          className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          設定する
        </button>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-20">
        <h1 className="text-xl font-bold text-gray-800">管理者ログイン</h1>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          パスワード
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="パスワードを入力"
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
          />
        </label>
        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
        <button
          onClick={handleUnlock}
          className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
        >
          ログイン
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">
          🛠 ガチャ管理画面（muiffybase）
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          プレゼント候補の名前・レアリティ・金額・アフィリエイトURLを管理します。
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">候補一覧</h2>
          {editingId === null && (
            <button
              onClick={startAdd}
              className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            >
              + 新規追加
            </button>
          )}
        </div>

        {prizesError && <p className="mb-2 text-sm text-red-600">{prizesError}</p>}

        {prizes.length === 0 && editingId === null && !prizesError && (
          <p className="text-sm text-gray-400">候補がまだありません。</p>
        )}

        <ul className="flex flex-col gap-2">
          {prizes.map((prize) => (
            <li
              key={prize.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <div className="flex flex-1 items-center gap-3 overflow-hidden">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${RARITY_BADGE_CLASSES[prize.rarity]}`}
                >
                  {RARITY_LABELS[prize.rarity]}
                </span>
                <span className="truncate font-medium text-gray-800">
                  {prize.name}
                </span>
                {prize.price !== undefined && (
                  <span className="shrink-0 text-xs text-gray-500">
                    ¥{prize.price.toLocaleString()}
                  </span>
                )}
                {prize.affiliateUrl && (
                  <a
                    href={prize.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="truncate text-xs text-blue-500 underline"
                  >
                    {prize.affiliateUrl}
                  </a>
                )}
                {prize.affiliateHtml && (
                  <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    画像コード設定済み
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => startEdit(prize)}
                  className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(prize.id)}
                  className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {editingId !== null && (
        <section className="rounded-xl border border-pink-300 bg-pink-50 p-4">
          <h2 className="mb-3 font-semibold text-gray-700">
            {editingId === "new" ? "新規候補の追加" : "候補の編集"}
          </h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              名前
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例: ぬいぐるみ"
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              レアリティ
              <select
                value={form.rarity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rarity: e.target.value as Rarity }))
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
              >
                {RARITY_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {RARITY_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              金額（任意・円）
              <input
                type="number"
                min={0}
                value={form.price ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    price: e.target.value === "" ? undefined : Number(e.target.value),
                  }))
                }
                placeholder="例: 1980"
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              商品説明（任意）
              <textarea
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="例: ふわふわの肌触りが人気のぬいぐるみ"
                rows={3}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              アフィリエイトURL（任意）
              <input
                type="url"
                value={form.affiliateUrl ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, affiliateUrl: e.target.value }))
                }
                placeholder="https://..."
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              アフィリエイト画像コード（任意・楽天等のリンク+画像のHTML）
              <textarea
                value={form.affiliateHtml ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, affiliateHtml: e.target.value }))
                }
                placeholder='<a href="..."><img src="..." ...></a>'
                rows={4}
                className="rounded border border-gray-300 px-3 py-2 font-mono text-xs focus:border-pink-400 focus:outline-none"
              />
              {form.affiliateHtml && (
                <div className="mt-1">
                  <p className="mb-1 text-xs text-gray-400">プレビュー：</p>
                  <div
                    className="inline-block"
                    dangerouslySetInnerHTML={{ __html: form.affiliateHtml }}
                  />
                </div>
              )}
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                保存
              </button>
              <button
                onClick={cancelEdit}
                className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">データのバックアップ</h2>
        <p className="mb-3 text-sm text-gray-500">
          景品データなどはブラウザ内にのみ保存されています。キャッシュ削除や別端末でのアクセスで消えてしまうため、定期的にエクスポートして保存しておくことをおすすめします。
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            エクスポート（ダウンロード）
          </button>
          <label className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
            インポート（ファイル選択）
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {backupMessage && <p className="mt-2 text-sm text-gray-600">{backupMessage}</p>}
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">ウェブ解析（来場人数）</h2>
        {(() => {
          const today = new Date().toISOString().slice(0, 10);
          const todayCount = visitStats[today] ?? 0;
          const totalCount = Object.values(visitStats).reduce((a, b) => a + b, 0);
          const recentDays = Object.entries(visitStats)
            .sort((a, b) => (a[0] < b[0] ? 1 : -1))
            .slice(0, 7);
          return (
            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                  <p className="text-xs text-gray-500">今日の来場人数</p>
                  <p className="text-xl font-bold text-gray-800">{todayCount}人</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2">
                  <p className="text-xs text-gray-500">累計来場人数</p>
                  <p className="text-xl font-bold text-gray-800">{totalCount}人</p>
                </div>
              </div>
              {recentDays.length === 0 ? (
                <p className="text-sm text-gray-400">まだ来場データがありません。</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {recentDays.map(([date, count]) => (
                    <li
                      key={date}
                      className="flex items-center justify-between rounded border border-gray-100 bg-white px-3 py-1 text-sm"
                    >
                      <span className="text-gray-600">{date}</span>
                      <span className="font-medium text-gray-800">{count}人</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">パスワードの変更</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPasswordMemo}
            onChange={(e) => setNewPasswordMemo(e.target.value)}
            placeholder="新しいパスワードをメモに記述"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
          />
          <button
            onClick={handleSetPassword}
            disabled={!newPasswordMemo.trim()}
            className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            変更する
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">売れた商品ランキング</h2>
        {purchaseCounts.length === 0 ? (
          <p className="text-sm text-gray-400">まだ購入リンクが押されていません。</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {[...purchaseCounts]
              .sort((a, b) => b.count - a.count)
              .map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">{i + 1}位</span>
                    <span className="font-medium text-gray-800">{c.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {c.count}回購入
                  </span>
                </li>
              ))}
          </ol>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">演出（動画）の管理</h2>
        <div className="flex flex-col gap-4">
          {RARITY_OPTIONS.map((rarity) => (
            <div key={rarity} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${RARITY_BADGE_CLASSES[rarity]}`}
                >
                  {RARITY_LABELS[rarity]}
                </span>
              </div>
              <ul className="mb-2 flex flex-col gap-1">
                {(effects[rarity] ?? []).map((url, i) => (
                  <li
                    key={`${rarity}-${i}`}
                    className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                  >
                    <span className="truncate text-gray-700">{url}</span>
                    <button
                      onClick={() => removeEffect(rarity, i)}
                      className="shrink-0 rounded bg-red-100 px-2 py-1 font-medium text-red-600 hover:bg-red-200"
                    >
                      削除
                    </button>
                  </li>
                ))}
                {(effects[rarity] ?? []).length === 0 && (
                  <li className="text-xs text-gray-400">演出が設定されていません。</li>
                )}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEffectUrls[rarity] ?? ""}
                  onChange={(e) =>
                    setNewEffectUrls((prev) => ({ ...prev, [rarity]: e.target.value }))
                  }
                  placeholder="/effect-xxx.mp4"
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
                />
                <button
                  onClick={() => addEffect(rarity)}
                  className="rounded bg-pink-600 px-3 py-1 text-xs font-semibold text-white hover:bg-pink-700"
                >
                  + 追加
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
