import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildStructuredData } from "@/lib/structuredData";
import { SEO_ORIGIN, SEO_PAGES, SHARE_IMAGE } from "@/lib/seoConfig";

const upsertMeta = (key, value, property = false) => {
  const attribute = property ? "property" : "name";
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.content = value;
};

export default function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = SEO_PAGES[pathname];
    const title = page?.title || "StackSixth";
    const description = page?.description || "The sixth sense for smarter software decisions.";
    const url = `${SEO_ORIGIN}${pathname === "/" ? "" : pathname}`;
    document.title = title;
    upsertMeta("description", description);
    upsertMeta("robots", page ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" : "noindex,nofollow");
    [["og:title", title], ["og:description", description], ["og:url", url], ["og:type", "website"], ["og:site_name", "StackSixth"], ["og:image", SHARE_IMAGE], ["og:image:width", "300"], ["og:image:height", "137"], ["og:image:alt", "StackSixth"], ["twitter:card", "summary_large_image"], ["twitter:title", title], ["twitter:description", description], ["twitter:image", SHARE_IMAGE], ["twitter:image:alt", "StackSixth"]].forEach(([key, value]) => upsertMeta(key, value, key.startsWith("og:")));
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;
    let script = document.getElementById("stack-sixth-structured-data");
    if (!script) { script = document.createElement("script"); script.id = "stack-sixth-structured-data"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = page ? JSON.stringify(buildStructuredData(pathname, page)) : "";
  }, [pathname]);
  return null;
}