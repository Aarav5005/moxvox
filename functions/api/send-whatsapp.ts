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

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const payload = await readJson(context.request);
  const phone = String(payload.phone || "").trim();
  const name = String(payload.name || "Guest");
  const date = String(payload.date || "N/A");
  const partyTime = String(payload.party_time || "N/A");
  const starterTime = String(payload.starter_time || "N/A");
  const mainCourseTime = String(payload.main_course_time || "N/A");
  const djTime = String(payload.dj_time || "N/A");

  if (!phone) {
    return json(400, { success: false, error: "phone is required" });
  }

  const apiKey = String(context.env.GREENTICK_API_KEY || "").trim();
  const apiUrl = String(context.env.GREENTICK_API_URL || "").trim();
  const fromNumber = String(context.env.WHATSAPP_FROM_NUMBER || "").trim();
  const templateName = String(context.env.WHATSAPP_TEMPLATE_NAME || "").trim();
  const termsLink = String(context.env.TERMS_LINK || "https://www.mox-vox.online/terms.html").trim();

  if (!apiKey || !apiUrl) {
    return json(500, { success: false, error: "Missing GreenTick API configuration." });
  }

  if (!fromNumber || !templateName) {
    return json(500, { success: false, error: "Missing WhatsApp template configuration." });
  }

  const templateParams = [name, date, partyTime, starterTime, mainCourseTime, djTime, termsLink];

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
