import { useMemo, useState } from "react";
import { Booking } from "@/types/booking";
import BookingDetailsModal from "./BookingDetailsModal";

type BookingTableProps = {
  bookings: Booking[];
  onDelete?: (booking: Booking) => Promise<void>;
  onUpdate?: (booking: Booking) => Promise<boolean>;
};

type SortField = "party_date" | "customer_name" | "phone" | "guests" | "created_at";
type SortDirection = "asc" | "desc";

export default function BookingTable({ bookings, onDelete, onUpdate }: BookingTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const getRowKey = (booking: Booking, index: number) =>
    booking.id ?? booking.booking_id ?? booking.uuid ?? `${booking.phone}-${booking.party_date}-${index}`;

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const sortedBookings = useMemo(() => {
    const sorted = [...bookings];

    const directionFactor = sortDirection === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      if (sortField === "party_date") {
        const aDate = new Date(a.party_date).getTime();
        const bDate = new Date(b.party_date).getTime();
        return (aDate - bDate) * directionFactor;
      }

      if (sortField === "created_at") {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return (aDate - bDate) * directionFactor;
      }

      if (sortField === "guests") {
        return (a.guests - b.guests) * directionFactor;
      }

      if (sortField === "customer_name") {
        return a.customer_name.localeCompare(b.customer_name, undefined, { sensitivity: "base" }) * directionFactor;
      }

      return a.phone.localeCompare(b.phone, undefined, { numeric: true, sensitivity: "base" }) * directionFactor;
    });

    return sorted;
  }, [bookings, sortDirection, sortField]);

  return (
    <>
      <div className="w-full rounded-2xl border border-[#D4AF3730] bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <label htmlFor="booking-sort" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Sort by
          </label>
          <select
            id="booking-sort"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="rounded-lg border border-white/10 bg-[#111111] px-2.5 py-1.5 text-xs text-white outline-none transition focus:border-[#D4AF37]"
          >
            <option value="party_date">Date</option>
            <option value="customer_name">Name</option>
            <option value="guests">Guests</option>
            <option value="created_at">Created Time</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-lg border border-white/15 bg-[#151515] px-2.5 py-1.5 text-xs font-semibold text-white/85 transition duration-300 hover:border-[#D4AF37] hover:text-[#f3d77c]"
          >
            {sortDirection === "asc" ? "A-Z" : "Z-A"}
          </button>
        </div>

        <table className="w-full table-auto overflow-hidden rounded-xl">
          <thead className="bg-[#0f0f0f] text-left text-xs uppercase tracking-[0.16em] text-[#f0d98e]">
            <tr>
              <th className="px-2 py-2.5 sm:px-3">Name</th>
              <th className="px-2 py-2.5 sm:px-3">Phone</th>
              <th className="whitespace-nowrap px-2 py-2.5 sm:px-3">Date</th>
              <th className="whitespace-nowrap px-2 py-2.5 sm:px-3">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white/85">
            {sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-7 text-center text-white/50">
                  No bookings found.
                </td>
              </tr>
            ) : (
              sortedBookings.map((booking, index) => (
                <tr
                  key={getRowKey(booking, index)}
                  className={`${
                    index % 2 === 0 ? "bg-[#101010]" : "bg-[#0c0c0c]"
                  } border-b border-white/5 transition duration-300 hover:bg-[#161616]`}
                >
                  <td className="px-2 py-2.5 font-medium text-white sm:px-3">{booking.customer_name}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-[13px] sm:px-3 sm:text-sm">{booking.phone}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-[13px] sm:px-3 sm:text-sm">{booking.party_date}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(booking)}
                      className="rounded-[10px] bg-gradient-to-r from-[#D4AF37] to-[#f1d274] px-2 py-1.5 text-[11px] font-semibold leading-tight text-black shadow-[0_6px_18px_rgba(212,175,55,0.28)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(212,175,55,0.4)] sm:px-2.5 sm:text-xs"
                    >
                      <span className="sm:hidden">Details</span>
                      <span className="hidden sm:inline">View Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BookingDetailsModal booking={selectedBooking} isOpen={isModalOpen} onClose={handleCloseModal} onDelete={onDelete} onUpdate={onUpdate} />
    </>
  );
}
