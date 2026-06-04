import { json, readJson, type RequestContext } from "./_shared";

function formatIndianPhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  if (digits.length > 10) {
    return `91${digits.slice(-10)}`;
  }

  return `91${digits}`;
}

function formatDateToDdmmyyyy(dateValue: string): string {
  const trimmed = String(dateValue || "").trim();

  if (!trimmed || trimmed === "N/A") {
    return "N/A";
  }

  const parts = trimmed.split("-");
  if (parts.length !== 3) {
    return trimmed;
  }

  const [year, month, day] = parts;
  if (!year || !month || !day) {
    return trimmed;
  }

  return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
}

function formatTimeTo12Hour(timeValue: string): string {
  const trimmed = String(timeValue || "").trim();

  if (!trimmed || trimmed === "N/A") {
    return "N/A";
  }

  const upper = trimmed.toUpperCase();
  if (upper.includes("AM") || upper.includes("PM")) {
    return trimmed;
  }

  const parts = trimmed.split(":");
  if (parts.length < 2) {
    return trimmed;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return trimmed;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
}

function formatTimeRangeTo12Hour(startTime: string, endTime: string): string {
  const formattedStart = formatTimeTo12Hour(startTime);
  const formattedEnd = formatTimeTo12Hour(endTime);

  const hasStart = formattedStart !== "N/A";
  const hasEnd = formattedEnd !== "N/A";

  if (hasStart && hasEnd) {
    return `${formattedStart} - ${formattedEnd}`;
  }

  if (hasStart) {
    return formattedStart;
  }

  if (hasEnd) {
    return formattedEnd;
  }

  return "N/A";
}

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const payload = await readJson(context.request);
  const phone = String(payload.phone || "").trim();
  const name = String(payload.name || "Guest");
  const date = formatDateToDdmmyyyy(String(payload.date || "N/A"));
  const partyTime = formatTimeRangeTo12Hour(
    String(payload.party_time || "N/A"),
    String(payload.party_end_time || "N/A")
  );
  const starterTime = formatTimeTo12Hour(String(payload.starter_time || "N/A"));
  const mainCourseTime = formatTimeTo12Hour(String(payload.main_course_time || "N/A"));
  const djTime = formatTimeTo12Hour(String(payload.dj_time || "N/A"));

  if (!phone) {
    return json(400, { success: false, error: "phone is required" });
  }

  const apiKey = String(context.env.GREENTICK_API_KEY || "").trim();
  const apiUrl = String(context.env.GREENTICK_API_URL || "").trim();
  const fromNumber = String(context.env.WHATSAPP_FROM_NUMBER || "").trim();
  const templateName = String(context.env.WHATSAPP_TEMPLATE_NAME || "").trim();
  const menuItems = Array.isArray(payload.menu_items) ? payload.menu_items : [];
  let dynamicLink = String(context.env.TERMS_LINK || "https://www.mox-vox.online/terms.html").trim();
  if (menuItems.length > 0) {
    const encodedItems = encodeURIComponent(menuItems.join("|"));
    dynamicLink = `https://www.mox-vox.online/menu.html?items=${encodedItems}`;
  }

  if (!apiKey || !apiUrl) {
    return json(500, { success: false, error: "Missing GreenTick API configuration." });
  }

  if (!fromNumber || !templateName) {
    return json(500, { success: false, error: "Missing WhatsApp template configuration." });
  }

  const templateParams = [name, date, partyTime, starterTime, mainCourseTime, djTime, dynamicLink];

  const requestBody = {
    from: fromNumber,
    campaignName: "api-test",
    to: `+${formatIndianPhone(phone)}`,
    templateName,
    components: {
      body: {
        params: templateParams,
      },
    },
    type: "template",
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return json(500, {
        success: false,
        error: `WhatsApp Send Failed: Status ${response.status}`,
        details: responseText || "No response body",
      });
    }

    return json(200, { success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "WhatsApp send failed";
    return json(500, { success: false, error: message });
  }
};
details: responseText || "No response body",
      });
    }

return json(200, { success: true });
  } catch (error: unknown) {
  const message = error instanceof Error ? error.message : "WhatsApp send failed";
  return json(500, { success: false, error: message });
}
};
