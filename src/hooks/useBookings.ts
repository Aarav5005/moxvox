import { useEffect, useState } from "react";
import {
  createBooking,
  deleteBooking,
  getBookings,
  updateBooking,
} from "@/services/bookingService";
import { Booking, BookingPayload } from "@/types/booking";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await getBookings();

      if (error) {
        console.error(error.message);
        alert(error.message);
        setLoading(false);
        return;
      }

      setBookings(data ?? []);
      setLoading(false);
    };

    fetchBookings();
  }, []);

  const addBooking = async (data: BookingPayload) => {
    const { data: created, error } = await createBooking(data);

    if (error) {
      alert(error.message);
      return false;
    }

    if (created) {
      setBookings((prev) => [...prev, created]);
      return true;
    }

    return false;
  };

  const getRowKey = (booking: Booking) => booking.id ?? booking.booking_id ?? booking.uuid;

  const editBooking = async (bookingToEdit: Booking, data: Partial<BookingPayload>) => {
    const { data: updated, error } = await updateBooking(bookingToEdit, data);

    if (error) {
      alert(error.message);
      return;
    }

    if (updated) {
      const targetKey = getRowKey(bookingToEdit);
      setBookings((prev) =>
        prev.map((booking) => (getRowKey(booking) === targetKey ? updated : booking))
      );
    }
  };

  const removeBooking = async (bookingToDelete: Booking) => {
    const { error } = await deleteBooking(bookingToDelete);

    if (error) {
      alert(error.message);
      return;
    }

    const targetKey = getRowKey(bookingToDelete);
    setBookings((prev) => prev.filter((booking) => getRowKey(booking) !== targetKey));
  };

  return { bookings, loading, addBooking, editBooking, removeBooking };
}
