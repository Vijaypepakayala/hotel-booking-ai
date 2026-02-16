import { NextResponse } from "next/server";
import { getAllRooms } from "@/lib/data";
export async function GET() {
  return NextResponse.json({ rooms: getAllRooms() });
}
