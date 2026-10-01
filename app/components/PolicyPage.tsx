import type { ReactNode } from "react";
import Header from "./Header";
import SiteFooter from "./SiteFooter";

type PolicySection = {
  heading: string;
  intro?: string;
  items?: ReactNode[];
};

export default function PolicyPage({
  title,
  sections,
}: {
  title: string;
  sections: PolicySection[];
}) {
  return (
    <div className="site-shell">
      <Header />

      <main className="policy-page">
        <h1>{title}</h1>

        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.intro && <p>{section.intro}</p>}
            {section.items && (
              <ul>
                {section.items.map((item, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>

      <SiteFooter />
    </div>
  );
}
