import React from "react";
import Image from "next/image";

interface AxisLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 56, height: 56 },
};

const fullLogoSizeMap = {
  sm: { width: 140, height: 50 },
  md: { width: 180, height: 64 },
  lg: { width: 260, height: 93 },
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
      <Image
        src={src}
        alt="Axis CRM Icon"
        width={dimensions.width}
        height={dimensions.height}
        className={`${className} object-contain`}
        priority
        unoptimized
        style={{ width: 'auto', height: 'auto' }}
        onError={(e) => {
          // Log error if image fails to load
          console.error('Failed to load icon logo:', src);
        }}
      />
    );
  }

  const dimensions = fullLogoSizeMap[size];
  const src = getImageSrc("full");
  
  return (
    <Image
      src={src}
      alt="Axis CRM"
      width={dimensions.width}
      height={dimensions.height}
      className={`${className} object-contain`}
      priority
      unoptimized
      style={{ width: 'auto', height: 'auto' }}
      onError={(e) => {
        // Log error if image fails to load
        console.error('Failed to load full logo:', src);
      }}
    />
  );
}

