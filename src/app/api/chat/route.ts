import { NextRequest, NextResponse } from "next/server";
import { getAvailableRooms, createBooking, calculateNights, getAllRooms } from "@/lib/data";

// Simple rule-based chat AI for the demo
// In production, this would use Telnyx Voice AI or an LLM

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

export async function POST(req: NextRequest) {
  const { message, history } = (await req.json()) as {
    message: string;
    history: ChatMessage[];
  };

  const lower = message.toLowerCase();
  const allHistory = [...history, { role: "user" as const, text: message }];

  let reply = "";

  // Detect intent
  if (containsAny(lower, ["availability", "available", "room", "book", "reserve", "stay", "looking for"])) {
    // Check if dates are mentioned
    const dates = extractDates(message);
    if (dates) {
      const roomType = extractRoomType(lower);
      const available = getAvailableRooms(dates.checkIn, dates.checkOut, roomType || undefined);

      if (available.length > 0) {
        const nights = calculateNights(dates.checkIn, dates.checkOut);
        const grouped = groupByType(available);
        const summary = Object.entries(grouped)
          .map(([type, rooms]) => `${rooms.length} ${type} room${rooms.length > 1 ? "s" : ""} ($${rooms[0].pricePerNight}/night)`)
          .join(", ");

        reply = `Great news! For ${formatDate(dates.checkIn)} to ${formatDate(dates.checkOut)} (${nights} night${nights > 1 ? "s" : ""}), we have:\n\n${summary}\n\nWhich type of room would you like? Or would you like me to recommend one based on your group size?`;
      } else {
        reply = `I'm sorry, we're fully booked for ${formatDate(dates.checkIn)} to ${formatDate(dates.checkOut)}. Would you like to try different dates, or shall I check nearby dates for availability?`;
      }
    } else {
      reply = "I'd love to help you find a room! What dates are you looking for? For example, you could say \"February 20 to February 23\" or \"next Friday to Sunday\".";
    }
  } else if (containsAny(lower, ["standard", "deluxe", "suite", "penthouse"]) && hasBookingContext(allHistory)) {
    const roomType = extractRoomType(lower)!;
    const dates = findDatesInHistory(allHistory);
    if (dates) {
      const available = getAvailableRooms(dates.checkIn, dates.checkOut, roomType);
      const nights = calculateNights(dates.checkIn, dates.checkOut);
      if (available.length > 0) {
        const room = available[0];
        const total = room.pricePerNight * nights;
        reply = `Excellent choice! I have ${roomType} Room ${room.number} available on Floor ${room.floor}.\n\n💰 ${nights} nights × $${room.pricePerNight} = $${total} total\n🛎️ Amenities: ${room.amenities.join(", ")}\n\nTo complete the booking, I'll need:\n1. Your full name\n2. Phone number\n3. Number of adults and children\n\nPlease go ahead!`;
      } else {
        reply = `Unfortunately, all our ${roomType} rooms are booked for those dates. Would you like to try a different room type?`;
      }
    } else {
      reply = "Which dates are you looking at? I'll check availability right away.";
    }
  } else if (containsAny(lower, ["name is", "i'm ", "my name"]) || (hasBookingContext(allHistory) && looksLikeGuestInfo(lower))) {
    // Try to extract guest details
    const name = extractName(message);
    const phone = extractPhone(message);
    const guests = extractGuests(message);

    if (name) {
      // Attempt to create booking with whatever info we have
      const dates = findDatesInHistory(allHistory);
      const roomType = findRoomTypeInHistory(allHistory);

      if (dates && roomType) {
        const available = getAvailableRooms(dates.checkIn, dates.checkOut, roomType);
        if (available.length > 0) {
          const room = available[0];
          const nights = calculateNights(dates.checkIn, dates.checkOut);
          const total = room.pricePerNight * nights;

          const booking = createBooking({
            roomId: room.id,
            roomType: room.type,
            roomNumber: room.number,
            guestName: name,
            guestPhone: phone || "+1 (555) 000-0000",
            checkIn: dates.checkIn,
            checkOut: dates.checkOut,
            adults: guests?.adults || 2,
            children: guests?.children || 0,
            totalPrice: total,
          });

          reply = `✅ Your reservation is confirmed!\n\n📋 Booking Details:\n━━━━━━━━━━━━━━━\n🔑 Confirmation: ${booking.confirmationCode}\n🏨 ${room.type} Room ${room.number}, Floor ${room.floor}\n📅 ${formatDate(dates.checkIn)} → ${formatDate(dates.checkOut)}\n👤 ${name} | ${booking.adults} adult${booking.adults > 1 ? "s" : ""}${booking.children > 0 ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}\n💰 Total: $${total}\n\n${phone ? `📱 A confirmation SMS has been sent to ${phone}.` : "Would you like me to send a confirmation to your phone?"}\n\nThank you for choosing Grand Horizon Hotel! Is there anything else I can help with?`;
        } else {
          reply = "I'm sorry, that room just got booked. Let me check other options for you...";
        }
      } else {
        reply = `Thank you, ${name}! To complete your booking, I need to know which dates and room type you'd like. What dates work for you?`;
      }
    } else {
      reply = "Could you please share your full name for the reservation?";
    }
  } else if (containsAny(lower, ["price", "cost", "rate", "how much"])) {
    reply = "Here are our room rates:\n\n🛏️ Standard — $99/night\n✨ Deluxe — $149/night\n🏰 Suite — $249/night\n👑 Penthouse — $499/night\n\nAll rooms include complimentary Wi-Fi and breakfast. Would you like to check availability for any of these?";
  } else if (containsAny(lower, ["amenities", "facilities", "what's included", "breakfast", "pool", "gym"])) {
    reply = "Grand Horizon Hotel offers:\n\n🏊 Rooftop infinity pool\n🍳 Complimentary breakfast buffet\n💪 24/7 fitness center\n🧖 Full-service spa\n🅿️ Valet parking\n📶 High-speed Wi-Fi\n🍽️ 3 on-site restaurants\n\nEach room type has additional amenities. Would you like details on a specific room?";
  } else if (containsAny(lower, ["cancel", "change", "modify"])) {
    reply = "For cancellations or modifications, I can help! Please provide your confirmation code (starts with GH-) and I'll look up your booking.";
  } else if (containsAny(lower, ["thank", "thanks", "bye", "goodbye"])) {
    reply = "Thank you for calling Grand Horizon Hotel! 🌟 We look forward to welcoming you. Have a wonderful day!";
  } else if (containsAny(lower, ["hello", "hi", "hey"])) {
    reply = "Hello! Welcome to Grand Horizon Hotel. I can help you with:\n\n1️⃣ Room availability & booking\n2️⃣ Room types & pricing\n3️⃣ Hotel amenities & facilities\n\nWhat would you like to know?";
  } else {
    reply = "I'd be happy to help! I can assist with room bookings, check availability, share pricing information, or tell you about our hotel amenities. What would you like to know?";
  }

  return NextResponse.json({ reply });
}

