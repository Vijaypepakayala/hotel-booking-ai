import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: "-c search_path=hotel",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.callLog.deleteMany();

  const roomDefs = [
    ...Array.from({ length: 10 }, (_, i) => ({
      type: "Standard", number: `${201 + i}`, floor: 2, pricePerNight: 99,
      amenities: ["Wi-Fi", "TV", "Mini Bar"],
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      type: "Deluxe", number: `${301 + i}`, floor: 3, pricePerNight: 149,
      amenities: ["Wi-Fi", "TV", "Mini Bar", "Balcony", "Bathrobe", "Breakfast"],
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      type: "Suite", number: `${401 + i}`, floor: 4, pricePerNight: 249,
      amenities: ["Wi-Fi", "TV", "Mini Bar", "Balcony", "Jacuzzi", "Living Room"],
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      type: "Penthouse", number: `${501 + i}`, floor: 5, pricePerNight: 499,
      amenities: ["Wi-Fi", "TV", "Mini Bar", "Terrace", "Jacuzzi", "Butler Service", "Kitchen"],
    })),
  ];

  const rooms = await Promise.all(roomDefs.map(r => prisma.room.create({ data: r })));
  console.log(`Created ${rooms.length} rooms`);

  const bookingDefs = [
    { roomNum: "201", guestName: "James Wilson", guestPhone: "+14155551234", checkIn: "2026-02-16", checkOut: "2026-02-19", adults: 2, children: 0, totalPrice: 297, status: "checked-in", confirmationCode: "GH-A7K3" },
    { roomNum: "301", guestName: "Sarah Chen", guestPhone: "+14155555678", checkIn: "2026-02-17", checkOut: "2026-02-20", adults: 2, children: 1, totalPrice: 447, status: "confirmed", confirmationCode: "GH-B9M2" },
    { roomNum: "401", guestName: "Robert & Maria Lopez", guestPhone: "+14155559012", checkIn: "2026-02-16", checkOut: "2026-02-22", adults: 2, children: 2, totalPrice: 1494, status: "checked-in", confirmationCode: "GH-C1P5" },
    { roomNum: "202", guestName: "Emily Park", guestPhone: "+14155553456", checkIn: "2026-02-15", checkOut: "2026-02-17", adults: 1, children: 0, totalPrice: 198, status: "checked-out", confirmationCode: "GH-D4R8" },
    { roomNum: "203", guestName: "David Kim", guestPhone: "+14155557890", checkIn: "2026-02-16", checkOut: "2026-02-18", adults: 2, children: 0, totalPrice: 198, status: "confirmed", confirmationCode: "GH-E6T1" },
    { roomNum: "302", guestName: "Anna Müller", guestPhone: "+491701234567", checkIn: "2026-02-18", checkOut: "2026-02-23", adults: 2, children: 0, totalPrice: 745, status: "confirmed", confirmationCode: "GH-F2W9" },
  ];

  for (const b of bookingDefs) {
    const room = rooms.find(r => r.number === b.roomNum)!;
    await prisma.booking.create({
      data: {
        roomId: room.id, guestName: b.guestName, guestPhone: b.guestPhone,
        checkIn: new Date(b.checkIn), checkOut: new Date(b.checkOut),
        adults: b.adults, children: b.children, totalPrice: b.totalPrice,
        status: b.status, confirmationCode: b.confirmationCode,
      },
    });
  }
  console.log(`Created ${bookingDefs.length} bookings`);

  await prisma.callLog.createMany({
    data: [
      { callerPhone: "+14155551234", duration: 145, outcome: "completed", transcript: "Booked Standard Room 201" },
      { callerPhone: "+14155555678", duration: 98, outcome: "completed", transcript: "Booked Deluxe Room 301" },
      { callerPhone: "+14155550000", duration: 32, outcome: "abandoned", transcript: "Caller hung up during options" },
    ],
  });
  console.log("Created 3 call logs");
}

main().then(() => { pool.end(); }).catch(e => { console.error(e); pool.end(); process.exit(1); });
