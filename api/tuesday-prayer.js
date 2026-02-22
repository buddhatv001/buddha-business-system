/**
 * tuesday-prayer.js — Tuesday Prayer Email + SMS Sender
 * Buddha Digital Temple
 *
 * Fetches all prayer-request tagged contacts from GHL
 * and sends the weekly Tuesday prayer email (+ SMS if available).
 *
 * Called by Make.com every Tuesday at scheduled time.
 */

const https = require("https");

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_FROM_EMAIL = process.env.GHL_FROM_EMAIL || "buddhabrainai@gmail.com";
const GHL_FROM_NAME = process.env.GHL_FROM_NAME || "Buddha Digital Temple";

const DEFAULT_ZOOM_LINK = process.env.TUESDAY_ZOOM_LINK || "https://us06web.zoom.us/meeting/register/gxS5Y774S4quGKfKbzz6Ag";
const WHATSAPP_GROUP = "https://chat.whatsapp.com/BQSLWdSkNJILBwAOJwN8Ru";

/**
 * Build the Tuesday prayer email HTML body
 */
function buildEmailBody(contact, zoomLink) {
  const firstName = contact.firstName || contact.name || "beloved friend";
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

<p>Dear ${firstName},</p>

<p>Your prayer has been received and is being held with care.</p>

<p>Tonight, <strong>Tuesday</strong>, we are offering a <strong>Live Prayer & Teaching</strong> led by an Ajarn and ordained monks. Your name and intention will be included in prayer, along with prayers for peace, healing, and well-being. A short teaching will also be shared.</p>

<p>If you feel called, you are warmly invited to join us live.</p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

<p><strong>Live Prayer Details</strong><br>
🗓 <strong>Tonight – Tuesday</strong><br>
🕗 <strong>8:00 PM Eastern Time</strong><br>
📍 <strong>Zoom link:</strong><br>
👉 <a href="${zoomLink}" style="color: #8B4513;">${zoomLink}</a></p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

<p>🙏 <strong>Water Prayer (Optional)</strong><br>
If you are able, please bring a glass or bottle of water with you. During the prayer, blessings will be offered so the water may be received with intention and compassion.</p>

<p>💬 <strong>Stay Connected (Optional)</strong><br>
You are also welcome to join our WhatsApp group, where we share prayer updates and invite others who may benefit from these offerings:<br>
👉 <a href="${WHATSAPP_GROUP}" style="color: #8B4513;">${WHATSAPP_GROUP}</a></p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

<p>There is nothing else you need to prepare. Simply come as you are.</p>

<p>If you cannot attend live, your prayer will still be included with care.</p>

<p>With peace and blessings,<br>
<strong>Buddha Digital Temple</strong> 🙏</p>

</body>
</html>`.trim();
}

/**
 * Build the Tuesday SMS body
 */
function buildSMSBody(zoomLink) {
  return `🙏 Live Prayer tonight (Tuesday) at 8:00 PM ET.
Please bring a glass or bottle of water for the water prayer.

Join here: ${zoomLink}
WhatsApp: ${WHATSAPP_GROUP}`;
}

/**
 * Make an HTTPS request (promisified)
 */
function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

/**
 * Fetch all GHL contacts with prayer-request tag (paginated)
 */
async function getPrayerContacts(tagFilter) {
  const contacts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const options = {
      hostname: "services.leadconnectorhq.com",
      path: `/contacts/?locationId=${GHL_LOCATION_ID}&limit=100&page=${page}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json"
      }
    };

    const result = await makeRequest(options);
    const batch = result.body.contacts || [];

    // Filter contacts that have the prayer-request tag AND have an email
    const filtered = batch.filter(c => {
      const hasPrayerTag = c.tags && c.tags.includes("prayer-request");
      const hasEmail = c.email && c.email.includes("@");
      if (tagFilter === "all") return hasEmail;
      return hasPrayerTag && hasEmail;
    });

    contacts.push(...filtered);

    const total = result.body.meta?.total || 0;
    if (contacts.length >= total || batch.length === 0) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return contacts;
}

