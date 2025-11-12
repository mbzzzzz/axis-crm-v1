"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, parseCurrencyValue, getSuggestedUnit, type CurrencyCode } from "@/lib/currency-formatter";

interface CurrencyInputProps {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  currency: CurrencyCode;
  placeholder?: string;
  required?: boolean;
  id?: string;
  showPreview?: boolean;
  className?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  currency,
  placeholder = "0.00",
  required = false,
  id,
  showPreview = true,
  className,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  const [previewValue, setPreviewValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize display value
  useEffect(() => {
    if (value && value !== 0) {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        setDisplayValue(numValue.toString());
        updatePreview(numValue);
      }
    } else {
      setDisplayValue("");
      setPreviewValue("");
    }
  }, [value, currency]);

  const updatePreview = (numValue: number) => {
    if (numValue === 0 || isNaN(numValue)) {
      setPreviewValue("");
      return;
    }

    const formatted = formatCurrency(numValue, currency, {
      showSymbol: true,
      showDecimals: true,
      compact: true,
    });
    setPreviewValue(formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input
    if (inputValue === "") {
      setDisplayValue("");
      setPreviewValue("");
      onChange(0);
      return;
    }

    // Remove all non-numeric characters except decimal point
    const cleanValue = inputValue.replace(/[^\d.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return;
    }

    setDisplayValue(cleanValue);

    // Parse the numeric value
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
      updatePreview(numValue);
    } else {
      setPreviewValue("");
      onChange(0);
    }
  };

  const handleBlur = () => {
    // Format the value on blur
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue) && numValue !== 0) {
      // Show full number without compact formatting for input
      setDisplayValue(numValue.toLocaleString("en-US", { maximumFractionDigits: 2 }));
    }
  };

  const handleFocus = () => {
    // Show raw number when focused for easier editing
    const numValue = parseFloat(displayValue.replace(/,/g, ""));
    if (!isNaN(numValue)) {
      setDisplayValue(numValue.toString());
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className="pr-24"
        />
        {showPreview && previewValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {previewValue}
          </div>
        )}
      </div>
    </div>
  );
}

