import { NextRequest, NextResponse } from "next/server";

const ASSISTANT_ID = "assistant-281f1430-c7a0-4186-a699-d0de5f3acf6d";

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
    // Create an outbound call using the AI Assistant
    const res = await fetch("https://api.telnyx.com/v2/ai/assistants/" + ASSISTANT_ID + "/conversations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "voice",
        voice: {
          from,
          to,
        },
      }),
    });

    const data = await res.json();
    console.log("[call] create conversation:", JSON.stringify(data).slice(0, 500));

    if (data.errors) {
      return NextResponse.json({ error: data.errors[0]?.detail || "Failed to initiate call" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      conversation_id: data.id || data.data?.id,
      message: "Calling you now! Pick up to speak with Aria.",
    });
  } catch (err: any) {
    console.error("[call] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
