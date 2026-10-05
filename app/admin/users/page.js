"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",username:"",password:"",role:"petugas"});

  async function load(){
    try{setLoading(true);setError("");const r=await fetch("/api/users",{cache:"no-store"});const j=await r.json();if(!r.ok||!j.success)throw new Error(j.message||"Gagal mengambil petugas.");setUsers(j.data||[])}
    catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);

  function reset(){setEditing(null);setForm({name:"",username:"",password:"",role:"petugas"})}

  async function submit(e){
    e.preventDefault();setError("");setSuccess("");
    try{
      const payload={...form};if(editing&&!payload.password)delete payload.password;
      const r=await fetch(editing?`/api/users/${editing.id}`:"/api/users",{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const j=await r.json();if(!r.ok||!j.success)throw new Error(j.message||"Gagal menyimpan petugas.");
      setSuccess(editing?"Petugas berhasil diperbarui.":"Petugas berhasil ditambahkan.");reset();await load();
    }catch(e){setError(e.message)}
  }

  async function remove(id){
    if(!confirm("Nonaktifkan/hapus akun ini?"))return;
    try{const r=await fetch(`/api/users/${id}`,{method:"DELETE"});const j=await r.json();if(!r.ok||!j.success)throw new Error(j.message||"Gagal menghapus petugas.");setSuccess("Akun berhasil dinonaktifkan.");await load()}catch(e){setError(e.message)}
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-end"><div><p className="text-sm font-medium text-primary">Sistem</p><h1 className="mt-1 text-2xl font-semibold text-ink">Petugas</h1><p className="mt-1 text-sm text-muted">Kelola akun admin dan petugas kasir.</p></div><button onClick={load} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink">↻ Refresh</button></div>
    {success&&<Alert type="success">{success}</Alert>}{error&&<Alert type="danger">{error}</Alert>}
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="rounded-xl border border-line bg-surface p-5"><h2 className="font-semibold text-ink">{editing?"Edit Akun":"Tambah Akun"}</h2><form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Nama"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1.5 h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary" placeholder="Nama lengkap"/></Field>
        <Field label="Username"><input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} className="mt-1.5 h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary" placeholder="username"/></Field>
        <Field label={editing?"Password baru (opsional)":"Password"}><input required={!editing} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="mt-1.5 h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary" placeholder="••••••••"/></Field>
        <Field label="Role"><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="mt-1.5 h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"><option value="petugas">Petugas</option><option value="admin">Admin</option></select></Field>
        <div className="flex gap-2"><button className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white">{editing?"Simpan":"Tambah Akun"}</button>{editing&&<button type="button" onClick={reset} className="rounded-lg border border-line px-4 text-sm">Batal</button>}</div>
      </form></section>
      <section className="overflow-hidden rounded-xl border border-line bg-surface"><div className="border-b border-line p-5"><h2 className="font-semibold text-ink">Daftar Akun</h2></div>
        {loading?<Loading/>:<div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b border-line bg-canvas text-left"><th className="px-5 py-3 text-muted">Nama</th><th className="px-5 py-3 text-muted">Username</th><th className="px-5 py-3 text-muted">Role</th><th className="px-5 py-3 text-muted">Status</th><th className="px-5 py-3 text-right text-muted">Aksi</th></tr></thead><tbody className="divide-y divide-line">{users.map(u=><tr key={u.id}><td className="px-5 py-4 font-medium text-ink">{u.name}</td><td className="px-5 py-4 text-muted">{u.username}</td><td className="px-5 py-4">{u.role}</td><td className="px-5 py-4"><span className="rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">{u.status||"active"}</span></td><td className="px-5 py-4 text-right"><button onClick={()=>{setEditing(u);setForm({name:u.name||"",username:u.username||"",password:"",role:u.role||"petugas"})}} className="mr-3 text-primary">Edit</button><button onClick={()=>remove(u.id)} className="text-danger">Nonaktifkan</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </div>
}
function Field({label,children}){return <div><label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>{children}</div>}
function Alert({type,children}){return <div className={`rounded-lg border px-4 py-3 text-sm ${type==="success"?"border-success/20 bg-success/10 text-success":"border-danger/20 bg-danger/10 text-danger"}`}>{children}</div>}
function Loading(){return <div className="space-y-3 p-5">{[1,2,3,4].map(i=><div key={i} className="h-12 animate-pulse rounded-lg bg-canvas"/>)}</div>}
