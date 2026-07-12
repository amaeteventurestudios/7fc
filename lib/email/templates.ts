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
  const subject = "Verify your email for 7FC";
  const html = layout(subject, `
    <p style="margin-top:0;">Hi ${esc(firstName)},</p>
    <p>Thank you for your interest in 7FC. Before your Global 7 Wall submission can be reviewed, we need to verify your email address.</p>
    ${button(verifyUrl, "Verify Email")}
    <p style="font-size:13px;color:#9ca3af;">Or open this link:<br><a href="${esc(verifyUrl)}" style="color:#d4af5e;word-break:break-all;">${esc(verifyUrl)}</a></p>
    <p style="font-size:13px;color:#9ca3af;">This link expires in 24 hours and can be used once. Your submission remains private until it has been reviewed and approved — verification does not mean approval.</p>
    <p style="font-size:13px;color:#9ca3af;">If you didn't sign up, you can ignore this email and nothing will be published. Questions? <a href="mailto:support@sevenfc.net" style="color:#d4af5e;">support@sevenfc.net</a></p>`);
  const text = `Hi ${firstName},

Thank you for your interest in 7FC. Before your Global 7 Wall submission can be reviewed, we need to verify your email address:

${verifyUrl}

This link expires in 24 hours and can be used once. Your submission remains private until it has been reviewed and approved - verification does not mean approval.

If you didn't sign up, ignore this email and nothing will be published.

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
}): EmailContent {
  const subject = `Welcome to 7FC, Supporter #${opts.supporterNumber}`;
  const html = layout(subject, `
    <p style="margin-top:0;">Welcome, ${esc(opts.firstName)} — your submission has been approved.</p>
    <p style="font-size:22px;font-weight:900;color:#f0d492;text-align:center;margin:18px 0;">Supporter #${opts.supporterNumber}</p>
    <p>Country: <strong>${esc(opts.country)}</strong>${opts.era ? `<br>Favorite era: <strong>${esc(opts.era)}</strong>` : ""}</p>
    ${button(`${SITE_URL}/wall`, "Visit the Global 7 Wall")}
    <p style="font-size:13px;color:#9ca3af;">Need to view, correct, unpublish, or delete your entry? Request your private management link any time at <a href="${SITE_URL}/manage" style="color:#d4af5e;">${SITE_URL}/manage</a> — it is emailed to this address and works for one hour.</p>
    <p style="font-size:13px;color:#9ca3af;">Questions? <a href="mailto:support@sevenfc.net" style="color:#d4af5e;">support@sevenfc.net</a></p>`);
  const text = `Welcome, ${opts.firstName} - your submission has been approved.

You are Supporter #${opts.supporterNumber}.
Country: ${opts.country}${opts.era ? `\nFavorite era: ${opts.era}` : ""}

Global 7 Wall: ${SITE_URL}/wall

Need to view, correct, unpublish, or delete your entry? Request your private management link any time at ${SITE_URL}/manage - it is emailed to this address and works for one hour.

Support: support@sevenfc.net
${FOOTER_LINKS_TEXT}

${UNOFFICIAL}`;
  return { subject, html, text };
}

/** Owner alert for a CLEAN, auto-approved & published supporter.
 *  Contains only what the owner needs for after-the-fact moderation. */
