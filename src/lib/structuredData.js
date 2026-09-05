import { pricingFaqItems } from "@/lib/pricingFaqContent";
import { SEO_ORIGIN } from "@/lib/seoConfig";
import { site } from "@/lib/siteContent";

const organization = {
  "@type": "Organization",
  "@id": `${SEO_ORIGIN}/#organization`,
  name: "StackSixth",
  alternateName: "Stack Sixth",
  url: SEO_ORIGIN,
  logo: "https://media.base44.com/images/public/69f28176704facfd454194e1/d3ef5da50_StackSixth.svg",
  description: "AI-powered software procurement intelligence and SaaS spend management platform.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "500 W Fifth St",
    addressLocality: "Winston-Salem",
    addressRegion: "NC",
    postalCode: "27101",
    addressCountry: "US",
  },
  sameAs: Object.values(site.social),
};

const software = {
  "@type": "SoftwareApplication",
  "@id": `${SEO_ORIGIN}/#software`,
  name: "StackSixth",
  alternateName: "Stack Sixth",
  url: SEO_ORIGIN,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  areaServed: "US",
  description: "AI-powered software procurement intelligence and SaaS spend management platform.",
  featureList: ["Software inventory", "SaaS spend tracking", "Evidence-based usage", "Renewal management", "Procurement governance"],
  offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: "199", highPrice: "999", offerCount: "3" },
};

export function buildStructuredData(pathname, page) {
  const url = `${SEO_ORIGIN}${pathname === "/" ? "" : pathname}`;
  const pageNode = { "@type": page.schemaType, "@id": `${url}#webpage`, url, name: page.title, description: page.description, isPartOf: { "@id": `${SEO_ORIGIN}/#website` } };
  const graph = pathname === "/" ? [organization, { "@type": "WebSite", "@id": `${SEO_ORIGIN}/#website`, name: "StackSixth", alternateName: "Stack Sixth", url: SEO_ORIGIN, publisher: { "@id": `${SEO_ORIGIN}/#organization` } }, software, pageNode] : [pageNode];
  if (page.faq) graph.push({ "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: pricingFaqItems.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) });
  return { "@context": "https://schema.org", "@graph": graph };
}