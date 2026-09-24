export type HeroSlide = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  image: string;
};

export type ChairCategory = {
  name: string;
  variant: "boss" | "cafe" | "executive" | "premium" | "bar-stool";
};

export type BestSellerProduct = {
  name: string;
  price: number;
  oldPrice: number;
  rating: number;
  color: string;
};

export const siteContent = {
  hero: [
    {
      eyebrow: "The workday, refined",
      title: "Engineered to",
      highlight: "Lead",
      description:
        "Designed for professionals who value refined style, supportive comfort, and dependable performance throughout the workday.",
      image: "/Banner one.svg",
    },
    {
      eyebrow: "Comfort, elevated",
      title: "Designed for",
      highlight: "Comfort",
      description:
        "Premium office seating designed to keep you comfortable, focused, and confident throughout your workday.",
      image: "/Banner two.webp",
    },
    {
      eyebrow: "Built to perform",
      title: "Work with",
      highlight: "Confidence",
      description:
        "Thoughtfully engineered office furniture combining modern design, lasting comfort, and dependable performance.",
      image: "/Banner one.svg",
    },
  ] satisfies HeroSlide[],

  chairCategories: [
    { name: "Boss", variant: "boss" },
    { name: "Cafe", variant: "cafe" },
    { name: "Executive", variant: "executive" },
    { name: "Premium", variant: "premium" },
    { name: "Bar Stool", variant: "bar-stool" },
  ] satisfies ChairCategory[],

  bestSellers: [
    {
      name: "Wing Way Boss Chair",
      price: 7434,
      oldPrice: 10000,
      rating: 5,
      color: "#111111",
    },
    {
      name: "Wing Way Boss Chair",
      price: 7434,
      oldPrice: 10000,
      rating: 5,
      color: "#111111",
    },
    {
      name: "Wing Way Boss Chair",
      price: 7434,
      oldPrice: 10000,
      rating: 5,
      color: "#111111",
    },
    {
      name: "Wing Way Boss Chair",
      price: 7434,
      oldPrice: 10000,
      rating: 5,
      color: "#111111",
    },
  ] satisfies BestSellerProduct[],
};
