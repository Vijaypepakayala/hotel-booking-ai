"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Booking } from "@/lib/types";

interface Stats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  totalGuests: number;
  totalBookings: number;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-500/20 text-blue-400",
  "checked-in": "bg-green-500/20 text-green-400",
  "checked-out": "bg-gray-500/20 text-gray-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data.bookings);
      setStats(data.stats);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--gold)] animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">🏨</span>
            <span className="font-semibold text-[var(--gold)]">Grand Horizon</span>
          </Link>
          <span className="text-[var(--text-muted)] text-sm">/ Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-[var(--text-muted)]">Live</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon="🏨" label="Total Rooms" value={stats.totalRooms} />
            <StatCard icon="📊" label="Occupancy" value={`${stats.occupancyRate}%`} sub={`${stats.occupiedRooms} occupied`} highlight />
            <StatCard icon="💰" label="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} />
            <StatCard icon="👤" label="Guests" value={stats.totalGuests} sub={`${stats.totalBookings} bookings`} />
          </div>
        )}

        {/* Room Availability Bar */}
        {stats && (
          <div className="glass rounded-xl p-5 mb-8 gold-glow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Room Availability</h2>
              <span className="text-sm text-[var(--text-muted)]">{stats.availableRooms} of {stats.totalRooms} available</span>
            </div>
            <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
              {[
                { type: "Standard", count: 10, color: "bg-blue-500" },
                { type: "Deluxe", count: 8, color: "bg-purple-500" },
                { type: "Suite", count: 5, color: "bg-amber-500" },
                { type: "Penthouse", count: 2, color: "bg-rose-500" },
              ].map((r) => (
                <div
                  key={r.type}
                  className={`${r.color}/30 flex items-center justify-center text-xs font-medium`}
                  style={{ flex: r.count }}
                  title={`${r.type}: ${r.count} rooms`}
                >
                  {r.type}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Table */}
        <div className="glass rounded-xl overflow-hidden gold-glow">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold">Recent Bookings</h2>
            <span className="text-xs text-[var(--text-muted)]">Auto-refreshing every 5s</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-3">Confirmation</th>
                  <th className="px-5 py-3">Guest</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Check-in</th>
                  <th className="px-5 py-3">Check-out</th>
                  <th className="px-5 py-3">Guests</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3">
                      <span className="font-mono text-[var(--gold)] font-medium">{b.confirmationCode}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{b.guestName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{b.guestPhone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div>{b.roomType}</div>
                      <div className="text-xs text-[var(--text-muted)]">Room {b.roomNumber}</div>
                    </td>
                    <td className="px-5 py-3">{formatDate(b.checkIn)}</td>
                    <td className="px-5 py-3">{formatDate(b.checkOut)}</td>
                    <td className="px-5 py-3">
                      {b.adults}A{b.children > 0 ? ` ${b.children}C` : ""}
                    </td>
                    <td className="px-5 py-3 font-medium">${b.totalPrice}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[var(--text-muted)]">
                      No bookings yet. Try making one through the AI assistant!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, highlight }: {
  icon: string; label: string; value: string | number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`glass rounded-xl p-5 ${highlight ? "gold-glow" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-[var(--gold)]" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
