const nodemailer = require('nodemailer');

// Create transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Email templates
const templates = {
  schemeEligible: (workerName, schemeName) => ({
    subject: `MigrantShield: You may be eligible for ${schemeName}`,
    html: `<h2>Good news, ${workerName}!</h2><p>Based on your profile, you may be eligible for <strong>${schemeName}</strong>. Log in to MigrantShield to check your eligibility and apply.</p><p>Visit: <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>`
  }),
  complaintUpdate: (workerName, complaintId, status) => ({
    subject: `MigrantShield: Complaint ${complaintId} Update`,
    html: `<h2>Complaint Status Update</h2><p>Dear ${workerName}, your complaint <strong>${complaintId}</strong> status has been updated to: <strong>${status}</strong>.</p>`
  }),
  wageAlert: (workerName) => ({
    subject: `MigrantShield: Wage Concern Detected`,
    html: `<h2>Wage Alert</h2><p>Dear ${workerName}, our analysis suggests your current wage may be below the applicable reference wage. Please log in to review the details.</p>`
  }),
  documentExpiry: (workerName, docType, expiryDate) => ({
    subject: `MigrantShield: Document Expiry Reminder`,
    html: `<h2>Document Reminder</h2><p>Dear ${workerName}, your <strong>${docType}</strong> is expiring on <strong>${expiryDate}</strong>. Please renew it and upload the new document.</p>`
  }),
};

async function sendEmail(to, templateName, ...args) {
  if (!process.env.SMTP_USER) {
    console.log(`[Notification stub] Would send email "${templateName}" to ${to}`);
    return { success: true, stub: true };
  }
  const transporter = createTransporter();
  const template = templates[templateName](...args);
  await transporter.sendMail({
    from: `MigrantShield <${process.env.SMTP_USER}>`,
    to,
    subject: template.subject,
    html: template.html,
  });
  return { success: true };
}

module.exports = { sendEmail };
