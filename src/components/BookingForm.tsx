import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { BookingPayload } from "@/types/booking";
import { TimePicker } from "./TimePicker";

type BookingFormProps = {
  onSubmitBooking: (data: BookingPayload) => Promise<boolean>;
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
    "Veg Manchurian (Dry/Gravy)",
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
  ],
  "Special Starter": [
    "Chilli Garlic Paneer",
    "Chilly Paneer",
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
  ],
  "Dal Preparation": ["Dal Fry", "Dal Tadka", "Dal Makhani"],
  Salad: ["Garden Fresh Salad", "Onion Ring Salad", "Kachumbar Salad", "Corn Pineapple Salad"],
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
    "Butter Naan",
    "Green Chilli Naan",
    "Garlic Naan",
    "Butter Laccha Paratha",
    "Missi Roti",
  ],
  Chutney: ["Garlic Sauce", "Mint Sauce", "Schezwan Sauce", "Mayo Sauce", "Garlic Chutney"],
  "Ice Cream": ["Vanilla", "Strawberry", "Chocolate", "Butterscotch", "Vanilla with Chocolate Sauce"],
  "Kuch Chatpata Sa": ["Sev Dahi Puri", "Aloo Chana Chaat", "Pani Puri", "Dahi Bhalla", "Bhel Puri"],
  "Curd Preparation": ["Mix Veg Raita", "Boondi Raita", "Onion Raita", "Fry Raita", "Pineapple Raita", "Mint Tadka Raita"],
};

const menuCategories = Object.keys(menuData);

const initialForm: BookingPayload = {
  customer_name: "",
  phone: "",
  date_of_birth: "",
  anniversary: "",
  party_date: "",
  party_time: "",
  starter_time: "",
  maincourse_time: "",
  guests: 0,
  food_type: "Regular Food",
  spicy_level: "Medium Spicy",
  package_type: "Snack Attack",
  venue_type: "Club",
  occasion: "Birthday",
  dj_required: "No",
  jockey_required: "No",
  dj_time: "",
  other_details: "",
  menu_items: [],
  billing_pax: 0,
  billing_dj: 0,
  billing_decor: 0,
  billing_gst: 0,
  billing_g_amount: 0,
  billing_advance: 0,
  billing_total_amount: 0,
  billing_due_amount: 0,
  payment_mode: "Cash",
};

export default function BookingForm({ onSubmitBooking }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingPayload>(initialForm);
  const [isGuestsFocused, setIsGuestsFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey | null>("customer");
  const [selectedCategory, setSelectedCategory] = useState(menuCategories[0]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAllSelectedItems, setShowAllSelectedItems] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const occasionOptions = ["Birthday", "Anniversary", "Get Together", "Freshers Party"];
  const foodTypeOptions = ["Jain Food", "Regular Food", "Brahmin Food"];
  const packageOptions = ["Snack Attack", "Social Luxe Experience", "Grand Affair"];
  const spicyLevelOptions = ["Spicy", "Medium Spicy", "Less Spicy"];
  const venueTypeOptions = ["Club", "Cafe", "Rooftop", "PDR - 1", "PDR - 2"];

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

      const updatedData = {
        ...prev,
        [name]: numericFields.has(name) ? Number(value) : value,
      };

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const cleanedData: BookingPayload = {
      ...formData,
      menu_items: selectedItems,
      date_of_birth: formData.date_of_birth || null,
      anniversary: formData.anniversary || null,
      starter_time: formData.starter_time || null,
      maincourse_time: formData.maincourse_time || null,
      dj_time: formData.dj_time || null,
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
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${
              activeSection === "customer" ? "rotate-180" : "rotate-0"
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
                    className={inputClassName}
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
          onClick={() => toggleSection("event")}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
        >
          <h3 className="font-display text-[1.65rem] leading-none text-[#D4AF37] sm:text-[1.85rem]">Event Details</h3>
          <ChevronDown
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${
              activeSection === "event" ? "rotate-180" : "rotate-0"
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
              className="overflow-hidden"
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
                        className={`h-5 w-5 transition-transform duration-300 ${
                          openDropdown === "food_type" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
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
                          className={`h-5 w-5 transition-transform duration-300 ${
                            openDropdown === "package_type" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
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
                        className={`h-5 w-5 transition-transform duration-300 ${
                          openDropdown === "spicy_level" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
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
                        className={`h-5 w-5 transition-transform duration-300 ${
                          openDropdown === "venue_type" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
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
                        className={`h-5 w-5 transition-transform duration-300 ${
                          openDropdown === "occasion" ? "rotate-180 text-[#D4AF37]" : "rotate-0"
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
                    placeholder="Write any extra details here"
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
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${
              activeSection === "timing" ? "rotate-180" : "rotate-0"
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
                <div className="grid grid-cols-5 gap-4 md:col-span-2">
                  <div className="col-span-3">
                    <label htmlFor="party_date" className={labelClassName}>
                      Party Date
                    </label>
                    <input
                      id="party_date"
                      name="party_date"
                      type="date"
                      value={formData.party_date}
                      onChange={handleChange}
                      className={`${inputClassName} date-time-icon-white`}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="party_time" className={labelClassName}>
                      Party Time
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
                </div>

                <div>
                  <label htmlFor="starter_time" className={labelClassName}>
                    Starter Time
                  </label>
                  <TimePicker
                    id="starter_time"
                    value={formData.starter_time}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        starter_time: value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label htmlFor="maincourse_time" className={labelClassName}>
                    Maincourse Time
                  </label>
                  <TimePicker
                    id="maincourse_time"
                    value={formData.maincourse_time}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        maincourse_time: value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-3">
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
                    <>
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

                      <div className="min-w-0 w-full">
                        <label htmlFor="dj_time" className={labelClassName}>
                          DJ Time
                        </label>
                        <TimePicker
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
                    </>
                  ) : (
                    <>
                      <div aria-hidden="true" className="min-w-0 w-full" />
                      <div aria-hidden="true" className="min-w-0 w-full" />
                    </>
                  )}
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
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${
              activeSection === "billing" ? "rotate-180" : "rotate-0"
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
              className="overflow-hidden"
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
            className={`h-5 w-5 text-[#D4AF37] transition-transform duration-300 ${
              activeSection === "menu" ? "rotate-180" : "rotate-0"
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
                        className={`shrink-0 text-left text-sm font-semibold transition duration-300 ${
                          isActive
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
                    className="grid max-h-[420px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]"
                  >
                    {menuData[selectedCategory].map((item) => {
                      const isSelected = selectedItems.includes(item);

                      return (
                        <motion.button
                          key={item}
                          type="button"
                          onClick={() => toggleMenuItem(item)}
                          whileTap={{ scale: 0.97 }}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition duration-250 ${
                            isSelected
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

        {showSuccessPopup ? (
          <div className="ml-auto inline-flex items-center justify-center rounded-[12px] border border-[#2dff8a99] bg-[linear-gradient(135deg,#0d2f1f_0%,#0f4729_55%,#0a2a19_100%)] px-4 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-[#8dffba] shadow-[0_0_10px_rgba(45,255,138,0.55),0_0_24px_rgba(45,255,138,0.35),inset_0_0_8px_rgba(141,255,186,0.22)]">
            Booking Saved
          </div>
        ) : null}
      </div>
    </form>
  );
}
