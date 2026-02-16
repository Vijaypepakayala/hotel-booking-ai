import { NextResponse } from "next/server";
import { getAllBookings, getBookingStats } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    bookings: getAllBookings(),
    stats: getBookingStats(),
  });
}
