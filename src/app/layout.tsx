import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grand Horizon Hotel | AI Booking Assistant",
  description: "Book your stay with our AI-powered voice assistant. Call in, check availability, and confirm your reservation instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
