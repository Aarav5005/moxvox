import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect } from "react";

export default function TnC() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-16 min-h-screen bg-charcoal text-cream-muted font-body">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-gold mb-10 text-center">
            Terms & Conditions
          </h1>
          
          <div className="space-y-6 glass-card p-8 md:p-12 rounded-2xl border border-white/5 bg-[#080808]/50">
            {[
              "Minimum 15 members for food package.",
              "30% booking advance, same day booking cancellation 100% payment.",
              "Advance non refundable.",
              "Age below 5 yr free.",
              "Party Poppers, Cold Fire, Dhol, Bands and Outside Music Player will be not allowed.",
              "Any outdoor food and beverages not allowed in restaurant premises.",
              "Food packing is not allowed from party food.",
              "Once main course started starters will not be served.",
              "Any dish apart from the menu ordered on the spot will be charged as per a-la-carte prices.",
              "Cake spoiling and damages to premises will be charged Rs. 15,000/-.",
              "Outside decoration maintenance charges Rs. 1500/-.",
              "We charge as per head count and not as per plate.",
              "Water bottle will be chargeable on MRP price."
            ].map((rule, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gold/70 text-gold font-display font-medium shrink-0 text-sm">
                  {idx + 1}
                </span>
                <p className="leading-relaxed text-cream/90 mt-1">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
