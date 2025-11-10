import Stripe from "stripe";

declare global {
  // Verhindert mehrfaches Initialisieren im Dev Mode
  // eslint-disable-next-line no-var
  var stripeClient: Stripe | undefined;
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_PLACEHOLDER";

const client =
  global.stripeClient ||
  new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });

if (process.env.NODE_ENV !== "production") {
  global.stripeClient = client;
}

// Wir exportieren eine einzige Instanz namens stripe.
export const stripe = client;
