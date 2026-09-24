/* =========================================================
   PRODUCT CATALOG
   Static data until the Prisma product tables are live.
   TODO: replace names, prices and specs with real catalog data
========================================================= */

export type ProductCategory = "boss" | "executive" | "visitor" | "cafe";

export type ProductColor = {
  name: string;
  hex: string;
};

export type Availability = "in-stock" | "pre-order" | "out-of-stock";

export type ProductOption = {
  name: string;
  values: { label: string; available: boolean }[];
};

export type Product = {
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  availability: Availability;
  shortDescription: string;
  description: string;
  images: { src: string; alt: string }[];
  colors: ProductColor[];
  option?: ProductOption;
  features: string[];
  materials: string[];
  specs: { label: string; value: string }[];
  featured?: boolean;
  /* Lower number = sells more; drives the "Best selling" sort */
  salesRank: number;
};

export const availabilityLabels: Record<Availability, string> = {
  "in-stock": "In stock",
  "pre-order": "Pre-order",
  "out-of-stock": "Out of stock",
};

/* TODO: confirm delivery, returns and warranty terms */
export const storePolicies = {
  delivery:
    "Estimated delivery: 3–7 days (metro cities), 7–12 days (rest of India).",
  returns:
    "Return within 7 days of delivery in original packaging. Assembly and shipping charges are non-refundable.",
  warranty:
    "Every Chamaro chair carries a 1-year warranty against manufacturing defects in the frame, mechanism and gas lift. Wear and tear, misuse and upholstery damage from sharp objects are not covered.",
};

export const chairCare = [
  { icon: "droplets", text: "Wipe upholstery with a soft, damp cloth." },
  { icon: "spray", text: "Avoid harsh chemicals, solvents and bleach." },
  { icon: "sun", text: "Keep away from prolonged direct sunlight." },
  { icon: "wrench", text: "Re-tighten fittings every 6 months." },
  { icon: "weight", text: "Do not exceed the rated weight capacity." },
] as const;

export const categories: { slug: ProductCategory; name: string }[] = [
  { slug: "boss", name: "Boss" },
  { slug: "executive", name: "Executive" },
  { slug: "visitor", name: "Visitor" },
  { slug: "cafe", name: "Cafe" },
];

