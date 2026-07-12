const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email is not configured (missing SENDGRID_API_KEY or EMAIL_FROM).");
  }

  const res = await fetch(SENDGRID_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: "PennyWise" },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html || `<p>${text}</p>` },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SendGrid request failed (${res.status}): ${body}`);
  }
}

function sendOtpEmail(to, otp) {
  return sendEmail({
    to,
    subject: `${otp} is your PennyWise verification code`,
    text: `Your PennyWise verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your PennyWise verification code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>
<p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

function sendResetEmail(to, link) {
  return sendEmail({
    to,
    subject: "Reset your PennyWise password",
    text: `Reset your PennyWise password using this link (expires in 15 minutes): ${link}`,
    html: `<p>Click the link below to reset your PennyWise password. This link expires in 15 minutes.</p>
<p><a href="${link}">${link}</a></p>
<p>If you didn't request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendEmail, sendOtpEmail, sendResetEmail };
