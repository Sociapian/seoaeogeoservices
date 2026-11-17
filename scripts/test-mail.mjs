import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

// Read and parse .env.local
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // Remove inline comments
      const commentIndex = val.indexOf(" #");
      if (commentIndex > 0) val = val.slice(0, commentIndex).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || user || "SEO AEO GEO Services <web@sociapa.com>";
const to = process.env.LEAD_NOTIFY_TO || "web@sociapa.com";

console.log("==========================================");
console.log("  Sociapa Mail Configuration Check");
console.log("==========================================");
console.log(`Notification Target : ${to}`);
console.log(`SMTP Host           : ${host || "(not configured)"}`);
console.log(`SMTP Port           : ${port}`);
console.log(`SMTP User           : ${user || "(not configured)"}`);
console.log(`SMTP From           : ${from}`);
console.log("------------------------------------------");

if (!host) {
  console.log("\n[INFO] SMTP is not yet configured in .env.local.");
  console.log("All website leads are currently captured safely in: .data/leads.jsonl\n");
  console.log("To test live email delivery to web@sociapa.com, update .env.local with your SMTP credentials:");
  console.log(`
  SMTP_HOST=smtp.gmail.com            # or your mail server (e.g. Google Workspace, Brevo, AWS SES)
  SMTP_PORT=587
  SMTP_USER=web@sociapa.com
  SMTP_PASS=your-16-char-app-password
  SMTP_FROM="SEO AEO GEO Services <web@sociapa.com>"
  LEAD_NOTIFY_TO=web@sociapa.com
  REPORT_DELIVERY=email
`);
  process.exit(0);
}

async function runTest() {
  console.log(`\nConnecting to SMTP server ${host}:${port}...`);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  });

  try {
    await transporter.verify();
    console.log("✓ SMTP connection verified successfully!");

    console.log(`Sending test email to ${to}...`);
    const info = await transporter.sendMail({
      from,
      to,
      subject: `[Test] SEO AEO GEO Services Mail System Verification`,
      text: `Hello,\n\nThis is a test email from the SEO AEO GEO Services website (Sociapa).\nSMTP configuration is working properly and leads will be delivered to ${to}.\n\nTimestamp: ${new Date().toISOString()}\nHost: ${host}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;padding:20px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#ff6a3d;margin-top:0">Sociapa Mail System Verified</h2>
          <p>This is a test email from the <b>SEO AEO GEO Services</b> website.</p>
          <p>SMTP configuration is working properly and all website form leads will be delivered to: <b>${to}</b></p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
          <p style="color:#718096;font-size:12px">Timestamp: ${new Date().toISOString()}<br/>SMTP Host: ${host}</p>
        </div>
      `,
    });

    console.log("✓ Test email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    if (info.response) console.log(`Server Response: ${info.response}`);
  } catch (err) {
    console.error("\n❌ SMTP Test Failed:", err.message);
    if (err.code) console.error(`Error Code: ${err.code}`);
    process.exit(1);
  }
}

runTest();
