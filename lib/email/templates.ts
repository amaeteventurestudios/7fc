/**
 * Transactional email templates (HTML + plain text).
 * All user-supplied values MUST pass through esc() before HTML rendering.
 * No affiliate, promotional, or marketing content belongs in these messages.
 */
import { SITE_URL } from "@/lib/site";

export const FROM_NOTIFICATIONS = "7FC Notifications <notifications@sevenfc.net>";
export const REPLY_TO_SUPPORT = "support@sevenfc.net";
export const REPLY_TO_CONTACT = "contact@sevenfc.net";
export const OWNER_ALERTS_TO = "admin@sevenfc.net";

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip CR/LF so user text can never inject email headers. */
export function stripHeaderChars(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

const UNOFFICIAL =
  "7FC is an independent, unofficial fan community. It is not affiliated with or endorsed by Cristiano Ronaldo, CR7, any club, league, federation, retailer, manufacturer, marketplace, or other rights holder.";

const FOOTER_LINKS_TEXT = `Terms: ${SITE_URL}/terms\nPrivacy: ${SITE_URL}/privacy\nSupport: support@sevenfc.net`;

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#05070f;font-family:Arial,Helvetica,sans-serif;">
<div role="article" aria-label="${esc(title)}" style="max-width:560px;margin:0 auto;padding:32px 20px;">
  <p style="font-size:26px;font-weight:900;color:#d4af5e;margin:0 0 4px;">7FC</p>
  <p style="font-size:10px;letter-spacing:4px;color:#8a7a4e;text-transform:uppercase;margin:0 0 28px;">Seven FC</p>
  <div style="background:#0a1024;border:1px solid #3d3624;border-radius:10px;padding:28px 24px;color:#e5e7eb;font-size:15px;line-height:1.65;">
    ${bodyHtml}
  </div>
  <p style="font-size:11px;color:#6b7280;line-height:1.6;margin:22px 0 0;">${UNOFFICIAL}</p>
  <p style="font-size:11px;color:#6b7280;margin:10px 0 0;">
    <a href="${SITE_URL}/terms" style="color:#d4af5e;">Terms of Use</a> ·
    <a href="${SITE_URL}/privacy" style="color:#d4af5e;">Privacy Policy</a> ·
    <a href="mailto:support@sevenfc.net" style="color:#d4af5e;">support@sevenfc.net</a>
  </p>
  <p style="font-size:11px;color:#4b5563;margin:10px 0 0;">© ${new Date().getUTCFullYear()} 7FC. All rights reserved. Independent unofficial fan community.</p>
</div>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="text-align:center;margin:26px 0;"><a href="${esc(href)}" style="display:inline-block;background:#d4af5e;color:#0a1024;font-weight:bold;text-transform:uppercase;letter-spacing:2px;font-size:13px;padding:14px 30px;border-radius:6px;text-decoration:none;">${esc(label)}</a></p>`;

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function verificationEmail(firstName: string, verifyUrl: string): EmailContent {
  const subject = "Confirm your place in 7FC";
  const html = layout(subject, `
    <p style="margin-top:0;">Hi ${esc(firstName)},</p>
    <p>Thanks for raising your 7. One step remains: confirm your email address so we know this signup is really yours. Your entry cannot join the Global 7 Wall until it is verified.</p>
    ${button(verifyUrl, "Confirm my email")}
    <p style="font-size:13px;color:#9ca3af;">Or open this link:<br><a href="${esc(verifyUrl)}" style="color:#d4af5e;word-break:break-all;">${esc(verifyUrl)}</a></p>
    <p style="font-size:13px;color:#9ca3af;">This link expires in 24 hours and can be used once. If you didn't request this, you can ignore this email and no entry will be published.</p>
    <p style="font-size:13px;color:#9ca3af;">Questions? Email <a href="mailto:support@sevenfc.net" style="color:#d4af5e;">support@sevenfc.net</a>.</p>`);
  const text = `Hi ${firstName},

Thanks for raising your 7. Confirm your email address to complete your Global 7 Wall signup:

${verifyUrl}

This link expires in 24 hours and can be used once. If you didn't request this, ignore this email and no entry will be published.

Support: support@sevenfc.net
${FOOTER_LINKS_TEXT}

${UNOFFICIAL}`;
  return { subject, html, text };
}

export function welcomeEmail(opts: {
  firstName: string;
  supporterNumber: number;
  country: string;
  era: string | null;
  displayConsent: boolean;
  underReview: boolean;
  manageUrl: string;
}): EmailContent {
  const subject = `Welcome to 7FC. You are Supporter #${opts.supporterNumber}`;
  const displayLine = opts.displayConsent
    ? opts.underReview
      ? "Your entry is in moderation review and will appear on the public Global 7 Wall once approved."
      : "Your entry appears on the public Global 7 Wall."
    : "You chose not to display your entry publicly, so it stays private.";
  const html = layout(subject, `
    <p style="margin-top:0;">Welcome, ${esc(opts.firstName)}.</p>
    <p style="font-size:22px;font-weight:900;color:#f0d492;text-align:center;margin:18px 0;">Supporter #${opts.supporterNumber}</p>
    <p>Country: <strong>${esc(opts.country)}</strong>${opts.era ? `<br>Favorite era: <strong>${esc(opts.era)}</strong>` : ""}</p>
    <p>${esc(displayLine)}</p>
    ${button(`${SITE_URL}/wall`, "Visit the Global 7 Wall")}
    <p style="font-size:13px;color:#9ca3af;">Manage your entry — view, correct, unpublish, or delete your information — with your private link (expires in 1 hour; request a new one any time at ${SITE_URL}/manage):<br><a href="${esc(opts.manageUrl)}" style="color:#d4af5e;word-break:break-all;">${esc(opts.manageUrl)}</a></p>
    <p style="font-size:13px;color:#9ca3af;">Your email address and any last name you provided stay private unless you explicitly chose otherwise. Support: <a href="mailto:support@sevenfc.net" style="color:#d4af5e;">support@sevenfc.net</a></p>`);
  const text = `Welcome, ${opts.firstName}.

You are Supporter #${opts.supporterNumber}.
Country: ${opts.country}${opts.era ? `\nFavorite era: ${opts.era}` : ""}

${displayLine}

Global 7 Wall: ${SITE_URL}/wall

Manage your entry (view, correct, unpublish, delete) with this private link (expires in 1 hour; request a new one at ${SITE_URL}/manage):
${opts.manageUrl}

Your email and any last name stay private unless you explicitly chose otherwise.

Support: support@sevenfc.net
${FOOTER_LINKS_TEXT}

${UNOFFICIAL}`;
  return { subject, html, text };
}