// --- Helpers ---

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function extractDates(text: string): { checkIn: string; checkOut: string } | null {
  // Try patterns like "Feb 20 to Feb 23", "20th to 23rd February", "2026-02-20 to 2026-02-23"
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|through|until|-)\s*(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return { checkIn: isoMatch[1], checkOut: isoMatch[2] };

  const months: Record<string, string> = {
    jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
    apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
    aug: "08", august: "08", sep: "09", september: "09", oct: "10", october: "10",
    nov: "11", november: "11", dec: "12", december: "12",
  };

  const monthPattern = Object.keys(months).join("|");
  const re = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:to|through|until|-)\\s*(?:(${monthPattern})\\s+)?(\\d{1,2})(?:st|nd|rd|th)?`,
    "i"
  );
  const match = text.match(re);
  if (match) {
    const m1 = months[match[1].toLowerCase()];
    const d1 = match[2].padStart(2, "0");
    const m2 = match[3] ? months[match[3].toLowerCase()] : m1;
    const d2 = match[4].padStart(2, "0");
    return { checkIn: `2026-${m1}-${d1}`, checkOut: `2026-${m2}-${d2}` };
  }

  return null;
}

function extractRoomType(text: string): string | null {
  if (text.includes("penthouse")) return "Penthouse";
  if (text.includes("suite")) return "Suite";
  if (text.includes("deluxe")) return "Deluxe";
  if (text.includes("standard")) return "Standard";
  return null;
}

function extractName(text: string): string | null {
  const patterns = [
    /(?:name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  // If it looks like just a name (2-3 capitalized words)
  if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){0,2}$/.test(text.trim())) {
    return text.trim();
  }
  return null;
}

function extractPhone(text: string): string | null {
  const m = text.match(/\+?[\d\s()-]{10,}/);
  return m ? m[0].trim() : null;
}

function extractGuests(text: string): { adults: number; children: number } | null {
  const adults = text.match(/(\d+)\s*adult/i);
  const children = text.match(/(\d+)\s*(?:child|kid)/i);
  if (adults || children) {
    return {
      adults: adults ? parseInt(adults[1]) : 2,
      children: children ? parseInt(children[1]) : 0,
    };
  }
  return null;
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByType(rooms: { type: string; pricePerNight: number }[]) {
  const groups: Record<string, typeof rooms> = {};
  rooms.forEach((r) => {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  });
  return groups;
}

function hasBookingContext(history: ChatMessage[]): boolean {
  return history.some((m) =>
    containsAny(m.text.toLowerCase(), ["availability", "available", "book", "room", "reserve", "night"])
  );
}

function looksLikeGuestInfo(text: string): boolean {
  return containsAny(text, ["adult", "child", "kid", "people", "guest", "person"]) ||
    /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text) ||
    /\+?\d{10,}/.test(text);
}

function findDatesInHistory(history: ChatMessage[]): { checkIn: string; checkOut: string } | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const dates = extractDates(history[i].text);
    if (dates) return dates;
  }
  return null;
}

function findRoomTypeInHistory(history: ChatMessage[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const type = extractRoomType(history[i].text.toLowerCase());
    if (type) return type;
  }
  return null;
}
