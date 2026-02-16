import { Room, Booking } from "./types";

const rooms: Room[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `std-${i + 1}`, type: "Standard" as const, number: `${201 + i}`, floor: 2,
    pricePerNight: 99, amenities: ["Wi-Fi", "TV", "Mini Bar"], booked: i < 3,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `dlx-${i + 1}`, type: "Deluxe" as const, number: `${301 + i}`, floor: 3,
    pricePerNight: 149, amenities: ["Wi-Fi", "TV", "Mini Bar", "Balcony", "Bathrobe"], booked: i < 2,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `ste-${i + 1}`, type: "Suite" as const, number: `${401 + i}`, floor: 4,
    pricePerNight: 249, amenities: ["Wi-Fi", "TV", "Mini Bar", "Balcony", "Jacuzzi", "Living Room"], booked: i < 1,
  })),
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `ph-${i + 1}`, type: "Penthouse" as const, number: `${501 + i}`, floor: 5,
    pricePerNight: 499, amenities: ["Wi-Fi", "TV", "Mini Bar", "Terrace", "Jacuzzi", "Butler Service", "Kitchen"], booked: false,
  })),
];

let bookings: Booking[] = [
  {
    id: "bk-001", roomId: "std-1", roomType: "Standard", roomNumber: "201",
    guestName: "James Wilson", guestPhone: "+14155551234",
    checkIn: "2026-02-16", checkOut: "2026-02-19", adults: 2, children: 0,
    totalPrice: 297, status: "checked-in", confirmationCode: "GH-A7K3",
    createdAt: "2026-02-14T10:30:00Z",
  },
  {
    id: "bk-002", roomId: "dlx-1", roomType: "Deluxe", roomNumber: "301",
    guestName: "Sarah Chen", guestPhone: "+14155555678",
    checkIn: "2026-02-17", checkOut: "2026-02-20", adults: 2, children: 1,
    totalPrice: 447, status: "confirmed", confirmationCode: "GH-B9M2",
    createdAt: "2026-02-15T14:20:00Z",
  },
  {
    id: "bk-003", roomId: "ste-1", roomType: "Suite", roomNumber: "401",
    guestName: "Robert & Maria Lopez", guestPhone: "+14155559012",
    checkIn: "2026-02-16", checkOut: "2026-02-22", adults: 2, children: 2,
    totalPrice: 1494, status: "checked-in", confirmationCode: "GH-C1P5",
    createdAt: "2026-02-10T09:15:00Z",
  },
  {
    id: "bk-004", roomId: "std-2", roomType: "Standard", roomNumber: "202",
    guestName: "Emily Park", guestPhone: "+14155553456",
    checkIn: "2026-02-15", checkOut: "2026-02-17", adults: 1, children: 0,
    totalPrice: 198, status: "checked-out", confirmationCode: "GH-D4R8",
    createdAt: "2026-02-13T11:00:00Z",
  },
  {
    id: "bk-005", roomId: "std-3", roomType: "Standard", roomNumber: "203",
    guestName: "David Kim", guestPhone: "+14155557890",
    checkIn: "2026-02-16", checkOut: "2026-02-18", adults: 2, children: 0,
    totalPrice: 198, status: "confirmed", confirmationCode: "GH-E6T1",
    createdAt: "2026-02-15T16:45:00Z",
  },
  {
    id: "bk-006", roomId: "dlx-2", roomType: "Deluxe", roomNumber: "302",
    guestName: "Anna Müller", guestPhone: "+491701234567",
    checkIn: "2026-02-18", checkOut: "2026-02-23", adults: 2, children: 0,
    totalPrice: 745, status: "confirmed", confirmationCode: "GH-F2W9",
    createdAt: "2026-02-16T08:30:00Z",
  },
];

export function getAllRooms() { return rooms; }
export function getAllBookings() { return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }

export function getAvailableRooms(checkIn: string, checkOut: string, type?: string): Room[] {
  const bookedIds = bookings
    .filter(b => b.status !== "cancelled" && b.checkIn < checkOut && checkIn < b.checkOut)
    .map(b => b.roomId);
  return rooms.filter(r => !bookedIds.includes(r.id) && (!type || r.type.toLowerCase() === type.toLowerCase()));
}

export function createBooking(data: Omit<Booking, "id" | "confirmationCode" | "createdAt" | "status">): Booking {
  const booking: Booking = {
    ...data, id: `bk-${Date.now()}`, status: "confirmed",
    confirmationCode: `GH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  // Mark room as booked
  const room = rooms.find(r => r.id === data.roomId);
  if (room) room.booked = true;
  return booking;
}

export function getStats() {
  const active = bookings.filter(b => ["confirmed", "checked-in"].includes(b.status));
  const bookedRooms = rooms.filter(r => r.booked).length;
  return {
    totalRooms: rooms.length,
    bookedRooms,
    available: rooms.length - bookedRooms,
    occupancy: Math.round((bookedRooms / rooms.length) * 100),
    revenue: bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.totalPrice, 0),
    guests: active.reduce((s, b) => s + b.adults + b.children, 0),
    bookings: bookings.length,
  };
}

export function calculateNights(checkIn: string, checkOut: string) {
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}
