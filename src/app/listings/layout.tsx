import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Find Properties for Sale & Rent | Axis CRM Property Listings',
    description: 'Browse exclusive property listings, buy or rent residential and commercial properties. Use our advanced filters to find your perfect home or investment opportunity.',
    keywords: [
        'buy property',
        'rent property',
        'property listings',
        'homes for sale',
        'apartments for rent',
        'real estate search',
        'commercial property for lease'
    ],
    openGraph: {
        title: 'Find Your Dream Property | Axis CRM',
        description: 'Explore verified listings for sale and rent. Filter by location, price, and amenities.',
    },
};

export default function ListingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
