import express from "express";
import axios from "axios";

const router = express.Router();

const paymongo = axios.create({
  baseURL: "https://api.paymongo.com/v1",
  auth: {
    username: process.env.PAYMONGO_SECRET_KEY,
    password: ""
  },
  headers: {
    "Content-Type": "application/json"
  }
});

router.post("/paymongo/gcash", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const response = await paymongo.post("/sources", {
      data: {
        attributes: {
          type: "gcash",
          amount,
          currency,
          redirect: {
            success: "http://localhost:3000/payment-success.html",
            failed: "http://localhost:3000/payment-failed.html"
          }
        }
      }
    });

    res.json({
      checkout_url: response.data.data.attributes.redirect.checkout_url
    });

  } catch (err) {
    console.error("PayMongo error:", err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: "Payment failed" });
  }
});

export default router;
