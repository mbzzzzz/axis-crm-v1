"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

/**
 * @name Shine Border
 * @description It is an animated background border effect component with easy to use and configurable props.
 * @param borderRadius defines the radius of the border.
 * @param borderWidth defines the width of the border.
 * @param duration defines the animation duration to be applied on the shining border
 * @param color a string or string array to define border color.
 * @param className defines the class name to be applied to the component
 * @param children contains react node elements.
 */
export function ShineBorder({
  borderRadius = 8,
  borderWidth = 2,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  const colors = color instanceof Array ? color : [color, color, color];
  
  // Create a linear gradient that moves
  const linearGradient = `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[0]})`;

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden",
        className,
      )}
      style={
        {
          borderRadius: `${borderRadius}px`,
        } as React.CSSProperties
      }
    >
      {/* Animated border layer - outer */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={
          {
            borderRadius: `${borderRadius}px`,
            background: linearGradient,
            backgroundSize: "200% 200%",
            animation: `shine-pulse ${duration}s infinite linear`,
            padding: `${borderWidth}px`,
          } as React.CSSProperties
        }
      >
        {/* Inner mask to create border effect */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={
            {
              borderRadius: `${borderRadius - borderWidth}px`,
              margin: `${borderWidth}px`,
              background: "transparent",
            } as React.CSSProperties
          }
        />
      </div>
      {/* Content */}
      <div 
        className="relative z-10 h-full w-full rounded-3xl" 
        style={{ 
          borderRadius: `${borderRadius}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

