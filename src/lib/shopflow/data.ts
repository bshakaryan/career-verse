export type Category = "apparel" | "accessories" | "mixed";
export type Cart = { subtotal: number; category: Category; promo: string };
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
// Values are integer cents. SAVE20 applies to every category, starting at $50.
export function expectedTotal(cart: Cart) {
  return cart.promo.trim().toUpperCase() === "SAVE20" && cart.subtotal >= 5000
    ? Math.round((cart.subtotal * 80) / 100)
    : cart.subtotal;
}
export function actualTotal(cart: Cart) {
  // Intentional defect: a stale exclusion flag suppresses the entire discount
  // if the cart contains an accessory, including mixed carts.
  return cart.category !== "apparel" ? cart.subtotal : expectedTotal(cart);
}
export function shippingTotals(subtotal: number) {
  return {
    expected: subtotal + (subtotal >= 7500 ? 0 : 699),
    actual: subtotal + (subtotal > 7500 ? 0 : 699),
  };
}
export const orders = [
  {
    id: "SF-1042",
    customer: "Maya Brooks",
    email: "maya@example.test",
    items: "Linen jacket $80 · Phone case $20",
    cart: { subtotal: 10000, category: "mixed", promo: "SAVE20" } as Cart,
    complaint:
      "The promotion said 20% off, but I was charged $100 for my jacket and case. Can you check my order?",
    received: "09:00",
  },
  {
    id: "SF-1043",
    customer: "Jordan Lee",
    email: "jordan@example.test",
    items: "Travel bag $60 (accessories)",
    cart: { subtotal: 6000, category: "accessories", promo: "SAVE20" } as Cart,
    complaint:
      "My travel bag cost $60 even after I entered SAVE20. Is the promotion broken?",
    received: "09:03",
  },
  {
    id: "SF-1044",
    customer: "Riley Chen",
    email: "riley@example.test",
    items: "Cotton shirt $75 (apparel)",
    cart: { subtotal: 7500, category: "apparel", promo: "SAVE20" } as Cart,
    complaint:
      "Could you confirm that SAVE20 was applied? My card statement shows $60.",
    received: "09:05",
  },
];
export const documents = [
  {
    id: "promotion",
    title: "SAVE20 · promotion requirements",
    tag: "PRODUCT",
    body: "SAVE20 gives 20% off the whole merchandise subtotal when the cart is at least $50. It applies to ALL categories, including accessories and mixed carts. Below $50 or without a valid code, no discount applies. This sandbox excludes tax and shipping. Round the final amount to the nearest cent.",
  },
  {
    id: "refunds",
    title: "Refund & customer communication policy",
    tag: "SUPPORT",
    body: "Refund exactly the difference between the actual charge and the amount required by the promotion. Never refund more than the customer paid. If there was no overcharge, record a $0 refund decision and explain why. Include the order ID, the verified refund amount, and the next step in your response. No real money moves in this simulation.",
  },
  {
    id: "escalation",
    title: "Escalation & release policy",
    tag: "OPERATIONS",
    body: "Two matching checkout complaints indicate a systemic payment issue. Escalate to QA before handoff, include the affected order IDs and a concrete symptom, and choose High priority for customer overcharges. The promotion release is scheduled for 11:00. Without an escalation, QA must reconstruct the evidence, adding 15 simulated minutes. Never promise a fix before QA verifies it.",
  },
  {
    id: "bugs",
    title: "Writing a reproducible bug report",
    tag: "QA",
    body: "Record a specific title, preconditions, at least three clear reproduction steps, expected and actual totals, and severity. Link a sandbox test. State the cart category, subtotal and promo code so another tester can repeat it. Test at least one passing control too. An overcharge affecting valid promotions is High severity. A complete handoff is ready for engineering; it does not mean the bug is fixed.",
  },
  {
    id: "shipping",
    title: "Follow-up · free shipping requirements",
    tag: "PRACTICE",
    body: "Merchandise subtotals of $75 or more qualify for free shipping. Below $75, shipping costs $6.99. No promotion is needed. Test the boundary and at least one nearby value; compare actual checkout total with the expected total.",
  },
];
export const roleLabels = { support: "Customer Support", qa: "QA Tester" };
