"use client";

import { useEffect, useState } from "react";

export default function ActivityPage() {
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [search,setSearch]=useState("");
  async function load(){try{setLoading(true);const r=await fetch("/api/activity-logs",{cache:"no-store"});const j=await r.json();if(!r.ok||!j.success)throw new Error(j.message||"Gagal mengambil activity log.");setRows(j.data||[])}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  const filtered=rows.filter(r=>{const q=search.toLowerCase();return !q||Object.values(r).some(v=>String(v??"").toLowerCase().includes(q))});
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-primary">Sistem</p><h1 className="mt-1 text-2xl font-semibold text-ink">Activity Log</h1><p className="mt-1 text-sm text-muted">Catatan aktivitas penting yang terjadi di dalam sistem.</p></div><button onClick={load} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink">↻ Refresh</button></div>
    {error&&<div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line p-5"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari aktivitas, user, aksi..." className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary md:max-w-md"/></div>
      {loading?<Loading/>:filtered.length===0?<div className="p-16 text-center text-sm text-muted">Belum ada aktivitas.</div>:
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b border-line bg-canvas text-left"><th className="px-5 py-3 text-muted">Waktu</th><th className="px-5 py-3 text-muted">User</th><th className="px-5 py-3 text-muted">Aksi</th><th className="px-5 py-3 text-muted">Deskripsi</th><th className="px-5 py-3 text-muted">IP</th></tr></thead><tbody className="divide-y divide-line">{filtered.map((r,i)=><tr key={r.id||i} className="hover:bg-canvas"><td className="px-5 py-4 text-xs text-muted">{format(r.created_at)}</td><td className="px-5 py-4 font-medium text-ink">{r.user_name||r.name||r.username||"-"}</td><td className="px-5 py-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{r.action||r.activity||"-"}</span></td><td className="px-5 py-4 text-muted">{r.description||r.details||r.message||"-"}</td><td className="px-5 py-4 text-xs text-muted">{r.ip_address||r.ip||"-"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>
}
function Loading(){return <div className="space-y-3 p-5">{[1,2,3,4].map(i=><div key={i} className="h-12 animate-pulse rounded-lg bg-canvas"/>)}</div>}
function format(v){if(!v)return "-";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short"}).format(d)}
