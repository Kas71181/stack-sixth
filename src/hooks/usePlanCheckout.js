import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function usePlanCheckout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pendingPlan, setPendingPlan] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const selectPlan = async ({ plan, interval, promoCode }) => {
    const choice = { plan: plan.plan_key, billing_interval: interval, promo_code: promoCode || null };
    sessionStorage.setItem("stackSixthAccessChoice", JSON.stringify(choice));
    if (plan.plan_key === "ENTERPRISE") return navigate("/contact-sales");
    if (!isAuthenticated) return navigate("/signup");
    if (promoCode) return navigate("/signup/setup");
    if (window.self !== window.top) {
      alert("Secure checkout is available from the published Stack Sixth app, not inside preview.");
      return;
    }
    setPendingPlan(plan.plan_key);
    setCheckoutError("");
    try {
      const response = await base44.functions.invoke("createSubscriptionCheckout", choice);
      window.location.href = response.data.checkout_url || response.data.redirect_url;
    } catch (error) {
      setCheckoutError(error.response?.data?.error || error.message);
      setPendingPlan("");
    }
  };

  return { selectPlan, pendingPlan, checkoutError };
}