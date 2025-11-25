# Brand Logos

This directory contains white/transparent logo images for the supported property listing platforms.

## Required Logos

Add the following logo files here (white/transparent PNG or SVG format):

- `zillow.png` or `zillow.svg` - Zillow logo
- `zameen.png` or `zameen.svg` - Zameen logo
- `realtor.png` or `realtor.svg` - Realtor.com logo
- `bayut.png` or `bayut.svg` - Bayut logo
- `propertyfinder.png` or `propertyfinder.svg` - Property Finder logo
- `dubizzle.png` or `dubizzle.svg` - Dubizzle logo
- `propsearch.png` or `propsearch.svg` - Propsearch logo

## Logo Requirements

- **Format**: PNG (with transparency) or SVG
- **Color**: White logos on transparent background
- **Size**: Recommended 200-300px width, maintain aspect ratio
- **Style**: Clean, professional logos suitable for dark backgrounds

## Usage

Once logos are added, update the `BRANDS` array in `src/components/landing/TrustedBrands.tsx`:

```tsx
{ name: "Zillow", key: "zillow", logoPath: "/logos/zillow.png" },
```

The component will automatically display logos when `logoPath` is provided, otherwise it will show the brand name as text.

