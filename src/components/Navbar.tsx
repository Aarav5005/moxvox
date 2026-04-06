import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { name: "Home", href: "#" },
  { name: "About", href: "#about" },
  { name: "Menu", href: "#menu" },
  { name: "Packages", href: "#packages" },
  { name: "Gallery", href: "#gallery" },
  { name: "Contact", href: "#contact" },
];

const navbarVariants = {
  resting: {
    y: 0,
    scale: 1,
    borderRadius: 0,
    backgroundColor: "rgba(7, 7, 7, 0.2)",
    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
    backdropFilter: "blur(8px)",
  },
  floating: {
    y: 16,
    scale: 0.985,
    borderRadius: 9999,
    backgroundColor: "rgba(7, 7, 7, 0.58)",
    boxShadow:
      "0 18px 50px rgba(0, 0, 0, 0.46), 0 0 0 1px rgba(246, 227, 169, 0.08), 0 0 36px rgba(217, 119, 6, 0.08)",
    backdropFilter: "blur(24px)",
  },
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.nav
        className="fixed inset-x-0 top-0 z-50 px-0"
        animate={isScrolled ? "floating" : "resting"}
        variants={navbarVariants}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 28,
          mass: 0.9,
        }}
        style={{ transformOrigin: "top center" }}
      >
        <div className="container-narrow mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a href="#" className="flex items-center flex-shrink-0 -ml-1 sm:-ml-2">
              <img 
                src="/mox-vox-logo.svg" 
                alt="Mox Vox Logo" 
                className="h-[42px] sm:h-16 w-auto transition-all duration-300 hover:scale-105" 
                style={{ filter: 'drop-shadow(0 3px 6px rgba(217, 119, 6, 0.25))' }}
              />
            </a>

            {/* Mobile Buttons */}
            <div className="flex md:hidden items-center gap-2 ml-auto pr-1">
              <a
                href="tel:+919461761555"
                className="px-4 py-2 gradient-gold text-primary-foreground font-body text-xs uppercase tracking-wider rounded-sm transition-all duration-300 hover:shadow-gold whitespace-nowrap"
              >
                Call Now
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 items-center justify-center px-8">
              <div className="flex items-center gap-6 lg:gap-10">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="font-body text-[0.76rem] uppercase tracking-[0.28em] text-cream/72 border-b border-transparent hover:text-cream hover:border-gold transition-all duration-300 py-2"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <a
                href="tel:+919461761555"
                className="px-6 py-2.5 gradient-gold text-primary-foreground font-body text-[0.78rem] uppercase tracking-[0.24em] rounded-full border border-white/10 transition-all duration-300 hover:shadow-[0_0_24px_rgba(217,119,6,0.24)] hover:brightness-110 whitespace-nowrap"
              >
                Call Now
              </a>
              <Link
                to="/admin/login"
                className="px-6 py-2.5 gradient-gold text-primary-foreground font-body text-[0.78rem] uppercase tracking-[0.24em] rounded-full border border-white/10 transition-all duration-300 hover:shadow-[0_0_24px_rgba(217,119,6,0.24)] hover:brightness-110 whitespace-nowrap"
              >
                Admin Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-cream p-2 -mr-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-gold/40"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-charcoal-dark/95 backdrop-blur-md pt-24 md:hidden"
          >
            <div className="flex flex-col items-center gap-8 px-6 py-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-display text-2xl text-cream/90 hover:text-gold transition-colors duration-300"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-3 w-full mt-4 px-2">
                <a
                  href="#booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-3 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-[0.22em] rounded-full text-center border border-white/10 transition-all duration-300 hover:shadow-[0_0_24px_rgba(217,119,6,0.22)]"
                >
                  Book Now
                </a>
                <a
                  href="tel:+919461761555"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-3 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-[0.22em] rounded-full text-center border border-white/10 transition-all duration-300 hover:shadow-[0_0_24px_rgba(217,119,6,0.22)]"
                >
                  Call Now
                </a>
                <Link
                  to="/admin/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-3 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-[0.22em] rounded-full text-center border border-white/10 transition-all duration-300 hover:shadow-[0_0_24px_rgba(217,119,6,0.22)]"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
