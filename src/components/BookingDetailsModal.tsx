import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import { Eye, EyeOff, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Booking } from "@/types/booking";
import { TimePicker } from "./TimePicker";
import { TimeRangePicker } from "./TimeRangePicker";
import { convertTo12Hour, combineTo12HourRange, parse12HourRange, formatDateDDMMYYYY } from "@/lib/timeUtils";

type BookingDetailsModalProps = {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (booking: Booking) => Promise<void>;
  onUpdate?: (booking: Booking) => Promise<boolean>;
};

const MENU_CATEGORY_GROUPS: Array<{ label: string; items: string[] }> = [
  {
    label: "Welcome Drinks",
    items: ["Cold Drinks", "Virgin Mojito", "Blue Lagoon", "Kiwi Classic", "Lemon Water", "Aam Panna", "Lemon Ice Tea", "Orange Blossom"],
  },
  { label: "Soups", items: ["Cream of Tomato", "Hot n Sour", "Veg Manchow", "Corn Soup", "Cream of Veg Soup", "Veg Clear Soup"] },
  {
    label: "Starter",
    items: [
      "Veg Manchurian Dry", "Veg Manchurian Gravy", "Veg Spring Roll", "Veg 65", "Dragon Potato", "Chilli Potato", "Honey Chilli Potato",
      "Potato Chilli Ball", "French Fries", "Red Sauce Pasta", "Assorted Pakode", "Ring Onion", "Peanut Masala", "Hara Bhara Kabab",
      "Mix Veg Kabab", "Corn Kabab", "Aloo Methi Tikki", "Crispy Veg", "Chowmein", "Hakka Noodles", "Fried Rice", "Bread Pakoda",
      "Chilly Garlic Noodles", "Pink Sauce Pasta",
    ],
  },
  {
    label: "Special Starter",
    items: [
      "Chilli Garlic Paneer", "Chilly Paneer Dry", "Chilly Paneer Gravy", "American Chopsy", "Paneer 65", "Methi Paneer Tikki", "Crispy Paneer",
      "Mini Pizza", "Corn Cheese Kabab", "Corn Fritters", "Veg Cheese Maggie", "Chilli Milli Kabab", "Hot Garlic Chilli Veg", "Shanghai Manchurian",
      "Sweet Chilli Potato", "Tandoori Aloo Achari", "Hariyali Tandoori Aloo", "Masala Tadka Pav", "Pav Bhaji", "Coleslaw Sandwich", "Masala Tikka Pav",
    ],
  },
  {
    label: "Paneer Preparation",
    items: [
      "Paneer Butter Masala", "Paneer Tikka Masala", "Paneer Lababdar", "Paneer Handi Lazeez", "Paneer Matar Masala", "Kadai Paneer", "Paneer Jwalamukhi",
      "Paneer Angara", "Paneer Do Pyaza", "Paneer Khurchan", "Palak Paneer",
    ],
  },
  {
    label: "Veg Preparation",
    items: [
      "Malai Kofta (Veg Gravy)", "Veg Kofta Curry", "Veg Kolhapuri", "Veg Jaipuri", "Dum Aloo", "Jeera Aloo", "Aloo Pyaj", "Aloo Matar", "Gobhi Matar",
      "Chef Special Aloo", "Gobhi Adraki", "Mix Veg", "Govind Gatta", "Sev Tomato", "Pindi Chana Masala", "Aloo Capsicum", "Veg. Angara", "Corn Palak",
      "Palak Lahsuni", "Spl. Aloo Gobhi Adaraki", "Punjabi Kofta Curry", "Veg Jaipur",
    ],
  },
  { label: "Dal Preparation", items: ["Dal Fry", "Dal Tadka", "Dal Makhani", "Rajasthani Kadi"] },
  {
    label: "Rice Preparation",
    items: ["Jeera Rice", "Jeera Peas Pulao", "Veg Pulao", "Moti Pulao", "Onion Pulao", "Veg Biryani", "Jodhpuri Biryani", "Hyderabadi Biryani", "Brown Onion Pulao"],
  },
  { label: "Indian Breads", items: ["Butter Tandoori Roti", "Tava Roti", "Butter Naan", "Green Chilli Naan", "Garlic Naan", "Butter Laccha Paratha", "Missi Roti"] },
  { label: "Salad", items: ["Garden Fresh Salad", "Onion Ring Salad", "Kachumbar Salad", "Corn Pineapple Salad"] },
  { label: "Chutney", items: ["Garlic Sauce", "Mint Sauce", "Schezwan Sauce", "Mayo Sauce", "Garlic Chutney"] },
  { label: "Ice Cream", items: ["Vanilla", "Strawberry", "Chocolate", "Butterscotch", "Vanilla with Chocolate Sauce", "Mix Ice Cream"] },
  { label: "Kuch Chatpata Sa", items: ["Sev Dahi Puri", "Aloo Chana Chaat", "Pani Puri", "Dahi Bhalla", "Bhel Puri"] },
  { label: "Curd Preparation", items: ["Mix Veg Raita", "Boondi Raita", "Onion Raita", "Fry Raita", "Pineapple Raita", "Mint Tadka Raita"] },
  { label: "Papad", items: ["Mini Khichiya", "Fried Papad", "Plain Roasted Papad", "Triangle Fryums"] },
];

const MENU_CATEGORY_LABELS = MENU_CATEGORY_GROUPS.map((group) => group.label);

