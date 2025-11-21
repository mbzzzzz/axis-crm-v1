import type { AxisPropertyRecord } from "@axis/shared/types";
import clsx from "clsx";

type Props = {
  property: AxisPropertyRecord;
  active: boolean;
  onSelect: () => void;
};

export function PropertyCard({ property, active, onSelect }: Props) {
  return (
    <button className={clsx("property-card", active && "active")} onClick={onSelect}>
      <p className="property-title">{property.title}</p>
      <div className="property-meta">
        <span>{property.city}, {property.state}</span>
        <span>{property.propertyType}</span>
        {typeof property.price === "number" && (
          <span>
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: property.currency ?? "USD",
              maximumFractionDigits: 0,
            }).format(property.price)}
          </span>
        )}
      </div>
    </button>
  );
}