export const products: Product[] = [
  {
    slug: "wing-way-boss-chair",
    name: "Wing Way Boss Chair",
    category: "boss",
    price: 7434,
    compareAtPrice: 10000,
    rating: 5,
    reviewCount: 0,
    availability: "in-stock",
    salesRank: 1,
    shortDescription:
      "A high-back boss chair with layered cushioning and padded loop armrests for long, focused workdays.",
    description:
      "The Wing Way pairs a sculpted, multi-panel backrest with a deep seat cushion so you stay supported from the first meeting to the last. Padded loop armrests, a smooth tilt mechanism and a chrome five-star base give it the presence of a boardroom chair with the comfort of a lounge seat.",
    images: [
      {
        src: "/products/boss-green-front.webp",
        alt: "Wing Way Boss Chair in forest green leatherette, front view",
      },
      {
        src: "/products/boss-green-back.webp",
        alt: "Wing Way Boss Chair in forest green leatherette, rear view",
      },
    ],
    colors: [
      { name: "Forest Green", hex: "#2f4a3e" },
      { name: "Black", hex: "#1d1d1d" },
    ],
    option: {
      name: "Base",
      values: [
        { label: "Chrome", available: true },
        { label: "Nylon", available: true },
        { label: "Aluminium", available: false },
      ],
    },
    features: [
      "Multi-panel padded backrest with lumbar support",
      "Padded loop armrests with satin-finish frame",
      "Tilt and tension control with lock",
      "Class-4 gas lift for smooth height adjustment",
    ],
    materials: [
      "Upholstery: premium PU leatherette",
      "Frame: moulded plywood with high-density foam",
      "Base: chrome-plated steel",
      "Castors: 50 mm nylon twin-wheel",
    ],
    specs: [
      { label: "Upholstery", value: "Premium leatherette" },
      { label: "Base", value: "Chrome five-star base with castors" },
      { label: "Mechanism", value: "Tilt with tension control" },
      { label: "Seat height", value: "46 – 56 cm" },
      { label: "Weight capacity", value: "120 kg" },
      { label: "Warranty", value: "1 year" },
    ],
    featured: true,
  },
  {
    slug: "regent-executive-chair",
    name: "Regent Executive Chair",
    category: "executive",
    price: 12499,
    compareAtPrice: 15999,
    rating: 5,
    reviewCount: 0,
    availability: "pre-order",
    salesRank: 3,
    shortDescription:
      "Diamond-stitched executive seating in rich tan with chrome arms and generous cushioning.",
    description:
      "Regent brings a tailored, diamond-quilted backrest and a waterfall-edge seat together in a warm tan finish. Chrome armrests and a sturdy base complete a chair built to anchor a private office or leadership cabin.",
    images: [
      {
        src: "/products/executive-tan.webp",
        alt: "Regent Executive Chair in tan leatherette with diamond stitching",
      },
    ],
    colors: [
      { name: "Tan", hex: "#b8672f" },
      { name: "Black", hex: "#1d1d1d" },
    ],
    option: {
      name: "Base",
      values: [
        { label: "Chrome", available: true },
        { label: "Nylon", available: true },
        { label: "Aluminium", available: false },
      ],
    },
    features: [
      "Diamond-stitched backrest and integrated headrest",
      "Waterfall seat edge reduces pressure behind the knees",
      "Chrome armrests with padded tops",
      "Synchro-tilt with multi-position lock",
    ],
    materials: [
      "Upholstery: premium PU leatherette",
      "Frame: moulded plywood with cold-cured foam",
      "Armrests: chrome-plated steel with padded tops",
      "Base: chrome-plated steel",
    ],
    specs: [
      { label: "Upholstery", value: "Premium leatherette" },
      { label: "Base", value: "Chrome five-star base with castors" },
      { label: "Mechanism", value: "Synchro-tilt with lock" },
      { label: "Seat height", value: "47 – 57 cm" },
      { label: "Weight capacity", value: "130 kg" },
      { label: "Warranty", value: "1 year" },
    ],
    featured: true,
  },
  {
    slug: "metro-mesh-visitor-chair",
    name: "Metro Mesh Visitor Chair",
    category: "visitor",
    price: 3299,
    compareAtPrice: 4499,
    rating: 4,
    reviewCount: 0,
    availability: "in-stock",
    salesRank: 4,
    shortDescription:
      "A sturdy cantilever visitor chair with a perforated seat and back for meeting rooms and reception.",
    description:
      "Metro is built on a continuous tubular steel frame that gives a gentle, comfortable flex. The perforated seat and backrest stay cool through long meetings, and the powder-coated finish stands up to daily use in busy reception areas.",
    images: [
      {
        src: "/products/visitor-mesh.webp",
        alt: "Metro Mesh Visitor Chair with black perforated seat and cantilever frame",
      },
    ],
    colors: [{ name: "Black", hex: "#1d1d1d" }],
    features: [
      "Cantilever tubular steel frame with gentle flex",
      "Perforated seat and back for airflow",
      "Integrated armrests",
      "Powder-coated, scratch-resistant finish",
    ],
    materials: [
      "Frame: powder-coated tubular steel",
      "Seat and back: perforated steel sheet",
      "Glides: non-marking polypropylene",
    ],
    specs: [
      { label: "Frame", value: "Powder-coated tubular steel" },
      { label: "Seat", value: "Perforated steel with cushioned pad" },
      { label: "Seat height", value: "45 cm" },
      { label: "Weight capacity", value: "110 kg" },
      { label: "Warranty", value: "1 year" },
    ],
  },
  {
    slug: "luna-cafe-chair",
    name: "Luna Cafe Chair",
    category: "cafe",
    price: 4299,
    compareAtPrice: 5499,
    rating: 5,
    reviewCount: 0,
    availability: "in-stock",
    salesRank: 2,
    shortDescription:
      "A softly curved upholstered cafe chair on slim black legs with brass-tone tips.",
    description:
      "Luna's wraparound shell hugs the back while its compact footprint suits cafés, restaurants and dining nooks. Plush upholstery and slim tapered legs finished with brass-tone tips bring a light, modern feel to any interior.",
    images: [
      {
        src: "/products/cafe-grey.webp",
        alt: "Luna Cafe Chair in grey fabric with black and brass-tone legs",
      },
    ],
    colors: [
      { name: "Stone Grey", hex: "#6b6b6b" },
      { name: "Sand", hex: "#cbb89a" },
    ],
    option: {
      name: "Leg finish",
      values: [
        { label: "Black / Brass", available: true },
        { label: "All Black", available: true },
      ],
    },
    features: [
      "Wraparound shell with plush upholstery",
      "Slim tapered legs with brass-tone tips",
      "Compact footprint for dining and café layouts",
      "Floor-protecting glides",
    ],
    materials: [
      "Upholstery: soft-touch polyester fabric",
      "Shell: moulded foam over steel frame",
      "Legs: powder-coated steel with brass-tone tips",
    ],
    specs: [
      { label: "Upholstery", value: "Soft-touch fabric" },
      { label: "Legs", value: "Powder-coated steel, brass-tone tips" },
      { label: "Seat height", value: "46 cm" },
      { label: "Weight capacity", value: "100 kg" },
      { label: "Warranty", value: "1 year" },
    ],
    featured: true,
  },
];

/* =========================================================
   HELPERS
========================================================= */

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

export function discountPercent(product: Product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
    return 0;
  }

  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategoryName(slug: string) {
  return categories.find((category) => category.slug === slug)?.name;
}

export function getRelatedProducts(product: Product, limit = 4) {
  const sameCategory = products.filter(
    (item) => item.slug !== product.slug && item.category === product.category
  );
  const others = products.filter(
    (item) => item.slug !== product.slug && item.category !== product.category
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export type SortOption =
  | "featured"
  | "best-selling"
  | "price-asc"
  | "price-desc"
  | "name";

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

export function sortProducts(items: Product[], sort: SortOption) {
  const sorted = [...items];

  switch (sort) {
    case "best-selling":
      return sorted.sort((a, b) => a.salesRank - b.salesRank);
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted.sort(
        (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)
      );
  }
}

export const PRICE_RANGES = [
  { value: "under-5000", label: "Under ₹5,000", min: 0, max: 5000 },
  { value: "5000-10000", label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { value: "over-10000", label: "Above ₹10,000", min: 10000, max: Infinity },
] as const;

export function allColors() {
  const seen = new Map<string, ProductColor>();
  for (const product of products) {
    for (const color of product.colors) {
      if (!seen.has(color.name)) seen.set(color.name, color);
    }
  }
  return [...seen.values()];
}

export function searchProducts(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  return products.filter((product) =>
    [product.name, getCategoryName(product.category) ?? "", product.shortDescription]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
}
