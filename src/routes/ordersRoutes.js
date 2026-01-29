import express from "express";
import { sendReceiptEmail, transporter } from "../utils/mailer.js";

const router = express.Router();

router.post("/checkout", async (req, res) => {
  const { email, cart, total } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    await transporter.sendMail({
      from: `"EDEN Store" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Order Receipt",
      html: `
        <h2>Thank you for your order</h2>
        <p>Total: ₱${total}</p>
        <pre>${JSON.stringify(cart, null, 2)}</pre>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
