export const STRIPE_PRICES = {
  STARTER: { monthly: "price_1U7uYGCugsX1kO5AyeTuAkkt", annual: "price_1U7uYGCugsX1kO5AvVQXKUPQ" },
  GROWTH: { monthly: "price_1U7uYHCugsX1kO5AKLESgpem", annual: "price_1U7uYHCugsX1kO5AsxJTAuEk" },
  SCALE: { monthly: "price_1U7uYHCugsX1kO5A6P3OVLss", annual: "price_1U7uYHCugsX1kO5AB5FmcPJI" }
};

export const priceFor = (plan, interval) => STRIPE_PRICES[plan]?.[interval] || null;