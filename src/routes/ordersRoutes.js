import express from "express";
import { sendReceiptEmail, transporter } from "../utils/mailer.js";

const router = express.Router();

router.post("/checkout", async (req, res) => {
  const { email, cart, totals } = req.body;

  if (!email || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Invalid checkout data" });
  }

  // Recalculate totals (DO NOT TRUST CLIENT)
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity) / 10,
    0
  );
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  // Optional: verify totals match within tolerance
  if (Math.abs(total - totals.total) > 0.01) {
    return res.status(400).json({ error: "Total mismatch" });
  }

  try {
    await sendReceiptEmail({
      to: email,
      cart,
      totals: { subtotal, tax, total }
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to process order" });
  }
});


export default router;
