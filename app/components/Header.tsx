import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getNavCategories } from "../lib/catalog-api";
import { categoryHref } from "../lib/catalog-nav";
import HeaderActions from "./HeaderActions";
import MobileMenu from "./MobileMenu";
import StickyHeader from "./StickyHeader";

/* overlay: transparent header that sits on top of the homepage hero */
export default async function Header({ overlay = false }: { overlay?: boolean }) {
  /* Live categories from the API; an empty list just leaves "All Products" */
  const categories = await getNavCategories();

  return (
    <StickyHeader overlay={overlay}>
      {/* Hamburger + slide-in menu (mobile only) */}
      <MobileMenu categories={categories} />

      {/* Logo */}
      <Link className="brand" href="/" aria-label="Chamaro home">
        <Image
          src="/Carmaro Logo 1.svg"
          alt="Chamaro"
          width={140}
          height={31}
          priority
        />
      </Link>

      {/* Navigation */}
      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/">Home</Link>

        {/* Products dropdown — opens on hover and keyboard focus */}
        <div className="nav-dropdown">
          <Link href="/products" aria-haspopup="true">
            <span>Products</span>
            <ChevronDown className="chevron" size={16} strokeWidth={2} />
          </Link>

          <ul className="nav-dropdown-menu">
            <li>
              <Link href="/products">All Products</Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={categoryHref(category.slug)}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/b2b">B2B</Link>

        <Link href="/contact">Contact Us</Link>
      </nav>

      <HeaderActions />
    </StickyHeader>
  );
}
