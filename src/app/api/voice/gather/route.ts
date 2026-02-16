import { NextRequest, NextResponse } from "next/server";
import { getAvailableRooms, createBooking, calculateNights } from "@/lib/data";

// Handles speech input gathered during the call

export async function POST(req: NextRequest) {
  const body = await req.json();
  const speech = body.SpeechResult || body.data?.payload?.speech || "";
  const baseUrl = getBaseUrl(req);

  // Simple response - in production this would use NLU
  let responseXml: string;

  if (speech) {
    // For demo: check availability for a default date range and respond
    const checkIn = "2026-02-20";
    const checkOut = "2026-02-23";
    const available = getAvailableRooms(checkIn, checkOut);
    const nights = calculateNights(checkIn, checkOut);

    if (available.length > 0) {
      const room = available[0];
      const total = room.pricePerNight * nights;

      responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Great! I found availability. We have a ${room.type} Room ${room.number} 
    available at $${room.pricePerNight} per night. 
    For ${nights} nights, your total would be $${total}.
    Would you like to proceed with this booking?
  </Say>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${baseUrl}/api/voice/confirm">
    <Say voice="Polly.Joanna">Please say yes to confirm or no to hear other options.</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thank you for calling Grand Horizon Hotel. Goodbye!</Say>
  <Hangup/>
</Response>`;
    } else {
      responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    I'm sorry, we're fully booked for those dates. 
    Please try different dates or visit our website for more options.
    Thank you for calling Grand Horizon Hotel!
  </Say>
  <Hangup/>
</Response>`;
    }
  } else {
    responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    I didn't catch that. Please call back and we'll be happy to help.
    Thank you for calling Grand Horizon Hotel!
  </Say>
  <Hangup/>
</Response>`;
  }

  return new NextResponse(responseXml, {
    headers: { "Content-Type": "application/xml" },
  });
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
