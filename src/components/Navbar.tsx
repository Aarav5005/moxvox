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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-charcoal-dark/95 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-charcoal-dark/20 backdrop-blur-sm"
        } relative`}
      >
        <div className="container-narrow mx-auto pl-4 pr-0 sm:pl-6 sm:pr-0 lg:pl-8 lg:pr-0">
          <div className="flex items-center justify-between h-14 sm:h-18">
            {/* Logo */}
            <a href="#" className="flex items-center">
              <img 
                src="/mox-vox-logo.svg" 
                alt="Mox Vox Logo" 
                className="h-[42px] sm:h-16 w-auto scale-110 sm:scale-[1.15] transition-all duration-300 hover:scale-[1.2] sm:hover:scale-[1.25]" 
                style={{ filter: 'drop-shadow(0 3px 6px rgba(217, 119, 6, 0.25))' }}
              />
            </a>

            {/* Mobile Buttons */}
            <div className="flex md:hidden items-center gap-1 ml-4">
              <a
                href="tel:+919461761555"
                className="px-3 py-1 gradient-gold text-primary-foreground font-body text-xs uppercase tracking-wider rounded-sm transition-all duration-300 hover:shadow-gold"
              >
                Call Now
              </a>
              <Link
                to="/admin/login"
                className="px-3 py-1 gradient-gold text-primary-foreground font-body text-xs uppercase tracking-wider rounded-sm transition-all duration-300 hover:shadow-gold"
              >
                Admin Login
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-1 items-center">
              <div className="flex items-center gap-8 mx-auto">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="font-body text-sm uppercase tracking-wider text-cream/80 hover:text-gold hover:border-b-2 hover:border-gold transition-all duration-300"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2">
              <a
                href="tel:+919461761555"
                className="px-6 py-2 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-wider rounded-sm transition-all duration-300 hover:shadow-gold"
              >
                Call Now
              </a>
              <Link
                to="/admin/login"
                className="px-6 py-2 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-wider rounded-sm transition-all duration-300 hover:shadow-gold"
              >
                Admin Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-cream p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-charcoal-dark pt-20 md:hidden"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-display text-2xl text-cream hover:text-gold transition-colors duration-300"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="#booking"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 px-8 py-3 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-wider rounded-sm"
              >
                Book Now
              </a>
              <a
                href="tel:+919461761555"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 px-8 py-3 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-wider rounded-sm"
              >
                Call Now
              </a>
              <Link
                to="/admin/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 px-8 py-3 gradient-gold text-primary-foreground font-body text-sm uppercase tracking-wider rounded-sm"
              >
                Admin Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
