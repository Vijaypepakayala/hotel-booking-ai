import { prisma } from "./prisma";

export async function getAllRooms() {
  return prisma.room.findMany({ orderBy: [{ floor: "asc" }, { number: "asc" }] });
}

export async function getAllBookings() {
  return prisma.booking.findMany({
    include: { room: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAvailableRooms(checkIn: string, checkOut: string, type?: string) {
  const bookedRoomIds = await prisma.booking.findMany({
    where: {
      status: { notIn: ["cancelled", "checked-out"] },
      checkIn: { lt: new Date(checkOut) },
      checkOut: { gt: new Date(checkIn) },
    },
    select: { roomId: true },
  });
  const ids = bookedRoomIds.map(b => b.roomId);

  return prisma.room.findMany({
    where: {
      id: { notIn: ids.length > 0 ? ids : ["_none_"] },
      ...(type ? { type: { equals: type, mode: "insensitive" as const } } : {}),
    },
    orderBy: { pricePerNight: "asc" },
  });
}

export async function createBooking(data: {
  roomId: string; guestName: string; guestPhone: string;
  checkIn: string; checkOut: string; adults: number; children: number; totalPrice: number;
}) {
  const code = `GH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  return prisma.booking.create({
    data: {
      roomId: data.roomId,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      adults: data.adults,
      children: data.children,
      totalPrice: data.totalPrice,
      confirmationCode: code,
      status: "confirmed",
    },
    include: { room: true },
  });
}

export async function getStats() {
  const [totalRooms, bookings, activeBookings] = await Promise.all([
    prisma.room.count(),
    prisma.booking.findMany({ where: { status: { notIn: ["cancelled"] } } }),
    prisma.booking.findMany({ where: { status: { in: ["confirmed", "checked-in"] } } }),
  ]);
  const bookedRoomIds = new Set(activeBookings.map(b => b.roomId));
  const bookedRooms = bookedRoomIds.size;
  return {
    totalRooms,
    bookedRooms,
    available: totalRooms - bookedRooms,
    occupancy: Math.round((bookedRooms / totalRooms) * 100),
    revenue: bookings.reduce((s, b) => s + b.totalPrice, 0),
    guests: activeBookings.reduce((s, b) => s + b.adults + b.children, 0),
    bookings: bookings.length,
  };
}

export function calculateNights(checkIn: string, checkOut: string) {
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}
