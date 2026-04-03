let greentickApiKey = "";
let greentickApiUrl = "";
let greentickFromNumber = "";
let greentickTemplateName = "";

export function configureWhatsApp(config: { apiKey?: string; apiUrl?: string; fromNumber?: string; templateName?: string }) {
  greentickApiKey = config.apiKey || "";
  greentickApiUrl = config.apiUrl || "";
  greentickFromNumber = config.fromNumber || "";
  greentickTemplateName = config.templateName || "";

  if (!greentickApiKey || !greentickApiUrl) {
    console.error(
      "[WhatsApp] Missing required env vars: GREENTICK_API_KEY and/or GREENTICK_API_URL in .env"
    );
  }
}

function formatIndianPhone(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    return `91${last10}`;
  }

  return `91${digits}`;
}

export async function sendWhatsApp(phone: string, params: string[]) {
  console.log("\n===================================");
  console.log("[WhatsApp Debug] Checking Environment Variables");
  console.log(`[WhatsApp Debug] GREENTICK_API_URL: ${greentickApiUrl ? greentickApiUrl.substring(0, 30) + "..." : "undefined"}`);
  console.log(`[WhatsApp Debug] GREENTICK_API_KEY: ${greentickApiKey ? greentickApiKey.substring(0, 5) + "..." : "undefined"}`);
  console.log(`[WhatsApp Debug] WHATSAPP_FROM_NUMBER: ${greentickFromNumber}`);
  console.log(`[WhatsApp Debug] WHATSAPP_TEMPLATE_NAME: ${greentickTemplateName}`);

  if (!greentickApiKey || !greentickApiUrl) {
    throw new Error("Missing GreenTick/AOC API key or URL");
  }

  if (!greentickFromNumber || !greentickTemplateName) {
    console.warn("[WhatsApp Debug] Warning: WHATSAPP_FROM_NUMBER or WHATSAPP_TEMPLATE_NAME is missing from .env");
  }

  const to = formatIndianPhone(phone);
  console.log(`[WhatsApp Debug] Formatted phone number: ${to}`);

  // Construct payload specifically for AOC API Template format
  const payload = {
    from: greentickFromNumber || "+910000000000", // Will fail if not provided in .env, but follows format
    campaignName: "api-test",
    to: `+${to}`, 
    templateName: greentickTemplateName || "template_name",
    components: {
      body: {
        params: params
      }
    },
    type: "template"
  };
  
  console.log("[WhatsApp Debug] Payload being sent:", JSON.stringify(payload));
  console.log(`[WhatsApp Debug] Sending request to: ${greentickApiUrl}`);
  console.log("[WhatsApp Debug] Headers:", JSON.stringify({
    apikey: `${greentickApiKey.substring(0, 5)}...`,
    "Content-Type": "application/json",
  }));

  let response: Response;
  try {
    response = await fetch(greentickApiUrl, {
      method: "POST",
      headers: {
        apikey: greentickApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    console.log(`[WhatsApp Debug] Fetch completed. Status: ${response.status} ${response.statusText}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const cause = error instanceof Error ? (error as Error & { cause?: { code?: string; message?: string } }).cause : undefined;
    console.error("[WhatsApp Debug] Fetch failed with exception:", message, cause);
    const causeCode = cause?.code;
    const causeMessage = cause?.message;
    throw new Error(
      ["Network error while calling GreenTick API", message, causeCode, causeMessage]
        .filter(Boolean)
        .join(" | ")
    );
  }

  const responseText = await response.text();
  console.log(`[WhatsApp Debug] Response Body: ${responseText}`);

  let data = {};
  if (responseText) {
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.log(`[WhatsApp Debug] Could not parse response as JSON`);
    }
  }

  if (!response.ok) {
    throw new Error(`WhatsApp Send Failed: Status ${response.status} | Body: ${responseText}`);
  }

  return data;
}