/**
 * Send email to a single contact via GHL conversations API
 */
async function sendEmail(contact, zoomLink) {
  const body = {
    type: "Email",
    contactId: contact.id,
    emailFrom: `${GHL_FROM_NAME} <${GHL_FROM_EMAIL}>`,
    emailTo: contact.email,
    subject: "🙏 Tonight – Live Prayer & Teaching at 8:00 PM ET",
    html: buildEmailBody(contact, zoomLink),
    locationId: GHL_LOCATION_ID
  };

  const options = {
    hostname: "services.leadconnectorhq.com",
    path: "/conversations/messages",
    method: "POST",
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json"
    }
  };

  const result = await makeRequest(options, body);
  return result;
}

/**
 * Send SMS to a single contact via GHL conversations API
 */
async function sendSMS(contact, zoomLink) {
  if (!contact.phone) return { skipped: true, reason: "no phone" };

  const body = {
    type: "SMS",
    contactId: contact.id,
    message: buildSMSBody(zoomLink),
    fromNumber: process.env.GHL_FROM_PHONE || "+13139426576"
  };

  const options = {
    hostname: "services.leadconnectorhq.com",
    path: "/conversations/messages",
    method: "POST",
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json"
    }
  };

  const result = await makeRequest(options, body);
  return result;
}

/**
 * Main handler — called by Express route
 */
async function sendTuesdayPrayer(req, res) {
  const startTime = Date.now();
  const zoomLink = req.body?.zoomLink || req.query?.zoomLink || DEFAULT_ZOOM_LINK;
  const tagFilter = req.body?.tagFilter || "prayer-request"; // "prayer-request" or "all"
  const sendSMSFlag = req.body?.sendSMS !== false; // default true

  console.log(`[TUESDAY PRAYER] Starting send — zoom: ${zoomLink}, filter: ${tagFilter}, sms: ${sendSMSFlag}`);

  try {
    // 1. Fetch contacts
    const contacts = await getPrayerContacts(tagFilter);
    console.log(`[TUESDAY PRAYER] Found ${contacts.length} contacts to notify`);

    if (contacts.length === 0) {
      return res.json({
        success: true,
        message: "No contacts found matching criteria",
        sent: 0
      });
    }

    // 2. Send to each contact (with small delay to avoid rate limits)
    const results = { email: { sent: 0, failed: 0 }, sms: { sent: 0, skipped: 0, failed: 0 } };
    const errors = [];

    for (const contact of contacts) {
      try {
        // Send email
        const emailResult = await sendEmail(contact, zoomLink);
        if (emailResult.status === 200 || emailResult.status === 201) {
          results.email.sent++;
        } else {
          results.email.failed++;
          errors.push({ contactId: contact.id, email: contact.email, emailError: emailResult.body });
        }

        // Send SMS
        if (sendSMSFlag) {
          const smsResult = await sendSMS(contact, zoomLink);
          if (smsResult.skipped) {
            results.sms.skipped++;
          } else if (smsResult.status === 200 || smsResult.status === 201) {
            results.sms.sent++;
          } else {
            results.sms.failed++;
          }
        }

        // 100ms delay between contacts to respect rate limits
        await new Promise(r => setTimeout(r, 100));

      } catch (err) {
        results.email.failed++;
        errors.push({ contactId: contact.id, error: err.message });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[TUESDAY PRAYER] Done in ${duration}s — Email: ${results.email.sent} sent, ${results.email.failed} failed | SMS: ${results.sms.sent} sent, ${results.sms.skipped} skipped`);

    return res.json({
      success: true,
      summary: {
        totalContacts: contacts.length,
        email: results.email,
        sms: results.sms,
        durationSeconds: duration,
        zoomLink,
        sentAt: new Date().toISOString()
      },
      errors: errors.slice(0, 10) // first 10 errors only
    });

  } catch (error) {
    console.error(`[TUESDAY PRAYER ERROR] ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { sendTuesdayPrayer };
