"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AdminCard,
  adminInput,
  adminBtn,
  adminBtnSecondary,
  adminBtnDanger,
} from "@/components/admin/AdminShell";
import { pickRelated, productImage, productSlug } from "@/lib/kit";
import type { AffiliateProduct, ProductFaq } from "@/lib/types";

interface FormState {
  title: string;
  short_title: string;
  brand: string;
  slug: string;
  category: string;
  tags: string;
  featured: boolean;
  active: boolean;
  image_path: string;
  image_alt: string;
  gallery_images: string;
  og_image: string;
  image_disclaimer: string;
  affiliate_url: string;
  button_text: string;
  affiliate_disclosure: string;
  primary_keyword: string;
  secondary_keywords: string;
  search_intent: string;
  seo_title: string;
  seo_description: string;
  og_title: string;
  og_description: string;
  indexable: boolean;
  eyebrow: string;
  h1: string;
  description: string;
  legal_disclaimer: string;
  content: Record<string, string>;
  faqs: ProductFaq[];
  related_fallback_slugs: string;
}

const EMPTY: FormState = {
  title: "",
  short_title: "",
  brand: "",
  slug: "",
  category: "",
  tags: "",
  featured: false,
  active: true,
  image_path: "",
  image_alt: "",
  gallery_images: "",
  og_image: "",
  image_disclaimer: "",
  affiliate_url: "",
  button_text: "Check Current Price on Amazon",
  affiliate_disclosure: "",
  primary_keyword: "",
  secondary_keywords: "",
  search_intent: "",
  seo_title: "",
  seo_description: "",
  og_title: "",
  og_description: "",
  indexable: true,
  eyebrow: "",
  h1: "",
  description: "",
  legal_disclaimer: "",
  content: {},
  faqs: [],
  related_fallback_slugs: "",
};

const CONTENT_SECTIONS: Array<[string, string]> = [
  ["why_7fc", "Why It Made the 7FC Kit"],
  ["overview", "Product Overview"],
  ["interesting", "What Makes It Interesting"],
  ["best_for", "Best For"],
  ["how_to_use", "How to Use or Display"],
  ["gift_occasions", "Gift Occasions"],
  ["what_to_check", "What to Check Before Buying"],
  ["verdict", "Editorial Verdict"],
];