export default function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
}: BookingDetailsModalProps) {
  const ADMIN_VERIFIED_KEY = "adminEditVerified";
  const ADMIN_VERIFIED_AT_KEY = "adminEditVerifiedAt";
  const VERIFICATION_TTL_MS = 8 * 60 * 60 * 1000;

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Booking | null>(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState(MENU_CATEGORY_LABELS[0] || "");
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [showAllSelectedMenuItems, setShowAllSelectedMenuItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingAction, setPendingAction] = useState<"edit" | "delete" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  const clearVerification = useCallback(() => {
    setIsVerified(false);
    localStorage.removeItem(ADMIN_VERIFIED_KEY);
    localStorage.removeItem(ADMIN_VERIFIED_AT_KEY);
  }, [ADMIN_VERIFIED_AT_KEY, ADMIN_VERIFIED_KEY]);

  const syncVerificationFromSession = useCallback(() => {
    const verified = localStorage.getItem(ADMIN_VERIFIED_KEY) === "true";
    const verifiedAt = Number(localStorage.getItem(ADMIN_VERIFIED_AT_KEY) || "0");

    if (!verified || !verifiedAt) {
      clearVerification();
      return false;
    }

    const isExpired = Date.now() - verifiedAt > VERIFICATION_TTL_MS;
    if (isExpired) {
      clearVerification();
      return false;
    }

    setIsVerified(true);
    return true;
  }, [ADMIN_VERIFIED_AT_KEY, ADMIN_VERIFIED_KEY, VERIFICATION_TTL_MS, clearVerification]);

  const openVerificationModal = (action: "edit" | "delete") => {
    setPendingAction(action);
    setVerifyError("");
    setVerifyPassword("");
    setShowPassword(false);
    setIsVerificationModalOpen(true);
  };

  // Reset to view mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setEditData(null);
      setSelectedMenuCategory(MENU_CATEGORY_LABELS[0] || "");
      setSelectedMenuItems([]);
      setShowAllSelectedMenuItems(false);
      setShowPdfMenu(false);
      syncVerificationFromSession();
    }
  }, [isOpen, syncVerificationFromSession]);

  useEffect(() => {
    if (!isOpen) return;

    const intervalId = window.setInterval(() => {
      syncVerificationFromSession();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, syncVerificationFromSession]);

  const handleEdit = () => {
    const normalizeYesNo = (value: unknown) => (isYesValue(value) ? "Yes" : "No");

    setEditData(
      booking
        ? {
            ...booking,
            starter_required: normalizeYesNo(booking.starter_required),
            maincourse_required: normalizeYesNo(booking.maincourse_required),
            dj_required: normalizeYesNo(booking.dj_required),
            jockey_required: normalizeYesNo(booking.jockey_required),
          }
        : booking
    );
    const rawMenuItems = booking?.menu_items as unknown;
    const initialMenuItems = Array.isArray(rawMenuItems)
      ? rawMenuItems
      : typeof rawMenuItems === "string"
        ? rawMenuItems.split(/[\n,]/)
        : [];
    setSelectedMenuItems(initialMenuItems.map((item) => String(item).trim()).filter(Boolean));
    setShowAllSelectedMenuItems(false);
    setIsEditing(true);
  };

  const handleChange = (field: keyof Booking, value: unknown) => {
    if (editData) {
      let finalValue = value;
      if (field === "phone") {
        finalValue = String(value).replace(/\D/g, "").slice(0, 10);
      }

      const updatedData = {
        ...editData,
        [field]: finalValue,
      };

      if (field === "starter_required" && value === "No") {
        updatedData.starter_time = null;
      }

      if (field === "maincourse_required" && value === "No") {
        updatedData.maincourse_time = null;
      }

      if (field === "dj_required" && !isYesValue(value)) {
        updatedData.dj_time = null;
        updatedData.jockey_required = "No";
      }

      // Auto-calculate G. Amount = ((PAX x Guests) + DJ + Decor) + GST Amount
      if (["guests", "billing_pax", "billing_dj", "billing_decor", "billing_gst"].includes(field)) {
        const guests = field === "guests" ? Number(value) : updatedData.guests;
        const pax = field === "billing_pax" ? Number(value) : updatedData.billing_pax;
        const dj = field === "billing_dj" ? Number(value) : updatedData.billing_dj;
        const decor = field === "billing_decor" ? Number(value) : updatedData.billing_decor;
        const gstPercentage = field === "billing_gst" ? Number(value) : updatedData.billing_gst;

        const baseAmount = pax * guests + dj + decor;
        const gstAmount = (gstPercentage / 100) * baseAmount;
        updatedData.billing_g_amount = Number((baseAmount + gstAmount).toFixed(2));
      }

      // Calculate Net Due Amount = G. Amount - Advance
      if (["guests", "billing_pax", "billing_dj", "billing_decor", "billing_gst", "billing_advance"].includes(field)) {
        const gAmount = updatedData.billing_g_amount;
        const advance = field === "billing_advance" ? Number(value) : updatedData.billing_advance;
        const netDue = gAmount - advance;

        updatedData.billing_due_amount = Number(netDue.toFixed(2));
      }

      setEditData(updatedData);
    }
  };

  const handleSave = async () => {
    if (!editData || !onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate({
        ...editData,
        menu_items: selectedMenuItems,
      });
      setIsEditing(false);
      setSelectedMenuCategory(MENU_CATEGORY_LABELS[0] || "");
      setSelectedMenuItems([]);
      setShowAllSelectedMenuItems(false);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!booking || !onDelete) return;
    if (!confirm("Are you sure you want to delete this booking?")) return;
    setIsDeleting(true);
    try {
      await onDelete(booking);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
    setSelectedMenuCategory(MENU_CATEGORY_LABELS[0] || "");
    setSelectedMenuItems([]);
    setShowAllSelectedMenuItems(false);
  };

  const handleProtectedEdit = () => {
    openVerificationModal("edit");
  };

  const handleProtectedDelete = () => {
    openVerificationModal("delete");
  };

  const runPendingAction = () => {
    if (pendingAction === "edit") {
      handleEdit();
      return;
    }

    if (pendingAction === "delete") {
      void handleDelete();
    }
  };

  const closeVerificationModal = () => {
    setIsVerificationModalOpen(false);
    setPendingAction(null);
    setVerifyError("");
    setVerifyPassword("");
    setShowPassword(false);
  };

  const handleVerifyAdmin = async () => {
    if (!verifyPassword) {
      setVerifyError("Please enter password.");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");

    try {
      const response = await fetch("/api/verify-admin-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: verifyPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        setVerifyError("Invalid password.");
        return;
      }

      setIsVerified(true);
      localStorage.setItem(ADMIN_VERIFIED_KEY, "true");
      localStorage.setItem(ADMIN_VERIFIED_AT_KEY, String(Date.now()));
      setIsVerificationModalOpen(false);
      setVerifyPassword("");
      setShowPassword(false);
      runPendingAction();
      setPendingAction(null);
    } catch {
      setVerifyError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen || !booking) return null;

  const displayData = isEditing && editData ? editData : booking;

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true") return "Yes";
      if (lower === "false") return "No";
    }
    return String(value);
  };

  const rawDisplayMenuItems = displayData.menu_items as unknown;
  const menuItemsText = Array.isArray(rawDisplayMenuItems)
    ? rawDisplayMenuItems.filter(Boolean).join(", ")
    : typeof rawDisplayMenuItems === "string"
      ? rawDisplayMenuItems
      : "";

  const toggleMenuItemSelection = (item: string) => {
    setSelectedMenuItems((prev) =>
      prev.includes(item) ? prev.filter((selected) => selected !== item) : [...prev, item]
    );
  };

  const removeSelectedMenuItem = (item: string) => {
    setSelectedMenuItems((prev) => prev.filter((selected) => selected !== item));
  };

  const selectedCategoryItems =
    MENU_CATEGORY_GROUPS.find((group) => group.label === selectedMenuCategory)?.items || [];

  const previewSelectedMenuItems = selectedMenuItems.slice(0, 4).join(", ");
  const hiddenSelectedMenuCount = Math.max(selectedMenuItems.length - 4, 0);

  const formatTime = (time: unknown) => {
    const timeStr = String(time || "");
    if (timeStr.includes(" AM") || timeStr.includes(" PM")) return timeStr;
    return convertTo12Hour(timeStr);
  };

  const isYesValue = (value: unknown) => {
    if (typeof value === "boolean") return value;
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "yes" || normalized === "true";
  };

  const getCategorizedMenuGroups = (rawItems: string[]) => {
    const selected = rawItems.map((item) => item.trim()).filter(Boolean);
    const remaining = [...selected];
    const groups: Array<{ heading: string; items: string[] }> = [];

    MENU_CATEGORY_GROUPS.forEach((category) => {
      const matched = category.items.filter((menuItem) => remaining.includes(menuItem));
      if (matched.length === 0) return;

      groups.push({ heading: category.label, items: matched });

      matched.forEach((matchedItem) => {
        const index = remaining.indexOf(matchedItem);
        if (index >= 0) remaining.splice(index, 1);
      });
    });

    if (remaining.length > 0) {
      groups.push({ heading: "Other Selection", items: remaining });
    }

    return groups;
  };

  const formatBookedAtIndia = (value: string | null | undefined) => {
    if (!value) return "N/A";

    const raw = String(value).trim();

    // Handle timestamps that may arrive without timezone info (treat as UTC).
    const noTimezonePattern = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/;
    const normalized = noTimezonePattern.test(raw)
      ? `${raw.replace(" ", "T")}Z`
      : raw;

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return raw;

    const datePart = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date).replace(/\//g, "-");

    return `${datePart} IST`;
  };

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const cardPadding = 4;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 24;
    const footerHeight = 9;
    const contentBottomY = pageHeight - footerHeight - 3;
    const headerTitle = "BOOKING CONFIRMATION";
    const headerSubtitle = "Customer Event Dossier";
    let pageNumber = 1;
    let y = headerHeight + 5;

    const money = (value: unknown) => {
      const amount = Number(value || 0);
      return `Rs. ${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
    };

    const fitLines = (text: string, width: number, maxLines: number) => {
      const wrapped = doc.splitTextToSize(text, width);
      const lines = Array.isArray(wrapped) ? wrapped : [String(wrapped)];
      if (lines.length <= maxLines) return lines;
      const trimmed = lines.slice(0, maxLines);
      trimmed[maxLines - 1] = `${trimmed[maxLines - 1]}...`;
      return trimmed;
    };

    const hasMeaningfulText = (value: unknown) => {
      const text = String(value ?? "").trim();
      return !!text && !/^n\/?a$/i.test(text);
    };

    const addHeader = (title: string, subtitle: string) => {
      doc.setFillColor(16, 19, 26);
      doc.rect(0, 0, pageWidth, headerHeight, "F");

      doc.setFillColor(212, 175, 55);
      doc.rect(0, headerHeight - 1.8, pageWidth, 1.8, "F");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14.5);
      doc.text("MOX VOX", margin, 9.6);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(212, 218, 231);
      doc.setFontSize(8.1);
      doc.text(subtitle, margin, 14.3);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(252, 235, 171);
      doc.setFontSize(10.2);
      doc.text(title, pageWidth - margin, 10.3, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(219, 224, 235);
      doc.setFontSize(7.3);
      doc.text(`Generated ${formatBookedAtIndia(new Date().toISOString())}`, pageWidth - margin, 14.7, { align: "right" });

      y = headerHeight + 4.5;
    };

    const drawFooter = () => {
      const footerY = pageHeight - footerHeight;
      doc.setFillColor(241, 242, 246);
      doc.rect(0, footerY, pageWidth, footerHeight, "F");

      doc.setFont("helvetica", "normal");
      doc.setTextColor(90, 95, 107);
      doc.setFontSize(7.1);
      doc.text("Confidential business document • MOX VOX Event Management", margin, footerY + 5.5);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, footerY + 5.5, { align: "right" });
    };

    const startNewPage = () => {
      drawFooter();
      doc.addPage();
      pageNumber += 1;
      addHeader(headerTitle, headerSubtitle);
    };

    const ensureSpace = (requiredHeight: number) => {
      if (y + requiredHeight > contentBottomY) {
        startNewPage();
      }
    };

    const addSectionTitle = (title: string) => {
      doc.setFillColor(250, 247, 236);
      doc.roundedRect(margin, y, contentWidth, 6.8, 1.5, 1.5, "F");
      doc.setFillColor(212, 175, 55);
      doc.roundedRect(margin, y, 2.1, 6.8, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(32, 36, 47);
      doc.setFontSize(8.2);
      doc.text(title.toUpperCase(), margin + 4, y + 4.5);
      y += 8.2;
    };

    const addKeyValueSection = (title: string, rows: Array<[string, unknown]>, sectionHeight: number) => {
      const cardHeight = sectionHeight;
      ensureSpace(8.2 + cardHeight + 2.5);
      addSectionTitle(title);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(223, 227, 235);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "FD");

      const rowCount = rows.length;
      const rowHeight = (cardHeight - 6) / rowCount;
      let rowY = y + 4.5;
      const labelWidth = 36;
      const valueWidth = contentWidth - 8 - labelWidth;
      rows.forEach(([label, value], index) => {
        const wrappedValue = fitLines(formatValue(value), valueWidth, 1);

        if (index > 0) {
          doc.setDrawColor(239, 241, 245);
          doc.line(margin + 2.3, rowY - 2.1, pageWidth - margin - 2.3, rowY - 2.1);
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 113, 127);
        doc.setFontSize(7.2);
        doc.text(label.toUpperCase(), margin + cardPadding, rowY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(33, 37, 45);
        doc.setFontSize(8.2);
        doc.text(wrappedValue, margin + cardPadding + labelWidth, rowY);

        rowY += rowHeight;
      });

      y += cardHeight + 1.5;
    };

    const addMenuSection = (items: string, sectionHeight: number) => {
      const normalizedItems = items.split(",").map((item) => item.trim()).filter(Boolean);
      const groupedItems = getCategorizedMenuGroups(normalizedItems);
      const cardHeight = sectionHeight;
      ensureSpace(8.2 + cardHeight + 2.5);
      addSectionTitle("Menu Selection");
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(223, 227, 235);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "FD");

      const innerTop = y + 4;
      const innerBottom = y + cardHeight - 3;
      const colGap = 6;
      const innerWidth = contentWidth - 8;
      const colWidth = (innerWidth - colGap) / 2;
      const leftX = margin + 4;
      const rightX = leftX + colWidth + colGap;
      const headingLineHeight = 3.5;
      const itemLineHeight = 3.15;
      const blockGap = 1.25;

      const blocks = groupedItems.map((group) => {
        const heading = fitLines(group.heading, colWidth, 1)[0];
        const itemsInBlock = group.items.map((item) => fitLines(`• ${item}`, colWidth, 1)[0]);
        const blockHeight = headingLineHeight + itemsInBlock.length * itemLineHeight + blockGap;
        return { heading, items: itemsInBlock, blockHeight };
      });

      if (blocks.length === 0) {
        blocks.push({ heading: "Other Selection", items: ["• N/A"], blockHeight: headingLineHeight + itemLineHeight + blockGap });
      }

      const leftBlocks: typeof blocks = [];
      const rightBlocks: typeof blocks = [];
      let leftHeight = 0;
      let rightHeight = 0;
      let hiddenGroups = 0;

      blocks.forEach((block) => {
        const leftFits = leftHeight + block.blockHeight <= innerBottom - innerTop;
        const rightFits = rightHeight + block.blockHeight <= innerBottom - innerTop;

        if (!leftFits && !rightFits) {
          hiddenGroups += 1;
          return;
        }

        if (leftFits && (!rightFits || leftHeight <= rightHeight)) {
          leftBlocks.push(block);
          leftHeight += block.blockHeight;
        } else {
          rightBlocks.push(block);
          rightHeight += block.blockHeight;
        }
      });

      const renderColumn = (colBlocks: typeof blocks, startX: number) => {
        let cursorY = innerTop;
        colBlocks.forEach((block) => {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(95, 80, 25);
          doc.setFontSize(7.8);
          doc.text(block.heading.toUpperCase(), startX, cursorY);
          cursorY += headingLineHeight;

          doc.setFont("helvetica", "normal");
          doc.setTextColor(33, 37, 45);
          doc.setFontSize(7.65);
          block.items.forEach((itemLine) => {
            doc.text(itemLine, startX, cursorY);
            cursorY += itemLineHeight;
          });

          cursorY += blockGap;
        });

        return cursorY;
      };

      const leftEndY = renderColumn(leftBlocks, leftX);
      const rightEndY = renderColumn(rightBlocks, rightX);
      const markerY = Math.max(leftEndY, rightEndY);

      if (hiddenGroups > 0 && markerY <= innerBottom) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 113, 127);
        doc.setFontSize(7.2);
        doc.text(`+ ${hiddenGroups} more category groups`, leftX, Math.min(innerBottom, markerY));
      }

      y += cardHeight + 1.5;
    };

    const addBillingSection = () => {
      const cardHeight = 56;
      ensureSpace(8.2 + cardHeight + 2.5);
      addSectionTitle("Billing Details");
      const cardTop = y;
      const cardBottom = y + cardHeight;
      const centerX = margin + contentWidth / 2;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(223, 227, 235);
      doc.roundedRect(margin, cardTop, contentWidth, cardHeight, 2, 2, "FD");

      doc.setDrawColor(238, 240, 244);
      doc.line(centerX, cardTop + 3, centerX, cardBottom - 12);

      const leftRows: Array<[string, string]> = [
        ["Person Per Price", money(displayData.billing_pax)],
        ["Guests", String(displayData.guests)],
        ["Base Amount", money(baseAmount)],
        ["GST", `${displayData.billing_gst}%`],
        ["Payment Mode", String(displayData.payment_mode || "N/A")],
        ["Payment Notes", String(displayData.payment_note || "N/A").slice(0, 24)],
      ];

      const rightRows: Array<[string, string]> = [
        ["DJ", money(displayData.billing_dj)],
        ["Decor", money(displayData.billing_decor)],
        ["G. Amount", money(displayData.billing_g_amount)],
        ["Advance", money(displayData.billing_advance)],
      ];

      const drawColumn = (rows: Array<[string, string]>, startX: number, valueX: number) => {
        let rowY = cardTop + 6;
        rows.forEach(([label, value], idx) => {
          if (idx > 0) {
            doc.setDrawColor(241, 243, 246);
            doc.line(startX, rowY - 2.2, valueX + 24, rowY - 2.2);
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.1);
          doc.setTextColor(103, 109, 121);
          doc.text(label.toUpperCase(), startX, rowY);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.4);
          doc.setTextColor(28, 33, 42);
          doc.text(value, valueX, rowY);

          rowY += 7;
        });
      };

      drawColumn(leftRows, margin + 4, margin + 40);
      drawColumn(rightRows, centerX + 4, centerX + 33);

      const dueBarY = cardBottom - 10;
      doc.setFillColor(250, 247, 236);
      doc.roundedRect(margin + 2, dueBarY, contentWidth - 4, 7.2, 1.4, 1.4, "F");
      doc.setFillColor(212, 175, 55);
      doc.roundedRect(margin + 2, dueBarY, 2, 7.2, 1.1, 1.1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.3);
      doc.setTextColor(44, 38, 26);
      doc.text("NET DUE AMOUNT", margin + 6, dueBarY + 4.8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.2);
      doc.setTextColor(33, 37, 45);
      doc.text(money(displayData.billing_due_amount), pageWidth - margin - 4, dueBarY + 5, { align: "right" });

      y += cardHeight + 1.5;
    };

    const baseAmount = displayData.billing_pax * displayData.guests + displayData.billing_dj + displayData.billing_decor;

    addHeader(headerTitle, headerSubtitle);

    addKeyValueSection("Customer Information", [
      ["Name", displayData.customer_name],
      ["Phone", displayData.phone],
      ["Booked At", formatBookedAtIndia(displayData.created_at)],
      ["Party Date", formatDateDDMMYYYY(displayData.party_date)],
      ["Party Start Time", formatTime(displayData.party_time)],
      ["Party End Time", formatTime(displayData.party_end_time)],
      ["Venue", displayData.venue_type],
      ["Package", displayData.package_type],
      ["Occasion", displayData.occasion],
      ["Guests", displayData.guests],
      ["Food Type", displayData.food_type],
      ["Spice Preference", displayData.spicy_level],
    ], 52);

    const djEnabledForCustomerPdf = isYesValue(displayData.dj_required);
    const customerTimingRows: Array<[string, unknown]> = [
      ["Starter Service", `${displayData.starter_required} • ${formatTime(displayData.starter_time)}`],
      ["Maincourse Service", `${displayData.maincourse_required} • ${formatTime(displayData.maincourse_time)}`],
      ["DJ Required", formatValue(displayData.dj_required)],
    ];

    if (djEnabledForCustomerPdf) {
      customerTimingRows.push(["DJ Jockey", displayData.jockey_required]);
      customerTimingRows.push(["DJ Time", formatTime(displayData.dj_time)]);
    }

    addKeyValueSection(
      "Food Timing & DJ Details",
      customerTimingRows,
      djEnabledForCustomerPdf ? 28 : 20
    );

    addMenuSection(menuItemsText || "N/A", 67);

    addBillingSection();

    if (hasMeaningfulText(displayData.other_details)) {
      addKeyValueSection("Other Details", [["Other Details", String(displayData.other_details).slice(0, 100)]], 9.5);
    }

    drawFooter();

    const safeName = formatValue(displayData.customer_name).replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeDate = formatValue(displayData.party_date).replace(/[^0-9-]/g, "");
    doc.save(`booking_customer_${safeName}_${safeDate || "details"}.pdf`);
  };

  const handleDownloadKitchenPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 24;
    const footerHeight = 10;
    let pageNumber = 1;
    let y = headerHeight + 7;

    const menuItems = Array.isArray(displayData.menu_items)
      ? displayData.menu_items.filter(Boolean)
      : String(displayData.menu_items || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const addHeader = () => {
      doc.setFillColor(13, 19, 30);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setFillColor(212, 175, 55);
      doc.rect(0, headerHeight - 2, pageWidth, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13.5);
      doc.text("MOX VOX • KITCHEN PRODUCTION SHEET", margin, 10.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(208, 216, 229);
      doc.setFontSize(8.3);
      doc.text(`Generated ${formatBookedAtIndia(new Date().toISOString())}`, pageWidth - margin, 10.5, { align: "right" });

      y = headerHeight + 6;
    };

    const drawFooter = () => {
      const footerY = pageHeight - footerHeight;
      doc.setFillColor(241, 242, 246);
      doc.rect(0, footerY, pageWidth, footerHeight, "F");
      doc.setTextColor(97, 103, 118);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("Kitchen copy • Internal operations use", margin, footerY + 6.2);
      doc.text(`All timings in local event standard • Page ${pageNumber}`, pageWidth - margin, footerY + 6.2, { align: "right" });
    };

    const contentBottomY = pageHeight - footerHeight - 4;

    const startNewPage = () => {
      drawFooter();
      doc.addPage();
      pageNumber += 1;
      addHeader();
    };

    const fitSingleLine = (text: unknown, width: number) => {
      const normalized = String(text ?? "").trim();
      if (!normalized) return "";
      const wrapped = doc.splitTextToSize(normalized, width);
      const lines = Array.isArray(wrapped) ? wrapped : [String(wrapped)];
      if (lines.length <= 1) return String(lines[0] || "");
      const first = String(lines[0] || "").replace(/[\s.,;:!?-]+$/, "");
      return `${first}...`;
    };

    const ensureSpace = (requiredHeight: number) => {
      if (y + requiredHeight > contentBottomY) {
        startNewPage();
      }
    };

    const addSectionTitle = (title: string) => {
      ensureSpace(9);
      doc.setFillColor(250, 247, 236);
      doc.roundedRect(margin, y, contentWidth, 7.5, 1.6, 1.6, "F");
      doc.setFillColor(212, 175, 55);
      doc.roundedRect(margin, y, 2.1, 7.5, 1.2, 1.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(33, 37, 45);
      doc.setFontSize(8.9);
      doc.text(title.toUpperCase(), margin + 4, y + 5);
      y += 9;
    };

    const addGridRow = (leftLabel: string, leftValue: unknown, rightLabel: string, rightValue: unknown) => {
      const leftX = margin + 3;
      const rightX = margin + contentWidth / 2 + 2;
      const rowTop = y;
      const rowHeight = 7.4;
      const leftColWidth = contentWidth / 2 - 8;
      const rightColWidth = contentWidth / 2 - 8;
      const rightLabelText = String(rightLabel || "").trim();
      const rightValueText =
        rightValue === null || rightValue === undefined ? "" : String(rightValue).trim();
      const hasRightColumn = rightLabelText.length > 0 || rightValueText.length > 0;
      const leftLabelShort = fitSingleLine(leftLabel.toUpperCase(), leftColWidth);
      const leftValueShort = fitSingleLine(formatValue(leftValue), leftColWidth);
      const rightLabelShort = hasRightColumn ? fitSingleLine(rightLabelText.toUpperCase(), rightColWidth) : "";
      const rightValueShort = hasRightColumn ? fitSingleLine(formatValue(rightValue), rightColWidth) : "";

      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 113, 127);
      doc.setFontSize(7.1);
      doc.text(leftLabelShort, leftX, rowTop + 0.8);
      if (hasRightColumn) {
        doc.text(rightLabelShort, rightX, rowTop + 0.8);
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 34, 42);
      doc.setFontSize(8.6);
      doc.text(leftValueShort, leftX, rowTop + 4.7);
      if (hasRightColumn) {
        doc.text(rightValueShort, rightX, rowTop + 4.7);
      }

      y += rowHeight;
      doc.setDrawColor(238, 240, 244);
      doc.line(margin + 2, y - 1.1, pageWidth - margin - 2, y - 1.1);
    };

    const addMenuChecklist = () => {
      const groupedItems = getCategorizedMenuGroups(menuItems);
      const entries: Array<{ text: string; isHeading: boolean }> = [];
      groupedItems.forEach((group) => {
        entries.push({ text: group.heading, isHeading: true });
        group.items.forEach((item) => {
          entries.push({ text: item, isHeading: false });
        });
      });

      if (entries.length === 0) {
        entries.push({ text: "N/A", isHeading: false });
      }

      const minCardHeight = 20;
      const cardTopPadding = 6;
      const cardBottomPadding = 4;
      const separatorGap = 1.2;
      const wrapWidth = contentWidth - 18;

      const getLineStep = (isHeading: boolean) => (isHeading ? 3.9 : 4.1);

      const getWrappedLines = (text: string) => {
        const wrapped = doc.splitTextToSize(text, wrapWidth);
        return Array.isArray(wrapped) ? wrapped.map((line) => String(line)) : [String(wrapped)];
      };

      let entryIndex = 0;
      let isFirstSegment = true;

      while (entryIndex < entries.length) {
        addSectionTitle(isFirstSegment ? "Menu Production Checklist" : "Menu Production Checklist (Cont.)");

        let availableHeight = contentBottomY - y;
        if (availableHeight < minCardHeight) {
          startNewPage();
          addSectionTitle("Menu Production Checklist (Cont.)");
          availableHeight = contentBottomY - y;
        }

        const maxContentHeight = Math.max(0, availableHeight - cardTopPadding - cardBottomPadding);

        const segmentEntries: Array<{ isHeading: boolean; lines: string[]; lineStep: number }> = [];
        let contentHeightUsed = 0;

        while (entryIndex < entries.length) {
          const entry = entries[entryIndex];
          const lines = getWrappedLines(entry.text);
          const lineStep = getLineStep(entry.isHeading);
          const entryHeight = lines.length * lineStep;
          const separatorHeight = segmentEntries.length > 0 ? separatorGap : 0;
          const projectedHeight = contentHeightUsed + separatorHeight + entryHeight;

          if (projectedHeight > maxContentHeight && segmentEntries.length > 0) {
            break;
          }

          // Always render at least one entry to avoid infinite loops on constrained space.
          segmentEntries.push({ isHeading: entry.isHeading, lines, lineStep });
          contentHeightUsed = projectedHeight;
          entryIndex += 1;

          if (projectedHeight > maxContentHeight) {
            break;
          }
        }

        const contentHeight = Math.max(10, contentHeightUsed);
        const cardHeight = Math.max(
          minCardHeight,
          Math.min(availableHeight, cardTopPadding + contentHeight + cardBottomPadding)
        );
        const cardTop = y;
        const cardBottom = cardTop + cardHeight;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(223, 227, 235);
        doc.roundedRect(margin, cardTop, contentWidth, cardHeight, 2, 2, "FD");

        let cursorY = cardTop + cardTopPadding;

        segmentEntries.forEach((lineData, lineDataIndex) => {
          if (lineDataIndex > 0) {
            doc.setDrawColor(239, 241, 245);
            doc.line(margin + 2, cursorY - 1.4, pageWidth - margin - 2, cursorY - 1.4);
            cursorY += separatorGap;
          }

          if (lineData.isHeading) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(95, 80, 25);
            doc.setFontSize(8.2);
            doc.text(lineData.lines[0].toUpperCase(), margin + 3, cursorY);
          } else {
            doc.setDrawColor(130, 136, 149);
            doc.rect(margin + 3, cursorY - 2.8, 3.2, 3.2);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(33, 37, 45);
            doc.setFontSize(8.8);
            doc.text(lineData.lines[0], margin + 8, cursorY);
          }

          cursorY += lineData.lineStep;

          for (let i = 1; i < lineData.lines.length; i += 1) {
            doc.text(lineData.lines[i], lineData.isHeading ? margin + 3 : margin + 8, cursorY);
            cursorY += lineData.lineStep;
          }
        });

        y = cardBottom + 4;
        isFirstSegment = false;

        if (entryIndex < entries.length) {
          // Continue remaining menu items on the next page.
          startNewPage();
        }
      }
    };

    addHeader();

    addSectionTitle("Party Details");
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(223, 227, 235);
    doc.roundedRect(margin, y, contentWidth, 36, 2, 2, "FD");
    y += 6;
    addGridRow("Name", displayData.customer_name, "Party Date", formatDateDDMMYYYY(displayData.party_date));
    addGridRow("Party Start Time", formatTime(displayData.party_time), "Party End Time", formatTime(displayData.party_end_time));
    addGridRow("Venue", displayData.venue_type, "Food Type", displayData.food_type);
    addGridRow("Spicy Level", displayData.spicy_level, "Occasion", displayData.occasion);
    y += 1.5;

    addSectionTitle("Food Timing & DJ Details");
    const djEnabledForKitchenPdf = isYesValue(displayData.dj_required);
    const kitchenTimingRows: Array<[string, unknown, string, unknown]> = [
      ["Starter Required", displayData.starter_required, "Starter Time", formatTime(displayData.starter_time)],
      ["Maincourse Required", displayData.maincourse_required, "Maincourse Time", formatTime(displayData.maincourse_time)],
      ["DJ Required", formatValue(displayData.dj_required), djEnabledForKitchenPdf ? "DJ Jockey" : "", djEnabledForKitchenPdf ? formatValue(displayData.jockey_required) : ""],
    ];

    if (djEnabledForKitchenPdf) {
      kitchenTimingRows.push(["DJ Time", formatTime(displayData.dj_time), "", ""]);
    }

    const timingCardHeight = 6 + kitchenTimingRows.length * 7.4;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(223, 227, 235);
    doc.roundedRect(margin, y, contentWidth, timingCardHeight, 2, 2, "FD");
    y += 6;
    kitchenTimingRows.forEach(([leftLabel, leftValue, rightLabel, rightValue]) => {
      addGridRow(leftLabel, leftValue, rightLabel, rightValue);
    });
    y += 1.5;

    addMenuChecklist();

    ensureSpace(31);
    addSectionTitle("Other Details");
    const notes = displayData.other_details ? doc.splitTextToSize(displayData.other_details, contentWidth - 8) : ["No additional notes"];
    const notesLines = (Array.isArray(notes) ? notes : [String(notes)]).slice(0, 4);
    const notesHeight = 20;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(223, 227, 235);
    doc.roundedRect(margin, y, contentWidth, notesHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(33, 37, 45);
    doc.setFontSize(8.9);
    doc.text(notesLines, margin + 4, y + 6);

    drawFooter();

    const safeName = formatValue(displayData.customer_name).replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeDate = formatValue(displayData.party_date).replace(/[^0-9-]/g, "");
    doc.save(`kitchen_detail_${safeName}_${safeDate || "details"}.pdf`);
  };

  const renderField = (label: string, field: keyof Booking, type: string = "text", options?: string[]) => {
    const value = displayData[field];

    // Special handling for G. Amount - always read-only
    if (field === "billing_g_amount") {
      return (
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
          <p className="text-sm font-semibold text-[#f4d986]">
            {displayData.billing_g_amount === 0 ? "" : displayData.billing_g_amount}
          </p>
        </div>
      );
    }

    // Special handling for Net Due Amount - always read-only
    if (field === "billing_due_amount") {
      return (
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
          <p className="text-sm font-semibold text-[#f4d986]">
            {displayData.billing_due_amount === 0 ? "" : displayData.billing_due_amount}
          </p>
        </div>
      );
    }

    if (isEditing && editData) {
      if (type === "textarea") {
        return (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
            <textarea
              value={editData[field] as string}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
              rows={3}
            />
          </div>
        );
      }

      if (type === "select" && options) {
        const rawSelectValue = editData[field] as unknown;
        const normalizedSelectValue =
          field === "starter_required" ||
          field === "maincourse_required" ||
          field === "dj_required" ||
          field === "jockey_required"
            ? (isYesValue(rawSelectValue) ? "Yes" : "No")
            : String(rawSelectValue ?? "");

        return (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
            <select
              value={normalizedSelectValue}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      }

      if (type === "time") {
        if (field === "dj_time") {
          const currentDjRequired = isEditing && editData ? editData.dj_required : displayData.dj_required;
          if (!isYesValue(currentDjRequired)) {
            return (
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">DJ Time</p>
                <p className="text-sm font-semibold text-[#efe6cf]">N/A</p>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1 col-span-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">DJ Timing (From - To)</p>
              <TimeRangePicker
                id="dj_time"
                value={editData.dj_time}
                onChange={(v) => handleChange("dj_time", v)}
              />
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
            <TimePicker
              id={field}
              value={editData[field] as string || ""}
              onChange={(v) => handleChange(field, v)}
            />
          </div>
        );
      }

      return (
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
          <input
            type={type}
            max={field === "date_of_birth" || field === "anniversary" ? today : undefined}
            inputMode={field === "phone" ? "numeric" : undefined}
            pattern={field === "phone" ? "[0-9]{10}" : undefined}
            maxLength={field === "phone" ? 10 : undefined}
            minLength={field === "phone" ? 10 : undefined}
            title={field === "phone" ? "Please enter a 10-digit phone number" : undefined}
            value={(editData[field] ?? "") as string | number}
            onChange={(e) =>
              handleChange(
                field,
                type === "number" ? Number(e.target.value) : e.target.value
              )
            }
            className={`w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]${type === "date" ? " date-time-icon-glow" : ""}`}
          />
        </div>
      );
    }

    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
        <p className="text-sm font-semibold text-[#efe6cf]">
          {type === "time"
            ? (field === "dj_time" && !isYesValue(displayData.dj_required) ? "N/A" : formatTime(value))
            : formatValue(value)}
        </p>
      </div>
    );
  };

  const currentDjRequired = isEditing && editData ? editData.dj_required : displayData.dj_required;
  const isDjEnabled = isYesValue(currentDjRequired);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl md:max-w-4xl overflow-y-auto rounded-2xl border border-[#D4AF3730] bg-[#080808] p-4 md:p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-4xl font-semibold text-[#D4AF37]">
            {isEditing ? "Edit Booking" : "Booking Details"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-3xl font-bold text-white/55 transition hover:text-[#D4AF37]"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {/* Customer Information */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Customer Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3 md:p-4">
              {renderField("Name", "customer_name")}
              {renderField("Phone", "phone")}
              {renderField("Date Of Birth", "date_of_birth", "date")}
              {renderField("Anniversary", "anniversary", "date")}
            </div>
          </div>

          {/* Party Details */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Party Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3 md:p-4">
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">Booked At (IST)</p>
                <p className="text-sm font-semibold text-[#f4d986]">
                  {formatBookedAtIndia(displayData.created_at)}
                </p>
              </div>
              {renderField("Party Date", "party_date", "date")}
              {renderField("Party Time", "party_time", "time")}
              {renderField("Party End Time", "party_end_time", "time")}
              {renderField("Guests", "guests", "number")}
              {renderField("Jain Members", "jain_members", "number")}
              {renderField("Package Type", "package_type", "select", [
                "Snack Attack",
                "Social Luxe Experience",
                "Grand Affair",
                "Kitty",
              ])}
              {renderField("Venue Type", "venue_type", "select", [
                "Club",
                "Cafe",
                "Rooftop",
                "PDR - 1",
                "PDR - 2",
              ])}
              {renderField("Food Type", "food_type", "select", [
                "Jain Food",
                "Regular Food",
                "Brahmin Food",
              ])}
              {renderField("Occasion", "occasion", "select", [
                "Birthday",
                "Anniversary",
                "Get Together",
                "Freshers Party",
              ])}
              {renderField("Spicy Level", "spicy_level", "select", [
                "Spicy",
                "Medium Spicy",
                "Less Spicy",
              ])}
            </div>
          </div>

          {/* Food Timing */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Food Timing</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3 md:p-4">
              {renderField("Starter Required", "starter_required", "select", ["Yes", "No"])}
              {renderField("Starter Time", "starter_time", "time")}
              {renderField("Maincourse Required", "maincourse_required", "select", ["Yes", "No"])}
              {renderField("Maincourse Time", "maincourse_time", "time")}
            </div>
          </div>

          {/* Menu Selection */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Menu Selection</h3>
            <div className="rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3 md:p-4">
              {isEditing && editData ? (
                <div className="space-y-3">
                  <div className="flex flex-nowrap items-center gap-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {MENU_CATEGORY_LABELS.map((category) => {
                      const isActive = selectedMenuCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedMenuCategory(category)}
                          className={`shrink-0 text-sm font-semibold transition ${
                            isActive
                              ? "text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.45)]"
                              : "text-[#D4AF37CC] hover:text-[#D4AF37]"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid max-h-[220px] grid-cols-[repeat(auto-fit,minmax(140px,1fr))] content-start gap-2 overflow-y-auto p-1 pr-2 [scrollbar-width:thin]">
                    {selectedCategoryItems.map((item) => {
                      const isSelected = selectedMenuItems.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleMenuItemSelection(item)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? "border-[#D4AF37] bg-[#D4AF371A] text-[#F0D981] shadow-[0_0_16px_rgba(212,175,55,0.24)]"
                              : "border-white/10 bg-[#111111] text-white/80 hover:border-[#D4AF3760] hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {selectedMenuItems.length > 0 ? (
                    <div className="rounded-xl border border-[#D4AF3738] bg-[#D4AF3714] px-3 py-2 text-sm text-[#f3df9f]">
                      {showAllSelectedMenuItems ? (
                        <div>
                          <div className="mb-2 font-medium text-[#f3df9f]">Selected Items</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedMenuItems.map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-2 rounded-full border border-[#D4AF3760] bg-[#111111] px-3 py-1 text-xs text-[#f3df9f]"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeSelectedMenuItem(item)}
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
                            onClick={() => setShowAllSelectedMenuItems(false)}
                            className="mt-2 text-xs font-medium text-[#D4AF37] hover:text-[#f7e4a8]"
                          >
                            Show less
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span>Selected: {previewSelectedMenuItems}</span>
                          {hiddenSelectedMenuCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => setShowAllSelectedMenuItems(true)}
                              className="ml-2 text-xs font-medium text-[#D4AF37] hover:text-[#f7e4a8]"
                            >
                              (+{hiddenSelectedMenuCount} more)
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-white/60">No menu items selected yet.</p>
                  )}
                </div>
              ) : menuItemsText ? (
                <p className="text-sm font-semibold text-[#efe6cf]">{menuItemsText}</p>
              ) : (
                <p className="text-sm font-semibold text-[#efe6cf]">N/A</p>
              )}
            </div>
          </div>

          {/* DJ Details */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">DJ Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3 md:p-4">
              {renderField("DJ Required", "dj_required", "select", ["Yes", "No"])}
              {isDjEnabled ? renderField("DJ Jockey", "jockey_required", "select", ["Yes", "No"]) : null}
              {isDjEnabled ? (
                <div className="col-span-2 md:col-span-4">
                  {renderField("DJ Time", "dj_time", "time")}
                </div>
              ) : null}
            </div>
          </div>

          {/* Billing Details */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Billing Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 overflow-hidden rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3 md:p-4">
              {renderField("PAX", "billing_pax", "number")}
              {renderField("DJ", "billing_dj", "number")}
              {renderField("Decor", "billing_decor", "number")}

              {/* GST with calculated amount */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-white/60">GST (%)</p>
                <div>
                  {isEditing && editData ? (
                    <input
                      type="number"
                      value={editData.billing_gst === 0 ? "" : editData.billing_gst}
                      onChange={(e) => handleChange("billing_gst", e.target.value ? Number(e.target.value) : 0)}
                      className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#efe6cf]">
                      {displayData.billing_gst === 0 ? "" : displayData.billing_gst}
                    </p>
                  )}
                </div>
              </div>

              {renderField("G. Amount", "billing_g_amount", "number")}
              {renderField("Advance", "billing_advance", "number")}
              {renderField("Payment Mode", "payment_mode", "select", ["Q5", "Q7", "cash", "card", "upi"])}
              {renderField("Net Due Amount", "billing_due_amount", "number")}
              <div className="col-span-2 md:col-span-4">
                {renderField("Payment Notes", "payment_note", "textarea")}
              </div>
              <div className="col-span-2 md:col-span-4">
                {renderField("Total Amount", "billing_total_amount", "number")}
              </div>
            </div>
          </div>

          {/* Other Details */}
          {(isEditing || (displayData.other_details && displayData.other_details !== "")) && (
            <div>
              <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Other Details</h3>
              <div className="rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3 md:p-4">
                {renderField("Other Details", "other_details", "textarea")}
              </div>
            </div>
          )}

          <div className="flex w-full items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div aria-hidden="true" className="flex-1" />
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-white/15 bg-[#141414] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#f4d986]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#f2d57b] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_20px_rgba(212,175,55,0.35)] transition hover:scale-[1.02] disabled:opacity-70"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowPdfMenu(!showPdfMenu)}
                        className={`rounded-lg border border-white/15 bg-[#141414] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#f4d986] flex items-center gap-1.5 ${showPdfMenu ? "border-[#D4AF37] text-[#f4d986]" : ""}`}
                    >
                        PDF
                        <ChevronUp className={`h-4 w-4 transition-transform duration-300 ${showPdfMenu ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                        {showPdfMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="absolute bottom-full left-1/2 mb-3 w-[150px] -translate-x-1/2 overflow-hidden rounded-xl border border-[#D4AF3744] bg-[#0c0c0c] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-md"
                                style={{ zIndex: 100 }}
                            >
                                <motion.button
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    onClick={() => {
                                        handleDownloadPdf();
                                        setShowPdfMenu(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-white/90 transition hover:bg-[#D4AF3722] hover:text-[#D4AF37]"
                                >
                                    <FileText className="h-4 w-4" />
                                    Customer Detail
                                </motion.button>
                                <div className="mx-1 my-1 border-t border-white/10" />
                                <motion.button
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    onClick={() => {
                                        handleDownloadKitchenPdf();
                                        setShowPdfMenu(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-white/90 transition hover:bg-[#D4AF3722] hover:text-[#D4AF37]"
                                >
                                    <FileText className="h-4 w-4" />
                                    Kitchen Detail
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                  <button
                    type="button"
                    onClick={handleProtectedDelete}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={handleProtectedEdit}
                    className="rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#f2d57b] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_20px_rgba(212,175,55,0.35)] transition hover:scale-[1.02]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-white/15 bg-[#141414] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#f4d986]"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D4AF3730] bg-[#080808] p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.65)] animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-display text-3xl font-semibold text-[#D4AF37]">Edit Verification</h3>
                <p className="mt-1 text-sm text-white/70">Password verification required for edit/delete</p>
              </div>
              <img
                src="/mox-vox-logo.svg"
                alt="Mox Vox"
                className="h-16 w-16 flex-shrink-0"
              />
            </div>

            <div className="mt-4 space-y-3">
              <p className="rounded-lg border border-[#D4AF3730] bg-[#111111] px-3 py-2 text-xs text-white/70">
                Enter the edit/delete password to continue.
              </p>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-white/60">Password</p>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 pr-10 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {verifyError ? <p className="text-sm text-red-400">{verifyError}</p> : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeVerificationModal}
                className="rounded-lg border border-white/15 bg-[#141414] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#f4d986]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyAdmin}
                disabled={isVerifying}
                className="rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#f2d57b] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_20px_rgba(212,175,55,0.35)] transition hover:scale-[1.02] disabled:opacity-70"
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
