"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminCard,
  adminInput,
  adminBtn,
  adminBtnSecondary,
  adminBtnDanger,
} from "@/components/admin/AdminShell";
import type { AffiliateProduct } from "@/lib/types";

const EMPTY = {
  title: "",
  category: "",
  image_path: "/images/",
  description: "",
  affiliate_url: "",
  button_text: "View on Amazon",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [editing, setEditing] = useState<AffiliateProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(() => {
    return fetch("/api/admin/products")
      .then((res) => res.json())
      .then((json) => setProducts(json.products ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function action(id: string, act: string) {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: act }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    load();
  }

  async function save() {
    if (editing) {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, action: "update", ...form }),
      });
    } else {
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setEditing(null);
    setCreating(false);
    setForm(EMPTY);
    load();
  }

  const showForm = creating || editing;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Affiliate Products</h1>
        <button
          className={adminBtn}
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setForm(EMPTY);
          }}
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <AdminCard title={editing ? `Edit: ${editing.title}` : "New Product"}>
          <div className="grid md:grid-cols-2 gap-3">
            {(
              [
                ["title", "Title"],
                ["category", "Category"],
                ["image_path", "Image path"],
                ["affiliate_url", "Affiliate URL"],
                ["button_text", "Button text"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                  {label}
                </label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className={adminInput}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className={adminInput}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className={adminBtn} onClick={save}>
              Save
            </button>
            <button
              className={adminBtnSecondary}
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              Cancel
            </button>
          </div>
        </AdminCard>
      )}

      <AdminCard>
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
                  <td className="pr-3">{p.title}</td>
                  <td className="pr-3 text-gray-400">{p.category}</td>
                  <td className="pr-3 text-gold-2">{p.click_count}</td>
                  <td className="pr-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${p.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {p.active ? "active" : "hidden"}
                    </span>
                  </td>
                  <td className="py-2 pr-1">
                    <div className="flex gap-1.5">
                      <button
                        className={adminBtnSecondary}
                        onClick={() => {
                          setEditing(p);
                          setCreating(false);
                          setForm({
                            title: p.title,
                            category: p.category,
                            image_path: p.image_path,
                            description: p.description,
                            affiliate_url: p.affiliate_url,
                            button_text: p.button_text,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className={adminBtnSecondary} onClick={() => action(p.id, "toggle_active")}>
                        {p.active ? "Hide" : "Show"}
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
    </div>
  );
}
