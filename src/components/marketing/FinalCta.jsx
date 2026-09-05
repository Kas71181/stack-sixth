import { Link } from "react-router-dom";

export default function FinalCta() {
  return <section className="bg-primary px-4 py-20 text-center text-primary-foreground"><h2 className="text-3xl font-black sm:text-4xl">You don't need another dashboard.<br/>You need better software decisions.</h2><Link to="/pricing" className="mt-8 inline-flex rounded-xl bg-background px-6 py-3 font-bold text-foreground active:scale-95">Start Your 30-Day Free Trial</Link></section>;
}