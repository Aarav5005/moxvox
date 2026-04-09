import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { BookingPayload } from "@/types/booking";
import { TimePicker } from "./TimePicker";
import { TimeRangePicker } from "./TimeRangePicker";
import { combineTo12HourRange, parse12HourRange } from "@/lib/timeUtils";

type BookingFormProps = {
  onSubmitBooking: (data: BookingPayload) => Promise<boolean>;
  onLogout?: () => void;
  isLoggingOut?: boolean;
};

type SectionKey = "customer" | "event" | "menu" | "timing" | "billing";

const menuData: Record<string, string[]> = {
  "Welcome Drinks": [
    "Cold Drinks",
    "Virgin Mojito",
    "Blue Lagoon",
    "Kiwi Classic",
    "Lemon Water",
    "Aam Panna",
    "Lemon Ice Tea",
    "Orange Blossom",
  ],
  Soups: [
    "Cream of Tomato",
    "Hot n Sour",
    "Veg Manchow",
    "Corn Soup",
    "Cream of Veg Soup",
    "Veg Clear Soup",
  ],
  Starter: [
    "Veg Manchurian Dry",
    "Veg Manchurian Gravy",
    "Veg Spring Roll",
    "Veg 65",
    "Dragon Potato",
    "Chilli Potato",
    "Honey Chilli Potato",
    "Potato Chilli Ball",
    "French Fries",
    "Red Sauce Pasta",
    "Assorted Pakode",
    "Ring Onion",
    "Peanut Masala",
    "Hara Bhara Kabab",
    "Mix Veg Kabab",
    "Corn Kabab",
    "Aloo Methi Tikki",
    "Crispy Veg",
    "Chowmein",
    "Hakka Noodles",
    "Fried Rice",
    "Bread Pakoda",
    "Chilly Garlic Noodles",
    "Pink Sauce Pasta",
  ],
  "Special Starter": [
    "Chilli Garlic Paneer",
    "Chilly Paneer Dry",
    "Chilly Paneer Gravy",
    "American Chopsy",
    "Paneer 65",
    "Methi Paneer Tikki",
    "Crispy Paneer",
    "Mini Pizza",
    "Corn Cheese Kabab",
    "Corn Fritters",
    "Veg Cheese Maggie",
    "Chilli Milli Kabab",
    "Hot Garlic Chilli Veg",
    "Shanghai Manchurian",
    "Sweet Chilli Potato",
    "Tandoori Aloo Achari",
    "Hariyali Tandoori Aloo",
    "Masala Tadka Pav",
    "Pav Bhaji",
    "Coleslaw Sandwich",
    "Masala Tikka Pav",
  ],
  "Paneer Preparation": [
    "Paneer Butter Masala",
    "Paneer Tikka Masala",
    "Paneer Lababdar",
    "Paneer Handi Lazeez",
    "Paneer Matar Masala",
    "Kadai Paneer",
    "Paneer Jwalamukhi",
    "Paneer Angara",
    "Paneer Do Pyaza",
    "Paneer Khurchan",
    "Palak Paneer",
  ],
  "Veg Preparation": [
    "Malai Kofta (Veg Gravy)",
    "Veg Kofta Curry",
    "Veg Kolhapuri",
    "Veg Jaipuri",
    "Dum Aloo",
    "Jeera Aloo",
    "Aloo Pyaj",
    "Aloo Matar",
    "Gobhi Matar",
    "Chef Special Aloo",
    "Gobhi Adraki",
    "Mix Veg",
    "Govind Gatta",
    "Sev Tomato",
    "Pindi Chana Masala",
    "Aloo Capsicum",
    "Veg. Angara",
    "Corn Palak",
    "Palak Lahsuni",
    "Spl. Aloo Gobhi Adaraki",
    "Punjabi Kofta Curry",
    "Veg Jaipur",
  ],
  "Dal Preparation": ["Dal Fry", "Dal Tadka", "Dal Makhani", "Rajasthani Kadi"],
  "Rice Preparation": [
    "Jeera Rice",
    "Jeera Peas Pulao",
    "Veg Pulao",
    "Moti Pulao",
    "Onion Pulao",
    "Veg Biryani",
    "Jodhpuri Biryani",
    "Hyderabadi Biryani",
    "Brown Onion Pulao",
  ],
  "Indian Breads": [
    "Butter Tandoori Roti",
    "Tava Roti",
    "Butter Naan",
    "Green Chilli Naan",
    "Garlic Naan",
    "Butter Laccha Paratha",
    "Missi Roti",
  ],
  Salad: ["Garden Fresh Salad", "Onion Ring Salad", "Kachumbar Salad", "Corn Pineapple Salad"],
  Chutney: ["Garlic Sauce", "Mint Sauce", "Schezwan Sauce", "Mayo Sauce", "Garlic Chutney"],
  "Ice Cream": ["Vanilla", "Strawberry", "Chocolate", "Butterscotch", "Vanilla with Chocolate Sauce", "Mix Ice Cream"],
  "Kuch Chatpata Sa": ["Sev Dahi Puri", "Aloo Chana Chaat", "Pani Puri", "Dahi Bhalla", "Bhel Puri"],
  "Curd Preparation": ["Mix Veg Raita", "Boondi Raita", "Onion Raita", "Fry Raita", "Pineapple Raita", "Mint Tadka Raita"],
  Papad: ["Mini Khichiya", "Fried Papad", "Plain Roasted Papad", "Triangle Fryums"],
};

