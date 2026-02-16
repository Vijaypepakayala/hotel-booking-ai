import { NextRequest, NextResponse } from "next/server";

const TEXML_APP_ID = "2896912305839146529";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || phone.length < 8) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }

  // Normalize phone — add + if missing
  const to = phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`;
  const from = process.env.TELNYX_PHONE_NUMBER;

  if (!from) {
    return NextResponse.json({ error: "Server not configured for calls" }, { status: 500 });
  }

  try {
    // Outbound call via TeXML → AI Assistant handles the conversation
    const res = await fetch(`https://api.telnyx.com/v2/texml/calls/${TEXML_APP_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: from,
        To: to,
      }),
    });

    const data = await res.json();
    console.log("[call] texml response:", JSON.stringify(data));

    if (data.errors && data.errors.length > 0 && !data.call_sid) {
      return NextResponse.json({ error: data.errors[0]?.detail || "Failed to initiate call" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      call_sid: data.call_sid,
      status: data.status,
      message: "Calling you now! Pick up to speak with Aria.",
    });
  } catch (err: any) {
    console.error("[call] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
