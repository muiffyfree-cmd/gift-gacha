"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Prize, Rarity } from "@/types/gacha";
import type { Article, ArticleItem } from "@/types/article";
import {
  exportAllData,
  importAllData,
  loadEffects,
  loadPurchaseCounts,
  loadRarityWeights,
  loadVisitStats,
  saveEffects,
  saveRarityWeights,
  type BackupData,
  type PurchaseCount,
  type RarityEffects,
  type RarityWeights,
  type VisitStats,
} from "@/lib/storage";
import { createItem, deleteItem, fetchItems, syncItemTags, updateItem } from "@/lib/items";
import {
  createArticle,
  deleteArticle,
  fetchAllArticlesForAdmin,
  updateArticle,
  type ArticleInput,
} from "@/lib/articles";
import { slugify } from "@/lib/slug";
import { parseCsvRecords } from "@/lib/csv";
import { checkIsAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { uploadEffectVideo } from "@/lib/uploads";
import {
  createItemGender,
  createItemRecipient,
  createItemType,
  deleteItemGender,
  deleteItemRecipient,
  deleteItemType,
  fetchItemGenders,
  fetchItemRecipients,
  fetchItemTypes,
  type Tag,
} from "@/lib/tags";
import { RARITY_BADGE_CLASSES, RARITY_LABELS, RARITY_OPTIONS } from "@/lib/rarity";

type ArticleItemFormRow = {
  name: string;
  price: string;
  introText: string;
  affiliateHtml: string;
  purchaseUrl: string;
  snsUrl: string;
  itemId?: string;
  newItemRarity: Rarity;
  type?: string;
  recipients: string[];
  gender?: string;
};

function emptyArticleItemRow(): ArticleItemFormRow {
  return {
    name: "",
    price: "",
    introText: "",
    affiliateHtml: "",
    purchaseUrl: "",
    snsUrl: "",
    itemId: undefined,
    newItemRarity: "N",
    type: undefined,
    recipients: [],
    gender: undefined,
  };
}

function parsePriceText(text: string): number | undefined {
  const match = text.replace(/,/g, "").match(/\d+/);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isNaN(value) ? undefined : value;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

type ArticleFormState = {
  title: string;
  slug: string;
  description: string;
  published: boolean;
  items: ArticleItemFormRow[];
};

function emptyArticleForm(): ArticleFormState {
  return {
    title: "",
    slug: "",
    description: "",
    published: false,
    items: [],
  };
}

function emptyForm(): Omit<Prize, "id"> {
  return {
    name: "",
    rarity: "N",
    price: undefined,
    description: "",
    affiliateUrl: "",
    affiliateHtml: "",
    type: undefined,
    recipients: [],
    gender: undefined,
  };
}

export default function AdminApp() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Prize, "id">>(emptyForm());
  const [purchaseCounts, setPurchaseCounts] = useState<PurchaseCount[]>([]);
  const [effects, setEffects] = useState<RarityEffects>({});
  const [newEffectUrls, setNewEffectUrls] = useState<Partial<Record<Rarity, string>>>({});
  const [uploadingRarity, setUploadingRarity] = useState<Rarity | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [visitStats, setVisitStats] = useState<VisitStats>({});
  const [backupMessage, setBackupMessage] = useState("");
  const [prizesError, setPrizesError] = useState("");
  const [rarityWeights, setRarityWeights] = useState<RarityWeights | null>(null);
  const [itemTypes, setItemTypes] = useState<Tag[]>([]);
  const [itemRecipients, setItemRecipients] = useState<Tag[]>([]);
  const [itemGenders, setItemGenders] = useState<Tag[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newGenderName, setNewGenderName] = useState("");
  const [tagsError, setTagsError] = useState("");

  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesError, setArticlesError] = useState("");
  const [articleEditingId, setArticleEditingId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState<ArticleFormState>(emptyArticleForm());
  const [articleSlugTouched, setArticleSlugTouched] = useState(false);
  const [articleCsvError, setArticleCsvError] = useState("");
  const [itemGachaRarity, setItemGachaRarityState] = useState<Record<string, Rarity>>({});
  const [gachaConvertMessage, setGachaConvertMessage] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) {
      setIsAdmin(null);
      return;
    }
    checkIsAdmin(email).then(setIsAdmin);
  }, [session]);

  useEffect(() => {
    if (!session || !isAdmin) return;
    fetchItems()
      .then(setPrizes)
      .catch((err) => setPrizesError(getErrorMessage(err, "候補一覧の取得に失敗しました。")));
    setPurchaseCounts(loadPurchaseCounts());
    setEffects(loadEffects());
    setVisitStats(loadVisitStats());
    setRarityWeights(loadRarityWeights());
    fetchItemTypes().then(setItemTypes).catch(() => {});
    fetchItemRecipients().then(setItemRecipients).catch(() => {});
    fetchItemGenders().then(setItemGenders).catch(() => {});
    fetchAllArticlesForAdmin()
      .then(setArticles)
      .catch((err) => setArticlesError(getErrorMessage(err, "記事一覧の取得に失敗しました。")));
  }, [session, isAdmin]);

  async function handleAddType() {
    const name = newTypeName.trim();
    if (!name) return;
    try {
      const created = await createItemType(name);
      setItemTypes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTypeName("");
      setTagsError("");
    } catch (err) {
      setTagsError(getErrorMessage(err, "種類の追加に失敗しました。"));
    }
  }

  async function handleDeleteType(id: string) {
    try {
      await deleteItemType(id);
      setItemTypes((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTagsError(getErrorMessage(err, "種類の削除に失敗しました。"));
    }
  }

  async function handleAddRecipient() {
    const name = newRecipientName.trim();
    if (!name) return;
    try {
      const created = await createItemRecipient(name);
      setItemRecipients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewRecipientName("");
      setTagsError("");
    } catch (err) {
      setTagsError(getErrorMessage(err, "相手の追加に失敗しました。"));
    }
  }

  async function handleDeleteRecipient(id: string) {
    try {
      await deleteItemRecipient(id);
      setItemRecipients((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTagsError(getErrorMessage(err, "相手の削除に失敗しました。"));
    }
  }

  function toggleRecipient(name: string) {
    setForm((f) => {
      const current = f.recipients ?? [];
      const next = current.includes(name)
        ? current.filter((r) => r !== name)
        : [...current, name];
      return { ...f, recipients: next };
    });
  }

  function selectType(name: string) {
    setForm((f) => ({ ...f, type: f.type === name ? undefined : name }));
  }

  function selectGender(name: string) {
    setForm((f) => ({ ...f, gender: f.gender === name ? undefined : name }));
  }

  async function handleAddGender() {
    const name = newGenderName.trim();
    if (!name) return;
    try {
      const created = await createItemGender(name);
      setItemGenders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewGenderName("");
      setTagsError("");
    } catch (err) {
      setTagsError(getErrorMessage(err, "性別の追加に失敗しました。"));
    }
  }

  async function handleDeleteGender(id: string) {
    try {
      await deleteItemGender(id);
      setItemGenders((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTagsError(getErrorMessage(err, "性別の削除に失敗しました。"));
    }
  }

  function handleWeightChange(rarity: Rarity, value: number) {
    setRarityWeights((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [rarity]: value };
      saveRarityWeights(next);
      return next;
    });
  }

  async function handleLogin() {
    setLoginLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoginLoading(false);
    if (error) {
      setLoginError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      return;
    }
    setLoginPassword("");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(null);
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

  function appendEffectUrl(rarity: Rarity, url: string) {
    setEffects((prev) => {
      const next = { ...prev, [rarity]: [...(prev[rarity] ?? []), url] };
      saveEffects(next);
      return next;
    });
  }

  function addEffect(rarity: Rarity) {
    const url = (newEffectUrls[rarity] ?? "").trim();
    if (!url) return;
    appendEffectUrl(rarity, url);
    setNewEffectUrls((prev) => ({ ...prev, [rarity]: "" }));
  }

  async function handleUploadEffect(rarity: Rarity, file: File) {
    setUploadingRarity(rarity);
    setUploadError("");
    try {
      const url = await uploadEffectVideo(file);
      appendEffectUrl(rarity, url);
    } catch (err) {
      setUploadError(getErrorMessage(err, "アップロードに失敗しました。"));
    } finally {
      setUploadingRarity(null);
    }
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
      type: prize.type,
      recipients: prize.recipients ?? [],
      gender: prize.gender,
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
    const payload = {
      name,
      rarity: form.rarity,
      price,
      description,
      affiliateUrl,
      affiliateHtml,
      type: form.type,
      recipients: form.recipients,
      gender: form.gender,
    };

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
      setPrizesError(getErrorMessage(err, "保存に失敗しました。"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteItem(id);
      setPrizes((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) cancelEdit();
      setPrizesError("");
    } catch (err) {
      setPrizesError(getErrorMessage(err, "削除に失敗しました。"));
    }
  }

  function startAddArticle() {
    setArticleEditingId("new");
    setArticleForm(emptyArticleForm());
    setArticleSlugTouched(false);
    setArticleCsvError("");
  }

  function startEditArticle(article: Article) {
    setArticleEditingId(article.id);
    setArticleForm({
      title: article.title,
      slug: article.slug,
      description: article.description ?? "",
      published: article.published,
      items: article.items.map((item) => ({
        name: item.name,
        price: item.price ?? "",
        introText: item.introText ?? "",
        affiliateHtml: item.affiliateHtml ?? "",
        purchaseUrl: item.purchaseUrl ?? "",
        snsUrl: item.snsUrl ?? "",
        itemId: item.itemId,
        newItemRarity: "N",
        type: item.type,
        recipients: item.recipients ?? [],
        gender: item.gender,
      })),
    });
    setArticleSlugTouched(true);
    setArticleCsvError("");
  }

  function cancelArticleEdit() {
    setArticleEditingId(null);
    setArticleForm(emptyArticleForm());
    setArticleSlugTouched(false);
  }

  function handleArticleTitleChange(value: string) {
    setArticleForm((f) => ({
      ...f,
      title: value,
      slug: articleSlugTouched ? f.slug : slugify(value),
    }));
  }

  function selectArticleItemLinkedItem(index: number, itemId: string) {
    setArticleForm((f) => ({
      ...f,
      items: f.items.map((row, i) => (i === index ? { ...row, itemId: itemId || undefined } : row)),
    }));
  }

  function setArticleItemNewRarity(index: number, rarity: Rarity) {
    setArticleForm((f) => ({
      ...f,
      items: f.items.map((row, i) => (i === index ? { ...row, newItemRarity: rarity } : row)),
    }));
  }

  async function createItemFromArticleRow(index: number) {
    const row = articleForm.items[index];
    const name = row.name.trim();
    if (!name) return;
    try {
      const created = await createItem({
        name,
        rarity: row.newItemRarity,
        price: parsePriceText(row.price),
        description: row.introText.trim() || undefined,
        affiliateUrl: row.purchaseUrl.trim() || undefined,
        affiliateHtml: row.affiliateHtml.trim() || undefined,
        type: row.type,
        recipients: row.recipients,
        gender: row.gender,
      });
      setPrizes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      selectArticleItemLinkedItem(index, created.id);
      setArticlesError("");
    } catch (err) {
      setArticlesError(getErrorMessage(err, "景品の追加に失敗しました。"));
    }
  }

  function selectArticleItemType(index: number, name: string) {
    setArticleForm((f) => ({
      ...f,
      items: f.items.map((row, i) =>
        i === index ? { ...row, type: row.type === name ? undefined : name } : row
      ),
    }));
  }

  function toggleArticleItemRecipient(index: number, name: string) {
    setArticleForm((f) => ({
      ...f,
      items: f.items.map((row, i) => {
        if (i !== index) return row;
        const next = row.recipients.includes(name)
          ? row.recipients.filter((r) => r !== name)
          : [...row.recipients, name];
        return { ...row, recipients: next };
      }),
    }));
  }

  function selectArticleItemGender(index: number, name: string) {
    setArticleForm((f) => ({
      ...f,
      items: f.items.map((row, i) =>
        i === index ? { ...row, gender: row.gender === name ? undefined : name } : row
      ),
    }));
  }

  function handleArticleCsvUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const records = parseCsvRecords(String(reader.result));
        if (records.length === 0) {
          setArticleCsvError("CSVから商品を読み取れませんでした。");
          return;
        }
        const items: ArticleItemFormRow[] = records.map((record) => ({
          name: record["商品名"] ?? "",
          price: record["金額"] ?? "",
          introText: record["商品説明"] ?? "",
          affiliateHtml: record["HTML"] ?? record["アフィリエイトHTML"] ?? "",
          purchaseUrl: record["購入URL"] ?? record["URL"] ?? "",
          snsUrl: "",
          newItemRarity: "N",
          type: undefined,
          recipients: [],
          gender: undefined,
        }));
        setArticleForm((f) => ({
          ...f,
          items,
          description:
            f.description.trim() === ""
              ? `${items.map((row) => row.name).join("・")} をSNSで紹介しました。`
              : f.description,
        }));
        setArticleCsvError("");
      } catch {
        setArticleCsvError("CSVの読み込みに失敗しました。形式を確認してください。");
      }
    };
    reader.readAsText(file);
  }

  function addBlankArticleItemRow() {
    setArticleForm((f) => ({ ...f, items: [...f.items, emptyArticleItemRow()] }));
  }

  function removeProductFromArticle(index: number) {
    setArticleForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  function moveProductInArticle(index: number, direction: -1 | 1) {
    setArticleForm((f) => {
      const target = index + direction;
      if (target < 0 || target >= f.items.length) return f;
      const items = [...f.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { ...f, items };
    });
  }

  function updateArticleItemField(
    index: number,
    field: "name" | "price" | "introText" | "affiliateHtml" | "purchaseUrl" | "snsUrl",
    value: string
  ) {
    setArticleForm((f) => ({
      ...f,
      items: f.items.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  }

  async function handleSaveArticle() {
    const title = articleForm.title.trim();
    const slug = slugify(articleForm.slug.trim());
    if (!title || !slug || articleForm.items.length === 0) return;
    const payload: ArticleInput = {
      title,
      slug,
      description: articleForm.description.trim() || undefined,
      published: articleForm.published,
      items: articleForm.items.map((row, i) => ({
        name: row.name.trim(),
        price: row.price.trim() || undefined,
        introText: row.introText.trim() || undefined,
        affiliateHtml: row.affiliateHtml.trim() || undefined,
        purchaseUrl: row.purchaseUrl.trim() || undefined,
        snsUrl: row.snsUrl.trim() || undefined,
        itemId: row.itemId,
        type: row.type,
        recipients: row.recipients,
        gender: row.gender,
        sortOrder: i,
      })),
    };

    try {
      if (articleEditingId === "new") {
        const created = await createArticle(payload);
        setArticles((prev) => [created, ...prev]);
      } else if (articleEditingId) {
        const updated = await updateArticle(articleEditingId, payload);
        setArticles((prev) => prev.map((a) => (a.id === articleEditingId ? updated : a)));
      }
      setArticlesError("");

      const linkedRows = articleForm.items.filter((row) => row.itemId);
      if (linkedRows.length > 0) {
        await Promise.all(
          linkedRows.map((row) =>
            syncItemTags(row.itemId as string, {
              type: row.type,
              recipients: row.recipients,
              gender: row.gender,
            })
          )
        );
        setPrizes(await fetchItems());
      }

      cancelArticleEdit();
    } catch (err) {
      setArticlesError(getErrorMessage(err, "記事の保存に失敗しました。"));
    }
  }

  async function handleDeleteArticle(id: string) {
    try {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      if (articleEditingId === id) cancelArticleEdit();
      setArticlesError("");
    } catch (err) {
      setArticlesError(getErrorMessage(err, "記事の削除に失敗しました。"));
    }
  }

  async function handleToggleArticlePublished(article: Article) {
    try {
      const updated = await updateArticle(article.id, {
        title: article.title,
        slug: article.slug,
        description: article.description,
        published: !article.published,
        items: article.items.map((item, i) => ({
          name: item.name,
          price: item.price,
          snsUrl: item.snsUrl,
          introText: item.introText,
          affiliateHtml: item.affiliateHtml,
          purchaseUrl: item.purchaseUrl,
          type: item.type,
          recipients: item.recipients,
          gender: item.gender,
          sortOrder: i,
        })),
      });
      setArticles((prev) => prev.map((a) => (a.id === article.id ? updated : a)));
    } catch (err) {
      setArticlesError(getErrorMessage(err, "公開状態の更新に失敗しました。"));
    }
  }

  function getItemGachaRarity(itemId: string): Rarity {
    return itemGachaRarity[itemId] ?? "N";
  }

  function setItemGachaRarity(itemId: string, rarity: Rarity) {
    setItemGachaRarityState((prev) => ({ ...prev, [itemId]: rarity }));
  }

  async function handleAddArticleItemToGacha(item: ArticleItem) {
    if (!item.name.trim()) return;
    if (prizes.some((p) => p.name === item.name)) {
      setGachaConvertMessage(`「${item.name}」は既にガチャ候補に存在するため追加しませんでした。`);
      return;
    }
    try {
      const created = await createItem({
        name: item.name,
        rarity: getItemGachaRarity(item.id),
        price: item.price ? parsePriceText(item.price) : undefined,
        description: item.introText,
        affiliateHtml: item.affiliateHtml,
      });
      setPrizes((prev) => [...prev, created]);
      setGachaConvertMessage(`「${item.name}」をガチャ景品に追加しました。`);
    } catch (err) {
      setGachaConvertMessage(
        getErrorMessage(err, "ガチャ景品への追加に失敗しました。")
      );
    }
  }

  async function handleAddAllArticleItemsToGacha(article: Article) {
    const existingNames = new Set(prizes.map((p) => p.name));
    const toCreate = article.items.filter(
      (item) => item.name.trim() !== "" && !existingNames.has(item.name)
    );
    const skipped = article.items.length - toCreate.length;
    try {
      const created = await Promise.all(
        toCreate.map((item) =>
          createItem({
            name: item.name,
            rarity: getItemGachaRarity(item.id),
            price: item.price ? parsePriceText(item.price) : undefined,
            description: item.introText,
            affiliateHtml: item.affiliateHtml,
          })
        )
      );
      setPrizes((prev) => [...prev, ...created]);
      setGachaConvertMessage(
        `「${article.title}」の商品を${created.length}件ガチャ景品に追加しました。${
          skipped > 0 ? `(${skipped}件は既存の商品名と重複のためスキップ)` : ""
        }`
      );
    } catch (err) {
      setGachaConvertMessage(
        getErrorMessage(err, "ガチャ景品への追加に失敗しました。")
      );
    }
  }

  if (authLoading) {
    return <div className="px-4 py-20 text-center text-sm text-gray-400">読み込み中...</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-20">
        <h1 className="text-xl font-bold text-gray-800">管理者ログイン</h1>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          メールアドレス
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="admin@example.com"
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          パスワード
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="パスワードを入力"
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
          />
        </label>
        {loginError && <p className="text-sm text-red-600">{loginError}</p>}
        <button
          onClick={handleLogin}
          disabled={loginLoading || !loginEmail.trim() || !loginPassword}
          className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loginLoading ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    );
  }

  if (isAdmin === null) {
    return <div className="px-4 py-20 text-center text-sm text-gray-400">確認中...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-20">
        <h1 className="text-xl font-bold text-gray-800">アクセス権限がありません</h1>
        <p className="text-sm text-gray-500">
          {session.user.email} は管理者として登録されていません。管理者に追加してもらってください。
        </p>
        <button
          onClick={handleLogout}
          className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            🛠 ガチャ管理画面（muiffybase）
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            プレゼント候補の名前・レアリティ・金額・アフィリエイトURLを管理します。
          </p>
          <p className="mt-1 text-xs text-gray-400">ログイン中: {session.user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="shrink-0 rounded bg-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-300"
        >
          ログアウト
        </button>
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
                {prize.type && (
                  <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {prize.type}
                  </span>
                )}
                {prize.recipients && prize.recipients.length > 0 && (
                  <span className="shrink-0 truncate text-xs text-gray-500">
                    {prize.recipients.join("・")}
                  </span>
                )}
                {prize.gender && (
                  <span className="shrink-0 rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    {prize.gender}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={cancelEdit}
        >
          <section
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-pink-300 bg-pink-50 p-4 shadow-xl"
          >
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

            <div className="flex flex-col gap-1 text-sm text-gray-600">
              種類（任意・1つ選択）
              <div className="flex flex-wrap gap-2">
                {itemTypes.length === 0 && (
                  <p className="text-xs text-gray-400">
                    種類の候補がまだありません。下の「タグ管理」で追加してください。
                  </p>
                )}
                {itemTypes.map((t) => {
                  const selected = form.type === t.name;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectType(t.name)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? "border-pink-600 bg-pink-600 text-white"
                          : "border-gray-300 bg-white text-gray-600 hover:border-pink-300"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm text-gray-600">
              相手（任意・複数選択可）
              <div className="flex flex-wrap gap-2">
                {itemRecipients.length === 0 && (
                  <p className="text-xs text-gray-400">
                    相手の候補がまだありません。下の「タグ管理」で追加してください。
                  </p>
                )}
                {itemRecipients.map((r) => {
                  const selected = (form.recipients ?? []).includes(r.name);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRecipient(r.name)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? "border-pink-600 bg-pink-600 text-white"
                          : "border-gray-300 bg-white text-gray-600 hover:border-pink-300"
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm text-gray-600">
              性別（任意・1つ選択）
              <div className="flex flex-wrap gap-2">
                {itemGenders.length === 0 && (
                  <p className="text-xs text-gray-400">
                    性別の候補がまだありません。下の「タグ管理」で追加してください。
                  </p>
                )}
                {itemGenders.map((g) => {
                  const selected = form.gender === g.name;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => selectGender(g.name)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? "border-pink-600 bg-pink-600 text-white"
                          : "border-gray-300 bg-white text-gray-600 hover:border-pink-300"
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>

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
        </div>
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
        <h2 className="mb-3 font-semibold text-gray-700">タグ管理（種類・相手・性別）</h2>
        {tagsError && <p className="mb-2 text-sm text-red-600">{tagsError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-600">種類（単一選択用）</h3>
            <ul className="mb-2 flex flex-col gap-1">
              {itemTypes.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                >
                  <span className="truncate text-gray-700">{t.name}</span>
                  <button
                    onClick={() => handleDeleteType(t.id)}
                    className="shrink-0 rounded bg-red-100 px-2 py-1 font-medium text-red-600 hover:bg-red-200"
                  >
                    削除
                  </button>
                </li>
              ))}
              {itemTypes.length === 0 && (
                <li className="text-xs text-gray-400">種類がまだありません。</li>
              )}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="例: 雑貨"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
              />
              <button
                onClick={handleAddType}
                className="rounded bg-pink-600 px-3 py-1 text-xs font-semibold text-white hover:bg-pink-700"
              >
                + 追加
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-600">相手（複数選択用）</h3>
            <ul className="mb-2 flex flex-col gap-1">
              {itemRecipients.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                >
                  <span className="truncate text-gray-700">{r.name}</span>
                  <button
                    onClick={() => handleDeleteRecipient(r.id)}
                    className="shrink-0 rounded bg-red-100 px-2 py-1 font-medium text-red-600 hover:bg-red-200"
                  >
                    削除
                  </button>
                </li>
              ))}
              {itemRecipients.length === 0 && (
                <li className="text-xs text-gray-400">相手がまだありません。</li>
              )}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRecipientName}
                onChange={(e) => setNewRecipientName(e.target.value)}
                placeholder="例: 友達"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
              />
              <button
                onClick={handleAddRecipient}
                className="rounded bg-pink-600 px-3 py-1 text-xs font-semibold text-white hover:bg-pink-700"
              >
                + 追加
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-600">性別（単一選択用）</h3>
            <ul className="mb-2 flex flex-col gap-1">
              {itemGenders.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                >
                  <span className="truncate text-gray-700">{g.name}</span>
                  <button
                    onClick={() => handleDeleteGender(g.id)}
                    className="shrink-0 rounded bg-red-100 px-2 py-1 font-medium text-red-600 hover:bg-red-200"
                  >
                    削除
                  </button>
                </li>
              ))}
              {itemGenders.length === 0 && (
                <li className="text-xs text-gray-400">性別がまだありません。</li>
              )}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGenderName}
                onChange={(e) => setNewGenderName(e.target.value)}
                placeholder="例: 男性"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
              />
              <button
                onClick={handleAddGender}
                className="rounded bg-pink-600 px-3 py-1 text-xs font-semibold text-white hover:bg-pink-700"
              >
                + 追加
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">出現率の設定</h2>
        <p className="mb-3 text-sm text-gray-500">
          各レアリティの抽選の重みを設定します。数値の比率で出現率が決まります（合計が100でなくても自動的に割合計算されます）。
        </p>
        {rarityWeights && (
          <div className="flex flex-col gap-2">
            {RARITY_OPTIONS.map((rarity) => {
              const total = RARITY_OPTIONS.reduce((sum, r) => sum + rarityWeights[r], 0);
              const percent = total > 0 ? (rarityWeights[rarity] / total) * 100 : 0;
              return (
                <div key={rarity} className="flex items-center gap-3">
                  <span
                    className={`w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${RARITY_BADGE_CLASSES[rarity]}`}
                  >
                    {RARITY_LABELS[rarity]}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={rarityWeights[rarity]}
                    onChange={(e) => handleWeightChange(rarity, Number(e.target.value))}
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">{percent.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <h2 className="mb-3 font-semibold text-gray-700">演出（動画）の管理</h2>
        <p className="mb-3 text-sm text-gray-500">
          URLを直接入力するか、動画ファイルをアップロードして追加できます（アップロードはSupabase Storageに保存されます）。
        </p>
        {uploadError && <p className="mb-3 text-sm text-red-600">{uploadError}</p>}
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
              <label className="mt-2 inline-block cursor-pointer rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300">
                {uploadingRarity === rarity ? "アップロード中..." : "動画ファイルをアップロード"}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={uploadingRarity !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadEffect(rarity, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">SNS紹介記事管理</h2>
          {articleEditingId === null && (
            <button
              onClick={startAddArticle}
              className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            >
              + 新規記事
            </button>
          )}
        </div>

        {articlesError && <p className="mb-2 text-sm text-red-600">{articlesError}</p>}
        {gachaConvertMessage && (
          <p className="mb-2 text-sm text-gray-600">{gachaConvertMessage}</p>
        )}

        {articles.length === 0 && articleEditingId === null && !articlesError && (
          <p className="text-sm text-gray-400">記事がまだありません。</p>
        )}

        <ul className="flex flex-col gap-2">
          {articles.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3 overflow-hidden">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      article.published ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {article.published ? "公開中" : "下書き"}
                  </span>
                  <span className="truncate font-medium text-gray-800">{article.title}</span>
                  <span className="shrink-0 text-xs text-gray-400">/articles/{article.slug}</span>
                  <span className="shrink-0 text-xs text-gray-500">{article.items.length}商品</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleToggleArticlePublished(article)}
                    className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                  >
                    {article.published ? "非公開にする" : "公開する"}
                  </button>
                  <button
                    onClick={() => startEditArticle(article)}
                    className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                  >
                    削除
                  </button>
                </div>
              </div>
              {article.items.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-gray-200 pt-2">
                  <span className="text-xs text-gray-500">
                    この記事の商品をガチャ景品に追加（商品ごとにレアリティを選択）：
                  </span>
                  <ul className="flex flex-col gap-1">
                    {article.items.map((item) => {
                      const alreadyAdded = prizes.some((p) => p.name === item.name);
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1"
                        >
                          <span className="flex-1 truncate text-xs text-gray-700">{item.name}</span>
                          <select
                            value={getItemGachaRarity(item.id)}
                            onChange={(e) => setItemGachaRarity(item.id, e.target.value as Rarity)}
                            disabled={alreadyAdded}
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none disabled:opacity-50"
                          >
                            {RARITY_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {RARITY_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAddArticleItemToGacha(item)}
                            disabled={alreadyAdded}
                            className="shrink-0 rounded bg-pink-600 px-2 py-1 text-xs font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            {alreadyAdded ? "追加済み" : "追加"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    onClick={() => handleAddAllArticleItemsToGacha(article)}
                    className="w-fit rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                  >
                    未追加の商品をまとめて追加
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {articleEditingId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={cancelArticleEdit}
          >
            <section
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-pink-300 bg-pink-50 p-4 shadow-xl"
            >
              <h2 className="mb-3 font-semibold text-gray-700">
                {articleEditingId === "new" ? "新規記事の作成" : "記事の編集"}
              </h2>
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm text-gray-600">
                  タイトル
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => handleArticleTitleChange(e.target.value)}
                    placeholder="例: 今週SNSで紹介したプレゼント特集"
                    className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-gray-600">
                  URLスラッグ（/articles/以下。"/"は含めない）
                  <input
                    type="text"
                    value={articleForm.slug}
                    onChange={(e) => {
                      setArticleSlugTouched(true);
                      setArticleForm((f) => ({ ...f, slug: e.target.value }));
                    }}
                    className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-gray-600">
                  概要（一覧・meta descriptionに使用）
                  <textarea
                    value={articleForm.description}
                    onChange={(e) => setArticleForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={articleForm.published}
                    onChange={(e) => setArticleForm((f) => ({ ...f, published: e.target.checked }))}
                  />
                  公開する
                </label>

                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  商品CSVを読み込む（商品名・金額・商品説明・HTML（アフィリエイトHTML）・購入URLの列を使用）
                  <label className="inline-block w-fit cursor-pointer rounded bg-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-300">
                    CSVファイルを選択
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleArticleCsvUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {articleCsvError && <p className="text-xs text-red-600">{articleCsvError}</p>}
                </div>

                <ul className="flex flex-col gap-3">
                  {articleForm.items.map((row, index) => (
                    <li key={index} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-500">商品 {index + 1}</span>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => moveProductInArticle(index, -1)}
                            disabled={index === 0}
                            className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 disabled:opacity-40"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProductInArticle(index, 1)}
                            disabled={index === articleForm.items.length - 1}
                            className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 disabled:opacity-40"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProductFromArticle(index)}
                            className="rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      <div className="mb-2 flex gap-2">
                        <label className="flex flex-1 flex-col gap-1 text-xs text-gray-600">
                          商品名
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => updateArticleItemField(index, "name", e.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
                          />
                        </label>
                        <label className="flex w-28 shrink-0 flex-col gap-1 text-xs text-gray-600">
                          金額
                          <input
                            type="text"
                            value={row.price}
                            onChange={(e) => updateArticleItemField(index, "price", e.target.value)}
                            placeholder="2,200円"
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
                          />
                        </label>
                      </div>
                      <label className="mb-2 flex flex-col gap-1 text-xs text-gray-600">
                        SNS投稿URL（X/Instagram）
                        <input
                          type="url"
                          value={row.snsUrl}
                          onChange={(e) => updateArticleItemField(index, "snsUrl", e.target.value)}
                          placeholder="https://x.com/..."
                          className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
                        />
                      </label>
                      <label className="mb-2 flex flex-col gap-1 text-xs text-gray-600">
                        紹介文
                        <textarea
                          value={row.introText}
                          onChange={(e) => updateArticleItemField(index, "introText", e.target.value)}
                          rows={3}
                          className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-gray-600">
                        アフィリエイト用HTML（リンク+画像のHTMLを貼り付け）
                        <textarea
                          value={row.affiliateHtml}
                          onChange={(e) => updateArticleItemField(index, "affiliateHtml", e.target.value)}
                          placeholder='<a href="..."><img src="..." ...></a>'
                          rows={4}
                          className="rounded border border-gray-300 px-2 py-1 font-mono text-xs focus:border-pink-400 focus:outline-none"
                        />
                        {row.affiliateHtml && (
                          <div className="mt-1">
                            <p className="mb-1 text-xs text-gray-400">プレビュー：</p>
                            <div
                              className="inline-block"
                              dangerouslySetInnerHTML={{ __html: row.affiliateHtml }}
                            />
                          </div>
                        )}
                      </label>
                      <label className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
                        購入URL（任意・「購入する」ボタン用）
                        <input
                          type="url"
                          value={row.purchaseUrl}
                          onChange={(e) => updateArticleItemField(index, "purchaseUrl", e.target.value)}
                          placeholder="https://..."
                          className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
                        />
                      </label>

                      {row.itemId ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-green-700">
                          ✅ ガチャの景品として追加済み（下のタグを変更して保存すると景品側にも反映されます）
                          <button
                            type="button"
                            onClick={() => selectArticleItemLinkedItem(index, "")}
                            className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                          >
                            追加状態を取り消す
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <select
                            value={row.newItemRarity}
                            onChange={(e) =>
                              setArticleItemNewRarity(index, e.target.value as Rarity)
                            }
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-pink-400 focus:outline-none"
                          >
                            {RARITY_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {RARITY_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => createItemFromArticleRow(index)}
                            disabled={!row.name.trim()}
                            className="rounded bg-pink-600 px-2 py-1 text-xs font-medium text-white hover:bg-pink-700 disabled:opacity-50"
                          >
                            ＋ この商品をガチャの景品として追加（タグも反映）
                          </button>
                        </div>
                      )}

                      <div className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
                        種類（任意・1つ選択）
                        <div className="flex flex-wrap gap-1">
                          {itemTypes.map((t) => {
                            const selected = row.type === t.name;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => selectArticleItemType(index, t.name)}
                                className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                                  selected
                                    ? "border-pink-600 bg-pink-600 text-white"
                                    : "border-gray-300 bg-white text-gray-600 hover:border-pink-300"
                                }`}
                              >
                                {t.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
                        相手（任意・複数選択可）
                        <div className="flex flex-wrap gap-1">
                          {itemRecipients.map((r) => {
                            const selected = row.recipients.includes(r.name);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => toggleArticleItemRecipient(index, r.name)}
                                className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                                  selected
                                    ? "border-pink-600 bg-pink-600 text-white"
                                    : "border-gray-300 bg-white text-gray-600 hover:border-pink-300"
                                }`}
                              >
                                {r.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
                        性別（任意・1つ選択）
                        <div className="flex flex-wrap gap-1">
                          {itemGenders.map((g) => {
                            const selected = row.gender === g.name;
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => selectArticleItemGender(index, g.name)}
                                className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                                  selected
                                    ? "border-pink-600 bg-pink-600 text-white"
                                    : "border-gray-300 bg-white text-gray-600 hover:border-pink-300"
                                }`}
                              >
                                {g.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={addBlankArticleItemRow}
                  className="w-fit rounded bg-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-300"
                >
                  + 商品欄を手動で追加
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveArticle}
                    disabled={
                      !articleForm.title.trim() ||
                      !articleForm.slug.trim() ||
                      articleForm.items.length === 0
                    }
                    className="rounded bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelArticleEdit}
                    className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