const menuCategories = [
  "Welcome Drinks",
  "Soups",
  "Starter",
  "Special Starter",
  "Paneer Preparation",
  "Veg Preparation",
  "Dal Preparation",
  "Rice Preparation",
  "Indian Breads",
  "Salad",
  "Chutney",
  "Ice Cream",
  "Kuch Chatpata Sa",
  "Curd Preparation",
  "Papad",
].filter((category) => category in menuData);

const initialForm: BookingPayload = {
  customer_name: "",
  phone: "",
  date_of_birth: "",
  anniversary: "",
  party_date: "",
  party_time: "",
  party_end_time: "",
  starter_required: "No",
  starter_time: "",
  maincourse_required: "No",
  maincourse_time: "",
  guests: 0,
  jain_members: 0,
  food_type: "Regular Food",
  spicy_level: "Medium Spicy",
  package_type: "Snack Attack",
  venue_type: "Club",
  occasion: "Birthday",
  dj_required: "No",
  jockey_required: "No",
  dj_time: "",
  other_details: "",
  payment_note: "",
  menu_items: [],
  billing_pax: 0,
  billing_dj: 0,
  billing_decor: 0,
  billing_gst: 0,
  billing_g_amount: 0,
  billing_advance: 0,
  billing_total_amount: 0,
  billing_due_amount: 0,
  payment_mode: "cash",
};

const BOOKING_DRAFT_STORAGE_KEY = "bookingFormDraftV1";

type BookingFormDraft = {
  formData: BookingPayload;
  selectedItems: string[];
  activeSection: SectionKey | null;
  selectedCategory: string;
  updatedAt: number;
};

