import { useMemo, useState } from "react";
import { Booking } from "@/types/booking";
import { combineTo12HourRange, convertTo12Hour, formatDateDDMMYYYY } from "@/lib/timeUtils";
import BookingDetailsModal from "./BookingDetailsModal";

type BookingTableProps = {
  bookings: Booking[];
  onDelete?: (booking: Booking) => Promise<void>;
  onUpdate?: (booking: Booking) => Promise<boolean>;
};

type SortField = "party_date" | "customer_name" | "venue_type" | "created_at";
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

  const formatPartyTime = (booking: Booking) => {
    const range = combineTo12HourRange(booking.party_time, booking.party_end_time);
    if (range) return range;
    return convertTo12Hour(booking.party_time);
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

      if (sortField === "customer_name") {
        return a.customer_name.localeCompare(b.customer_name, undefined, { sensitivity: "base" }) * directionFactor;
      }

      return a.venue_type.localeCompare(b.venue_type, undefined, { sensitivity: "base" }) * directionFactor;
    });

    return sorted;
  }, [bookings, sortDirection, sortField]);

  return (
    <>
      <div className="w-full flex flex-col h-[calc(100dvh-116px)] sm:h-[calc(100dvh-132px)] md:h-[calc(100dvh-144px)]">
        <div className="mb-3 shrink-0 flex flex-wrap items-center justify-end gap-2">
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
            <option value="venue_type">Venue</option>
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

        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] -mx-4 sm:-mx-6">
          <div className="space-y-2 px-4 md:hidden">
            {sortedBookings.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-6 text-center text-sm text-white/50">
                No bookings found.
              </div>
            ) : (
              sortedBookings.map((booking, index) => (
                <article
                  key={getRowKey(booking, index)}
                  className="rounded-xl border border-white/10 bg-[#0d0d0d] px-3 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
                >
                  <p className="truncate text-sm font-semibold text-white" title={booking.customer_name}>
                    {booking.customer_name}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <p className="text-white/60">Date</p>
                    <p className="text-right text-[#f3d77c]">{formatDateDDMMYYYY(booking.party_date)}</p>
                    <p className="text-white/60">Party Time</p>
                    <p className="text-right text-white/90">{formatPartyTime(booking)}</p>
                    <p className="text-white/60">Venue</p>
                    <p className="truncate text-right text-white/90" title={booking.venue_type}>{booking.venue_type || "N/A"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewDetails(booking)}
                    className="mt-3 w-full rounded-[10px] bg-gradient-to-r from-[#D4AF37] to-[#f1d274] px-2 py-1.5 text-xs font-semibold text-black shadow-[0_6px_18px_rgba(212,175,55,0.28)] transition duration-300 active:scale-[0.99]"
                  >
                    View Details
                  </button>
                </article>
              ))
            )}
          </div>

          <table className="hidden w-full table-auto sm:table">
            <thead className="sticky top-0 z-20 bg-[#0f0f0f] text-left text-xs uppercase tracking-[0.16em] text-[#f0d98e] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
               <tr>
                <th className="pl-4 pr-1 py-2 sm:pl-6 sm:pr-2 sm:py-2.5 md:pl-8 md:py-3">Name</th>
                <th className="whitespace-nowrap px-1 py-2 text-center sm:px-2 sm:py-2.5 md:px-3 md:py-3">Date</th>
                <th className="whitespace-nowrap px-1 py-2 text-center sm:px-2 sm:py-2.5 md:px-3 md:py-3">Party Time</th>
                <th className="whitespace-nowrap px-1 py-2 text-center sm:px-2 sm:py-2.5 md:px-3 md:py-3">Venue</th>
                <th className="whitespace-nowrap pr-4 pl-1 py-2 text-right sm:pr-6 sm:pl-2 sm:py-2.5 md:pr-8 md:pl-3 md:py-3">Action</th>
              </tr>
            </thead>
          <tbody className="text-sm text-white/85">
            {sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-7 text-center text-white/50">
                  No bookings found.
                </td>
              </tr>
            ) : (
              sortedBookings.map((booking, index) => (
                <tr
                  key={getRowKey(booking, index)}
                  className="border-b border-white/5 last:border-b-0 transition duration-300 hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <td className="max-w-[85px] truncate pl-4 pr-1 py-2.5 text-[13px] font-medium text-white sm:max-w-[200px] sm:pl-6 sm:pr-2 sm:text-sm md:max-w-[250px] md:pl-8 md:text-base" title={booking.customer_name}>{booking.customer_name}</td>
                  <td className="whitespace-nowrap px-1 py-2.5 text-center text-[12px] sm:px-2 sm:text-sm md:px-3 md:text-base">{formatDateDDMMYYYY(booking.party_date)}</td>
                  <td className="whitespace-nowrap px-1 py-2.5 text-center text-[12px] sm:px-2 sm:text-sm md:px-3 md:text-base">{formatPartyTime(booking)}</td>
                  <td className="whitespace-nowrap px-1 py-2.5 text-center text-[12px] sm:px-2 sm:text-sm md:px-3 md:text-base">{booking.venue_type || "N/A"}</td>
                  <td className="whitespace-nowrap pr-4 pl-1 py-2.5 text-right sm:pr-6 sm:pl-2 md:pr-8 md:pl-3">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(booking)}
                      className="rounded-[10px] bg-gradient-to-r from-[#D4AF37] to-[#f1d274] px-2 py-1 text-[10px] font-semibold leading-tight text-black shadow-[0_6px_18px_rgba(212,175,55,0.28)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(212,175,55,0.4)] sm:px-2.5 sm:py-1.5 sm:text-xs md:px-3 md:py-2 md:text-sm"
                    >
                      <span className="md:hidden">Details</span>
                      <span className="hidden sm:inline md:hidden">View Details</span>
                      <span className="hidden md:inline">View Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <BookingDetailsModal booking={selectedBooking} isOpen={isModalOpen} onClose={handleCloseModal} onDelete={onDelete} onUpdate={onUpdate} />
    </>
  );
}