function productToForm(p: AffiliateProduct): FormState {
  const content: Record<string, string> = {};
  for (const [key] of CONTENT_SECTIONS) {
    const v = (p.content as Record<string, unknown>)[key];
    if (typeof v === "string") content[key] = v;
  }
  return {
    title: p.title,
    short_title: p.short_title,
    brand: p.brand,
    slug: p.slug,
    category: p.category,
    tags: p.tags,
    featured: p.featured,
    active: p.active,
    image_path: p.image_path,
    image_alt: p.image_alt,
    gallery_images: (p.gallery_images ?? []).join("\n"),
    og_image: p.og_image,
    image_disclaimer: p.image_disclaimer,
    affiliate_url: p.affiliate_url,
    button_text: p.button_text,
    affiliate_disclosure: p.affiliate_disclosure,
    primary_keyword: p.primary_keyword,
    secondary_keywords: p.secondary_keywords,
    search_intent: p.search_intent,
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    og_title: p.og_title,
    og_description: p.og_description,
    indexable: p.indexable,
    eyebrow: p.eyebrow,
    h1: p.h1,
    description: p.description,
    legal_disclaimer: p.legal_disclaimer,
    content,
    faqs: p.faqs ?? [],
    related_fallback_slugs: p.related_fallback_slugs,
  };
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gold-2 bg-navy/70 hover:bg-navy"
      >
        {title}
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">
        {label}
        {hint && <span className="ml-2 normal-case text-gray-600">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function CharCount({ value, ideal }: { value: string; ideal: number }) {
  const over = value.length > ideal;
  return (
    <span className={`text-[10px] ${over ? "text-amber-400" : "text-gray-600"}`}>
      {value.length}/{ideal}
      {over && " — longer than suggested (still saves)"}
    </span>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [editing, setEditing] = useState<AffiliateProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    return fetch("/api/admin/products")
      .then((res) => res.json())
      .then((json) => setProducts(json.products ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Unsaved-changes warning.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  async function action(id: string, act: string) {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: act }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    setMessage({ ok: true, text: "Product deleted." });
    load();
  }

  function closeEditor() {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    setEditing(null);
    setCreating(false);
    setForm(EMPTY);
    setDirty(false);
  }

  async function save() {
    if (!form.title.trim()) {
      setMessage({ ok: false, text: "Title is required." });
      return;
    }
    if (!/^https:\/\//.test(form.affiliate_url.trim())) {
      setMessage({ ok: false, text: "Affiliate URL must start with https://" });
      return;
    }
    const payload = { ...form };
    const res = await fetch("/api/admin/products", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editing ? { id: editing.id, action: "update", ...payload } : payload
      ),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage({ ok: false, text: err.error || "Save failed." });
      return;
    }
    setMessage({ ok: true, text: editing ? "Product saved." : "Product created." });
    setEditing(null);
    setCreating(false);
    setForm(EMPTY);
    setDirty(false);
    load();
  }

  async function upload(file: File, target: "image_path" | "gallery") {
    setUploading(target);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      if (target === "image_path") set("image_path", json.url);
      else
        set(
          "gallery_images",
          (form.gallery_images ? form.gallery_images + "\n" : "") + json.url
        );
      setMessage({ ok: true, text: "Image uploaded." });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading(null);
    }
  }

  const showForm = creating || editing;
  const previewProduct: AffiliateProduct | null = editing
    ? {
        ...editing,
        category: form.category,
        tags: form.tags,
        related_fallback_slugs: form.related_fallback_slugs,
      }
    : null;
  const relatedPreview = previewProduct
    ? pickRelated(previewProduct, products.filter((p) => p.active))
    : [];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg font-bold text-white">Affiliate Products</h1>
        <button
          className={adminBtn}
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm(EMPTY);
            setDirty(false);
          }}
        >
          + Add Product
        </button>
      </div>

      {message && (
        <div
          role="status"
          className={`text-xs rounded px-3 py-2 border ${
            message.ok
              ? "border-green-600/50 bg-green-500/10 text-green-400"
              : "border-crimson/50 bg-crimson/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <AdminCard title={editing ? `Edit: ${editing.title}` : "New Product"}>
          <div className="space-y-3">
            <Section title="Basic Information" defaultOpen>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Product title">
                  <input className={adminInput} value={form.title} onChange={(e) => set("title", e.target.value)} />
                </Field>
                <Field label="Short title (cards)">
                  <input className={adminInput} value={form.short_title} onChange={(e) => set("short_title", e.target.value)} />
                </Field>
                <Field label="Slug" hint="blank = generated from title">
                  <input className={adminInput} value={form.slug} onChange={(e) => set("slug", e.target.value)} />
                </Field>
                <Field label="Brand">
                  <input className={adminInput} value={form.brand} onChange={(e) => set("brand", e.target.value)} />
                </Field>
                <Field label="Category">
                  <input className={adminInput} value={form.category} onChange={(e) => set("category", e.target.value)} list="kit-categories" />
                </Field>
                <Field label="Tags" hint="pipe or comma separated">
                  <input className={adminInput} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
                </Field>
              </div>
              <datalist id="kit-categories">
                {[...new Set(products.map((p) => p.category))].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                  Active (published on the site)
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
                  Featured on homepage
                </label>
              </div>
            </Section>

            <Section title="Images">
              <div className="flex flex-wrap items-start gap-4">
                {form.image_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image_path}
                    alt={form.image_alt || "Product image preview"}
                    className="w-36 h-24 object-cover rounded border border-gray-700"
                  />
                )}
                <div className="space-y-2">
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/webp,image/jpeg,image/png,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(f, "image_path");
                      e.target.value = "";
                    }}
                  />
                  <button type="button" className={adminBtnSecondary} onClick={() => fileInput.current?.click()} disabled={uploading !== null}>
                    {uploading === "image_path" ? "Uploading…" : form.image_path ? "Replace image" : "Upload image"}
                  </button>
                  {form.image_path && (
                    <button type="button" className={adminBtnDanger} onClick={() => set("image_path", "")}>
                      Remove image
                    </button>
                  )}
                </div>
              </div>
              <Field label="Main image URL">
                <input type="url" className={adminInput} value={form.image_path} onChange={(e) => set("image_path", e.target.value)} />
              </Field>
              <Field label="Image alt text">
                <input className={adminInput} value={form.image_alt} onChange={(e) => set("image_alt", e.target.value)} />
              </Field>
              <Field label="Gallery images (one path per line, optional)">
                <textarea rows={2} className={adminInput} value={form.gallery_images} onChange={(e) => set("gallery_images", e.target.value)} />
              </Field>
              <Field label="Open Graph image (optional)">
                <input type="url" className={adminInput} value={form.og_image} onChange={(e) => set("og_image", e.target.value)} />
              </Field>
              <Field label="Image disclaimer">
                <textarea rows={2} className={adminInput} value={form.image_disclaimer} onChange={(e) => set("image_disclaimer", e.target.value)} />
              </Field>
            </Section>

            <Section title="Affiliate">
              <Field label="Amazon affiliate URL">
                <input type="url" className={adminInput} value={form.affiliate_url} onChange={(e) => set("affiliate_url", e.target.value)} />
              </Field>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Button text">
                  <input className={adminInput} value={form.button_text} onChange={(e) => set("button_text", e.target.value)} />
                </Field>
                <Field label="Outbound clicks (read-only)">
                  <input className={adminInput} value={editing?.click_count ?? 0} readOnly disabled />
                </Field>
              </div>
              <Field label="Affiliate disclosure">
                <textarea rows={2} className={adminInput} value={form.affiliate_disclosure} onChange={(e) => set("affiliate_disclosure", e.target.value)} />
              </Field>
            </Section>

            <Section title="SEO">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Primary keyword">
                  <input className={adminInput} value={form.primary_keyword} onChange={(e) => set("primary_keyword", e.target.value)} />
                </Field>
                <Field label="Search intent">
                  <input className={adminInput} value={form.search_intent} onChange={(e) => set("search_intent", e.target.value)} />
                </Field>
              </div>
              <Field label="Secondary keywords" hint="pipe separated">
                <input className={adminInput} value={form.secondary_keywords} onChange={(e) => set("secondary_keywords", e.target.value)} />
              </Field>
              <Field label="SEO title">
                <input className={adminInput} value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
              </Field>
              <CharCount value={form.seo_title} ideal={60} />
              <Field label="Meta description">
                <textarea rows={2} className={adminInput} value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
              </Field>
              <CharCount value={form.seo_description} ideal={160} />
              <Field label="Open Graph title">
                <input className={adminInput} value={form.og_title} onChange={(e) => set("og_title", e.target.value)} />
              </Field>
              <CharCount value={form.og_title} ideal={60} />
              <Field label="Open Graph description">
                <textarea rows={2} className={adminInput} value={form.og_description} onChange={(e) => set("og_description", e.target.value)} />
              </Field>
              <CharCount value={form.og_description} ideal={160} />
              <label className="flex items-center gap-2 text-xs text-gray-300 pt-1">
                <input type="checkbox" checked={form.indexable} onChange={(e) => set("indexable", e.target.checked)} />
                Indexable (include in sitemap and search)
              </label>
            </Section>

            <Section title="Page Content">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Eyebrow">
                  <input className={adminInput} value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
                </Field>
                <Field label="H1" hint="blank = product title">
                  <input className={adminInput} value={form.h1} onChange={(e) => set("h1", e.target.value)} />
                </Field>
              </div>
              <Field label="Hero summary (also the card description)">
                <textarea rows={2} className={adminInput} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              {CONTENT_SECTIONS.map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea
                    rows={3}
                    className={adminInput}
                    value={form.content[key] ?? ""}
                    onChange={(e) => set("content", { ...form.content, [key]: e.target.value })}
                  />
                </Field>
              ))}
              <Field label="Legal disclaimer (page footer)">
                <textarea rows={2} className={adminInput} value={form.legal_disclaimer} onChange={(e) => set("legal_disclaimer", e.target.value)} />
              </Field>
            </Section>

            <Section title={`FAQs (${form.faqs.length})`}>
              {form.faqs.map((f, i) => (
                <div key={i} className="border border-gray-800 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">FAQ {i + 1}</span>
                    <div className="flex gap-1.5">
                      <button type="button" className={adminBtnSecondary} aria-label="Move FAQ up" disabled={i === 0}
                        onClick={() => {
                          const faqs = [...form.faqs];
                          [faqs[i - 1], faqs[i]] = [faqs[i], faqs[i - 1]];
                          set("faqs", faqs);
                        }}>↑</button>
                      <button type="button" className={adminBtnSecondary} aria-label="Move FAQ down" disabled={i === form.faqs.length - 1}
                        onClick={() => {
                          const faqs = [...form.faqs];
                          [faqs[i + 1], faqs[i]] = [faqs[i], faqs[i + 1]];
                          set("faqs", faqs);
                        }}>↓</button>
                      <button type="button" className={adminBtnDanger}
                        onClick={() => set("faqs", form.faqs.filter((_, j) => j !== i))}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <Field label="Question">
                    <input className={adminInput} value={f.question}
                      onChange={(e) => {
                        const faqs = [...form.faqs];
                        faqs[i] = { ...faqs[i], question: e.target.value };
                        set("faqs", faqs);
                      }} />
                  </Field>
                  <Field label="Answer">
                    <textarea rows={2} className={adminInput} value={f.answer}
                      onChange={(e) => {
                        const faqs = [...form.faqs];
                        faqs[i] = { ...faqs[i], answer: e.target.value };
                        set("faqs", faqs);
                      }} />
                  </Field>
                </div>
              ))}
              <button type="button" className={adminBtnSecondary}
                onClick={() => set("faqs", [...form.faqs, { question: "", answer: "" }])}>
                + Add FAQ
              </button>
            </Section>

            <Section title="Related Products">
              <p className="text-xs text-gray-500">
                Related picks are selected dynamically (category +4, shared tag +2,
                complementary category +1) with a daily rotation. Fallback slugs
                backfill when fewer than four scored matches exist.
              </p>
              <Field label="Fallback slugs" hint="pipe separated">
                <input className={adminInput} value={form.related_fallback_slugs} onChange={(e) => set("related_fallback_slugs", e.target.value)} />
              </Field>
              {editing && relatedPreview.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                    Current selection preview (today)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {relatedPreview.map((p) => (
                      <div key={p.id} className="border border-gray-800 rounded p-2 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={productImage(p)} alt="" className="w-full aspect-[3/2] object-cover rounded" />
                        <p className="text-[10px] text-gray-400 mt-1 truncate">{p.short_title || p.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Publishing" defaultOpen>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Status: {form.active ? "Published (active)" : "Hidden (draft)"}</p>
                {editing?.updated_at && <p>Last updated: {editing.updated_at.slice(0, 19).replace("T", " ")} UTC</p>}
                {editing && (
                  <p>
                    <a className="text-gold-2 underline underline-offset-2" href={`/kit/${productSlug(editing)}`} target="_blank" rel="noopener">
                      Preview public page ↗
                    </a>
                  </p>
                )}
              </div>
            </Section>
          </div>

          {/* Sticky save bar */}
          <div className="sticky bottom-0 -mx-4 md:-mx-5 mt-4 px-4 md:px-5 py-3 bg-navy/95 border-t border-gold/20 backdrop-blur flex gap-2 items-center">
            <button className={adminBtn} onClick={save} disabled={uploading !== null}>
              {editing ? "Save" : "Create"}
            </button>
            <button className={adminBtnSecondary} onClick={closeEditor}>
              Cancel
            </button>
            {dirty && <span className="text-[11px] text-amber-400">Unsaved changes</span>}
          </div>
        </AdminCard>
      )}

      {/* Desktop table */}
      <AdminCard className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                {["Order", "Title", "Category", "Clicks", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-2 pr-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-800/60 text-gray-300">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-5">{i + 1}</span>
                      <button onClick={() => action(p.id, "move_up")} className="text-gray-500 hover:text-gold px-1" aria-label="Move up">↑</button>
                      <button onClick={() => action(p.id, "move_down")} className="text-gray-500 hover:text-gold px-1" aria-label="Move down">↓</button>
                    </div>
                  </td>
                  <td className="pr-3">
                    {p.title}
                    {p.featured && <span className="ml-2 text-[9px] uppercase text-gold-2 border border-gold/40 rounded px-1">Featured</span>}
                  </td>
                  <td className="pr-3 text-gray-400">{p.category}</td>
                  <td className="pr-3 text-gold-2">{p.click_count}</td>
                  <td className="pr-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${p.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {p.active ? "active" : "hidden"}
                    </span>
                  </td>
                  <td className="py-2 pr-1">
                    <div className="flex gap-1.5">
                      <button className={adminBtnSecondary}
                        onClick={() => {
                          setEditing(p);
                          setCreating(false);
                          setForm(productToForm(p));
                          setDirty(false);
                          window.scrollTo({ top: 0 });
                        }}>
                        Edit
                      </button>
                      <button className={adminBtnSecondary} onClick={() => action(p.id, "toggle_active")}>
                        {p.active ? "Hide" : "Publish"}
                      </button>
                      <button className={adminBtnDanger} onClick={() => remove(p.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {products.map((p, i) => (
          <AdminCard key={p.id}>
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productImage(p)} alt="" className="w-20 h-14 object-cover rounded border border-gray-800 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-semibold leading-snug">{p.short_title || p.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  #{i + 1} · {p.category} · {p.click_count} clicks
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] ${p.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                  {p.active ? "active" : "hidden"}
                </span>
                {p.featured && <span className="ml-2 text-[9px] uppercase text-gold-2 border border-gold/40 rounded px-1">Featured</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button className={`${adminBtnSecondary} py-2 px-4`}
                onClick={() => {
                  setEditing(p);
                  setCreating(false);
                  setForm(productToForm(p));
                  setDirty(false);
                  window.scrollTo({ top: 0 });
                }}>
                Edit
              </button>
              <button className={`${adminBtnSecondary} py-2 px-4`} onClick={() => action(p.id, "toggle_active")}>
                {p.active ? "Hide" : "Publish"}
              </button>
              <button className={`${adminBtnSecondary} py-2 px-3`} onClick={() => action(p.id, "move_up")} aria-label="Move up">↑</button>
              <button className={`${adminBtnSecondary} py-2 px-3`} onClick={() => action(p.id, "move_down")} aria-label="Move down">↓</button>
              <button className={`${adminBtnDanger} py-2 px-4`} onClick={() => remove(p.id)}>
                Delete
              </button>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
