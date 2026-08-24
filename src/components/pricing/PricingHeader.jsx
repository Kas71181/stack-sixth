import { Link } from "react-router-dom";

export default function PricingHeader() {
  return <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <Link to="/" className="flex items-center"><img src="https://media.base44.com/images/public/69f28176704facfd454194e1/d3ef5da50_StackSixth.svg" alt="Stack Sixth" className="h-9 dark:hidden" /><img src="https://media.base44.com/images/public/69f28176704facfd454194e1/9bbf1227c_Asset5.svg" alt="Stack Sixth" className="hidden h-9 dark:block" /></Link>
      <div className="flex items-center gap-3"><Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Sign in</Link><Link to="/signup" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.96]">Start 30 Days Free</Link></div>
    </div>
  </header>;
}