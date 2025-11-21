import type { AxisPropertyRecord } from "@axis/shared/types";
import clsx from "clsx";

type Props = {
  property: AxisPropertyRecord;
  active: boolean;
  onSelect: () => void;
};

export function PropertyCard({ property, active, onSelect }: Props) {
  const formatPrice = (price: number, currency?: string | null): string => {
    const currencyCode = currency && /^[A-Z]{3}$/.test(currency) ? currency : "USD";
    try {
      const hasFraction = price % 1 !== 0;
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: hasFraction ? 2 : 0,
      }).format(price);
    } catch (error) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(price);
    }
  };

  const locationParts = [property.city, property.state].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : "—";

  return (
    <button
      type="button"
      className={clsx("property-card", active && "active")}
      onClick={onSelect}
      aria-label={`Select property: ${property.title}`}
    >
      <p className="property-title">{property.title}</p>
      <div className="property-meta">
        <span>{locationText}</span>
        <span>{property.propertyType ?? "Unknown"}</span>
        {typeof property.price === "number" && (
          <span>{formatPrice(property.price, property.currency)}</span>
        )}
      </div>
    </button>
  );
}

