import { NextResponse } from "next/server";
import { getAllBookings, getStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [bookings, stats] = await Promise.all([getAllBookings(), getStats()]);
  // Flatten room info
  const mapped = bookings.map((b: any) => ({
    id: b.id, roomId: b.roomId, roomType: b.room.type, roomNumber: b.room.number,
    guestName: b.guestName, guestPhone: b.guestPhone,
    checkIn: b.checkIn.toISOString().split("T")[0],
    checkOut: b.checkOut.toISOString().split("T")[0],
    adults: b.adults, children: b.children, totalPrice: b.totalPrice,
    status: b.status, confirmationCode: b.confirmationCode, createdAt: b.createdAt,
  }));
  return NextResponse.json({ bookings: mapped, stats });
}
