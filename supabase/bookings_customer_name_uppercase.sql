-- Backfill existing booking names to uppercase (trim + upper).
UPDATE public.bookings
SET customer_name = UPPER(TRIM(customer_name))
WHERE customer_name IS NOT NULL
  AND customer_name <> UPPER(TRIM(customer_name));

-- Enforce uppercase names for all future inserts/updates.
CREATE OR REPLACE FUNCTION public.normalize_bookings_customer_name_uppercase()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.customer_name IS NOT NULL THEN
    NEW.customer_name := UPPER(TRIM(NEW.customer_name));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_customer_name_uppercase ON public.bookings;

CREATE TRIGGER trg_bookings_customer_name_uppercase
BEFORE INSERT OR UPDATE OF customer_name ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.normalize_bookings_customer_name_uppercase();