export function ownerSignupAlert(s: {
  supporterNumber: number;
  firstName: string;
  lastName: string | null;
  email: string;
  country: string;
  era: string | null;
  message: string | null;
  displayConsent: boolean;
  marketingConsent: boolean;
  verifiedAt: string;
  status: string;
  createdAt: string;
}): EmailContent {
  const subject = stripHeaderChars(
    `New 7FC Supporter: #${s.supporterNumber}: ${s.country}`
  );
  const rows: Array<[string, string]> = [
    ["Supporter number", `#${s.supporterNumber}`],
    ["First name", s.firstName],
    ["Last name", s.lastName || "—"],
    ["Email (private)", s.email],
    ["Country", s.country],
    ["Favorite era", s.era || "—"],
    ["Message", s.message || "—"],
    ["Public display consent", s.displayConsent ? "Yes" : "No"],
    ["Marketing consent", s.marketingConsent ? "Yes" : "No"],
    ["Email verified (UTC)", s.verifiedAt],
    ["Moderation status", s.status],
    ["Signup time (UTC)", s.createdAt],
  ];
  const html = layout(subject, `
    <p style="margin-top:0;font-weight:bold;color:#f0d492;">New verified supporter signup</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;color:#9ca3af;border-bottom:1px solid #1f2937;white-space:nowrap;">${esc(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #1f2937;">${esc(v)}</td></tr>`).join("")}
    </table>
    <p style="font-size:13px;color:#9ca3af;">Review in the protected admin area: <a href="${SITE_URL}/admin" style="color:#d4af5e;">${SITE_URL}/admin</a> (login required).</p>`);
  const text = `New verified 7FC supporter signup\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReview (login required): ${SITE_URL}/admin`;
  return { subject, html, text };
}

export function contactAcknowledgment(name: string, category: string): EmailContent {
  const subject = "7FC has received your message";
  const body =
    "Thank you for contacting 7FC. Your message has been received and routed to the appropriate inbox. We review every submission, but we cannot guarantee a response to every message.";
  const html = layout(subject, `
    <p style="margin-top:0;">Hi ${esc(name)},</p>
    <p>${esc(body)}</p>
    <p style="font-size:13px;color:#9ca3af;">Category: ${esc(category)}</p>`);
  const text = `Hi ${name},\n\n${body}\n\nCategory: ${category}\n\n${FOOTER_LINKS_TEXT}\n\n${UNOFFICIAL}`;
  return { subject, html, text };
}

export function contactAlert(c: {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}): EmailContent {
  const subject = stripHeaderChars(`7FC contact form: [${c.category}] ${c.subject}`);
  const html = layout(subject, `
    <p style="margin-top:0;font-weight:bold;color:#f0d492;">New contact submission</p>
    <p style="font-size:14px;color:#9ca3af;">From: ${esc(c.name)} &lt;${esc(c.email)}&gt;<br>Category: ${esc(c.category)}<br>Subject: ${esc(c.subject)}</p>
    <p style="white-space:pre-wrap;">${esc(c.message)}</p>`);
  const text = `New 7FC contact submission\n\nFrom: ${c.name} <${c.email}>\nCategory: ${c.category}\nSubject: ${c.subject}\n\n${c.message}`;
  return { subject, html, text };
}

export function privacyRequestVerification(requestType: string, verifyUrl: string): EmailContent {
  const subject = "Verify your 7FC privacy request";
  const html = layout(subject, `
    <p style="margin-top:0;">We received a privacy request (${esc(requestType)}) for this email address. To protect your information, please confirm that you made this request.</p>
    ${button(verifyUrl, "Verify my request")}
    <p style="font-size:13px;color:#9ca3af;">Or open this link:<br><a href="${esc(verifyUrl)}" style="color:#d4af5e;word-break:break-all;">${esc(verifyUrl)}</a></p>
    <p style="font-size:13px;color:#9ca3af;">This link expires in 24 hours. If you did not make this request, ignore this email — nothing will change and no data will be disclosed.</p>`);
  const text = `We received a privacy request (${requestType}) for this email address.\n\nConfirm it here (expires in 24 hours):\n${verifyUrl}\n\nIf you did not make this request, ignore this email — nothing will change and no data will be disclosed.\n\n${UNOFFICIAL}`;
  return { subject, html, text };
}

export function privacyRequestAcknowledgment(requestType: string): EmailContent {
  const subject = "Your 7FC privacy request has been verified";
  const body = `Your privacy request (${requestType}) has been verified and queued for processing. We will follow up at this address. Requests are handled by privacy@sevenfc.net.`;
  const html = layout(subject, `<p style="margin-top:0;">${esc(body)}</p>`);
  const text = `${body}\n\n${UNOFFICIAL}`;
  return { subject, html, text };
}

export function privacyOwnerAlert(r: {
  id: string;
  requestType: string;
  email: string;
  details: string | null;
}): EmailContent {
  const subject = stripHeaderChars(`7FC privacy request: ${r.requestType}`);
  const html = layout(subject, `
    <p style="margin-top:0;font-weight:bold;color:#f0d492;">Verified privacy request</p>
    <p style="font-size:14px;">Type: ${esc(r.requestType)}<br>Requester: ${esc(r.email)}<br>Request ID: ${esc(r.id)}</p>
    ${r.details ? `<p style="white-space:pre-wrap;font-size:14px;">${esc(r.details)}</p>` : ""}`);
  const text = `Verified 7FC privacy request\n\nType: ${r.requestType}\nRequester: ${r.email}\nRequest ID: ${r.id}\n${r.details ? `\n${r.details}` : ""}`;
  return { subject, html, text };
}

export function managementLinkEmail(manageUrl: string): EmailContent {
  const subject = "Your 7FC supporter management link";
  const html = layout(subject, `
    <p style="margin-top:0;">You (or someone using this email address) requested a private link to manage your 7FC Global 7 Wall entry.</p>
    ${button(manageUrl, "Manage my entry")}
    <p style="font-size:13px;color:#9ca3af;">Or open this link:<br><a href="${esc(manageUrl)}" style="color:#d4af5e;word-break:break-all;">${esc(manageUrl)}</a></p>
    <p style="font-size:13px;color:#9ca3af;">This link expires in 1 hour. If you didn't request it, you can safely ignore this email — nothing changes without this link.</p>`);
  const text = `You (or someone using this email address) requested a private link to manage your 7FC Global 7 Wall entry.

Manage your entry (expires in 1 hour):
${manageUrl}

If you didn't request it, ignore this email — nothing changes without this link.

Support: support@sevenfc.net`;
  return { subject, html, text };
}
