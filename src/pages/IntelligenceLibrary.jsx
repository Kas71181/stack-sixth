import BenchmarkNetworkStats from "@/components/intelligence/BenchmarkNetworkStats";
import NegotiationIntelligencePanel from "@/components/intelligence/NegotiationIntelligencePanel";
import { Brain, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function IntelligenceLibrary() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-[500px] h-40 rounded-full bg-primary/8 blur-3xl -z-10 dark:bg-primary/12" />
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-primary" />
          <p className="text-[11px] font-semibold text-primary/60 uppercase tracking-[0.1em]">Proprietary Intelligence</p>
        </div>
        <h1 className="text-2xl sm:text-[2rem] font-extrabold tracking-tight leading-tight">
          Intelligence Library
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Crowd-sourced benchmark data and negotiation intelligence from the Stack Sixth network. Every audit and negotiation outcome makes this library smarter — a compounding advantage no new entrant can replicate.
        </p>
      </motion.div>

      {/* Benchmark Network */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold">Benchmark Network</h2>
        </div>
        <BenchmarkNetworkStats />
      </motion.div>

      {/* Negotiation Intelligence */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold">Negotiation Intelligence</h2>
        </div>
        <NegotiationIntelligencePanel />
      </motion.div>
    </div>
  );
}