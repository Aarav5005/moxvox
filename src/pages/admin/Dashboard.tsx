import { useEffect, useMemo, useState } from "react";
import BookingForm from "@/components/BookingForm";
import BookingTable from "@/components/BookingTable";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/types/booking";

function getBookingDateTime(booking: Booking) {
  const [year, month, day] = booking.party_date.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  let hours = 0;
  let minutes = 0;

  if (booking.party_time) {
    const [parsedHours, parsedMinutes] = booking.party_time.split(":").map(Number);
    hours = Number.isFinite(parsedHours) ? parsedHours : 0;
    minutes = Number.isFinite(parsedMinutes) ? parsedMinutes : 0;
  }

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Dashboard() {
  const { bookings, loading, addBooking, removeBooking, editBooking } = useBookings();
  const [activeView, setActiveView] = useState<
    "add-booking" | "upcoming-party" | "happy-customers"
  >("add-booking");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const handleUpdateBooking = async (updatedBooking: Booking): Promise<boolean> => {
    const { customer_name, phone, party_date, party_time, starter_time, maincourse_time, guests, food_type, spicy_level, package_type, venue_type, occasion, dj_required, dj_time, other_details, menu_items, billing_pax, billing_dj, billing_decor, billing_gst, billing_advance, billing_g_amount, billing_due_amount } = updatedBooking;
    
    await editBooking(updatedBooking, {
      customer_name,
      phone,
      party_date,
      party_time,
      starter_time,
      maincourse_time,
      guests,
      food_type,
      spicy_level,
      package_type,
      venue_type,
      occasion,
      dj_required,
      dj_time,
      other_details,
      menu_items,
      billing_pax,
      billing_dj,
      billing_decor,
      billing_gst,
      billing_advance,
      billing_g_amount,
      billing_due_amount,
    });
    
    return true;
  };

  const { upcomingBookings, happyCustomers } = useMemo(() => {
    const upcoming: Booking[] = [];
    const completed: Booking[] = [];

    bookings.forEach((booking) => {
      const bookingDateTime = getBookingDateTime(booking);

      if (!bookingDateTime || bookingDateTime.getTime() >= now) {
        upcoming.push(booking);
        return;
      }

      completed.push(booking);
    });

    return { upcomingBookings: upcoming, happyCustomers: completed };
  }, [bookings, now]);

  return (
    <main className="min-h-screen bg-[#060606] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_40%),linear-gradient(180deg,#080808_0%,#050505_100%)] pb-0">
      <header className="sticky top-0 z-40 w-full bg-[#060606]/85 backdrop-blur-md pt-4 pb-4 sm:pt-6 sm:pb-5">
        <div className="relative mx-auto max-w-[1000px] px-4 sm:px-6">
          <img
            src="/mox-vox-logo.svg"
            alt="MoxVox logo"
            className="absolute right-8 -top-3 h-16 w-16 object-contain sm:-top-5 sm:right-12 sm:h-20 sm:w-20"
          />
          <h1 className="font-display text-2xl italic tracking-[0.07em] text-[#D4AF37] sm:text-3xl">Booking Dashboard</h1>
          <nav className="mt-3 grid grid-cols-3 gap-1 text-center text-[13px] font-semibold sm:flex sm:justify-start sm:gap-4 sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveView("add-booking")}
              className={`whitespace-nowrap rounded-md px-1.5 py-1 transition ${
                activeView === "add-booking"
                  ? "text-[#f8e8b3]"
                  : "text-white/55 hover:text-[#D4AF37]"
              }`}
            >
              Add Booking
            </button>
            <button
              type="button"
              onClick={() => setActiveView("upcoming-party")}
              className={`whitespace-nowrap rounded-md px-1.5 py-1 transition ${
                activeView === "upcoming-party"
                  ? "text-[#f8e8b3]"
                  : "text-white/55 hover:text-[#D4AF37]"
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView("happy-customers")}
              className={`whitespace-nowrap rounded-md px-1.5 py-1 transition ${
                activeView === "happy-customers"
                  ? "text-[#f8e8b3]"
                  : "text-white/55 hover:text-[#D4AF37]"
              }`}
            >
              Event History
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1000px] space-y-2 px-4 pt-4 sm:px-6 sm:pt-6">

        {activeView === "add-booking" ? <BookingForm onSubmitBooking={addBooking} /> : null}

        {activeView === "upcoming-party" ? (
          loading ? (
            <div className="rounded-2xl border border-[#D4AF3730] bg-[rgba(255,255,255,0.03)] p-6 text-white/70 shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-md">
              Loading bookings...
            </div>
          ) : (
            <BookingTable
              bookings={upcomingBookings}
              onDelete={removeBooking}
              onUpdate={handleUpdateBooking}
            />
          )
        ) : null}

        {activeView === "happy-customers" ? (
          loading ? (
            <div className="rounded-2xl border border-[#D4AF3730] bg-[rgba(255,255,255,0.03)] p-6 text-white/70 shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-md">
              Loading bookings...
            </div>
          ) : (
            <BookingTable
              bookings={happyCustomers}
              onDelete={removeBooking}
              onUpdate={handleUpdateBooking}
            />
          )
        ) : null}
      </div>
    </main>
  );
}
