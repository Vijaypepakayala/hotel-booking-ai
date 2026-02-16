import { Room, Booking, CallLog } from "./types";

// In-memory store (resets on cold start — fine for demo)
// In production, use a database

const rooms: Room[] = [
  // Standard Rooms - Floor 2
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `std-${i + 1}`,
    type: "Standard" as const,
    number: `${200 + i + 1}`,
    floor: 2,
    pricePerNight: 99,
    description: "Comfortable room with city view",
    amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service"],
  })),
  // Deluxe Rooms - Floor 3
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `dlx-${i + 1}`,
    type: "Deluxe" as const,
    number: `${300 + i + 1}`,
    floor: 3,
    pricePerNight: 149,
    description: "Spacious room with premium amenities",
    amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service", "Balcony", "Bathrobe"],
  })),
  // Suites - Floor 4
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `ste-${i + 1}`,
    type: "Suite" as const,
    number: `${400 + i + 1}`,
    floor: 4,
    pricePerNight: 249,
    description: "Luxury suite with living area",
    amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service", "Balcony", "Bathrobe", "Jacuzzi", "Living Room"],
  })),
  // Penthouses - Floor 5
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `ph-${i + 1}`,
    type: "Penthouse" as const,
    number: `${500 + i + 1}`,
    floor: 5,
    pricePerNight: 499,
    description: "Ultimate luxury penthouse experience",
    amenities: ["Wi-Fi", "TV", "Mini Bar", "Room Service", "Terrace", "Bathrobe", "Jacuzzi", "Living Room", "Kitchen", "Butler Service"],
  })),
];

let bookings: Booking[] = [
  // Seed some demo bookings
  {
    id: "bk-001",
    roomId: "std-1",
    roomType: "Standard",
    roomNumber: "201",
    guestName: "John Smith",
    guestPhone: "+14155551234",
    checkIn: "2026-02-16",
    checkOut: "2026-02-19",
    adults: 2,
    children: 0,
    totalPrice: 297,
    status: "confirmed",
    confirmationCode: "GH-78A3K",
    createdAt: "2026-02-14T10:30:00Z",
  },
  {
    id: "bk-002",
    roomId: "dlx-1",
    roomType: "Deluxe",
    roomNumber: "301",
    guestName: "Sarah Johnson",
    guestPhone: "+14155555678",
    checkIn: "2026-02-17",
    checkOut: "2026-02-20",
    adults: 2,
    children: 1,
    totalPrice: 447,
    status: "confirmed",
    confirmationCode: "GH-92B7M",
    createdAt: "2026-02-15T14:20:00Z",
  },
  {
    id: "bk-003",
    roomId: "ste-1",
    roomType: "Suite",
    roomNumber: "401",
    guestName: "Michael Chen",
    guestPhone: "+14155559012",
    checkIn: "2026-02-16",
    checkOut: "2026-02-22",
    adults: 2,
    children: 2,
    totalPrice: 1494,
    status: "checked-in",
    confirmationCode: "GH-45C1P",
    createdAt: "2026-02-10T09:15:00Z",
  },
];

let callLogs: CallLog[] = [
  {
    id: "cl-001",
    callId: "call-abc123",
    callerNumber: "+14155551234",
    duration: 180,
    summary: "Booked Standard Room 201 for Feb 16-19",
    bookingId: "bk-001",
    createdAt: "2026-02-14T10:30:00Z",
  },
  {
    id: "cl-002",
    callId: "call-def456",
    callerNumber: "+14155555678",
    duration: 240,
    summary: "Booked Deluxe Room 301 for Feb 17-20, 1 child",
    bookingId: "bk-002",
    createdAt: "2026-02-15T14:20:00Z",
  },
];

// --- Room functions ---
export function getAllRooms(): Room[] {
  return rooms;
}

export function getRoomsByType(type: string): Room[] {
  return rooms.filter((r) => r.type.toLowerCase() === type.toLowerCase());
}

export function getAvailableRooms(checkIn: string, checkOut: string, type?: string): Room[] {
  const bookedRoomIds = bookings
    .filter((b) => b.status !== "cancelled" && datesOverlap(b.checkIn, b.checkOut, checkIn, checkOut))
    .map((b) => b.roomId);

  return rooms.filter(
    (r) => !bookedRoomIds.includes(r.id) && (!type || r.type.toLowerCase() === type.toLowerCase())
  );
}

function datesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// --- Booking functions ---
export function getAllBookings(): Booking[] {
  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createBooking(data: Omit<Booking, "id" | "confirmationCode" | "createdAt" | "status">): Booking {
  const booking: Booking = {
    ...data,
    id: `bk-${Date.now()}`,
    status: "confirmed",
    confirmationCode: `GH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  return booking;
}

export function getBookingStats() {
  const active = bookings.filter((b) => b.status === "confirmed" || b.status === "checked-in");
  const totalRooms = rooms.length;
  const occupiedRooms = active.length;
  const revenue = bookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.totalPrice, 0);
  const totalGuests = active.reduce((sum, b) => sum + b.adults + b.children, 0);

  return {
    totalRooms,
    occupiedRooms,
    availableRooms: totalRooms - occupiedRooms,
    occupancyRate: Math.round((occupiedRooms / totalRooms) * 100),
    totalRevenue: revenue,
    totalGuests,
    totalBookings: bookings.length,
  };
}

// --- Call log functions ---
export function getAllCallLogs(): CallLog[] {
  return callLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addCallLog(log: Omit<CallLog, "id" | "createdAt">): CallLog {
  const entry: CallLog = {
    ...log,
    id: `cl-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  callLogs.push(entry);
  return entry;
}

// --- Nights calculator ---
export function calculateNights(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
