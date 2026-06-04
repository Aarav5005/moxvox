import { sendWhatsApp, configureWhatsApp } from "./server/sendWhatsApp.ts";
import dotenv from "dotenv";

dotenv.config();

configureWhatsApp({
  apiKey: process.env.GREENTICK_API_KEY,
  apiUrl: process.env.GREENTICK_API_URL,
  fromNumber: process.env.WHATSAPP_FROM_NUMBER,
  templateName: process.env.WHATSAPP_TEMPLATE_NAME,
});

async function run() {
  try {
    const res = await sendWhatsApp("9828460555", [
      "Test Name",
      "01-01-2027",
      "19:00 - 22:00",
      "19:00",
      "20:00",
      "21:00",
      "https://www.mox-vox.online/terms.html",
      "https://is.gd/test12"
    ]);
    console.log("Success:", res);
  } catch (e) {
    console.error("Failed:", e);
  }
}

run();
