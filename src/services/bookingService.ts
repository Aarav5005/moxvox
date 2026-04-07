import { supabase } from "./supabaseClient";
import { Booking, BookingPayload } from "@/types/booking";

function normalizeMenuItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  // JSON array support.
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Continue with fallback parsing below.
    }
  }

  // PostgreSQL array literal support: {a,b,c}
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const withoutBraces = trimmed.slice(1, -1).trim();
    if (!withoutBraces) {
      return [];
    }

    return withoutBraces
      .split(",")
      .map((item) => item.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }

  // Comma-separated fallback.
  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Ensures that empty strings in the payload are converted to null for fields
 * that should be NULL in the database (like time, date, etc.).
 */
export function sanitizePayload<T extends Record<string, unknown>>(data: T): T {
  const fieldsToNullify = [
    "party_time",
    "starter_time",
    "maincourse_time",
    "dj_time",
    "date_of_birth",
    "anniversary",
    "payment_mode",
  ];

  const sanitized: Record<string, unknown> = { ...data };
  
  fieldsToNullify.forEach((field) => {
    if (sanitized[field] === "") {
      sanitized[field] = null;
    }
  });

  return sanitized as T;
}

function normalizeBookingRow(row: Booking): Booking {
  return {
    ...row,
    menu_items: normalizeMenuItems((row as unknown as { menu_items?: unknown }).menu_items),
  };
}

function canRetryMenuItemsAsText(payload: Record<string, unknown>, message: string) {
  const normalizedMessage = message.toLowerCase();
  const mentionsMenuItems = normalizedMessage.includes("menu_items");
  const typeMismatchHints =
    normalizedMessage.includes("is of type text") ||
    normalizedMessage.includes("cannot cast") ||
    normalizedMessage.includes("invalid input syntax");

  return mentionsMenuItems && typeMismatchHints && Array.isArray(payload.menu_items);
}

function convertMenuItemsArrayToText(payload: Record<string, unknown>) {
  return {
    ...payload,
    menu_items: (payload.menu_items as string[]).join(", "),
  };
}

function mapBookingErrorMessage(message: string, code?: string) {
  // Postgres permission denied: table grants or RLS policies are missing.
  if (code === "42501" || message.toLowerCase().includes("permission denied")) {
    return "Database permission denied for table bookings. Add Supabase RLS policies/grants for authenticated users.";
  }

  if (code === "23505" || message.toLowerCase().includes("duplicate key value violates unique constraint")) {
    return "Duplicate booking primary key detected. Run the bookings sequence sync SQL in Supabase SQL Editor.";
  }

  return message;
}

function withFriendlyError<T extends { error: { message: string; code?: string } | null }>(result: T): T {
  if (!result.error) {
    return result;
  }

  return {
    ...result,
    error: {
      ...result.error,
      message: mapBookingErrorMessage(result.error.message, result.error.code),
    },
  };
}

function getIdentifierFilter(booking: Booking): { column: string; value: number | string } | null {
  if (booking.id !== undefined && booking.id !== null) {
    return { column: "id", value: booking.id };
  }

  if (booking.booking_id !== undefined && booking.booking_id !== null) {
    return { column: "booking_id", value: booking.booking_id };
  }

  if (booking.uuid) {
    return { column: "uuid", value: booking.uuid };
  }

  return null;
}

function extractMissingColumnName(message: string) {
  const columnRegexes = [
    /column\s+["']?([a-zA-Z0-9_]+)["']?/i,
    /find the\s+["']([a-zA-Z0-9_]+)["']\s+column/i,
  ];

  for (const regex of columnRegexes) {
    const match = message.match(regex);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function dropMissingColumnFromPayload<T extends Record<string, unknown>>(payload: T, message: string): T | null {
  const normalizedMessage = message.toLowerCase();
  const looksLikeMissingColumnError =
    normalizedMessage.includes("does not exist") || normalizedMessage.includes("schema cache");

  if (!looksLikeMissingColumnError) {
    return null;
  }

  const missingColumn = extractMissingColumnName(message);

  if (!missingColumn || !(missingColumn in payload)) {
    return null;
  }

  // Do not silently drop critical fields that must persist in bookings.
  if (missingColumn === "menu_items") {
    return null;
  }

  const nextPayload = { ...payload };
  delete nextPayload[missingColumn];
  return nextPayload as T;
}

export async function getBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("party_date", { ascending: true });

  const normalized = ((data as Booking[] | null) ?? []).map(normalizeBookingRow);
  return withFriendlyError({ data: normalized, error });
}

export async function createBooking(data: BookingPayload) {
  let payload: BookingPayload | Record<string, unknown> = sanitizePayload({ ...data });

  // Allow enough retries to drop many missing columns from newer UI payloads.
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await supabase
      .from("bookings")
      .insert([payload])
      .select()
      .single();

    if (!result.error) {
      const normalizedData = result.data ? normalizeBookingRow(result.data as Booking) : null;
      return withFriendlyError({ data: normalizedData, error: result.error });
    }

    if (canRetryMenuItemsAsText(payload as Record<string, unknown>, result.error.message)) {
      payload = convertMenuItemsArrayToText(payload as Record<string, unknown>);
      continue;
    }

    const nextPayload = dropMissingColumnFromPayload(payload, result.error.message);
    if (!nextPayload) {
      return withFriendlyError({ data: result.data as Booking | null, error: result.error });
    }

    payload = nextPayload;
  }

  return {
    data: null,
    error: {
      message: "Unable to save booking due to repeated schema mismatch. Please update bookings table columns.",
    },
  };
}

export async function updateBooking(booking: Booking, data: Partial<BookingPayload>) {
  const identifier = getIdentifierFilter(booking);

  if (!identifier) {
    return {
      data: null,
      error: { message: "Cannot update booking because no identifier column exists on this row." },
    };
  }

  let payload: Partial<BookingPayload> | Record<string, unknown> = sanitizePayload({ ...data });

  // Allow enough retries to drop many missing columns from newer UI payloads.
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await supabase
      .from("bookings")
      .update(payload)
      .eq(identifier.column, identifier.value)
      .select()
      .single();

    if (!result.error) {
      const normalizedData = result.data ? normalizeBookingRow(result.data as Booking) : null;
      return withFriendlyError({ data: normalizedData, error: result.error });
    }

    if (canRetryMenuItemsAsText(payload as Record<string, unknown>, result.error.message)) {
      payload = convertMenuItemsArrayToText(payload as Record<string, unknown>);
      continue;
    }

    const nextPayload = dropMissingColumnFromPayload(payload, result.error.message);
    if (!nextPayload) {
      return withFriendlyError({ data: result.data as Booking | null, error: result.error });
    }

    payload = nextPayload;
  }

  return {
    data: null,
    error: {
      message: "Unable to update booking due to repeated schema mismatch. Please update bookings table columns.",
    },
  };
}

export async function deleteBooking(booking: Booking) {
  const identifier = getIdentifierFilter(booking);

  if (identifier) {
    const result = await supabase.from("bookings").delete().eq(identifier.column, identifier.value);
    return withFriendlyError(result);
  }

  // Last-resort fallback when table has no explicit id column.
  const result = await supabase
    .from("bookings")
    .delete()
    .eq("customer_name", booking.customer_name)
    .eq("phone", booking.phone)
    .eq("party_date", booking.party_date)
    .eq("party_time", booking.party_time);

  return withFriendlyError(result);
}
