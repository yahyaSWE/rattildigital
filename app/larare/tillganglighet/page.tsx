"use client";

import { useCallback, useEffect, useState } from "react";

type Availability = { id: string; weekday: number | null; specific_date: string | null; start_time: string; end_time: string; lesson_duration_minutes: number; buffer_minutes: number };
type Exception = { id: string; exception_date: string; start_time: string | null; end_time: string | null; reason: string | null };
const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

export default function TillganglighetPage() {
  const [items, setItems] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [form, setForm] = useState({ weekday: "1", start_time: "09:00", end_time: "17:00", duration_minutes: "60", buffer_minutes: "5" });
  const [exception, setException] = useState({ exception_date: "", reason: "" });
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/teacher/availability", { cache: "no-store" });
    if (response.ok) { const data = await response.json(); setItems(data.availability); setExceptions(data.exceptions); }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMessage("");
    const response = await fetch("/api/teacher/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, weekday: Number(form.weekday), lesson_duration_minutes: Number(form.duration_minutes), buffer_minutes: Number(form.buffer_minutes) }) });
    const data = await response.json(); setMessage(response.ok ? "Tiden har lagts till." : data.error); if (response.ok) void load();
  }
  async function remove(id: string) {
    const response = await fetch("/api/teacher/availability", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) void load();
  }
  async function addException(e: React.FormEvent) {
    e.preventDefault();
    const response = await fetch("/api/teacher/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exception) });
    const data = await response.json(); setMessage(response.ok ? "Undantaget har sparats." : data.error); if (response.ok) { setException({ exception_date: "", reason: "" }); void load(); }
  }

  return <div className="max-w-4xl space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Tillgänglighet</h1><p className="text-sm text-gray-500 mt-1">Ange återkommande tider. Längden och pausen används när eleven ser bokningsbara starttider.</p></div>
    {message && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</div>}
    <form onSubmit={add} className="bg-white rounded-2xl border border-gray-100 p-6 grid sm:grid-cols-6 gap-4">
      <label className="sm:col-span-2 text-sm font-medium">Veckodag<select className="mt-1 w-full border rounded-lg p-2" value={form.weekday} onChange={e => setForm({ ...form, weekday: e.target.value })}>{DAYS.map((d, i) => <option value={i + 1} key={d}>{d}</option>)}</select></label>
      <label className="text-sm font-medium">Från<input type="time" required className="mt-1 w-full border rounded-lg p-2" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></label>
      <label className="text-sm font-medium">Till<input type="time" required className="mt-1 w-full border rounded-lg p-2" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></label>
      <label className="text-sm font-medium">Längd (min)<input type="number" min="15" max="240" step="5" className="mt-1 w-full border rounded-lg p-2" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /></label>
      <label className="text-sm font-medium">Paus (min)<input type="number" min="0" max="60" step="5" className="mt-1 w-full border rounded-lg p-2" value={form.buffer_minutes} onChange={e => setForm({ ...form, buffer_minutes: e.target.value })} /></label>
      <button className="sm:col-span-6 rounded-lg px-4 py-2 text-white font-semibold" style={{ background: "var(--primary)" }}>Lägg till tillgänglig tid</button>
    </form>
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden"><h2 className="font-semibold p-5 border-b">Återkommande tider</h2>{items.length === 0 ? <p className="p-6 text-sm text-gray-400">Inga tider har lagts in.</p> : <div className="divide-y">{items.map(item => <div key={item.id} className="p-4 flex items-center justify-between gap-3"><div><p className="font-medium">{item.weekday ? DAYS[item.weekday - 1] : item.specific_date}</p><p className="text-sm text-gray-500">{item.start_time.slice(0,5)}–{item.end_time.slice(0,5)} · {item.lesson_duration_minutes} min · {item.buffer_minutes} min paus</p></div><button onClick={() => void remove(item.id)} className="text-sm text-red-600">Ta bort</button></div>)}</div>}</section>
    <form onSubmit={addException} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"><div><h2 className="font-semibold">Undantag</h2><p className="text-sm text-gray-500">Blockera en hel dag vid ledighet eller avvikelse.</p></div><div className="grid sm:grid-cols-3 gap-3"><input type="date" required className="border rounded-lg p-2" value={exception.exception_date} onChange={e => setException({ ...exception, exception_date: e.target.value })} /><input className="border rounded-lg p-2 sm:col-span-2" placeholder="Orsak (valfritt)" value={exception.reason} onChange={e => setException({ ...exception, reason: e.target.value })} /></div><button className="rounded-lg border px-4 py-2 text-sm font-semibold">Lägg till undantag</button>{exceptions.length > 0 && <div className="flex flex-wrap gap-2">{exceptions.map(x => <span key={x.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs">{x.exception_date}{x.reason ? ` · ${x.reason}` : ""}</span>)}</div>}</form>
  </div>;
}
