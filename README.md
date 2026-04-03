🍽️ MOX VOX – Premium Rooftop Restaurant & Nightlife Website

Official website for MOX VOX, a premium pure vegetarian rooftop restaurant & nightlife destination located in Jodhpur, Rajasthan.

This project showcases MOX VOX’s brand identity, ambience, menu, party packages, guest testimonials, and booking options with a modern, luxury-focused UI.

🌟 Features

🎶 Luxury Rooftop Nightlife Experience showcase

🥗 Pure Vegetarian Menu with clear pricing & disclaimer

🎉 Party & Celebration Packages (Birthday, Corporate, Family, Groups)

⭐ Guest Testimonials Section (curated real reviews)

📸 Gallery Section with premium ambience visuals

📞 Quick Actions

Call Now

WhatsApp Booking

Zomato Order

Swiggy Dineout Reservation

🕒 Opening Hours Display

📍 Google Maps Location Embed

📱 Fully Responsive (Desktop & Mobile Optimized)

🛠️ Tech Stack

React + TypeScript

Vite

CSS (Custom styling)

SVG Assets for logos & icons

Netlify / Vercel Ready

Note: The current admin login and WhatsApp API flows use server routes (`/api/*`) wired through the runtime server.
Do not deploy as static files only. Deploy with a Node/server runtime that serves these API endpoints.

## Cloudflare Deployment

This repository now includes Cloudflare Pages Functions under `functions/api/*` for:

- `/api/verify-admin`
- `/api/change-admin-password`
- `/api/verify-admin-edit`
- `/api/change-admin-edit-password`
- `/api/verify-admin-session`
- `/api/logout-admin`
- `/api/send-whatsapp`

### Required Cloudflare environment variables

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_EDIT_EMAIL`
- `ADMIN_EDIT_PASSWORD`
- `ADMIN_SESSION_SECRET` (recommended)
- `GREENTICK_API_KEY`
- `GREENTICK_API_URL`
- `WHATSAPP_FROM_NUMBER`
- `WHATSAPP_TEMPLATE_NAME`
- `TERMS_LINK`

### Optional KV binding for password persistence

For change-password endpoints to persist updates in Cloudflare, bind KV namespace:

- Binding name: `AUTH_KV`
- Keys used:
	- `ADMIN_EMAIL`
	- `ADMIN_PASSWORD`
	- `ADMIN_EDIT_EMAIL`
	- `ADMIN_EDIT_PASSWORD`

Without `AUTH_KV`, verify endpoints still work from env vars, but change-password endpoints cannot persist new credentials.

### Quick setup steps (Cloudflare)

1. Create KV namespace in Cloudflare Dashboard:
	- Storage & Databases -> KV -> Create namespace
2. Bind namespace to Pages project:
	- Pages -> Your project -> Settings -> Functions -> KV namespace bindings
	- Binding name: `AUTH_KV`
3. Add all required environment variables in Pages project settings (Production + Preview).
4. Update `wrangler.toml` with KV namespace IDs for local wrangler workflows.
5. (Optional local dev) copy `.dev.vars.example` to `.dev.vars` and fill values.

📂 Project Structure
mox-vox-website/
│
├── public/
│   ├── mox-vox-logo.svg
│   ├── pure_veg.svg
│
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── MenuSection.tsx
│   │   ├── GallerySection.tsx
│   │   ├── PackagesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── BookingSection.tsx
│   │   ├── ContactSection.tsx
│   │   └── Footer.tsx
│   │
│   ├── pages/
│   │   └── Index.tsx
│   │
│   ├── index.css
│   └── main.tsx
│
└── README.md

🚀 Getting Started
1️⃣ Clone the Repository
git clone https://github.com/Aarav5005/mox-vox-website.git

2️⃣ Install Dependencies
npm install

3️⃣ Run Locally
npm run dev


The site will be available at:

http://localhost:5173

🌐 Live Website

🔗 Production URL:
👉 https://mox-vox.online

(Hosted via Netlify with custom domain)

🏷️ Brand Details

Name: MOX VOX

Category: Pure Vegetarian Rooftop Restaurant & Nightlife

Location:
5th Floor, Amrit Kalash, Jodhpur, Rajasthan

Opening Hours:
Open Daily — 11:00 AM to 11:00 PM

📞 Contact & Booking

📱 Phone: +91 9461761555

💬 WhatsApp Booking Available

🍴 Zomato – Order & Delivery

🪑 Swiggy Dineout – Table Reservations

📸 Instagram: @mox_vox

📌 Notes

Prices listed on the menu are subject to change

All food offerings are 100% vegetarian

This project is optimized for performance, SEO, and mobile usability

👨‍💻 Developer

Aarav Panchal
Student, IIT Jodhpur
GitHub: https://github.com/Aarav5005

📄 License

This project is proprietary and developed exclusively for MOX VOX.
All rights reserved © 2024 MOX VOX.
