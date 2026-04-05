import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Eye, EyeOff, FileText, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Booking } from "@/types/booking";
import { TimePicker } from "./TimePicker";
import { TimeRangePicker } from "./TimeRangePicker";
import { convertTo12Hour, combineTo12HourRange, parse12HourRange } from "@/lib/timeUtils";

type BookingDetailsModalProps = {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (booking: Booking) => Promise<void>;
  onUpdate?: (booking: Booking) => Promise<boolean>;
};

export default function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
}: BookingDetailsModalProps) {
  const ADMIN_VERIFIED_KEY = "adminVerified";
  const ADMIN_VERIFIED_AT_KEY = "verifiedAt";
  const VERIFICATION_TTL_MS = 5 * 60 * 1000;

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Booking | null>(null);
  const [menuItemsInput, setMenuItemsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<"edit" | "delete" | null>(null);
  const [verificationMode, setVerificationMode] = useState<"verify" | "change-password">("verify");
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);

  const clearVerification = () => {
    setIsVerified(false);
    sessionStorage.removeItem(ADMIN_VERIFIED_KEY);
    sessionStorage.removeItem(ADMIN_VERIFIED_AT_KEY);
  };

  const syncVerificationFromSession = () => {
    const verified = sessionStorage.getItem(ADMIN_VERIFIED_KEY) === "true";
    const verifiedAt = Number(sessionStorage.getItem(ADMIN_VERIFIED_AT_KEY) || "0");

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
  };

  const openVerificationModal = (action: "edit" | "delete") => {
    setPendingAction(action);
    setVerifyError("");
    setVerifySuccess("");
    setVerifyPassword("");
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setVerificationMode("verify");
    setIsVerificationModalOpen(true);
  };

  // Reset to view mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setEditData(null);
      setMenuItemsInput("");
      setShowPdfMenu(false);
      syncVerificationFromSession();
    } else {
      // Clear verification when modal closes
      clearVerification();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const intervalId = window.setInterval(() => {
      syncVerificationFromSession();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setEditData(booking);
    const initialMenuText = Array.isArray(booking?.menu_items)
      ? booking.menu_items.filter(Boolean).join(", ")
      : typeof booking?.menu_items === "string"
        ? booking.menu_items
        : "";
    setMenuItemsInput(initialMenuText);
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
      const parsedMenuItems = menuItemsInput
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

      await onUpdate({
        ...editData,
        menu_items: parsedMenuItems,
      });
      setIsEditing(false);
      setMenuItemsInput("");
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
    setMenuItemsInput("");
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
    setVerifySuccess("");
    setVerifyPassword("");
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setVerificationMode("verify");
    setShowPassword(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleVerifyAdmin = async () => {
    if (!verifyEmail || !verifyPassword) {
      setVerifyError("Please enter email and password.");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");
    setVerifySuccess("");

    try {
      const response = await fetch("/api/verify-admin-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verifyEmail,
          password: verifyPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        setVerifyError("Invalid edit credentials.");
        return;
      }

      setIsVerified(true);
      sessionStorage.setItem(ADMIN_VERIFIED_KEY, "true");
      sessionStorage.setItem(ADMIN_VERIFIED_AT_KEY, String(Date.now()));
      setIsVerificationModalOpen(false);
      setVerifyPassword("");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      runPendingAction();
      setPendingAction(null);
    } catch {
      setVerifyError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangeAdminPassword = async () => {
    if (!verifyEmail || !oldPassword || !newPassword || !confirmNewPassword) {
      setVerifyError("Please enter email, old password, and new password.");
      return;
    }

    if (newPassword.length < 4) {
      setVerifyError("New password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setVerifyError("New password and confirm password do not match.");
      return;
    }

    setIsChangingPassword(true);
    setVerifyError("");
    setVerifySuccess("");

    try {
      const response = await fetch("/api/change-admin-edit-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: verifyEmail,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        setVerifyError(result?.error || "Unable to change password.");
        return;
      }

      // Old password has been validated, so this admin session is trusted.
      setIsVerified(true);
      sessionStorage.setItem(ADMIN_VERIFIED_KEY, "true");
      sessionStorage.setItem(ADMIN_VERIFIED_AT_KEY, String(Date.now()));

      setVerifySuccess("Password changed successfully.");
      setVerifyPassword(newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsVerificationModalOpen(false);

      runPendingAction();
      setPendingAction(null);
    } catch {
      setVerifyError("Change password failed. Please try again.");
    } finally {
      setIsChangingPassword(false);
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

  const menuItemsText = Array.isArray(displayData.menu_items)
    ? displayData.menu_items.filter(Boolean).join(", ")
    : typeof displayData.menu_items === "string"
      ? displayData.menu_items
      : "";

  const formatTime = (time: unknown) => {
    const timeStr = String(time || "");
    if (timeStr.includes(" AM") || timeStr.includes(" PM")) return timeStr;
    return convertTo12Hour(timeStr);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const labelWidth = 44;
    const valueWidth = contentWidth - labelWidth - 2;
    let y = 16;

    const ensureSpace = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - margin) {
        doc.addPage();
        y = 16;
      }
    };

    const addPageHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("Booking Details", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 4;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    const addSection = (title: string, rows: Array<[string, unknown]>) => {
      const rowHeights = rows.map(([_, value]) => {
        const wrapped = doc.splitTextToSize(formatValue(value), valueWidth);
        const lineCount = Array.isArray(wrapped) ? wrapped.length : 1;
        return Math.max(6, lineCount * 5 + 1);
      });
      const sectionHeight = 8 + rowHeights.reduce((sum, h) => sum + h, 0) + 3;

      ensureSpace(sectionHeight);

      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, contentWidth, sectionHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin + 3, y + 5.5);

      let rowY = y + 9;
      rows.forEach(([label, value], index) => {
        const formattedValue = formatValue(value);
        const wrappedValue = doc.splitTextToSize(formattedValue, valueWidth);
        const rowHeight = rowHeights[index];

        if (index > 0) {
          doc.setDrawColor(225, 225, 225);
          doc.line(margin + 2, rowY, pageWidth - margin - 2, rowY);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(label, margin + 3, rowY + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.text(wrappedValue, margin + labelWidth, rowY + 4.5);

        rowY += rowHeight;
      });

      y += sectionHeight + 4;
    };

    const baseAmount = displayData.billing_pax * displayData.guests + displayData.billing_dj + displayData.billing_decor;

    addPageHeader();
    addSection("Customer & Party", [
      ["Name", displayData.customer_name],
      ["Phone", displayData.phone],
      ["Date Of Birth", displayData.date_of_birth],
      ["Anniversary", displayData.anniversary],
      ["Booking Date", new Date(displayData.created_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })],
      ["Party Date", displayData.party_date],
      ["Party Time", formatTime(displayData.party_time)],
      ["Guests", displayData.guests],
      ["Package", displayData.package_type],
      ["Venue", displayData.venue_type],
      ["Occasion", displayData.occasion],
      ["Food Type", displayData.food_type],
      ["Spicy Level", displayData.spicy_level],
    ]);

    addSection("Timing & DJ", [
      ["Starter Time", formatTime(displayData.starter_time)],
      ["Maincourse Time", formatTime(displayData.maincourse_time)],
      ["DJ Required", displayData.dj_required],
      ["Jockey", displayData.jockey_required],
      ["DJ Time", formatTime(displayData.dj_time)],
    ]);

    addSection("Menu Selection", [["Selected Items", menuItemsText || "N/A"]]);

    addSection("Billing Summary", [
      ["PAX Rate", `Rs. ${displayData.billing_pax}`],
      ["Guests", displayData.guests],
      ["Base Amount", `Rs. ${baseAmount.toFixed(2)}`],
      ["DJ", `Rs. ${displayData.billing_dj}`],
      ["Decor", `Rs. ${displayData.billing_decor}`],
      ["GST (%)", displayData.billing_gst],
      ["G. Amount", `Rs. ${displayData.billing_g_amount}`],
      ["Advance", `Rs. ${displayData.billing_advance}`],
      ["Payment Mode", displayData.payment_mode || "N/A"],
      ["Net Due", `Rs. ${displayData.billing_due_amount}`],
    ]);

    addSection("Notes", [["Other Details", displayData.other_details]]);

    const safeName = formatValue(displayData.customer_name).replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeDate = formatValue(displayData.party_date).replace(/[^0-9-]/g, "");
    doc.save(`booking_customer_${safeName}_${safeDate || "details"}.pdf`);
  };

  const handleDownloadKitchenPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const labelWidth = 44;
    const valueWidth = contentWidth - labelWidth - 2;
    let y = 16;

    const ensureSpace = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - margin) {
        doc.addPage();
        y = 16;
      }
    };

    const addPageHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("Kitchen Detail", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 4;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    const addSection = (title: string, rows: Array<[string, unknown]>) => {
      const rowHeights = rows.map(([_, value]) => {
        const wrapped = doc.splitTextToSize(formatValue(value), valueWidth);
        const lineCount = Array.isArray(wrapped) ? wrapped.length : 1;
        return Math.max(6, lineCount * 5 + 1);
      });
      const sectionHeight = 8 + rowHeights.reduce((sum, h) => sum + h, 0) + 3;

      ensureSpace(sectionHeight);

      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, contentWidth, sectionHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin + 3, y + 5.5);

      let rowY = y + 9;
      rows.forEach(([label, value], index) => {
        const formattedValue = formatValue(value);
        const wrappedValue = doc.splitTextToSize(formattedValue, valueWidth);
        const rowHeight = rowHeights[index];

        if (index > 0) {
          doc.setDrawColor(225, 225, 225);
          doc.line(margin + 2, rowY, pageWidth - margin - 2, rowY);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(label, margin + 3, rowY + 4.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.text(wrappedValue, margin + labelWidth, rowY + 4.5);

        rowY += rowHeight;
      });

      y += sectionHeight + 4;
    };

    addPageHeader();
    addSection("Booking Details", [
      ["Customer Name", displayData.customer_name],
      ["Party Date", displayData.party_date],
      ["Party Time", formatTime(displayData.party_time)],
      ["Member (Guests)", displayData.guests],
      ["Venue Type", displayData.venue_type],
    ]);

    addSection("Kitchen Preparation", [
      ["Food Type", displayData.food_type],
      ["Spicy Level", displayData.spicy_level],
      ["Starter Time", formatTime(displayData.starter_time)],
      ["Maincourse Time", formatTime(displayData.maincourse_time)],
    ]);

    addSection("DJ & Service", [
      ["DJ Required", displayData.dj_required],
      ["DJ Time", formatTime(displayData.dj_time)],
    ]);

    addSection("Menu Items", [["Selected Menu", menuItemsText || "N/A"]]);

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
        return (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
            <select
              value={editData[field] as string}
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
            inputMode={field === "phone" ? "numeric" : undefined}
            pattern={field === "phone" ? "[0-9]{10}" : undefined}
            maxLength={field === "phone" ? 10 : undefined}
            minLength={field === "phone" ? 10 : undefined}
            title={field === "phone" ? "Please enter a 10-digit phone number" : undefined}
            value={editData[field] as string | number}
            onChange={(e) =>
              handleChange(
                field,
                type === "number" ? Number(e.target.value) : e.target.value
              )
            }
            className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
          />
        </div>
      );
    }

    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">{label}</p>
        <p className="text-sm font-semibold text-[#efe6cf]">
          {type === "time" ? formatTime(value) : (value === null || value === undefined || value === "" ? "N/A" : String(value))}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#D4AF3730] bg-[#080808] p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
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
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3">
              {renderField("Name", "customer_name")}
              {renderField("Phone", "phone")}
              {renderField("Date Of Birth", "date_of_birth", "date")}
              {renderField("Anniversary", "anniversary", "date")}
            </div>
          </div>

          {/* Party Details */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Party Details</h3>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3">
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">Booking Date</p>
                <p className="text-sm font-semibold text-[#f4d986]">
                  {new Date(displayData.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
              {renderField("Party Date", "party_date", "date")}
              {renderField("Party Time", "party_time", "time")}
              {renderField("Guests", "guests", "number")}
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
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3">
              {renderField("Starter Time", "starter_time", "time")}
              {renderField("Maincourse Time", "maincourse_time", "time")}
            </div>
          </div>

          {/* Menu Selection */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Menu Selection</h3>
            <div className="rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3">
              {isEditing && editData ? (
                <textarea
                  value={menuItemsInput}
                  onChange={(e) => setMenuItemsInput(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
                  rows={3}
                  placeholder="Enter menu items separated by commas or new lines"
                />
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
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3">
              {renderField("DJ Required", "dj_required", "select", ["Yes", "No"])}
              {renderField("Jockey", "jockey_required", "select", ["Yes", "No"])}
              <div className="col-span-2">
                {renderField("DJ Time", "dj_time", "time")}
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div>
            <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Billing Details</h3>
            <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3">
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
            </div>
          </div>

          {/* Other Details */}
          {(displayData.other_details && displayData.other_details !== "") && (
            <div>
              <h3 className="mb-2 font-display text-3xl text-[#D4AF37]">Other Details</h3>
              <div className="rounded-lg border border-[#D4AF3726] bg-[rgba(255,255,255,0.03)] p-3">
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
                <p className="mt-1 text-sm text-white/70">Admin edit login required for edit/delete</p>
              </div>
              <img
                src="/mox-vox-logo.svg"
                alt="Mox Vox"
                className="h-16 w-16 flex-shrink-0"
              />
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#111111] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationMode("verify");
                    setVerifyError("");
                    setVerifySuccess("");
                  }}
                  className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                    verificationMode === "verify"
                      ? "bg-[#D4AF37] text-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationMode("change-password");
                    setVerifyError("");
                    setVerifySuccess("");
                  }}
                  className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                    verificationMode === "change-password"
                      ? "bg-[#D4AF37] text-black"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Change Password
                </button>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-white/60">Email</p>
                <input
                  type="email"
                  value={verifyEmail}
                  onChange={(e) => setVerifyEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
                  autoComplete="off"
                  placeholder=""
                />
              </div>

              {verificationMode === "verify" ? (
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
              ) : (
                <>
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-white/60">Old Password</p>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 pr-10 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-white/60">New Password</p>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 pr-10 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-white/60">Confirm New Password</p>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#111111] px-3 py-2 pr-10 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF3730]"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {verifyError ? <p className="text-sm text-red-400">{verifyError}</p> : null}
              {verifySuccess ? <p className="text-sm text-emerald-400">{verifySuccess}</p> : null}
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
                onClick={verificationMode === "verify" ? handleVerifyAdmin : handleChangeAdminPassword}
                disabled={isVerifying || isChangingPassword}
                className="rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#f2d57b] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_20px_rgba(212,175,55,0.35)] transition hover:scale-[1.02] disabled:opacity-70"
              >
                {verificationMode === "verify"
                  ? (isVerifying ? "Verifying..." : "Verify")
                  : (isChangingPassword ? "Changing..." : "Change Password")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
