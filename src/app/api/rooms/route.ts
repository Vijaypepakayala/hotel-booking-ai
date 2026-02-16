import { NextRequest, NextResponse } from "next/server";
import { getAllRooms, getAvailableRooms } from "@/lib/data";

export async function GET(req: NextRequest) {
  const checkIn = req.nextUrl.searchParams.get("checkIn");
  const checkOut = req.nextUrl.searchParams.get("checkOut");
  const type = req.nextUrl.searchParams.get("type");

  if (checkIn && checkOut) {
    return NextResponse.json({ rooms: getAvailableRooms(checkIn, checkOut, type || undefined) });
  }
  return NextResponse.json({ rooms: getAllRooms() });
}
