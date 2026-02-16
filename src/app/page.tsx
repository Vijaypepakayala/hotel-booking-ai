"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "assistant" | "user";
  text: string;
}

const ROOM_TYPES = [
  { type: "Standard", price: 99, icon: "🛏️" },
  { type: "Deluxe", price: 149, icon: "✨" },
  { type: "Suite", price: 249, icon: "🏰" },
  { type: "Penthouse", price: 499, icon: "👑" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function startCall() {
    setCallActive(true);
    setMessages([]);
    setIsTyping(true);
    await delay(1000);
    addAssistant(
      "Welcome to Grand Horizon Hotel! 🏨 I'm your AI booking assistant. I can help you check room availability, make a reservation, or answer any questions about our hotel. What can I help you with today?"
    );
    setIsTyping(false);
  }

  function endCall() {
    setCallActive(false);
    setMessages([]);
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: messages }),
      });
      const data = await res.json();
      await delay(800);
      addAssistant(data.reply);
    } catch {
      await delay(500);
      addAssistant("I apologize, I'm having a moment. Could you please repeat that?");
    }
    setIsTyping(false);
  }

  function addAssistant(text: string) {
    setMessages((prev) => [...prev, { role: "assistant", text }]);
  }

  function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏨</span>
          <span className="font-semibold text-[var(--gold)]">Grand Horizon</span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition"
        >
          Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mb-12 animate-in">
          <div className="inline-block px-4 py-1 rounded-full text-xs font-medium tracking-wider uppercase mb-6 border border-[var(--gold-dim)] text-[var(--gold)]">
            AI-Powered Hotel Booking
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            Book Your Stay with a{" "}
            <span className="text-[var(--gold)]">Simple Call</span>
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Our AI assistant handles your reservation from start to finish. Check availability,
            choose your room, and get instant confirmation — all through a natural conversation.
          </p>
        </div>

        {/* Room Types */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-in" style={{ animationDelay: "0.1s" }}>
          {ROOM_TYPES.map((r) => (
            <div key={r.type} className="glass rounded-xl p-4 text-center gold-glow">
              <div className="text-3xl mb-2">{r.icon}</div>
              <div className="font-semibold text-sm">{r.type}</div>
              <div className="text-[var(--gold)] font-bold">${r.price}<span className="text-xs text-[var(--text-muted)]">/night</span></div>
            </div>
          ))}
        </div>

        {/* Call Simulator */}
        <div className="max-w-lg mx-auto animate-in" style={{ animationDelay: "0.2s" }}>
          <div className="glass rounded-2xl overflow-hidden gold-glow">
            {/* Phone header */}
            <div className="bg-[var(--navy-card)] px-5 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${callActive ? "bg-green-400 animate-pulse" : "bg-[var(--text-muted)]"}`} />
                <div>
                  <div className="font-semibold text-sm">Grand Horizon Hotel</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {callActive ? "Connected • AI Assistant" : "+1 (555) 0100"}
                  </div>
                </div>
              </div>
              {callActive ? (
                <button
                  onClick={endCall}
                  className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/30 transition"
                >
                  End Call
                </button>
              ) : (
                <button
                  onClick={startCall}
                  className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-500/30 transition pulse-gold"
                >
                  📞 Call Now
                </button>
              )}
            </div>

            {/* Chat area */}
            <div ref={chatRef} className="h-80 overflow-y-auto p-4 space-y-3">
              {!callActive && messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <div className="text-4xl mb-3">📞</div>
                    <p className="text-[var(--text-muted)] text-sm">
                      Click &quot;Call Now&quot; to start a conversation<br />with our AI booking assistant
                    </p>
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[var(--gold)] text-[var(--navy)] rounded-br-sm"
                        : "bg-[var(--navy-light)] border border-white/5 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[var(--navy-light)] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[var(--gold)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-[var(--gold)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-[var(--gold)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            {callActive && (
              <div className="p-3 border-t border-white/5">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-[var(--navy-light)] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--gold-dim)] transition placeholder:text-[var(--text-muted)]"
                  />
                  <button
                    type="submit"
                    className="bg-[var(--gold)] text-[var(--navy)] px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-[var(--gold-light)] transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 animate-in" style={{ animationDelay: "0.3s" }}>
          {[
            { icon: "🤖", title: "AI-Powered", desc: "Natural language understanding handles complex booking requests" },
            { icon: "⚡", title: "Instant Booking", desc: "Real-time availability checking and immediate confirmation" },
            { icon: "📱", title: "SMS Confirmation", desc: "Automatic text message with booking details sent to your phone" },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-sm text-[var(--text-muted)]">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-xs text-[var(--text-muted)]">
          Powered by <span className="text-[var(--gold)]">Telnyx</span> Voice AI &amp; Messaging
        </div>
      </div>
    </div>
  );
}
