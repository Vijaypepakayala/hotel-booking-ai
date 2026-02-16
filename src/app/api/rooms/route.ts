import { NextResponse } from "next/server";
import { getAllRooms } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const rooms = await getAllRooms();
  return NextResponse.json({ rooms });
}
