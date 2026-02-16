require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const c = await pool.connect();
  try {
    await c.query("SET search_path TO hotel");
    await c.query("DELETE FROM hotel_bookings");
    await c.query("DELETE FROM hotel_call_logs");
    await c.query("DELETE FROM hotel_rooms");

    // Rooms
    const rooms = [];
    const defs = [
      ...Array.from({ length: 10 }, (_, i) => ({ type: "Standard", number: `${201+i}`, floor: 2, price: 99, amenities: ["Wi-Fi","TV","Mini Bar"] })),
      ...Array.from({ length: 8 }, (_, i) => ({ type: "Deluxe", number: `${301+i}`, floor: 3, price: 149, amenities: ["Wi-Fi","TV","Mini Bar","Balcony","Bathrobe","Breakfast"] })),
      ...Array.from({ length: 5 }, (_, i) => ({ type: "Suite", number: `${401+i}`, floor: 4, price: 249, amenities: ["Wi-Fi","TV","Mini Bar","Balcony","Jacuzzi","Living Room"] })),
      ...Array.from({ length: 2 }, (_, i) => ({ type: "Penthouse", number: `${501+i}`, floor: 5, price: 499, amenities: ["Wi-Fi","TV","Mini Bar","Terrace","Jacuzzi","Butler Service","Kitchen"] })),
    ];
    for (const d of defs) {
      const r = await c.query(
        `INSERT INTO hotel_rooms (id, type, number, floor, "pricePerNight", amenities, "createdAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW()) RETURNING id, number`,
        [d.type, d.number, d.floor, d.price, `{${d.amenities.map(a=>`"${a}"`).join(",")}}`]
      );
      rooms.push(r.rows[0]);
    }
    console.log(`Created ${rooms.length} rooms`);

    // Bookings
    const bookings = [
      { num:"201", name:"James Wilson", phone:"+14155551234", ci:"2026-02-16", co:"2026-02-19", a:2, ch:0, total:297, status:"checked-in", code:"GH-A7K3" },
      { num:"301", name:"Sarah Chen", phone:"+14155555678", ci:"2026-02-17", co:"2026-02-20", a:2, ch:1, total:447, status:"confirmed", code:"GH-B9M2" },
      { num:"401", name:"Robert & Maria Lopez", phone:"+14155559012", ci:"2026-02-16", co:"2026-02-22", a:2, ch:2, total:1494, status:"checked-in", code:"GH-C1P5" },
      { num:"202", name:"Emily Park", phone:"+14155553456", ci:"2026-02-15", co:"2026-02-17", a:1, ch:0, total:198, status:"checked-out", code:"GH-D4R8" },
      { num:"203", name:"David Kim", phone:"+14155557890", ci:"2026-02-16", co:"2026-02-18", a:2, ch:0, total:198, status:"confirmed", code:"GH-E6T1" },
      { num:"302", name:"Anna Müller", phone:"+491701234567", ci:"2026-02-18", co:"2026-02-23", a:2, ch:0, total:745, status:"confirmed", code:"GH-F2W9" },
    ];
    for (const b of bookings) {
      const room = rooms.find(r => r.number === b.num);
      await c.query(
        `INSERT INTO hotel_bookings (id, "roomId", "guestName", "guestPhone", "checkIn", "checkOut", adults, children, "totalPrice", status, "confirmationCode", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [room.id, b.name, b.phone, b.ci, b.co, b.a, b.ch, b.total, b.status, b.code]
      );
    }
    console.log(`Created ${bookings.length} bookings`);

    // Call logs
    await c.query(`INSERT INTO hotel_call_logs (id, "callerPhone", duration, outcome, transcript, "createdAt") VALUES
      (gen_random_uuid()::text, '+14155551234', 145, 'completed', 'Booked Standard Room 201', NOW()),
      (gen_random_uuid()::text, '+14155555678', 98, 'completed', 'Booked Deluxe Room 301', NOW()),
      (gen_random_uuid()::text, '+14155550000', 32, 'abandoned', 'Caller hung up during options', NOW())
    `);
    console.log("Created 3 call logs");
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
