import { site } from "@/lib/siteContent";
export default function AnnouncementBar() {
  if (!site.announcement.enabled) return null;
  return <div className="bg-primary px-4 py-2 text-center text-xs font-semibold text-primary-foreground"><span>{site.announcement.text}</span> <a href="/#product" className="ml-2 underline underline-offset-4">{site.announcement.link}</a></div>;
}