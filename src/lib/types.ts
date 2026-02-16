export interface Room {
  id: string;
  type: "Standard" | "Deluxe" | "Suite" | "Penthouse";
  number: string;
  floor: number;
  pricePerNight: number;
  amenities: string[];
  booked: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  roomType: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalPrice: number;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled";
  confirmationCode: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  text: string;
  timestamp: number;
  typing?: boolean;
}

export interface CallState {
  active: boolean;
  duration: number;
  phase: "idle" | "ringing" | "connected" | "ended";
}
