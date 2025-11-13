import React from "react";
import Image from "next/image";

interface AxisLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: "sm" | "md" | "lg" | "navbar";
}

const sizeMap = {
  sm: { width: 32, height: 32, maxHeight: "32px" },
  md: { width: 40, height: 40, maxHeight: "40px" },
  lg: { width: 56, height: 56, maxHeight: "56px" },
  navbar: { width: 45, height: 45, maxHeight: "45px" }, // App logo in sidebar
};

const fullLogoSizeMap = {
  sm: { width: 140, height: 50, maxHeight: "50px" },
  md: { width: 180, height: 64, maxHeight: "64px" },
  lg: { width: 180, height: 350, maxHeight: "200px" }, // Landing page and sign in logo
  navbar: { width: 350, height: 180, maxHeight: "200px" }, // Landing page header logo
};

// Use the provided logo files
const getImageSrc = (variant: "full" | "icon") => {
  if (variant === "icon") {
    return "/icon logo.png";
  }
  return "/landing page logo full.png";
};

export function AxisLogo({ variant = "full", className = "", size = "md" }: AxisLogoProps) {
  if (variant === "icon") {
    const dimensions = sizeMap[size];
    const src = getImageSrc("icon");
    
    return (
      <div className={`flex items-center shrink-0 ${className}`} style={{ maxHeight: dimensions.maxHeight, height: dimensions.maxHeight }}>
        <Image
          src={src}
          alt="Axis CRM Icon"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain"
          style={{ 
            maxHeight: dimensions.maxHeight,
            maxWidth: dimensions.maxHeight,
            height: dimensions.maxHeight,
            width: dimensions.maxHeight
          }}
          priority
          unoptimized
          onError={(e) => {
            // Log error if image fails to load
            console.error('Failed to load icon logo:', src);
          }}
        />
      </div>
    );
  }

  const dimensions = fullLogoSizeMap[size];
  const src = getImageSrc("full");
  
  // Special handling for landing page logos
  const isLandingPageLogo = size === "lg" || size === "navbar";
  
  return (
    <div 
      className={`flex items-center shrink-0 ${className}`} 
      style={{ 
        maxHeight: dimensions.maxHeight, 
        height: isLandingPageLogo ? (size === "lg" ? "350px" : "180px") : dimensions.maxHeight,
        width: isLandingPageLogo ? (size === "lg" ? "180px" : "350px") : "auto"
      }}
    >
      <Image
        src={src}
        alt="Axis CRM"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        style={{ 
          color: "transparent",
          maxHeight: dimensions.maxHeight,
          height: isLandingPageLogo ? (size === "lg" ? "350px" : "180px") : "100%",
          width: isLandingPageLogo ? (size === "lg" ? "180px" : "350px") : "auto"
        }}
        priority
        unoptimized
        onError={(e) => {
          // Log error if image fails to load
          console.error('Failed to load full logo:', src);
        }}
      />
    </div>
  );
}

