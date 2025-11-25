"use client";

import Image from "next/image";

// Brand configuration - add logo paths here when available
// Logo images should be white/transparent PNGs or SVGs placed in public/logos/
const BRANDS = [
  { name: "Zillow", key: "zillow", logoPath: null },
  { name: "Zameen", key: "zameen", logoPath: null },
  { name: "Realtor.com", key: "realtor", logoPath: null },
  { name: "Bayut", key: "bayut", logoPath: null },
  { name: "Property Finder", key: "propertyfinder", logoPath: null },
  { name: "Dubizzle", key: "dubizzle", logoPath: null },
  { name: "Propsearch", key: "propsearch", logoPath: null },
];

export function TrustedBrands() {
  // Duplicate brands for seamless loop
  const duplicatedBrands = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="relative py-12 md:py-16 overflow-hidden border-y border-neutral-800/50 bg-black/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs md:text-sm font-semibold tracking-widest uppercase text-neutral-400 mb-2">
            Trusted by Leading Platforms
          </p>
          <p className="text-sm md:text-base text-neutral-500">
            Seamlessly import from the biggest property listing sites
          </p>
        </div>

        {/* Moving Logo Belt */}
        <div className="relative w-full overflow-hidden">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-black via-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-black via-black to-transparent z-10 pointer-events-none" />

          {/* Animated belt container */}
          <div className="flex animate-logo-scroll hover:pause-animation">
            {duplicatedBrands.map((brand, index) => (
              <div
                key={`${brand.key}-${index}`}
                className="flex-shrink-0 mx-6 md:mx-8 lg:mx-12 flex items-center justify-center"
              >
                <div className="flex flex-col items-center justify-center min-w-[120px] md:min-w-[150px]">
                  {/* Logo container */}
                  <div className="relative w-full h-12 md:h-16 flex items-center justify-center">
                    {brand.logoPath ? (
                      // Display actual logo image when available
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={brand.logoPath}
                          alt={`${brand.name} logo`}
                          width={120}
                          height={48}
                          className="object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
                          unoptimized
                        />
                      </div>
                    ) : (
                      // Fallback to text when logo not available
                      <div className="w-full h-full flex items-center justify-center px-4 py-2 rounded-lg border border-neutral-800/50 bg-neutral-900/30 backdrop-blur-sm hover:bg-neutral-900/50 transition-colors">
                        <span className="text-white/90 text-base md:text-lg font-semibold tracking-tight whitespace-nowrap">
                          {brand.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

