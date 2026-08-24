import { Play, Youtube } from "lucide-react";

export default function DemoVideoPlaceholder() {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="aspect-video bg-slate-950 p-6 text-white sm:p-10">
        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/20">
            <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-300">
            <Youtube className="h-5 w-5 text-red-500" aria-hidden="true" />
            YouTube product demo
          </div>
          <h3 className="mt-3 text-2xl font-black sm:text-3xl">See Stack Sixth in action</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">Your guided product walkthrough will appear here.</p>
          <span className="mt-5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">Video coming soon</span>
        </div>
      </div>
    </div>
  );
}