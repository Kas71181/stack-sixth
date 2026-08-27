import { Outlet } from "react-router-dom";
import AnnouncementBar from "@/components/marketing/AnnouncementBar";
import PublicNavbar from "@/components/marketing/PublicNavbar";
import PublicFooter from "@/components/marketing/PublicFooter";
import ScrollToTop from "@/components/marketing/ScrollToTop";
export default function MarketingLayout(){return <div className="min-h-screen bg-background text-foreground"><ScrollToTop/><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a><AnnouncementBar/><PublicNavbar/><main id="main-content"><Outlet/></main><PublicFooter/></div>}