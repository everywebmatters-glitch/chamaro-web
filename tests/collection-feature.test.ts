import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_COLLECTION_FEATURE, MAX_COLLECTION_IMAGES, toCollectionFeature } from "../app/lib/collection-feature.ts";

const ORIGIN = "https://api.example.com";
const page = (content: unknown, status = "PUBLISHED", type = "collection-feature") => ({ status, sections: [{ type, content, position: 0 }] });

test("no page, a draft page or no matching section keeps the built-in content", () => {
  assert.deepEqual(toCollectionFeature(null, ORIGIN), DEFAULT_COLLECTION_FEATURE);
  assert.deepEqual(toCollectionFeature(page({ heading: "X" }, "DRAFT"), ORIGIN), DEFAULT_COLLECTION_FEATURE);
  assert.deepEqual(toCollectionFeature(page({ heading: "X" }, "PUBLISHED", "other"), ORIGIN), DEFAULT_COLLECTION_FEATURE);
  assert.deepEqual(toCollectionFeature(page("nope"), ORIGIN), DEFAULT_COLLECTION_FEATURE);
});

test("admin content replaces the defaults; blank fields fall back individually", () => {
  const feature = toCollectionFeature(
    page({ heading: " Autumn ", text: "", buttonLabel: "Shop", buttonUrl: "/products?c=1", images: [{ url: "/api/v1/media/m1", alt: " Chair " }, { url: "https://cdn.example.com/b.jpg" }] }),
    ORIGIN,
  );
  assert.equal(feature.heading, "Autumn");
  assert.equal(feature.text, DEFAULT_COLLECTION_FEATURE.text);
  assert.equal(feature.buttonLabel, "Shop");
  assert.equal(feature.buttonHref, "/products?c=1");
  assert.deepEqual(feature.images, [{ src: "https://api.example.com/api/v1/media/m1", alt: "Chair" }, { src: "https://cdn.example.com/b.jpg", alt: "" }]);
});

test("unsafe links and images are dropped", () => {
  for (const bad of ["javascript:alert(1)", "//evil.com", "data:text/html,x", "/\\evil.com"]) {
    assert.equal(toCollectionFeature(page({ buttonUrl: bad }), ORIGIN).buttonHref, "/products", bad);
  }
  assert.equal(toCollectionFeature(page({ buttonUrl: "https://shop.example.com/x" }), ORIGIN).buttonHref, "https://shop.example.com/x");
  const images = toCollectionFeature(page({ images: [{ url: "javascript:x" }, { url: "data:image/png;base64,AA" }, null, 5] }), ORIGIN).images;
  assert.deepEqual(images, DEFAULT_COLLECTION_FEATURE.images);
});

test("at most six images are shown", () => {
  const many = Array.from({ length: 10 }, (_, i) => ({ url: `https://cdn.example.com/${i}.jpg` }));
  assert.equal(toCollectionFeature(page({ images: many }), ORIGIN).images.length, MAX_COLLECTION_IMAGES);
});
