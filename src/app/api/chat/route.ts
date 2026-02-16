import { NextRequest, NextResponse } from "next/server";
import { getAvailableRooms, createBooking, calculateNights } from "@/lib/data";

interface Msg { role: string; text: string; }

export async function POST(req: NextRequest) {
  const { message, history } = await req.json() as { message: string; history: Msg[] };
  const lower = message.toLowerCase();
  const all = [...(history || []), { role: "user", text: message }];

  let reply: string;

  if (has(lower, ["price", "cost", "rate", "how much"])) {
    reply = "Our nightly rates:\n\n🛏️ Standard — $99 · City view, Wi-Fi, TV\n✨ Deluxe — $149 · Balcony, bathrobe, breakfast\n🏰 Suite — $249 · Jacuzzi, living room, minibar\n👑 Penthouse — $499 · Terrace, butler, full kitchen\n\nWhich dates would you like me to check?";
  } else if (has(lower, ["amenities", "facilities", "pool", "spa", "gym", "breakfast"])) {
    reply = "Grand Horizon amenities:\n\n🏊 Rooftop infinity pool\n🧖 Full-service spa & sauna\n💪 24/7 fitness center\n🍳 Complimentary breakfast buffet\n🍷 3 restaurants & sky bar\n🅿️ Valet parking\n📶 High-speed Wi-Fi\n\nAll included with your stay. Shall I check room availability?";
  } else if (has(lower, ["available", "availability", "book", "reserve", "room", "stay", "looking for", "need a"])) {
    const dates = parseDates(message);
    if (dates) {
      const type = parseType(lower);
      const avail = await getAvailableRooms(dates.checkIn, dates.checkOut, type || undefined);
      const nights = calculateNights(dates.checkIn, dates.checkOut);
      if (avail.length > 0) {
        const grouped = new Map<string, { count: number; price: number }>();
        avail.forEach(r => {
          const g = grouped.get(r.type) || { count: 0, price: r.pricePerNight };
          g.count++;
          grouped.set(r.type, g);
        });
        const lines = Array.from(grouped.entries()).map(([t, g]) =>
          `• ${t} — $${g.price}/night ($${g.price * nights} for ${nights} nights) — ${g.count} available`
        ).join("\n");
        reply = `For ${fmtDate(dates.checkIn)} to ${fmtDate(dates.checkOut)} (${nights} night${nights > 1 ? "s" : ""}):\n\n${lines}\n\nWhich would you prefer?`;
      } else {
        reply = `Unfortunately we're fully booked ${fmtDate(dates.checkIn)} to ${fmtDate(dates.checkOut)}. Would you like to try nearby dates?`;
      }
    } else {
      reply = "I'd be happy to check availability! What dates are you looking at? For example: \"February 20 to 23\"";
    }
  } else if (has(lower, ["standard", "deluxe", "suite", "penthouse"]) && hasContext(all)) {
    const type = parseType(lower)!;
    const dates = findDates(all);
    if (dates) {
      const avail = await getAvailableRooms(dates.checkIn, dates.checkOut, type);
      const nights = calculateNights(dates.checkIn, dates.checkOut);
      if (avail.length > 0) {
        const room = avail[0];
        const total = room.pricePerNight * nights;
        reply = `Great choice! ${type} Room ${room.number} on Floor ${room.floor}.\n\n💰 ${nights} × $${room.pricePerNight} = $${total}\n🛎️ ${room.amenities.join(" · ")}\n\nTo book, I'll need your full name, phone number, and number of guests.`;
      } else {
        reply = `All ${type} rooms are taken for those dates. Would you like a different room type?`;
      }
    } else {
      reply = "Which dates are you interested in?";
    }
  } else if (hasName(message) && hasContext(all)) {
    const name = extractName(message);
    const phone = extractPhone(message);
    const guests = extractGuests(message);
    const dates = findDates(all);
    const type = findType(all);

    if (name && dates && type) {
      const avail = await getAvailableRooms(dates.checkIn, dates.checkOut, type);
      if (avail.length > 0) {
        const room = avail[0];
        const nights = calculateNights(dates.checkIn, dates.checkOut);
        const total = room.pricePerNight * nights;
        const booking = await createBooking({
          roomId: room.id, guestName: name, guestPhone: phone || "+1 (555) 000-0000",
          checkIn: dates.checkIn, checkOut: dates.checkOut,
          adults: guests?.adults || 2, children: guests?.children || 0, totalPrice: total,
        });
        reply = `✅ Reservation confirmed!\n\n━━━━━━━━━━━━━━━━━━━━━\n🔑  ${booking.confirmationCode}\n🏨  ${room.type} Room ${room.number}, Floor ${room.floor}\n📅  ${fmtDate(dates.checkIn)} → ${fmtDate(dates.checkOut)} (${nights} nights)\n👤  ${name} · ${booking.adults} adult${booking.adults > 1 ? "s" : ""}${booking.children ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}\n💰  $${total}\n━━━━━━━━━━━━━━━━━━━━━\n\n${phone ? `📱 Confirmation sent to ${phone}` : "Would you like a confirmation text?"}\n\nIs there anything else I can help with?`;
      } else {
        reply = "That room was just booked! Let me find alternatives...";
      }
    } else if (name) {
      reply = `Thanks, ${name}! What dates and room type would you like?`;
    } else {
      reply = "Could you share your full name for the reservation?";
    }
  } else if (has(lower, ["thank", "thanks", "bye", "goodbye", "that's all"])) {
    reply = "Thank you for choosing Grand Horizon Hotel! We look forward to your stay. Have a wonderful day! 🌟";
  } else if (has(lower, ["hello", "hi ", "hey", "good morning", "good evening", "good afternoon"])) {
    reply = "Welcome to Grand Horizon Hotel! I can help you with:\n\n📅 Room availability & booking\n💰 Rates & room types\n🏨 Hotel amenities\n\nWhat can I do for you?";
  } else {
    reply = "I'm here to help with room bookings, availability, rates, or hotel information. What would you like to know?";
  }

  return NextResponse.json({ reply });
}

