import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function sendReceiptEmail({ to, cart, totals }) {
  const itemsHtml = cart.map(item => `
    <li>
      ${item.title} × ${item.quantity} — ₱${((item.price * item.quantity) / 10).toFixed(2)}
    </li>
  `).join("");

  const html = `
    <h2>Thank you for your purchase!</h2>
    <p>Here is your order receipt:</p>
    <ul>${itemsHtml}</ul>
    <p><strong>Subtotal:</strong> ₱${(totals.subtotal / 10).toFixed(2)}</p>
    <p><strong>Tax:</strong> ₱${(totals.tax / 10).toFixed(2)}</p>
    <p><strong>Total:</strong> ₱${(totals.total / 10).toFixed(2)}</p>
  `;

  await transporter.sendMail({
    from: `"EDEN Store" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your EDEN Order Receipt",
    html
  });
}