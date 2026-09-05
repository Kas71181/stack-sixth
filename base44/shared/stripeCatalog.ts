export const STRIPE_PRICES = {
  STARTER: { monthly: "price_1U7uYGCugsX1kO5AyeTuAkkt", annual: "price_1UCImOCugsX1kO5AYFf82nNx" },
  GROWTH: { monthly: "price_1U7uYHCugsX1kO5AKLESgpem", annual: "price_1UCImOCugsX1kO5A3Q89sXez" },
  SCALE: { monthly: "price_1U7uYHCugsX1kO5A6P3OVLss", annual: "price_1UCImOCugsX1kO5AHhHURz09" }
};

export const priceFor = (plan, interval) => STRIPE_PRICES[plan]?.[interval] || null;