function has(t: string, kw: string[]) { return kw.some(k => t.includes(k)); }
function hasContext(h: Msg[]) { return h.some(m => has(m.text.toLowerCase(), ["room", "book", "night", "available", "standard", "deluxe", "suite", "penthouse"])); }
function hasName(t: string) { return /(?:name is|i'm |i am )/i.test(t) || /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(t.trim()); }

function parseDates(t: string) {
  const iso = t.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|through)\s*(\d{4}-\d{2}-\d{2})/);
  if (iso) return { checkIn: iso[1], checkOut: iso[2] };
  const M: Record<string, string> = { jan:"01",january:"01",feb:"02",february:"02",mar:"03",march:"03",apr:"04",april:"04",may:"05",jun:"06",june:"06",jul:"07",july:"07",aug:"08",august:"08",sep:"09",september:"09",oct:"10",october:"10",nov:"11",november:"11",dec:"12",december:"12" };
  const mp = Object.keys(M).join("|");
  const re = new RegExp(`(${mp})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:to|-|through|until)\\s*(?:(${mp})\\s+)?(\\d{1,2})(?:st|nd|rd|th)?`, "i");
  const m = t.match(re);
  if (m) return { checkIn: `2026-${M[m[1].toLowerCase()]}-${m[2].padStart(2,"0")}`, checkOut: `2026-${M[(m[3]||m[1]).toLowerCase()]}-${m[4].padStart(2,"0")}` };
  return null;
}
function parseType(t: string) { return t.includes("penthouse") ? "Penthouse" : t.includes("suite") ? "Suite" : t.includes("deluxe") ? "Deluxe" : t.includes("standard") ? "Standard" : null; }
function extractName(t: string) { const m = t.match(/(?:name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i); return m?.[1] || (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(t.trim()) ? t.trim().match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/)?.[1] : null) || null; }
function extractPhone(t: string) { return t.match(/\+?[\d\s()-]{10,}/)?.[0]?.trim() || null; }
function extractGuests(t: string) { const a = t.match(/(\d+)\s*adult/i); const c = t.match(/(\d+)\s*(?:child|kid)/i); return (a||c) ? { adults: a ? +a[1] : 2, children: c ? +c[1] : 0 } : null; }
function fmtDate(d: string) { return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function findDates(h: Msg[]) { for (let i=h.length-1;i>=0;i--) { const d=parseDates(h[i].text); if(d) return d; } return null; }
function findType(h: Msg[]) { for (let i=h.length-1;i>=0;i--) { const t=parseType(h[i].text.toLowerCase()); if(t) return t; } return null; }
