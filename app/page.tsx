"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Slot = {
  id: string;
  booking_date: string;
  slot_time: string;
  status: "available" | "booked" | "closed" | "full";
};

const TIMES = ["09:00", "11:00", "13:00", "15:00", "17:00"];
const MONTH = "2026-12";
const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const displayTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const formatBookingDate = (date: string, includeYear = false) => {
  const [year, month, day] = date.split("-").map(Number);

  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  return `${months[month - 1]} ${day}${includeYear ? `, ${year}` : ""}`;
};

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState("2026-12-01");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSlots() {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from("public_booking_slots")
      .select("id,booking_date,slot_time,status")
      .gte("booking_date", "2026-12-01").lte("booking_date", "2026-12-31");
    if (!error && data) setSlots(data as Slot[]);
    setLoading(false);
  }

  useEffect(() => { loadSlots(); }, []);

  const dateSlots = useMemo(() => slots.filter(s => s.booking_date === selectedDate), [slots, selectedDate]);
  const dateStatus = useMemo(() => {
    const day = dateSlots;
    if (day.length === 0) return "loading";
    if (day.every(s => s.status === "closed")) return "closed";
    if (day.every(s => s.status !== "available")) return "full";
    return "open";
  }, [dateSlots]);

  async function book() {
    setError(""); setMessage("");
    if (!name.trim() || !phone.trim() || !selectedTime) {
      setError("Please enter your name, contact number, and select an available time.");
      return;
    }
    if (!supabase) { setError("Connect your Supabase project first. Follow the README setup instructions."); return; }
    setSaving(true);
    const { data, error } = await supabase.rpc("book_nail_slot", {
      p_slot_id: selectedTime,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim()
    });
    setSaving(false);
    if (error || !data?.success) {
      setError(data?.message || "Sorry, this slot was just booked. Please choose another time.");
      await loadSlots();
      return;
    }setMessage(`Your appointment is confirmed for ${formatBookingDate(selectedDate, true)} at ${displayTime(dateSlots.find(s => s.id === selectedTime)?.slot_time || "")}.`);
    
    setName(""); setPhone(""); setSelectedTime("");
    await loadSlots();
  }

  const firstDay = new Date(2026, 11, 1).getDay();
  const calendarCells = [...Array(firstDay).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];

  return (
    <main>
      <header className="topbar"><a className="brand" href="#">YZHE <span>NAILS</span></a><a className="admin-link" href="/admin">Admin Login</a></header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A LITTLE TIME FOR YOURSELF</p>
          <h1>Your next nail day<br /><em>starts here.</em></h1>
          <p className="hero-text">Choose your date and reserve your appointment at Yzhe Nails. Simple, easy, and confirmed instantly.</p>
          <a className="primary-link" href="#booking">Book an appointment <span>↗</span></a>
        </div>
        <div className="hero-art"><div className="art-circle"><span>♡</span><strong>YZHE<br />NAILS</strong><small>BEAUTY IN EVERY DETAIL</small></div><div className="sparkle one">✦</div><div className="sparkle two">✧</div></div>
      </section>

      <section className="booking-section" id="booking">
        <div className="section-heading"><p className="eyebrow">ONLINE APPOINTMENT</p><h2>December <em>2026</em></h2><p>Select a date to see available appointment times.</p></div>
        {!supabase && <div className="notice warning">Database setup needed: add your Supabase keys to <code>.env.local</code> and run the SQL in <code>supabase/schema.sql</code>.</div>}
        <div className="booking-layout">
          <div className="calendar-card">
            <div className="calendar-title"><div><b>DECEMBER</b><span>2026</span></div><span className="calendar-heart">♡</span></div>
            <div className="calendar-grid weekdays">{labels.map(d => <div key={d}>{d}</div>)}</div>
            <div className="calendar-grid">{calendarCells.map((day, i) => {
              if (!day) return <div key={`blank-${i}`} />;
              const date = `${MONTH}-${String(day).padStart(2, "0")}`;
              const daySlots = slots.filter(s => s.booking_date === date);
              const allClosed = daySlots.length > 0 && daySlots.every(s => s.status === "closed");
              const allFull = daySlots.length > 0 && daySlots.every(s => s.status !== "available") && !allClosed;
              return <button key={date} className={`day ${selectedDate === date ? "selected" : ""} ${allClosed ? "day-closed" : ""} ${allFull ? "day-full" : ""}`} onClick={() => { setSelectedDate(date); setSelectedTime(""); setMessage(""); setError(""); }}>
                <b>{day}</b><small>{allClosed ? "CLOSED" : allFull ? "FULL" : "OPEN"}</small>
              </button>;
            })}</div>
            <div className="legend"><span><i className="dot open" /> Open</span><span><i className="dot full" /> Fully booked</span><span><i className="dot closed" /> Closed</span></div>
          </div>

          <div className="slot-card">
            <p className="eyebrow">YOUR APPOINTMENT</p>
            <h3>{formatBookingDate(selectedDate)}</h3>
            <p className="muted">Choose one available time slot.</p>
            {loading ? <p className="muted">Loading availability…</p> : dateStatus === "closed" ? <div className="empty-state">This date is closed. Please select another day.</div> : dateStatus === "full" ? <div className="empty-state">This date is fully booked. Please choose another day.</div> : (
              <div className="time-list">{dateSlots.sort((a,b) => a.slot_time.localeCompare(b.slot_time)).map(slot => <button key={slot.id} disabled={slot.status !== "available"} className={`time-option ${selectedTime === slot.id ? "chosen" : ""} ${slot.status !== "available" ? "unavailable" : ""}`} onClick={() => setSelectedTime(slot.id)}>
                <span>{displayTime(slot.slot_time)}</span><small>{slot.status === "available" ? "Available" : slot.status === "booked" ? "Booked" : slot.status === "full" ? "Full" : "Closed"}</small>
              </button>)}</div>
            )}
            <div className="form-divider" />
            <label>Your full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" /></label>
            <label>Contact number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09XX XXX XXXX" inputMode="tel" /></label>
            {error && <div className="notice error">{error}</div>}
            {message && <div className="notice success">♡ {message}</div>}
            <button className="submit-button" onClick={book} disabled={saving || loading || !selectedTime}>{saving ? "Confirming…" : "Confirm my appointment"}</button>
            <p className="tiny-note">By booking, you agree that Yzhe Nails may contact you about your appointment.</p>
          </div>
        </div>
      </section>
      <footer><b>YZHE NAILS</b><span>Pretty nails, happy days. ♡</span><small>© 2026 Yzhe Nails</small></footer>
    </main>
  );
}
