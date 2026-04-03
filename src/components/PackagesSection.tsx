import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { PartyPopper, Building2, Users, Star } from "lucide-react";

interface PackageItem {
  icon: React.ReactNode;
  title: string;
  price: string;
  type: string;
  minPax: string;
  features: string[];
  note?: string;
  whatsappMessage: string;
}

const packages: PackageItem[] = [
  {
    icon: <PartyPopper className="w-8 h-8" />,
    title: "Snack Attack",
    price: "₹479 + GST",
    type: "per person",
    minPax: "Perfect for quick bites and casual celebrations",
    whatsappMessage: "Hi%2C%20I%E2%80%99m%20interested%20in%20booking%20Snack%20Attack%20package%20at%20Mox%20Vox.%20Please%20share%20details%20and%20availability.",
    features: [
      "Unlimited package",
      "2 Welcome Drinks",
      "3 Starters",
      "1 Special Starter",
      "Ice Cream",
    ],
    note: "Welcome drinks and ice cream served once",
  },
  {
    icon: <Building2 className="w-8 h-8" />,
    title: "Social Luxe Experience",
    price: "₹479 + GST",
    type: "per person",
    minPax: "Ideal for social gatherings and premium experiences",
    whatsappMessage: "Hi%2C%20I%E2%80%99m%20interested%20in%20booking%20Social%20Luxe%20Experience%20at%20Mox%20Vox.%20Kindly%20share%20package%20details.",
    features: [
      "Unlimited package",
      "1 Welcome Drink",
      "1 Choice of Starter",
      "Paneer Preparation",
      "Veg Preparation",
      "Dal Preparation",
      "Rice Preparation",
      "2 Indian Breads",
      "Pickle",
      "Garden Fresh Salad",
      "Mini Khichiya",
      "Ice Cream",
    ],
    note: "Welcome drinks and ice cream served once",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Grand Affair",
    price: "₹479 + GST",
    type: "per person",
    minPax: "Designed for grand celebrations and special occasions",
    whatsappMessage: "Hi%2C%20I%E2%80%99m%20interested%20in%20booking%20Grand%20Affair%20package%20at%20Mox%20Vox.%20Please%20share%20more%20information.",
    features: [
      "Unlimited package",
      "2 Welcome Drinks",
      "2 Soups",
      "2 Starters",
      "2 Special Starters",
      "Paneer Preparation",
      "2 Veg Preparations",
      "Dal Preparation",
      "2 Rice Preparations",
      "3 Indian Breads",
      "Pickle",
      "Garden Fresh Salad",
      "Mini Khichiya",
      "Chutney",
      "Ice Cream",
    ],
    note: "Welcome drinks and ice cream served once",
  },
  {
    icon: <Star className="w-8 h-8" />,
    title: "Special Group Package",
    price: "₹4,999",
    type: "for 10 people",
    minPax: "Great for private group celebrations",
    whatsappMessage: "Hi%2C%20I%E2%80%99m%20interested%20in%20hosting%20a%20group%20celebration%20at%20Mox%20Vox.%20Please%20guide%20me%20with%20the%20details.",
    features: [
      "Fixed package",
      "Welcome Drinks",
      "3 Starters",
      "1 Special Starter",
      "1 Paneer Preparation",
      "1 Veg Preparation",
      "Dal Preparation",
      "Rice Preparation",
      "Indian Breads",
      "Salad",
      "Ice Cream",
    ],
  },
];

const PackagesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="packages" className="section-padding bg-charcoal-dark">
      <div className="container-narrow mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="font-body text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
            Celebrate With Us
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-cream mb-4">
            Party Packages
          </h2>
          <p className="font-body text-cream-muted text-lg max-w-2xl mx-auto">
            Perfectly curated experiences for celebrations at MOX VOX
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.8, delay: 0.1 * index }}
              className="glass-card rounded-lg p-6 sm:p-8 hover:border-gold/30 transition-all duration-300 group cursor-pointer focus-within:ring-2 focus-within:ring-gold/50"
              tabIndex={0}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="text-gold">{pkg.icon}</div>
                <div>
                  <h3 className="font-display text-2xl text-cream mb-1">
                    {pkg.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl text-gold">
                      {pkg.price}
                    </span>
                    <span className="font-body text-sm text-cream-muted">
                      {pkg.type}
                    </span>
                  </div>
                </div>
              </div>

              <p className="font-body text-sm text-gold/80 mb-4">
                {pkg.minPax}
              </p>

              <ul className="space-y-2 mb-6">
                {pkg.features.map((feature, i) => (
                  <li
                    key={i}
                    className="font-body text-sm text-cream/80 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gold/60" />
                    {feature}
                  </li>
                ))}
              </ul>

              {pkg.note && (
                <p className="font-body text-xs text-cream-muted italic border-t border-border pt-4 mb-4">
                  Note: {pkg.note}
                </p>
              )}

              <a
                href={`https://wa.me/919461761555?text=${pkg.whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-6 py-3 gradient-gold text-primary-foreground font-body font-medium text-sm uppercase tracking-widest rounded-sm transition-all duration-300 hover:shadow-gold opacity-0 group-hover:opacity-100 md:group-focus-within:opacity-100 md:group-focus-within:block"
              >
                Book Now
              </a>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-12"
        >
          <a
            href="https://wa.me/919461761555?text=Hi%2C%20I%E2%80%99d%20like%20to%20make%20a%20reservation%20at%20Mox%20Vox.%20Please%20assist%20me."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 gradient-gold text-primary-foreground font-body font-medium text-sm uppercase tracking-widest rounded-sm transition-all duration-300 hover:shadow-gold hover:scale-105"
          >
            Book Party via WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default PackagesSection;
