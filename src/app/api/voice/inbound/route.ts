import { NextRequest, NextResponse } from "next/server";

// Telnyx Voice AI webhook - handles inbound calls
// This returns TeXML instructions for the call flow

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = body.data?.event_type || body.event_type;

  if (event === "call.initiated" || event === "call.answered") {
    // Answer with greeting and gather speech
    const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Welcome to Grand Horizon Hotel! I'm your AI booking assistant. 
    I can help you check room availability and make a reservation.
    What dates are you looking for?
  </Say>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="${getBaseUrl(req)}/api/voice/gather">
    <Say voice="Polly.Joanna">Please tell me your preferred check-in and check-out dates.</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Please call back and let me know your preferred dates. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(texml, {
      headers: { "Content-Type": "application/xml" },
    });
  }

  return NextResponse.json({ status: "ok" });
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
