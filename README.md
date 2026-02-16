# 🏨 Grand Horizon Hotel — AI Booking Assistant

An AI-powered hotel booking system that handles reservations through natural voice conversations. Built with Next.js, powered by [Telnyx](https://telnyx.com) Voice AI and Messaging.

## ✨ Features

- **AI Voice Assistant** — Customers call in and book rooms through natural conversation
- **Real-time Dashboard** — Live view of bookings, occupancy, and revenue
- **Smart Availability** — Automatic room matching based on dates and preferences
- **SMS Confirmation** — Instant booking confirmation sent via Telnyx
- **Interactive Demo** — Simulated call interface to try without a phone

## 🏗️ Architecture

```
Customer calls → Telnyx Voice AI → Webhook API → Check availability → Book room → SMS confirmation
                                                                           ↓
                                                                    Admin Dashboard (live)
```

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local  # Add your Telnyx keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click "Call Now" to try the AI assistant.

## 📱 Room Types

| Type | Price/Night | Rooms | Floor |
|------|-----------|-------|-------|
| Standard | $99 | 10 | 2 |
| Deluxe | $149 | 8 | 3 |
| Suite | $249 | 5 | 4 |
| Penthouse | $499 | 2 | 5 |

## 🔌 Telnyx Setup (for real phone calls)

1. Create a [Telnyx account](https://portal.telnyx.com)
2. Get a phone number with Voice & SMS enabled
3. Create a TeXML Application pointing to `https://your-app.vercel.app/api/voice/inbound`
4. Set your API key in `.env.local`

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Telnyx Voice AI** (TeXML)
- **Telnyx SMS API**

## 📄 License

MIT
