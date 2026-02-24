const nodemailer = require('nodemailer');

let transporter;

/**
 * Shared email transporter — uses SMTP env vars or falls back to console logging.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        console.log('──── DEV EMAIL ────');
        console.log(`To: ${opts.to}`);
        console.log(`Subject: ${opts.subject}`);
        console.log(opts.text || opts.html);
        console.log('───────────────────');
        return { messageId: 'dev' };
      }
    };
  }
  return transporter;
};

/**
 * Send an email using the shared transporter.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const mailer = await getTransporter();
  return mailer.sendMail({
    from: process.env.SMTP_FROM || '"UtilityScheduler" <noreply@utilitysched.dev>',
    to,
    subject,
    text,
    html
  });
};

module.exports = { getTransporter, sendEmail };
