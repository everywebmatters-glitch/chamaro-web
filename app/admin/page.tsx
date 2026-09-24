"use client";

import { useMemo, useState } from "react";
import { siteContent } from "../lib/site-content";

export default function AdminPage() {
  const [content, setContent] = useState(siteContent);

  const stats = useMemo(
    () => ({
      heroSlides: content.hero.length,
      categories: content.chairCategories.length,
      products: content.bestSellers.length,
    }),
    [content]
  );

  const updateHero = (index: number, field: keyof (typeof content.hero)[number], value: string) => {
    setContent((current) => ({
      ...current,
      hero: current.hero.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide
      ),
    }));
  };

  const updateProduct = (index: number, field: keyof (typeof content.bestSellers)[number], value: string | number) => {
    setContent((current) => ({
      ...current,
      bestSellers: current.bestSellers.map((product, productIndex) =>
        productIndex === index ? { ...product, [field]: value } : product
      ),
    }));
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <span className="brand-mark">C</span>
          <div>
            <p className="eyebrow">CMS</p>
            <h1>Chamaro Admin</h1>
          </div>
        </div>

        <nav className="admin-nav">
          <a href="#overview">Overview</a>
          <a href="#hero">Hero</a>
          <a href="#categories">Categories</a>
          <a href="#products">Products</a>
        </nav>
      </aside>

      <section className="admin-content">
        <header id="overview" className="admin-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Content management</h2>
          </div>
          <button type="button" className="save-button">Save changes</button>
        </header>

        <div className="stat-grid">
          <div className="stat-card">
            <span>Hero slides</span>
            <strong>{stats.heroSlides}</strong>
          </div>
          <div className="stat-card">
            <span>Categories</span>
            <strong>{stats.categories}</strong>
          </div>
          <div className="stat-card">
            <span>Products</span>
            <strong>{stats.products}</strong>
          </div>
        </div>

        <div id="hero" className="panel-block">
          <div className="panel-header">
            <h3>Hero configuration</h3>
          </div>

          {content.hero.map((slide, index) => (
            <div key={`${slide.eyebrow}-${index}`} className="field-group">
              <label>
                Eyebrow
                <input
                  value={slide.eyebrow}
                  onChange={(event) => updateHero(index, "eyebrow", event.target.value)}
                />
              </label>

              <label>
                Title
                <input
                  value={slide.title}
                  onChange={(event) => updateHero(index, "title", event.target.value)}
                />
              </label>

              <label>
                Highlight
                <input
                  value={slide.highlight}
                  onChange={(event) => updateHero(index, "highlight", event.target.value)}
                />
              </label>

              <label>
                Description
                <textarea
                  value={slide.description}
                  onChange={(event) => updateHero(index, "description", event.target.value)}
                />
              </label>
            </div>
          ))}
        </div>

        <div id="categories" className="panel-block">
          <div className="panel-header">
            <h3>Chair categories</h3>
          </div>

          <div className="chip-list">
            {content.chairCategories.map((category, index) => (
              <div key={`${category.name}-${index}`} className="chip-item">
                <span>{category.name}</span>
                <small>{category.variant}</small>
              </div>
            ))}
          </div>
        </div>

        <div id="products" className="panel-block">
          <div className="panel-header">
            <h3>Best sellers</h3>
          </div>

          {content.bestSellers.map((product, index) => (
            <div key={`${product.name}-${index}`} className="field-group compact">
              <label>
                Product title
                <input
                  value={product.name}
                  onChange={(event) => updateProduct(index, "name", event.target.value)}
                />
              </label>

              <label>
                Price
                <input
                  type="number"
                  value={product.price}
                  onChange={(event) => updateProduct(index, "price", Number(event.target.value))}
                />
              </label>

              <label>
                Old price
                <input
                  type="number"
                  value={product.oldPrice}
                  onChange={(event) => updateProduct(index, "oldPrice", Number(event.target.value))}
                />
              </label>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
