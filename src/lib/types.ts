export interface Room {
  id: string;
  type: "Standard" | "Deluxe" | "Suite" | "Penthouse";
  number: string;
  floor: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
}

export interface Booking {
  id: string;
  roomId: string;
  roomType: string;
  roomNumber: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  adults: number;
  children: number;
  totalPrice: number;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled";
  confirmationCode: string;
  createdAt: string;
  notes?: string;
}

export interface CallLog {
  id: string;
  callId: string;
  callerNumber: string;
  duration: number;
  summary: string;
  bookingId?: string;
  createdAt: string;
}

export interface ConversationMessage {
  role: "assistant" | "user";
  text: string;
  timestamp: number;
}

export interface BookingState {
  step: "greeting" | "dates" | "room_type" | "guest_info" | "confirm" | "complete";
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  guestName?: string;
  guestPhone?: string;
  adults?: number;
  children?: number;
  selectedRoom?: Room;
}
