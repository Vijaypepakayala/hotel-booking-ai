import { NextRequest } from "next/server";

// SSE endpoint — polls Telnyx conversation for live transcript
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return new Response("Missing phone", { status: 400 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { closed = true; }
      }

      // Find the conversation for this phone number (may take a few seconds to appear)
      let conversationId: string | null = null;
      let lastMessageCount = 0;
      let attempts = 0;
      let callEnded = false;

      send({ type: "status", text: "Connecting..." });

      while (!closed && attempts < 180) { // max 3 minutes
        attempts++;
        try {
          // If we don't have a conversation yet, search for it
          if (!conversationId) {
            const convRes = await fetch(
              "https://api.telnyx.com/v2/ai/conversations?page%5Bsize%5D=5",
              { headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` } }
            );
            const convData = await convRes.json();
            // Find conversation matching this phone (within last 60 seconds)
            const now = Date.now();
            const conv = convData.data?.find((c: any) => {
              const to = c.metadata?.to || c.metadata?.telnyx_end_user_target;
              const age = now - new Date(c.created_at).getTime();
              return to?.includes(phone.replace(/\D/g, "").slice(-10)) && age < 120_000;
            });
            if (conv) {
              conversationId = conv.id;
              send({ type: "status", text: "Call connected — listening..." });
            } else {
              send({ type: "status", text: "Ringing..." });
              await sleep(2000);
              continue;
            }
          }

          // Fetch messages
          const msgRes = await fetch(
            `https://api.telnyx.com/v2/ai/conversations/${conversationId}/messages?page%5Bsize%5D=50`,
            { headers: { Authorization: `Bearer ${process.env.TELNYX_API_KEY}` } }
          );
          const msgData = await msgRes.json();
          const messages = (msgData.data || [])
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          // Send only new messages
          if (messages.length > lastMessageCount) {
            const newMsgs = messages.slice(lastMessageCount);
            for (const msg of newMsgs) {
              // Skip tool call JSON messages (assistant outputting raw JSON)
              const text = msg.text || "";
              if (text.startsWith("{") && text.includes('"name"')) continue;
              
              send({
                type: "message",
                role: msg.role === "assistant" ? "assistant" : "user",
                text: text,
                timestamp: msg.created_at,
              });
            }
            lastMessageCount = messages.length;
          }

          // Check if call ended (no new messages for 15 seconds after we had some)
          if (lastMessageCount > 0) {
            const lastMsg = messages[messages.length - 1];
            const lastMsgAge = Date.now() - new Date(lastMsg.created_at).getTime();
            if (lastMsgAge > 15_000) {
              // Double check — wait one more cycle
              if (callEnded) {
                send({ type: "ended", text: "Call ended" });
                break;
              }
              callEnded = true;
            } else {
              callEnded = false;
            }
          }
        } catch (err: any) {
          console.error("[transcript] error:", err.message);
        }

        await sleep(1500); // Poll every 1.5 seconds
      }

      if (!closed) {
        send({ type: "ended", text: "Stream closed" });
        controller.close();
      }
    },
    cancel() { closed = true; },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
