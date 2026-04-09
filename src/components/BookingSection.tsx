import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UtensilsCrossed, CalendarCheck, MessageCircle } from "lucide-react";

const bookingOptions = [
  {
    icon: <UtensilsCrossed className="w-8 h-8" />,
    name: "Zomato",
    description: "Order & Delivery",
    url: "https://www.zomato.com/jodhpur/mox-vox-the-restro-shastri-nagar",
    highlighted: false,
  },
  {
    icon: <CalendarCheck className="w-8 h-8" />,
    name: "Swiggy Dineout",
    description: "Table Reservation",
    url: "https://www.swiggy.com/restaurants/mox-vox-sardarpura-jodhpur-686562/dineout",
    highlighted: false,
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    name: "WhatsApp",
    description: "Direct Booking",
    url: "https://wa.me/919461761555?text=Hi%2C%20I%E2%80%99d%20like%20to%20make%20a%20reservation%20at%20Mox%20Vox.%20Please%20assist%20me.",
    highlighted: true,
  },
];

const BookingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="booking" className="section-padding bg-charcoal">
      <div className="container-narrow mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="font-body text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
            Reserve Your Table
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-cream mb-4">
            Book Your Experience
          </h2>
          <p className="font-body text-cream-muted text-lg max-w-2xl mx-auto">
            Choose your preferred way to experience MOX VOX
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card rounded-lg p-6 sm:p-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookingOptions.map((option, index) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center text-center p-6 rounded-lg transition-all duration-300 ${
                  option.highlighted
                    ? "glass-button border-gold/50 hover:border-gold"
                    : "glass-button"
                }`}
              >
                <div
                  className={`mb-4 transition-colors duration-300 ${
                    option.highlighted
                      ? "text-gold"
                      : "text-cream-muted group-hover:text-gold"
                  }`}
                >
                  {option.icon}
                </div>
                <h3
                  className={`font-display text-xl mb-1 transition-colors duration-300 ${
                    option.highlighted
                      ? "text-gold"
                      : "text-cream group-hover:text-gold"
                  }`}
                >
                  {option.name}
                </h3>
                <p className="font-body text-sm text-cream-muted">
                  {option.description}
                </p>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BookingSection;
