/**
 * Converts a 24-hour time string (HH:mm) into a 12-hour format with AM/PM (h:mm AM/PM).
 */
export function convertTo12Hour(time24: string | null | undefined): string {
  if (!time24 || !time24.includes(":")) return "N/A";

  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "N/A";

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Converts 12-hour components into a 24-hour string (HH:mm).
 */
export function convertTo24Hour(hour: string, minute: string, period: string): string {
  let h = parseInt(hour, 10);
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;

  const hh = h < 10 ? `0${h}` : h;
  const mm = minute.padStart(2, "0");

  return `${hh}:${mm}`;
}

/**
 * Splits a 24-hour string into its 12-hour components.
 */
export function split24Hour(time24: string | null | undefined) {
  if (!time24 || !time24.includes(":")) {
    return { hour: "12", minute: "00", period: "AM" };
  }

  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = String(hours % 12 || 12);
  const displayMinutes = String(minutes).padStart(2, "0");

  return { hour: displayHours, minute: displayMinutes, period };
}

/**
 * Combines two 24-hour time strings into a 12-hour range string.
 * Result: "h:mm AM - h:mm PM"
 */
export function combineTo12HourRange(
  start24: string | null | undefined,
  end24: string | null | undefined
): string | null {
  if (!start24 && !end24) return null;
  const start12 = start24 && start24.includes(":") ? convertTo12Hour(start24) : null;
  const end12 = end24 && end24.includes(":") ? convertTo12Hour(end24) : null;

  if (start12 && end12 && start12 !== "N/A" && end12 !== "N/A") {
    return `${start12} - ${end12}`;
  }
  if (start12 && start12 !== "N/A") return start12;
  if (end12 && end12 !== "N/A") return end12;
  return null;
}

/**
 * Parses a 12-hour range string back into start and end 24-hour strings.
 */
export function parse12HourRange(rangeStr: string | null | undefined) {
  const result = { start24: "", end24: "" };
  if (!rangeStr || rangeStr === "N/A") return result;

  if (rangeStr.includes(" - ")) {
    const [startPart, endPart] = rangeStr.split(" - ");
    result.start24 = convert12To24(startPart);
    result.end24 = convert12To24(endPart);
  } else {
    // If it's a single time
    result.start24 = convert12To24(rangeStr);
  }

  return result;
}

/**
 * Helper to convert 12h string ("h:mm AM/PM") to 24h string ("HH:mm")
 */
export function convert12To24(time12: string): string {
  if (!time12 || !time12.includes(":") || !time12.includes(" ")) return "";

  const parts = time12.trim().split(" ");
  if (parts.length < 2) return "";

  const timePart = parts[0];
  const period = parts[1].toUpperCase();
  const [hour, minute] = timePart.split(":");

  return convertTo24Hour(hour, minute, period);
}

const ISO_DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDateParts(value: string | number | Date) {
  if (typeof value === "string") {
    const match = value.trim().match(ISO_DATE_ONLY_REGEX);
    if (match) {
      const [, year, month, day] = match;
      return { day, month, year };
    }
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = String(parsedDate.getFullYear());

  return { day, month, year };
}

export function formatDateDDMMYYYY(
  value: string | number | Date | null | undefined,
  fallback = "N/A"
): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parts = toDateParts(value);
  if (!parts) {
    return typeof value === "string" ? value : fallback;
  }

  return `${parts.day}-${parts.month}-${parts.year}`;
}

export function formatDateTimeDDMMYYYY(
  value: string | number | Date | null | undefined,
  fallback = "N/A"
): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : fallback;
  }

  const datePart = formatDateDDMMYYYY(date, fallback);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${datePart}, ${timePart}`;
}
