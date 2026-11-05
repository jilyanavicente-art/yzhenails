"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Slot = { id: string; booking_date: string; slot_time: string; status: string; customer_first_name: string | null; customer_phone: string | null; customer_name: string | null };
const TIMES = ["09:00", "11:00", "13:00", "15:00", "17:00"];
const pretty = (t: string) => { const [h,m]=t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; };

export default function Admin() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [session,setSession]=useState(false); const [slots,setSlots]=useState<Slot[]>([]);
  const [date,setDate]=useState("2026-12-01"); const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);

  async function refresh() {
    if(!supabase) return;
    const {data:{session}}=await supabase.auth.getSession();
    setSession(!!session);
    if(session) {
      const {data}=await supabase.from("booking_slots").select("*").gte("booking_date","2026-12-01").lte("booking_date","2026-12-31").order("booking_date").order("slot_time");
      setSlots((data||[]) as Slot[]);
    }
  }
  useEffect(()=>{refresh();},[]);
  async function login() {
    if(!supabase) {setNotice("Configure Supabase first.");return;}
    setBusy(true); const {error}=await supabase.auth.signInWithPassword({email,password}); setBusy(false);
    if(error) setNotice(error.message); else {setNotice("Logged in.");await refresh();}
  }
  async function logout(){if(supabase) await supabase.auth.signOut();setSession(false);setSlots([]);}
  async function updateSlot(id:string,status:string) {
    if(!supabase)return;
    const {error}=await supabase.from("booking_slots").update({status, ...(status==="available"?{customer_name:null,customer_first_name:null,customer_phone:null}:{})}).eq("id",id);
    setNotice(error?error.message:"Schedule updated."); await refresh();
  }
  async function setDateStatus(status:"closed"|"available"|"full") {
    if(!supabase)return;
    const {error}=await supabase.from("booking_slots").update({status, ...(status==="available"?{customer_name:null,customer_first_name:null,customer_phone:null}:{})}).eq("booking_date",date);
    setNotice(error?error.message:`December ${Number(date.slice(-2))} updated.`); await refresh();
  }
  const todays=slots.filter(s=>s.booking_date===date);
  const booked=slots.filter(s=>s.status==="booked").length;
  const available=slots.filter(s=>s.status==="available").length;
  if(!session) return <main className="admin-page"><div className="admin-login"><a className="brand" href="/">YZHE <span>NAILS</span></a><p className="eyebrow">ADMINISTRATION</p><h1>Welcome back ♡</h1><p className="muted">Sign in to manage your December appointments.</p><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Admin email"/></label><label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password"/></label>{notice&&<div className="notice error">{notice}</div>}<button className="submit-button" onClick={login} disabled={busy}>{busy?"Signing in…":"Log in"}</button><a className="back-link" href="/">← Back to public booking page</a></div></main>;
  return <main className="admin-page"><header className="admin-top"><a className="brand" href="/">YZHE <span>NAILS</span></a><div><span>Admin dashboard</span><button className="logout" onClick={logout}>Log out</button></div></header>
    <section className="admin-content"><p className="eyebrow">DECEMBER 2026</p><h1>Booking management</h1><p className="muted">Manage reservations, close dates, and control appointment availability.</p>
      <div className="stats"><div><small>Total slots</small><b>{slots.length}</b></div><div><small>Booked</small><b>{booked}</b></div><div><small>Available</small><b>{available}</b></div></div>
      <div className="manage-card"><h2>Manage a date</h2><label>Select date<input type="date" min="2026-12-01" max="2026-12-31" value={date} onChange={e=>setDate(e.target.value)}/></label><div className="action-row"><button onClick={()=>setDateStatus("closed")}>Close whole day</button><button onClick={()=>setDateStatus("full")}>Mark fully booked</button><button onClick={()=>setDateStatus("available")}>Open all slots</button></div><p className="tiny-note">“Mark fully booked” blocks all five slots without creating fake customer reservations. “Open all slots” clears the current reservations on that date, so use it carefully.</p>{notice&&<div className="notice success">{notice}</div>}</div>
      <div className="manage-card"><h2>December {Number(date.slice(-2))} schedule</h2>{todays.map(s=><div className="admin-slot" key={s.id}><div><b>{pretty(s.slot_time)}</b><small>{s.status.toUpperCase()} {s.customer_name?`· ${s.customer_name}`:""}</small></div><div className="slot-actions">{s.status!=="available"&&<button onClick={()=>updateSlot(s.id,"available")}>Make available</button>}{s.status==="available"&&<button onClick={()=>updateSlot(s.id,"closed")}>Close slot</button>}{s.status==="closed"&&<button onClick={()=>updateSlot(s.id,"available")}>Open slot</button>}</div></div>)}</div>
      <div className="manage-card"><h2>All December bookings</h2>{slots.filter(s=>s.status==="booked").length===0?<p className="muted">No confirmed bookings yet.</p>:slots.filter(s=>s.status==="booked").map(s=><div className="admin-slot" key={s.id}><div><b>{new Date(`${s.booking_date}T00:00:00`).toLocaleDateString("en-PH",{month:"short",day:"numeric"})} · {pretty(s.slot_time)}</b><small>{s.customer_name} · {s.customer_phone}</small></div><button onClick={()=>updateSlot(s.id,"available")}>Cancel booking</button></div>)}</div>
      <a className="back-link" href="/">← View public booking page</a>
    </section>
  </main>;
}