export default function BookingForm({ onSubmitBooking, onLogout, isLoggingOut = false }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingPayload>(initialForm);
  const [isJainMembersEnabled, setIsJainMembersEnabled] = useState(false);
  const [isGuestsFocused, setIsGuestsFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey | null>("customer");
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAllSelectedItems, setShowAllSelectedItems] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const occasionOptions = ["Birthday", "Anniversary", "Get Together", "Freshers Party"];
  const foodTypeOptions = ["Jain Food", "Regular Food", "Brahmin Food"];
  const packageOptions = ["Snack Attack", "Social Luxe Experience", "Grand Affair", "Kitty"];
  const spicyLevelOptions = ["Spicy", "Medium Spicy", "Less Spicy"];
  const venueTypeOptions = ["Club", "Cafe", "Rooftop", "PDR - 1", "PDR - 2"];
  const supportedPaymentModes = ["Q5", "Q7", "cash", "card", "upi"];
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    const rawDraft = localStorage.getItem(BOOKING_DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const parsed = JSON.parse(rawDraft) as Partial<BookingFormDraft>;

      if (parsed.formData) {
        setFormData({ ...initialForm, ...parsed.formData });
        setIsJainMembersEnabled(Number(parsed.formData.jain_members || 0) > 0);
      }

      if (Array.isArray(parsed.selectedItems)) {
        setSelectedItems(parsed.selectedItems.filter((item): item is string => typeof item === "string"));
      }

      if (typeof parsed.selectedCategory === "string" && menuCategories.includes(parsed.selectedCategory)) {
        setSelectedCategory(parsed.selectedCategory);
      }

      if (
        parsed.activeSection === "customer" ||
        parsed.activeSection === "event" ||
        parsed.activeSection === "menu" ||
        parsed.activeSection === "timing" ||
        parsed.activeSection === "billing" ||
        parsed.activeSection === null
      ) {
        setActiveSection(parsed.activeSection);
      }
    } catch {
      localStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const hasUserData =
      formData.customer_name.trim() !== "" ||
      formData.phone.trim() !== "" ||
      formData.party_date.trim() !== "" ||
      selectedItems.length > 0;

    if (!hasUserData) {
      localStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
      return;
    }

    const draft: BookingFormDraft = {
      formData,
      selectedItems,
      activeSection,
      selectedCategory,
      updatedAt: Date.now(),
    };

    localStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [formData, selectedItems, activeSection, selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-themed-dropdown='true']")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!navbarRef.current) return;

    const categoryButtons = navbarRef.current.querySelectorAll("button[type='button']");
    const selectedButton = Array.from(categoryButtons).find(
      (btn) => btn.textContent?.trim() === selectedCategory
    ) as HTMLElement | undefined;

    if (selectedButton) {
      selectedButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      menu_items: selectedItems,
    }));
  }, [selectedItems]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    const numericFields = new Set([
      "guests",
      "jain_members",
      "billing_pax",
      "billing_dj",
      "billing_decor",
      "billing_gst",
      "billing_g_amount",
      "billing_advance",
      "billing_total_amount",
      "billing_due_amount",
    ]);

    setFormData((prev) => {
      if (name === "dj_required" && value === "No") {
        return {
          ...prev,
          dj_required: value,
          jockey_required: "No",
          dj_time: "",
        };
      }

      let finalValue = numericFields.has(name) ? Number(value) : value;
      if (name === "phone") {
        finalValue = String(value).replace(/\D/g, "").slice(0, 10);
      }

      const updatedData = {
        ...prev,
        [name]: finalValue,
      };

      if (name === "jain_members") {
        const requestedJain = Number(value) || 0;
        updatedData.jain_members = Math.max(0, Math.min(requestedJain, updatedData.guests));
      }

      if (name === "guests") {
        const guestCount = Number(value) || 0;
        if (updatedData.jain_members > guestCount) {
          updatedData.jain_members = guestCount;
        }
      }

      if (name === "food_type" && String(value) === "Jain Food") {
        updatedData.jain_members = updatedData.guests;
        setIsJainMembersEnabled(true);
      }

      if (["guests", "billing_pax", "billing_dj", "billing_decor", "billing_gst"].includes(name)) {
        const guests = name === "guests" ? Number(value) : updatedData.guests;
        const pax = name === "billing_pax" ? Number(value) : updatedData.billing_pax;
        const dj = name === "billing_dj" ? Number(value) : updatedData.billing_dj;
        const decor = name === "billing_decor" ? Number(value) : updatedData.billing_decor;
        const gstPercentage = name === "billing_gst" ? Number(value) : updatedData.billing_gst;

        const baseAmount = pax * guests + dj + decor;
        const gstAmount = (gstPercentage / 100) * baseAmount;
        updatedData.billing_g_amount = Number((baseAmount + gstAmount).toFixed(2));
      }

      if (["guests", "billing_pax", "billing_dj", "billing_decor", "billing_gst", "billing_advance"].includes(name)) {
        const gAmount = updatedData.billing_g_amount;
        const advance = updatedData.billing_advance;
        const netDue = gAmount - advance;

        updatedData.billing_due_amount = Number(netDue.toFixed(2));
      }

      return updatedData;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowConfirmPopup(true);
  };

  const confirmAndSubmit = async () => {
    setShowConfirmPopup(false);
    setSubmitting(true);

    const cleanedData: BookingPayload = {
      ...formData,
      menu_items: selectedItems,
      date_of_birth: formData.date_of_birth || null,
      anniversary: formData.anniversary || null,
      party_time: formData.party_time || null,
      party_end_time: formData.party_end_time || null,
      starter_time: formData.starter_time || null,
      maincourse_time: formData.maincourse_time || null,
      dj_time: formData.dj_time || null,
      payment_note: formData.payment_note || null,
    };

    const saved = await onSubmitBooking(cleanedData);
    setSubmitting(false);

    if (!saved) {
      return;
    }

    void fetch("/api/send-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanedData.phone,
        name: cleanedData.customer_name,
        date: cleanedData.party_date,
        party_time: cleanedData.party_time,
        party_end_time: cleanedData.party_end_time,
        starter_time: cleanedData.starter_time,
        main_course_time: cleanedData.maincourse_time,
        dj_time: cleanedData.dj_time,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          console.error("WhatsApp notification failed:", errorPayload);
        }
      })
      .catch((error) => {
        console.error("WhatsApp notification failed:", error);
      });

    setFormData(initialForm);
    setSelectedItems([]);
    setShowAllSelectedItems(false);
    localStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
    setShowSuccessPopup(true);
    window.setTimeout(() => setShowSuccessPopup(false), 2200);
  };

  const toggleSection = (section: SectionKey) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const toggleMenuItem = (item: string) => {
    setSelectedItems((prev) => (prev.includes(item) ? prev.filter((selected) => selected !== item) : [...prev, item]));
  };

  const removeSelectedItem = (item: string) => {
    setSelectedItems((prev) => prev.filter((selected) => selected !== item));
  };

  const handleStarterRequiredToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      starter_required: checked ? "Yes" : "No",
      starter_time: checked ? (prev.starter_time || "14:00") : "",
    }));
  };

  const handleMaincourseRequiredToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      maincourse_required: checked ? "Yes" : "No",
      maincourse_time: checked ? (prev.maincourse_time || "19:00") : "",
    }));
  };

  const handleJainMembersToggle = (checked: boolean) => {
    setIsJainMembersEnabled(checked);

    setFormData((prev) => {
      if (!checked) {
        return {
          ...prev,
          jain_members: 0,
        };
      }

      const minCount = prev.guests > 0 ? 1 : 0;
      const nextCount = prev.jain_members > 0 ? prev.jain_members : minCount;

      return {
        ...prev,
        jain_members: nextCount,
      };
    });
  };

  const previewSelectedItems = selectedItems.slice(0, 3).join(", ");
  const hiddenSelectedCount = Math.max(selectedItems.length - 3, 0);

  const inputClassName =
    "w-full rounded-[10px] border border-white/10 bg-[#111111] px-3 py-2.5 text-white outline-none transition duration-300 placeholder:text-white/35 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]";
  const labelClassName =
    "mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60";

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="mx-auto max-w-[1000px] space-y-4 rounded-3xl border border-[#D4AF372B] bg-[rgba(255,255,255,0.02)] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-6"
    >
      <section className="mb-4 rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(212,175,55,0.14)] sm:px-5">
        <button
          type="button"
          onClick={() => toggleSection("customer")}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        >
          <h3 className="font-display text-[1.65rem] leading-none text-[#D4AF37] sm:text-[1.85rem]">Customer Details</h3>
          <ChevronDown
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${activeSection === "customer" ? "rotate-180" : "rotate-0"
              }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === "customer" ? (
            <motion.div
              key="customer"
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                <div>
                  <label htmlFor="customer_name" className={labelClassName}>
                    Customer Name
                  </label>
                  <input
                    id="customer_name"
                    name="customer_name"
                    type="text"
                    value={formData.customer_name}
                    onChange={handleChange}
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                  <div className="col-span-2">
                    <label htmlFor="phone" className={labelClassName}>
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClassName}
                      required
                      maxLength={10}
                      minLength={10}
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit phone number"
                    />
                  </div>

                  <div className="col-span-1">
                    <label htmlFor="guests" className={labelClassName}>
                      Guests
                    </label>
                    <input
                      id="guests"
                      name="guests"
                      type="number"
                      min={1}
                      placeholder="0"
                      value={isGuestsFocused && formData.guests === 0 ? "" : formData.guests}
                      onChange={handleChange}
                      onFocus={() => setIsGuestsFocused(true)}
                      onBlur={() => setIsGuestsFocused(false)}
                      className={inputClassName}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="date_of_birth" className={labelClassName}>
                    Date Of Birth (Optional)
                  </label>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth ?? ""}
                    onChange={handleChange}
                    max={today}
                    className={`${inputClassName} h-[56px] date-time-icon-glow`}
                  />
                </div>

                <div>
                  <label htmlFor="anniversary" className={labelClassName}>
                    Anniversary (Optional)
                  </label>
                  <input
                    id="anniversary"
                    name="anniversary"
                    type="date"
                    value={formData.anniversary ?? ""}
                    onChange={handleChange}
                    max={today}
                    className={`${inputClassName} h-[56px] date-time-icon-glow`}
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="mb-4 rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(212,175,55,0.14)] sm:px-5">
        <button
          type="button"
          onClick={() => toggleSection("event")}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        >
          <h3 className="font-display text-[1.65rem] leading-none text-[#D4AF37] sm:text-[1.85rem]">Event Details</h3>
          <ChevronDown
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${activeSection === "event" ? "rotate-180" : "rotate-0"
              }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === "event" ? (
            <motion.div
              key="event"
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-visible"
            >
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                <div>
                  <label htmlFor="food_type" className={labelClassName}>
                    Food Type
                  </label>
                  <div className="relative" data-themed-dropdown="true">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown((prev) => (prev === "food_type" ? null : "food_type"))}
                      className={`${inputClassName} flex items-center justify-between text-left`}
                    >
                      <span>{formData.food_type}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${openDropdown === "food_type" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openDropdown === "food_type" ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="absolute z-30 mt-1 w-full overflow-hidden rounded-[10px] border border-[#D4AF3755] bg-[#0b0b0b] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
                        >
                          {foodTypeOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, food_type: option }));
                                setOpenDropdown(null);
                              }}
                              className="w-full border-b border-white/10 px-4 py-2.5 text-left text-[1.05rem] text-white transition duration-200 last:border-b-0 hover:bg-[#D4AF3720]"
                            >
                              {option}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Jain Members</label>
                  <div className="space-y-2 rounded-[10px] border border-white/10 bg-[#0f0f0f] p-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f4d986]">
                      <input
                        type="checkbox"
                          checked={isJainMembersEnabled}
                        onChange={(event) => handleJainMembersToggle(event.target.checked)}
                        className="h-4 w-4 accent-[#D4AF37]"
                      />
                      Include Jain Members
                    </label>

                    <input
                      id="jain_members"
                      name="jain_members"
                      type="number"
                      min={0}
                      max={formData.guests}
                      placeholder={formData.jain_members > 0 ? "1" : "0"}
                      value={formData.jain_members === 0 ? "" : formData.jain_members}
                      onChange={handleChange}
                      disabled={!isJainMembersEnabled}
                      className={`${inputClassName} ${!isJainMembersEnabled ? "opacity-45" : ""}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="package_type" className={labelClassName}>
                    Package
                  </label>
                  <div className="relative" data-themed-dropdown="true">
                    <div className="relative">
                      <input
                        id="package_type"
                        name="package_type"
                        type="text"
                        value={formData.package_type}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            package_type: event.target.value,
                          }))
                        }
                        className={`${inputClassName} pr-11`}
                        placeholder="Select or type package"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setOpenDropdown((prev) => (prev === "package_type" ? null : "package_type"))}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/85"
                        aria-label="Toggle package options"
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition-transform duration-300 ${openDropdown === "package_type" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
                            }`}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {openDropdown === "package_type" ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="absolute z-30 mt-1 w-full overflow-hidden rounded-[10px] border border-[#D4AF3755] bg-[#0b0b0b] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
                        >
                          {packageOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, package_type: option }));
                                setOpenDropdown(null);
                              }}
                              className="w-full border-b border-white/10 px-4 py-2.5 text-left text-[1.05rem] text-white transition duration-200 last:border-b-0 hover:bg-[#D4AF3720]"
                            >
                              {option}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label htmlFor="spicy_level" className={labelClassName}>
                    Spicy Level
                  </label>
                  <div className="relative" data-themed-dropdown="true">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown((prev) => (prev === "spicy_level" ? null : "spicy_level"))}
                      className={`${inputClassName} flex items-center justify-between text-left`}
                    >
                      <span>{formData.spicy_level}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${openDropdown === "spicy_level" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openDropdown === "spicy_level" ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="absolute z-30 mt-1 w-full overflow-hidden rounded-[10px] border border-[#D4AF3755] bg-[#0b0b0b] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
                        >
                          {spicyLevelOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, spicy_level: option }));
                                setOpenDropdown(null);
                              }}
                              className="w-full border-b border-white/10 px-4 py-2.5 text-left text-[1.05rem] text-white transition duration-200 last:border-b-0 hover:bg-[#D4AF3720]"
                            >
                              {option}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <div>
                  <label htmlFor="venue_type" className={labelClassName}>
                    Venue Type
                  </label>
                  <div className="relative" data-themed-dropdown="true">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown((prev) => (prev === "venue_type" ? null : "venue_type"))}
                      className={`${inputClassName} flex items-center justify-between text-left`}
                    >
                      <span>{formData.venue_type}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${openDropdown === "venue_type" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openDropdown === "venue_type" ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="absolute z-30 mt-1 w-full overflow-hidden rounded-[10px] border border-[#D4AF3755] bg-[#0b0b0b] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
                        >
                          {venueTypeOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, venue_type: option }));
                                setOpenDropdown(null);
                              }}
                              className="w-full border-b border-white/10 px-4 py-2.5 text-left text-[1.05rem] text-white transition duration-200 last:border-b-0 hover:bg-[#D4AF3720]"
                            >
                              {option}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
                  className="relative"
                  data-themed-dropdown="true"
                >
                  <label htmlFor="occasion" className={labelClassName}>
                    Occasion
                  </label>
                  <div className="relative">
                    <input
                      id="occasion"
                      name="occasion"
                      type="text"
                      value={formData.occasion}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          occasion: event.target.value,
                        }))
                      }
                      className={`${inputClassName} pr-11`}
                      placeholder="Select or type occasion"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setOpenDropdown((prev) => (prev === "occasion" ? null : "occasion"))}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/85"
                      aria-label="Toggle occasion options"
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${openDropdown === "occasion" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
                          }`}
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {openDropdown === "occasion" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="relative z-30 mt-1 w-full overflow-hidden rounded-[10px] border border-[#D4AF3755] bg-[#0b0b0b] shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
                      >
                        {occasionOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, occasion: option }));
                              setOpenDropdown(null);
                            }}
                            className="w-full border-b border-white/10 px-4 py-2.5 text-left text-[1.05rem] text-white transition duration-200 last:border-b-0 hover:bg-[#D4AF3720]"
                          >
                            {option}
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>

                <div className="md:col-span-2">
                  <label htmlFor="other_details" className={labelClassName}>
                    Other
                  </label>
                  <textarea
                    id="other_details"
                    name="other_details"
                    value={formData.other_details}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Write any extra event details here"
                    className={inputClassName}
                  />
                </div>

              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="mb-4 rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(212,175,55,0.14)] sm:px-5">
        <button
          type="button"
          onClick={() => toggleSection("timing")}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        >
          <h3 className="font-display text-[1.65rem] leading-none text-[#D4AF37] sm:text-[1.85rem]">Timing</h3>
          <ChevronDown
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${activeSection === "timing" ? "rotate-180" : "rotate-0"
              }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === "timing" ? (
            <motion.div
              key="timing"
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                <div className="grid grid-cols-1 gap-4 md:col-span-2">
                  <div className="min-w-0 w-full">
                    <label htmlFor="party_date" className={labelClassName}>
                      Party Date
                    </label>
                    <input
                      id="party_date"
                      name="party_date"
                      type="date"
                      value={formData.party_date}
                      onChange={handleChange}
                      min={today}
                      className={`${inputClassName} h-[56px] date-time-icon-glow`}
                      required
                    />
                  </div>

                  <div className="min-w-0 w-full">
                    <label htmlFor="party_time" className={labelClassName}>
                      Party Start Time
                    </label>
                    <TimePicker
                      id="party_time"
                      value={formData.party_time}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          party_time: value,
                        }))
                      }
                    />
                  </div>

                  <div className="min-w-0 w-full">
                    <label htmlFor="party_end_time" className={labelClassName}>
                      Party End Time
                    </label>
                    <TimePicker
                      id="party_end_time"
                      value={formData.party_end_time}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          party_end_time: value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:col-span-2 sm:grid-cols-2">
                  <div className="min-w-0 w-full rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label htmlFor="starter_time" className={labelClassName}>
                        Starter Time
                      </label>
                      <label className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF3740] bg-[#151515] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#f4d986]">
                        <input
                          type="checkbox"
                          checked={formData.starter_required === "Yes"}
                          onChange={(event) => handleStarterRequiredToggle(event.target.checked)}
                          className="h-3.5 w-3.5 accent-[#D4AF37]"
                        />
                        Need
                      </label>
                    </div>
                    <TimePicker
                      id="starter_time"
                      value={formData.starter_time}
                      disabled={formData.starter_required !== "Yes"}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          starter_time: value,
                        }))
                      }
                    />
                  </div>

                  <div className="min-w-0 w-full rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label htmlFor="maincourse_time" className={labelClassName}>
                        Maincourse Time
                      </label>
                      <label className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF3740] bg-[#151515] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#f4d986]">
                        <input
                          type="checkbox"
                          checked={formData.maincourse_required === "Yes"}
                          onChange={(event) => handleMaincourseRequiredToggle(event.target.checked)}
                          className="h-3.5 w-3.5 accent-[#D4AF37]"
                        />
                        Need
                      </label>
                    </div>
                    <TimePicker
                      id="maincourse_time"
                      value={formData.maincourse_time}
                      disabled={formData.maincourse_required !== "Yes"}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          maincourse_time: value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0 w-full">
                      <label htmlFor="dj_required" className={labelClassName}>
                        DJ
                      </label>
                      <select
                        id="dj_required"
                        name="dj_required"
                        value={formData.dj_required}
                        onChange={handleChange}
                        className={`${inputClassName} h-[56px]`}
                        required
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {formData.dj_required === "Yes" ? (
                      <div className="min-w-0 w-full">
                        <label htmlFor="jockey_required" className={labelClassName}>
                          Jockey
                        </label>
                        <select
                          id="jockey_required"
                          name="jockey_required"
                          value={formData.jockey_required}
                          onChange={handleChange}
                          className={`${inputClassName} h-[56px]`}
                          required
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    ) : (
                      <div aria-hidden="true" className="min-w-0 w-full" />
                    )}
                  </div>

                  {formData.dj_required === "Yes" ? (
                    <div className="w-full">
                      <label htmlFor="dj_time" className={labelClassName}>
                        DJ Timing
                      </label>
                      <TimeRangePicker
                        id="dj_time"
                        value={formData.dj_time}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            dj_time: value,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="mb-4 rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(212,175,55,0.14)] sm:px-5">
        <button
          type="button"
          onClick={() => toggleSection("billing")}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        >
          <h3 className="font-display text-[1.65rem] leading-none text-[#D4AF37] sm:text-[1.85rem]">Billing Details</h3>
          <ChevronDown
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${activeSection === "billing" ? "rotate-180" : "rotate-0"
              }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === "billing" ? (
            <motion.div
              key="billing"
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-visible"
            >
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                <div>
                  <label htmlFor="billing_pax" className={labelClassName}>
                    Person Per Price
                  </label>
                  <input
                    id="billing_pax"
                    name="billing_pax"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={formData.billing_pax === 0 ? "" : formData.billing_pax}
                    onChange={handleChange}
                    className={inputClassName}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label htmlFor="billing_dj" className={labelClassName}>
                      DJ
                    </label>
                    <input
                      id="billing_dj"
                      name="billing_dj"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.billing_dj === 0 ? "" : formData.billing_dj}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor="billing_decor" className={labelClassName}>
                      Decor
                    </label>
                    <input
                      id="billing_decor"
                      name="billing_decor"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.billing_decor === 0 ? "" : formData.billing_decor}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                  <div>
                    <label htmlFor="billing_gst" className={labelClassName}>
                      GST (%)
                    </label>
                    <input
                      id="billing_gst"
                      name="billing_gst"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      value={formData.billing_gst === 0 ? "" : formData.billing_gst}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="billing_g_amount" className={labelClassName}>
                      G. Amount
                    </label>
                    <input
                      id="billing_g_amount"
                      name="billing_g_amount"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      value={formData.billing_g_amount === 0 ? "" : formData.billing_g_amount}
                      readOnly
                      className="w-full cursor-not-allowed rounded-[10px] border border-white/10 bg-[#121212] px-3 py-2.5 text-white/85 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label htmlFor="billing_advance" className={labelClassName}>
                      Advance
                    </label>
                    <input
                      id="billing_advance"
                      name="billing_advance"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      value={formData.billing_advance === 0 ? "" : formData.billing_advance}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor="payment_mode" className={labelClassName}>
                      Payment Mode
                    </label>
                    <div className="relative" data-themed-dropdown="true">
                      <button
                        type="button"
                        id="payment_mode"
                        onClick={() => setOpenDropdown(openDropdown === "payment_mode" ? null : "payment_mode")}
                        className={`flex w-full items-center justify-between rounded-[10px] border border-white/10 bg-[#111111] px-3 py-2.5 text-sm transition-all focus:border-[#D4AF37] ${openDropdown === "payment_mode" ? "border-[#D4AF37] ring-2 ring-[#D4AF3720]" : ""}`}
                      >
                        <span className="text-white/85">{formData.payment_mode || "Select Mode"}</span>
                        <ChevronDown className={`h-4 w-4 text-[#D4AF37] transition-transform duration-300 ${openDropdown === "payment_mode" ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {openDropdown === "payment_mode" && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute bottom-full left-0 right-0 z-[60] mb-1 rounded-[10px] border border-[rgba(212,175,55,0.3)] bg-[#121212] shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md"
                          >
                            <div className="p-1">
                              {supportedPaymentModes.map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, payment_mode: mode }));
                                    setOpenDropdown(null);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[rgba(212,175,55,0.1)] ${formData.payment_mode === mode ? "bg-[rgba(212,175,55,0.08)] text-[#D4AF37]" : "text-white/70"}`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-xl border border-[#D4AF37AA] bg-[rgba(212,175,55,0.08)] p-4 shadow-[0_0_25px_rgba(212,175,55,0.15)]">
                    <label htmlFor="billing_due_amount" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4d986]">
                      Net Due Amount
                    </label>
                    <input
                      id="billing_due_amount"
                      name="billing_due_amount"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      value={formData.billing_due_amount === 0 ? "" : formData.billing_due_amount}
                      readOnly
                      className="w-full cursor-not-allowed rounded-[10px] border border-[#D4AF3755] bg-[#111111] px-3 py-2.5 text-[#f5dfa0] outline-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="payment_note" className={labelClassName}>
                    Payment Notes
                  </label>
                  <textarea
                    id="payment_note"
                    name="payment_note"
                    value={formData.payment_note ?? ""}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Write payment-related notes"
                    className={inputClassName}
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="mb-4 rounded-2xl border border-[rgba(212,175,55,0.2)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(212,175,55,0.14)] sm:px-5">
        <button
          type="button"
          onClick={() => toggleSection("menu")}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        >
          <h3 className="font-display text-[1.65rem] leading-none text-[#D4AF37] sm:text-[1.85rem]">Menu Selection ({selectedItems.length})</h3>
          <ChevronDown
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${activeSection === "menu" ? "rotate-180" : "rotate-0"
              }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === "menu" ? (
            <motion.div
              key="menu"
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <div
                  ref={navbarRef}
                  className="mb-4 flex flex-nowrap items-center gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {menuCategories.map((category) => {
                    const isActive = selectedCategory === category;

                    return (
                      <motion.button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        whileTap={{ scale: 0.97 }}
                        className={`shrink-0 text-left text-sm font-semibold transition duration-300 ${isActive
                            ? "text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.45)]"
                            : "text-[#D4AF37CC] hover:text-[#D4AF37]"
                          }`}
                      >
                        {category}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="grid max-h-[200px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] content-start gap-2 overflow-y-auto p-1 pb-4 pr-2 [scrollbar-width:thin]"
                  >
                    {menuData[selectedCategory].map((item) => {
                      const isSelected = selectedItems.includes(item);

                      return (
                        <motion.button
                          key={item}
                          type="button"
                          onClick={() => toggleMenuItem(item)}
                          whileTap={{ scale: 0.97 }}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition duration-250 ${isSelected
                              ? "border-[#D4AF37] bg-[#D4AF371A] text-[#F0D981] shadow-[0_0_16px_rgba(212,175,55,0.24)] scale-[1.01]"
                              : "border-white/10 bg-[#111111] text-white/80 hover:border-[#D4AF3760] hover:text-white"
                            }`}
                        >
                          {item}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>

                {selectedItems.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-[#D4AF3738] bg-[#D4AF3714] px-3 py-2 text-sm text-[#f3df9f]">
                    {showAllSelectedItems ? (
                      <div>
                        <div className="mb-2 font-medium text-[#f3df9f]">Selected Items</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedItems.map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-2 rounded-full border border-[#D4AF3760] bg-[#111111] px-3 py-1 text-xs text-[#f3df9f]"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => removeSelectedItem(item)}
                                className="text-[#D4AF37] transition hover:text-[#f7e4a8]"
                                aria-label={`Remove ${item}`}
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAllSelectedItems(false)}
                          className="mt-2 text-xs font-medium text-[#D4AF37] hover:text-[#f7e4a8]"
                        >
                          Show less
                        </button>
                      </div>
                    ) : (
                      <div>
                        <span>Selected: {previewSelectedItems}</span>
                        {hiddenSelectedCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setShowAllSelectedItems(true)}
                            className="ml-2 text-xs font-medium text-[#D4AF37] hover:text-[#f7e4a8]"
                          >
                            (+{hiddenSelectedCount} more)
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <div className="mt-1 flex items-center gap-3 border-t border-white/10 pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D4AF37] to-[#f2d57b] px-6 py-2.5 text-sm font-bold text-black shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_14px_34px_rgba(212,175,55,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving..." : "Add Booking"}
        </button>

        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center rounded-[12px] border border-[#D4AF3740] bg-[#111111] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#f4d986] transition hover:border-[#D4AF37] hover:bg-[#171717] hover:text-[#ffe9b2] disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        ) : null}

        {showSuccessPopup ? (
          <div className="ml-auto inline-flex items-center justify-center rounded-[12px] border border-[#2dff8a99] bg-[linear-gradient(135deg,#0d2f1f_0%,#0f4729_55%,#0a2a19_100%)] px-4 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-[#8dffba] shadow-[0_0_10px_rgba(45,255,138,0.55),0_0_24px_rgba(45,255,138,0.35),inset_0_0_8px_rgba(141,255,186,0.22)]">
            Booking Saved
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {showConfirmPopup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm rounded-[24px] border border-[#D4AF3740] bg-[#0b0b0b] p-6 shadow-[0_24px_50px_rgba(212,175,55,0.15)]"
            >
              <h3 className="mb-2 font-display text-[1.8rem] leading-none text-[#D4AF37]">Confirm Booking</h3>
              <p className="mb-6 text-sm text-white/70">
                Are you sure you want to add this booking? Please ensure all details are correct.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmPopup(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#111] py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAndSubmit}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#f2d57b] py-2.5 text-sm font-bold text-black shadow-[0_4px_14px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(212,175,55,0.4)]"
                >
                  Yes, Book It!
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
