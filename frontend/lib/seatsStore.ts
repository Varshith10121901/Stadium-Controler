// Shared in-memory seat lock storage for the demo.
// In production, this would read/write directly to the Firebase Firestore / Realtime Database.
const globalForSeats = global as unknown as { lockedSeats: Record<string, string> };

export const lockedSeats: Record<string, string> = globalForSeats.lockedSeats || {
  "35.00_-15.00": "user_alpha",
  "12.50_20.00": "user_beta"
};

if (process.env.NODE_ENV !== 'production') {
  globalForSeats.lockedSeats = lockedSeats;
}

export function lockSeat(seatId: string, userId: string): boolean {
  // If the seat is already locked by someone else, return false (conflict)
  if (lockedSeats[seatId] && lockedSeats[seatId] !== userId) {
    return false;
  }
  lockedSeats[seatId] = userId;
  return true;
}

export function getLockedSeats(): Record<string, string> {
  return lockedSeats;
}
