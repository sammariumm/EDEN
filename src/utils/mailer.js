import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Generic email sender (used for application accept/reject, notifications, etc.)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Plain text or HTML message
 */
export async function sendEmail(to, subject, message) {
  if (!to || !subject || !message) {
    throw new Error("sendEmail: Missing required parameters");
  }

  await transporter.sendMail({
    from: `"EDEN Job Application" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    // Allow HTML but also work with plain text
    html: `<p>${message}</p>`,
    text: message
  });
}

/**
 * Receipt-specific email (used for store checkout)
 */
export async function sendReceiptEmail({ to, cart, totals }) {
  const itemsHtml = cart
    .map(
      (item) => `
      <li>
        ${item.title} × ${item.quantity} — ₱${(
          (item.price * item.quantity) / 10
        ).toFixed(2)}
      </li>
    `
    )
    .join("");

  const html = `
    <h2>Thank you for your purchase!</h2>
    <p>Here is your order receipt:</p>
    <ul>${itemsHtml}</ul>
    <p><strong>Subtotal:</strong> ₱${totals.subtotal.toFixed(2)}</p>
    <p><strong>Tax:</strong> ₱${totals.tax.toFixed(2)}</p>
    <p><strong>Total:</strong> ₱${totals.total.toFixed(2)}</p>
    <p>Thank you for trusting EDEN!</p>
  `;

  await transporter.sendMail({
    from: `"EDEN Store" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your EDEN Order Receipt",
    html
  });
}
