import Link from "next/link";
import { Armchair, Coffee, Sofa, Users } from "lucide-react";
import { categories, products, type ProductCategory } from "../lib/products";

const categoryIcon: Record<ProductCategory, typeof Armchair> = {
  boss: Armchair,
  executive: Sofa,
  visitor: Users,
  cafe: Coffee,
};

export default function ChairShowcase() {
  return (
    <section className="chair-showcase" aria-labelledby="chair-showcase-title">
      <div className="chair-showcase-header">
        <h2 id="chair-showcase-title">Find Your Perfect Chair</h2>
      </div>

      <ul className="category-circles">
        {categories.map((category) => {
          const count = products.filter((product) => product.category === category.slug).length;
          const Icon = categoryIcon[category.slug];

          return (
            <li key={category.slug}>
              <Link href={`/products?category=${category.slug}`} className="category-circle">
                <span className="category-circle-art">
                  <Icon size={40} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <span className="category-circle-name">{category.name}</span>
                <span className="category-circle-count">
                  {count} {count === 1 ? "product" : "products"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
