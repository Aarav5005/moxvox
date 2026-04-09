import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const galleryImages = [
  { src: "/MOX VOX ambience 1.jpg", alt: "MOX VOX ambience 1" },
  { src: "/MOX VOX ambience 2.jpg", alt: "MOX VOX ambience 2" },
  { src: "/MOX VOX ambience 3.jpg", alt: "MOX VOX ambience 3" },
  { src: "/MOX VOX ambience 4.jpg", alt: "MOX VOX ambience 4" },
  { src: "/MOX VOX ambience 5.jpg", alt: "MOX VOX ambience 5" },
  { src: "/MOX VOX ambience 6.jpg", alt: "MOX VOX ambience 6" },
  { src: "/MOX VOX ambience 7.jpg", alt: "MOX VOX ambience 7" },
  { src: "/MOX VOX ambience 8.jpg", alt: "MOX VOX ambience 8" },
];

const GallerySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="gallery" className="section-padding bg-charcoal-dark">
      <div className="container-narrow mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="font-body text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
            Visual Experience
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-cream mb-4">
            The Ambience
          </h2>
          <p className="font-body text-cream-muted text-lg max-w-2xl mx-auto">
            Experience the luxury and vibe of MOX VOX
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={
                isInView
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.95 }
              }
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-charcoal-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