export function ownerNewSupporterAlert(s: {
  supporterNumber: number;
  displayName: string;
  country: string;
  createdAt: string;
}): EmailContent {
  const subject = stripHeaderChars(
    `New 7FC Supporter: #${s.supporterNumber}, ${s.country}`
  );
  const rows: Array<[string, string]> = [
    ["Supporter number", `#${s.supporterNumber}`],
    ["Display name", s.displayName],
    ["Country", s.country],
    ["Signup time (UTC)", s.createdAt],
  ];
  const html = layout(subject, `
    <p style="margin-top:0;font-weight:bold;color:#f0d492;">A new supporter was automatically approved and is now live.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;color:#9ca3af;border-bottom:1px solid #1f2937;white-space:nowrap;">${esc(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #1f2937;">${esc(v)}</td></tr>`).join("")}
    </table>
    <p style="font-size:13px;color:#9ca3af;">Published entry: <a href="${SITE_URL}/wall" style="color:#d4af5e;">${SITE_URL}/wall</a></p>
    <p style="font-size:13px;color:#9ca3af;">Manage this record (Unpublish / Hide / Delete) in the protected admin area — available only after you sign in: <a href="${SITE_URL}/admin/supporters" style="color:#d4af5e;">${SITE_URL}/admin/supporters</a></p>`);
  const text = `A new 7FC supporter was automatically approved and is now live.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nPublished entry: ${SITE_URL}/wall\nManage (Unpublish/Hide/Delete, login required): ${SITE_URL}/admin/supporters`;
  return { subject, html, text };
}

/** Owner alert for a FLAGGED verified submission held in the review queue.
 *  Includes the internal flag reason (owner-only) but never sends a welcome. */
export function ownerReviewAlert(s: {
  supporterNumber: number;
  displayName: string;
  country: string;
  createdAt: string;
  flagReason: string;
}): EmailContent {
  const subject = "7FC Signup Requires Review";
  const rows: Array<[string, string]> = [
    ["Supporter number", `#${s.supporterNumber}`],
    ["Display name", s.displayName],
    ["Country", s.country],
    ["Signup time (UTC)", s.createdAt],
    ["Flagged reason (internal)", s.flagReason],
  ];
  const html = layout(subject, `
    <p style="margin-top:0;font-weight:bold;color:#f0d492;">A verified signup was held for your review and is not public.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;color:#9ca3af;border-bottom:1px solid #1f2937;white-space:nowrap;">${esc(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #1f2937;">${esc(v)}</td></tr>`).join("")}
    </table>
    <p style="font-size:13px;color:#9ca3af;">Approve, Reject, or Delete it in the protected admin area (login required): <a href="${SITE_URL}/admin/supporters" style="color:#d4af5e;">${SITE_URL}/admin/supporters</a></p>`);
  const text = `A verified 7FC signup was held for your review and is not public.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReview (Approve/Reject/Delete, login required): ${SITE_URL}/admin/supporters`;
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

/** Optional, respectful status notice when a submission is not approved.
 *  Never includes internal moderation notes. */
export function rejectionNotice(firstName: string): EmailContent {
  const subject = "An update on your 7FC submission";
  const body =
    "Thank you for your interest in 7FC. After review, your Global 7 Wall submission was not approved for publication, and it will not appear on the site. This can happen when a submission does not fit the Community Guidelines or the format of the Wall. You are welcome to submit again.";
  const html = layout(subject, `
    <p style="margin-top:0;">Hi ${esc(firstName)},</p>
    <p>${esc(body)}</p>
    <p style="font-size:13px;color:#9ca3af;">Community Guidelines: <a href="${SITE_URL}/community-guidelines" style="color:#d4af5e;">${SITE_URL}/community-guidelines</a><br>Questions? <a href="mailto:support@sevenfc.net" style="color:#d4af5e;">support@sevenfc.net</a></p>`);
  const text = `Hi ${firstName},\n\n${body}\n\nCommunity Guidelines: ${SITE_URL}/community-guidelines\nSupport: support@sevenfc.net\n\n${UNOFFICIAL}`;
  return { subject, html, text };
}

/** Weekly owner digest — sent ONLY when unresolved flagged submissions or
 *  open reports exist. Never sent when there is nothing to review. */
export function reviewDigest(d: {
  flaggedCount: number;
  openReports: number;
}): EmailContent {
  const subject = "7FC Weekly Review Digest";
  const rows: Array<[string, string]> = [
    ["Flagged submissions awaiting review", String(d.flaggedCount)],
    ["Open entry reports", String(d.openReports)],
  ];
  const html = layout(subject, `
    <p style="margin-top:0;">You have items waiting in the 7FC moderation queue.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;color:#9ca3af;border-bottom:1px solid #1f2937;">${esc(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #1f2937;font-weight:bold;">${esc(v)}</td></tr>`).join("")}
    </table>
    <p style="font-size:13px;color:#9ca3af;">Review in the protected admin area (login required): <a href="${SITE_URL}/admin/supporters" style="color:#d4af5e;">${SITE_URL}/admin/supporters</a></p>`);
  const text = `You have items waiting in the 7FC moderation queue.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReview (login required): ${SITE_URL}/admin/supporters`;
  return { subject, html, text };
}
