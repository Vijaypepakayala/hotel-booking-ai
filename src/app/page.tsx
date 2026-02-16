"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ChatMessage, CallState } from "@/lib/types";

const DEMO_CONVERSATION: { role: "assistant" | "user"; text: string; audio: string; ambient?: boolean }[] = [
  { role: "assistant", text: "Good evening, thank you for calling Grand Horizon Hotel. My name is Aria, your AI concierge. How may I assist you today?", audio: "/demo/step-0.mp3" },
  { role: "user", text: "Hi, I'd like to book a room for February 20th to the 23rd", audio: "/demo/step-1.mp3" },
  { role: "assistant", text: "Wonderful! Let me check availability for February 20th through the 23rd — that's 3 nights.\n\nI have several options for you:\n\n• Standard Room — $99/night ($297 total)\n• Deluxe Room with balcony — $149/night ($447 total)\n• Suite with jacuzzi — $249/night ($747 total)\n\nWhich would you prefer?", audio: "/demo/step-2.mp3", ambient: true },
  { role: "user", text: "The deluxe sounds great", audio: "/demo/step-3.mp3" },
  { role: "assistant", text: "Excellent choice! The Deluxe Room on the 3rd floor includes a private balcony, bathrobe, and complimentary breakfast.\n\nTo complete your reservation, may I have your full name?", audio: "/demo/step-4.mp3" },
  { role: "user", text: "Rachel Anderson, 2 adults", audio: "/demo/step-5.mp3" },
  { role: "assistant", text: "Thank you, Rachel! Could I have a phone number for the reservation? I'll send your confirmation via text.", audio: "/demo/step-6.mp3" },
  { role: "user", text: "+1 415 555 7890", audio: "/demo/step-7.mp3" },
  { role: "assistant", text: "✅ Your reservation is confirmed!\n\n━━━━━━━━━━━━━━━━━━━━━\n🔑  Confirmation: GH-R4N7\n🏨  Deluxe Room 305, Floor 3\n📅  Feb 20 → Feb 23 (3 nights)\n👤  Rachel Anderson — 2 adults\n💰  $447 total\n━━━━━━━━━━━━━━━━━━━━━\n\n📱 Confirmation sent to +1 415 555 7890\n\nWe look forward to welcoming you, Rachel! Is there anything else I can help with?", audio: "/demo/step-8.mp3", ambient: true },
  { role: "user", text: "That's all, thank you!", audio: "/demo/step-9.mp3" },
  { role: "assistant", text: "Thank you for choosing Grand Horizon Hotel, Rachel. Have a wonderful evening! 🌙", audio: "/demo/step-10.mp3" },
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [call, setCall] = useState<CallState>({ active: false, duration: 0, phase: "idle" });
  const [input, setInput] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<"assistant" | "user" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callRequested, setCallRequested] = useState(false);
  const [callError, setCallError] = useState("");
  const [liveStatus, setLiveStatus] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (call.phase === "connected") {
      timerRef.current = setInterval(() => setCall(c => ({ ...c, duration: c.duration + 1 })), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [call.phase]);

  // Pre-load typing sound
  useEffect(() => {
    const t = new Audio("/demo/typing.mp3");
    t.loop = true;
    t.volume = 0.15;
    typingAudioRef.current = t;
    return () => { t.pause(); };
  }, []);

  const addMsg = useCallback((role: "assistant" | "user" | "system", text: string) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, role, text, timestamp: Date.now() }]);
  }, []);

  function playAudio(src: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => setTimeout(resolve, 2000));
    });
  }

  async function startCall(demo: boolean) {
    setMessages([]);
    setDemoMode(demo);
    abortRef.current = false;
    setCall({ active: true, duration: 0, phase: "ringing" });
    setActiveSpeaker(null);

    await sleep(2000);
    setCall(c => ({ ...c, phase: "connected" }));
    addMsg("system", "Call connected — AI Concierge Active");

    if (demo) {
      await sleep(600);
      runDemo(0);
    } else {
      await sleep(800);
      setIsTyping(true);
      setActiveSpeaker("assistant");
      await sleep(1500);
      setIsTyping(false);
      addMsg("assistant", "Good evening, thank you for calling Grand Horizon Hotel. My name is Aria, your AI concierge. How may I assist you today?");
      setActiveSpeaker(null);
    }
  }

  async function runDemo(idx: number) {
    if (idx >= DEMO_CONVERSATION.length || abortRef.current) {
      if (!abortRef.current) {
        await sleep(2000);
        endCall();
      }
      return;
    }

    const step = DEMO_CONVERSATION[idx];

    // Pause between turns
    if (idx > 0) {
      const prev = DEMO_CONVERSATION[idx - 1];
      await sleep(prev.role !== step.role ? 800 : 400);
    }
    if (abortRef.current) return;

    // Show typing for AI
    if (step.role === "assistant") {
      setIsTyping(true);
      await sleep(600);
      if (abortRef.current) return;
      setIsTyping(false);
    }

    // Add message & set speaker
    addMsg(step.role, step.text);
    setActiveSpeaker(step.role);

    // Play ambient typing if applicable
    if (step.ambient && typingAudioRef.current) {
      typingAudioRef.current.currentTime = 0;
      typingAudioRef.current.play().catch(() => {});
    }

    // Play audio
    await playAudio(step.audio);

    // Stop typing sound
    if (typingAudioRef.current) typingAudioRef.current.pause();

    setActiveSpeaker(null);
    if (abortRef.current) return;

    // Next step
    runDemo(idx + 1);
  }

  function endCall() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typingAudioRef.current) typingAudioRef.current.pause();
    if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
    setCall(c => ({ ...c, phase: "ended", active: false }));
    addMsg("system", `Call ended — ${formatDuration(call.duration)}`);
    clearInterval(timerRef.current);
    setActiveSpeaker(null);
    setIsTyping(false);
    setLiveStatus("");
    abortRef.current = true;
  }

  async function sendMessage() {
    if (!input.trim() || demoMode) return;
    const text = input.trim();
    setInput("");
    addMsg("user", text);
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages.filter(m => m.role !== "system").map(m => ({ role: m.role, text: m.text })) }),
      });
      const data = await res.json();
      await sleep(600 + Math.random() * 800);
      setIsTyping(false);
      addMsg("assistant", data.reply);
    } catch {
      setIsTyping(false);
      addMsg("assistant", "I apologize, could you repeat that?");
    }
  }

  return (
    <div className="min-h-screen mesh-bg">
      {/* Floating nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-t-0 border-x-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dim)] flex items-center justify-center text-sm font-bold text-[var(--bg)]">GH</div>
            <span className="font-display text-lg font-semibold tracking-tight">Grand Horizon</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Copy */}
          <div>
            <div className="animate-fadeUp">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--gold-dim)]/30 text-[var(--gold)] mb-6 bg-[var(--gold)]/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                AI Concierge Online
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
                Your next hotel stay,<br/>
                <span className="bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)] bg-clip-text text-transparent">booked by voice</span>
              </h1>
              <p className="text-lg text-[var(--muted)] leading-relaxed mb-8 max-w-lg">
                Call in. Tell our AI what you need. Get confirmed instantly with a text. No apps, no forms, no waiting on hold.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-12 animate-fadeUp" style={{ animationDelay: '0.15s' }}>
              <button
                onClick={() => startCall(true)}
                disabled={call.phase === "ringing" || call.phase === "connected"}
                className="group relative px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[var(--gold)] to-[var(--gold-bright)] text-[var(--bg)] hover:shadow-lg hover:shadow-[var(--gold)]/20 transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  🔊 Watch Demo Call
                </span>
              </button>
              <button
                onClick={() => setCallRequested(true)}
                disabled={call.phase === "ringing" || call.phase === "connected" || callRequested}
                className="px-6 py-3.5 rounded-xl font-semibold text-sm glass border-[var(--gold-dim)]/20 hover:border-[var(--gold)]/30 transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  📞 Try It Yourself
                </span>
              </button>
            </div>

            {/* Phone number input for real call */}
            {callRequested && (
              <div className="animate-fadeUp mb-8 p-5 rounded-2xl glass border border-[var(--gold-dim)]/20 max-w-md">
                <p className="text-sm font-medium mb-3 text-[var(--gold)]">📞 Enter your phone number — Aria will call you!</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setCallError("");
                  if (!phoneNumber.trim()) return;
                  try {
                    const res = await fetch("/api/call", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ phone: phoneNumber.trim() }),
                    });
                    const data = await res.json();
                    if (data.error) { setCallError(data.error); return; }
                    setCallRequested(false);
                    setCall({ active: true, duration: 0, phase: "ringing" });
                    setMessages([]);
                    setDemoMode(false);
                    setLiveStatus("Calling...");
                    addMsg("system", "📞 Calling " + phoneNumber + " — pick up to talk to Aria!");

                    // Connect to live transcript SSE
                    const cleanPhone = phoneNumber.trim().replace(/\D/g, "").slice(-10);
                    const es = new EventSource(`/api/call/transcript?phone=${cleanPhone}`);
                    eventSourceRef.current = es;
                    let connected = false;
                    es.onmessage = (event) => {
                      try {
                        const d = JSON.parse(event.data);
                        if (d.type === "status") {
                          setLiveStatus(d.text);
                          if (d.text.includes("connected") && !connected) {
                            connected = true;
                            setCall(c => ({ ...c, phase: "connected" }));
                          }
                        } else if (d.type === "message") {
                          if (!connected) {
                            connected = true;
                            setCall(c => ({ ...c, phase: "connected" }));
                          }
                          setLiveStatus(d.role === "assistant" ? "🤖 Aria speaking..." : "🎤 You speaking...");
                          addMsg(d.role, d.text);
                        } else if (d.type === "ended") {
                          setLiveStatus("");
                          endCall();
                          es.close();
                        }
                      } catch {}
                    };
                    es.onerror = () => { es.close(); };
                  } catch (err: any) {
                    setCallError("Failed to initiate call. Try again.");
                  }
                }} className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="flex-1 bg-[var(--card)] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--gold-dim)] transition placeholder:text-[var(--muted)]"
                    autoFocus
                  />
                  <button type="submit" className="px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[var(--green)] to-emerald-600 text-white hover:shadow-lg transition-all">
                    Call Me
                  </button>
                </form>
                {callError && <p className="text-xs text-[var(--red)] mt-2">{callError}</p>}
                <p className="text-xs text-[var(--muted)] mt-2">Aria will call your phone. Standard call rates may apply.</p>
              </div>
            )}

            {/* Stats row */}
            <div className="flex gap-8 animate-fadeUp" style={{ animationDelay: '0.25s' }}>
              {[
                { value: "25", label: "Rooms" },
                { value: "<3s", label: "Avg. Answer" },
                { value: "98%", label: "Accuracy" },
                { value: "24/7", label: "Available" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-[var(--gold)]">{s.value}</div>
                  <div className="text-xs text-[var(--muted)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Phone UI */}
          <div className="animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            <div className="relative max-w-sm mx-auto">
              {/* Phone frame */}
              <div className="rounded-[2.5rem] border-2 border-white/[0.06] bg-[var(--bg2)] p-2 glow-gold">
                <div className="rounded-[2rem] overflow-hidden bg-[var(--bg)]">
                  {/* Phone status bar */}
                  <div className="flex items-center justify-between px-6 py-2 text-[10px] text-[var(--muted)]">
                    <span>9:41</span>
                    <div className="w-20 h-5 bg-black rounded-full" />
                    <span>📶 🔋</span>
                  </div>

                  {/* Call header */}
                  <div className="px-5 py-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      {call.phase === "ringing" ? (
                        <div className="w-10 h-10 rounded-full bg-[var(--green)]/20 flex items-center justify-center animate-ring">
                          <span className="text-lg">📞</span>
                        </div>
                      ) : call.phase === "connected" ? (
                        <div className="w-10 h-10 rounded-full bg-[var(--green)]/20 flex items-center justify-center animate-pulse-ring">
                          <span className="text-lg">🎙️</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center">
                          <span className="text-lg">🏨</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Grand Horizon Hotel</div>
                        <div className="text-xs text-[var(--muted)]">
                          {call.phase === "ringing" && <span className="text-[var(--green)]">Ringing...</span>}
                          {call.phase === "connected" && (
                            <span className="text-[var(--green)] flex items-center gap-2">
                              Connected • {formatDuration(call.duration)}
                              {activeSpeaker && (
                                <span className="flex items-end gap-[2px] h-3">
                                  {[12, 18, 8, 22, 14, 10, 16].map((h, i) => (
                                    <span key={i} className="w-[2px] bg-[var(--green)] rounded-full wave-bar" style={{ '--h': `${h}px`, '--d': `${i * 0.08}s` } as React.CSSProperties} />
                                  ))}
                                </span>
                              )}
                            </span>
                          )}
                          {call.phase === "ended" && <span className="text-[var(--red)]">Call ended</span>}
                          {call.phase === "idle" && "+1 (800) 555-0100"}
                        </div>
                      </div>
                      {call.phase === "connected" && (
                        <button onClick={endCall} className="w-9 h-9 rounded-full bg-[var(--red)] flex items-center justify-center text-white text-xs hover:bg-red-600 transition">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Speaker indicator */}
                  {activeSpeaker && call.phase === "connected" && (
                    <div className="px-5 py-1.5 bg-[var(--card)] border-b border-white/5 text-[10px] text-center">
                      {activeSpeaker === "assistant" ? (
                        <span className="text-[var(--gold)]">🤖 Aria Speaking</span>
                      ) : (
                        <span className="text-blue-400">🎤 Caller Speaking</span>
                      )}
                    </div>
                  )}

                  {/* Messages */}
                  <div ref={chatRef} className="h-[340px] overflow-y-auto px-4 py-3 space-y-2.5">
                    {call.phase === "idle" && messages.length === 0 && (
                      <div className="h-full flex items-center justify-center text-center px-4">
                        <div>
                          <div className="text-5xl mb-4 animate-float">🏨</div>
                          <p className="text-sm text-[var(--muted)] leading-relaxed">
                            Press <strong>Watch Demo Call</strong> to hear the AI concierge in action
                          </p>
                          <p className="text-xs text-[var(--muted)] mt-2">🔊 Turn your volume up</p>
                        </div>
                      </div>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : m.role === "system" ? "justify-center" : "justify-start"} animate-scaleIn`}>
                        {m.role === "system" ? (
                          <div className="text-[10px] text-[var(--muted)] bg-[var(--card)] px-3 py-1 rounded-full">
                            {m.text}
                          </div>
                        ) : (
                          <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
                            m.role === "user"
                              ? "bg-[var(--accent)] text-white rounded-br-md"
                              : "bg-[var(--card)] border border-white/5 rounded-bl-md"
                          }`}>
                            {m.text}
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start animate-scaleIn">
                        <div className="bg-[var(--card)] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex gap-1.5 items-center">
                            <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="px-3 py-3 border-t border-white/5">
                    {call.phase === "connected" && !demoMode ? (
                      <div className="h-10 flex items-center justify-center text-xs gap-2">
                        {liveStatus ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                            <span className="text-[var(--green)]">{liveStatus}</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                            <span className="text-[var(--muted)]">Live call — speak into your phone</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="h-10 flex items-center justify-center text-xs text-[var(--muted)]">
                        {call.phase === "ringing" && "Connecting to AI Concierge..."}
                        {call.phase === "connected" && demoMode && "🔴 Live Demo — Listen to the conversation"}
                        {(call.phase === "idle" || call.phase === "ended") && "Start a call to begin"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", icon: "📞", title: "Call In", desc: "Dial our hotel number — AI answers in under 3 seconds" },
            { step: "02", icon: "📅", title: "Tell Us Your Dates", desc: "Just say when you need the room, naturally" },
            { step: "03", icon: "🏨", title: "Pick Your Room", desc: "AI checks live availability and recommends options" },
            { step: "04", icon: "✅", title: "Get Confirmed", desc: "Booking confirmed + SMS sent in seconds" },
          ].map((s, i) => (
            <div key={s.step} className="relative animate-fadeUp" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="glass rounded-2xl p-6 h-full hover:border-[var(--gold)]/20 transition group">
                <div className="text-xs font-mono text-[var(--gold-dim)] mb-3">{s.step}</div>
                <div className="text-3xl mb-3 group-hover:scale-110 transition">{s.icon}</div>
                <div className="font-semibold mb-1">{s.title}</div>
                <div className="text-sm text-[var(--muted)] leading-relaxed">{s.desc}</div>
              </div>
              {i < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-3 text-[var(--muted)]">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tech */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="glass-gold rounded-2xl p-8 md:p-12 text-center glow-gold">
          <h2 className="font-display text-2xl font-bold mb-3">Built with Telnyx</h2>
          <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
            Voice AI for natural conversations. Programmable SMS for instant confirmations. 
            Global infrastructure for crystal-clear calls.
          </p>
          <div className="flex justify-center gap-6 text-sm text-[var(--muted)]">
            <span>Voice AI</span>
            <span className="text-[var(--gold)]">•</span>
            <span>Call Control</span>
            <span className="text-[var(--gold)]">•</span>
            <span>SMS API</span>
            <span className="text-[var(--gold)]">•</span>
            <span>TeXML</span>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-[var(--muted)]">
        Grand Horizon Hotel — AI Booking Demo • Powered by Telnyx
      </footer>
    </div>
  );
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function formatDuration(s: number) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`; }
