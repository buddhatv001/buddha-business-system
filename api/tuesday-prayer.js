/**
 * tuesday-prayer.js — 3-Day Prayer Sequence (Sunday → Monday → Tuesday)
 * Buddha Digital Temple
 *
 * Sunday  12 PM ET: "Join us Tuesday" — Save the date
 * Monday  12 PM ET: "Tomorrow" — Reminder + water prayer
 * Tuesday 12 PM ET: "Tonight" — Final call + Zoom link
 *
 * Sends to ALL contacts in GHL (prayer + health + hospital combined)
 */

const https = require("https");

const GHL_API_KEY     = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_FROM_EMAIL  = process.env.GHL_FROM_EMAIL  || "buddhabrainai@gmail.com";
const GHL_FROM_NAME   = process.env.GHL_FROM_NAME   || "Buddha Digital Temple";
const ZOOM_LINK       = process.env.TUESDAY_ZOOM_LINK || "https://us06web.zoom.us/meeting/register/gxS5Y774S4quGKfKbzz6Ag";
const WHATSAPP        = "https://chat.whatsapp.com/BQSLWdSkNJILBwAOJwN8Ru";

// ─── EMAIL TEMPLATES ─────────────────────────────────────────────────────────

function sundayEmail(contact, zoomLink) {
  const name = contact.firstName || "beloved friend";
  return {
    subject: "🙏 Join Us This Tuesday — Live Prayer & Teaching at 8 PM ET",
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
<p>Dear ${name},</p>
<p>We wanted to reach out and let you know that this <strong>Tuesday evening</strong> we will be hosting a <strong>Live Prayer & Teaching</strong> — and you are warmly invited.</p>
<p>The prayer will be led by an Ajarn and ordained monks. Your name and intention will be included, along with prayers for peace, healing, and well-being.</p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p><strong>📅 This Tuesday</strong><br>
🕗 <strong>8:00 PM Eastern Time</strong><br>
📍 Online via Zoom</p>
<p>We will be sending you the Zoom link on Monday as a reminder.</p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p>🙏 <strong>Water Prayer</strong><br>
You may wish to prepare a glass or bottle of water ahead of time. During the prayer, blessings will be offered over the water with intention and compassion.</p>
<p>💬 <strong>Stay Connected</strong><br>
Join our WhatsApp group for prayer updates:<br>
👉 <a href="${WHATSAPP}" style="color:#8B4513;">${WHATSAPP}</a></p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p>Simply come as you are. There is nothing to prepare.</p>
<p>With peace and blessings,<br><strong>Buddha Digital Temple</strong> 🙏</p>
</body></html>`
  };
}

function mondayEmail(contact, zoomLink) {
  const name = contact.firstName || "beloved friend";
  return {
    subject: "🙏 Tomorrow — Live Prayer & Teaching | Tuesday 8 PM ET",
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
<p>Dear ${name},</p>
<p>Just a gentle reminder — <strong>tomorrow is Tuesday</strong>, and we are holding our weekly <strong>Live Prayer & Teaching</strong> at <strong>8:00 PM Eastern Time</strong>.</p>
<p>Your prayer intention is being held with care. An Ajarn and ordained monks will be leading the session, and your name will be included in the prayers.</p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p><strong>Live Prayer Details</strong><br>
🗓 <strong>Tomorrow — Tuesday</strong><br>
🕗 <strong>8:00 PM Eastern Time</strong><br>
📍 <strong>Zoom link:</strong><br>
👉 <a href="${zoomLink}" style="color:#8B4513;">${zoomLink}</a></p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p>🙏 <strong>Water Prayer (Optional)</strong><br>
If you are able, please set aside a glass or bottle of water before the session. During prayer, blessings will be offered so the water may carry intention and healing.</p>
<p>💬 <strong>WhatsApp Group</strong><br>
👉 <a href="${WHATSAPP}" style="color:#8B4513;">${WHATSAPP}</a></p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p>We look forward to being with you in prayer. Simply come as you are.</p>
<p>With peace and blessings,<br><strong>Buddha Digital Temple</strong> 🙏</p>
</body></html>`
  };
}

function tuesdayEmail(contact, zoomLink) {
  const name = contact.firstName || "beloved friend";
  return {
    subject: "🙏 Tonight — Live Prayer & Teaching at 8:00 PM ET",
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
<p>Dear ${name},</p>
<p>Your prayer has been received and is being held with care.</p>
<p>Tonight, <strong>Tuesday</strong>, we are offering a <strong>Live Prayer & Teaching</strong> led by an Ajarn and ordained monks. Your name and intention will be included in prayer, along with prayers for peace, healing, and well-being. A short teaching will also be shared.</p>
<p>If you feel called, you are warmly invited to join us live.</p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p><strong>Live Prayer Details</strong><br>
🗓 <strong>Tonight — Tuesday</strong><br>
🕗 <strong>8:00 PM Eastern Time</strong><br>
📍 <strong>Zoom link:</strong><br>
👉 <a href="${zoomLink}" style="color:#8B4513;">${zoomLink}</a></p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p>🙏 <strong>Water Prayer (Optional)</strong><br>
If you are able, please bring a glass or bottle of water with you. During the prayer, blessings will be offered so the water may be received with intention and compassion.</p>
<p>💬 <strong>Stay Connected (Optional)</strong><br>
Join our WhatsApp group:<br>
👉 <a href="${WHATSAPP}" style="color:#8B4513;">${WHATSAPP}</a></p>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p>There is nothing else you need to prepare. Simply come as you are.</p>
<p>If you cannot attend live, your prayer will still be included with care.</p>
<p>With peace and blessings,<br><strong>Buddha Digital Temple</strong> 🙏</p>
</body></html>`
  };
}

// SMS templates
function sundaySMS(zoomLink) {
  return `🙏 Buddha Digital Temple: Join us THIS Tuesday at 8PM ET for Live Prayer & Teaching.\nBring a glass of water for blessings.\nDetails coming Monday!\nWhatsApp: ${WHATSAPP}`;
}
function mondaySMS(zoomLink) {
  return `🙏 TOMORROW — Live Prayer Tuesday 8PM ET.\nBring water for blessing.\nZoom: ${zoomLink}\nWhatsApp: ${WHATSAPP}`;
}
function tuesdaySMS(zoomLink) {
  return `🙏 TONIGHT — Live Prayer 8PM ET.\nPlease bring a glass of water for blessing.\nJoin: ${zoomLink}\nWhatsApp: ${WHATSAPP}`;
}

// ─── SHARED UTILITIES ─────────────────────────────────────────────────────────

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

async function getAllContacts() {
  const contacts = [];
  let startAfterId = null;
  let page = 0;

  while (true) {
    page++;
    let path = `/contacts/?locationId=${GHL_LOCATION_ID}&limit=100`;
    if (startAfterId) path += `&startAfterId=${startAfterId}`;

    const result = await makeRequest({
      hostname: "services.leadconnectorhq.com",
      path,
      method: "GET",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json"
      }
    });

    const batch = result.body.contacts || [];
    const total = result.body.meta?.total || 0;
    console.log(`[GHL FETCH] Page ${page}: ${batch.length} contacts (total: ${total})`);

    // Include all contacts with a valid email
    const eligible = batch.filter(c => c.email && c.email.includes("@"));
    contacts.push(...eligible);

    if (batch.length < 100 || contacts.length >= total) break;
    startAfterId = batch[batch.length - 1].id;
  }

  console.log(`[GHL FETCH] Complete — ${contacts.length} eligible contacts`);
  return contacts;
}

async function sendEmailToContact(contact, template) {
  const { subject, html } = template(contact, ZOOM_LINK);
  return makeRequest({
    hostname: "services.leadconnectorhq.com",
    path: "/conversations/messages",
    method: "POST",
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json"
    }
  }, {
    type: "Email",
    contactId: contact.id,
    emailFrom: `${GHL_FROM_NAME} <${GHL_FROM_EMAIL}>`,
    emailTo: contact.email,
    subject,
    html,
    locationId: GHL_LOCATION_ID
  });
}

async function sendSMSToContact(contact, smsBody) {
  if (!contact.phone) return { skipped: true };
  return makeRequest({
    hostname: "services.leadconnectorhq.com",
    path: "/conversations/messages",
    method: "POST",
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: "2021-07-28",
      "Content-Type": "application/json"
    }
  }, {
    type: "SMS",
    contactId: contact.id,
    message: smsBody,
    fromNumber: process.env.GHL_FROM_PHONE || "+13139426576"
  });
}

// ─── CORE BLAST HANDLER ───────────────────────────────────────────────────────

async function sendPrayerBlast(day, req, res) {
  const startTime = Date.now();
  const sendSMSFlag = req?.body?.sendSMS !== false;
  console.log(`[PRAYER BLAST] Day: ${day} | SMS: ${sendSMSFlag}`);

  const emailTemplate = day === "sunday"  ? sundayEmail
                      : day === "monday"  ? mondayEmail
                      :                    tuesdayEmail;
  const smsTemplate   = day === "sunday"  ? sundaySMS
                      : day === "monday"  ? mondaySMS
                      :                    tuesdaySMS;

  try {
    const contacts = await getAllContacts();
    if (contacts.length === 0) {
      return res?.json({ success: true, message: "No contacts found", sent: 0 });
    }

    const results = { email: { sent: 0, failed: 0 }, sms: { sent: 0, skipped: 0, failed: 0 } };
    const errors  = [];

    for (const contact of contacts) {
      try {
        const emailResult = await sendEmailToContact(contact, emailTemplate);
        if (emailResult.status === 200 || emailResult.status === 201) {
          results.email.sent++;
        } else {
          results.email.failed++;
          if (errors.length < 10) errors.push({ email: contact.email, err: emailResult.body?.message });
        }

        if (sendSMSFlag) {
          const smsResult = await sendSMSToContact(contact, smsTemplate(ZOOM_LINK));
          if (smsResult.skipped)                                      results.sms.skipped++;
          else if (smsResult.status === 200 || smsResult.status === 201) results.sms.sent++;
          else                                                         results.sms.failed++;
        }

        await new Promise(r => setTimeout(r, 100)); // 100ms rate limit
      } catch (err) {
        results.email.failed++;
        if (errors.length < 10) errors.push({ email: contact.email, err: err.message });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary  = { day, totalContacts: contacts.length, email: results.email, sms: results.sms, durationSeconds: duration, sentAt: new Date().toISOString(), zoomLink: ZOOM_LINK };
    console.log(`[PRAYER BLAST] ${day} done in ${duration}s — ✉️ ${results.email.sent}/${contacts.length} sent`);

    return res?.json({ success: true, summary, errors });
  } catch (error) {
    console.error(`[PRAYER BLAST ERROR] ${error.message}`);
    return res?.status(500).json({ success: false, error: error.message });
  }
}

// ─── EXPRESS ROUTE HANDLERS ───────────────────────────────────────────────────

const sendSundayPrayer  = (req, res) => sendPrayerBlast("sunday",  req, res);
const sendMondayPrayer  = (req, res) => sendPrayerBlast("monday",  req, res);
const sendTuesdayPrayer = (req, res) => sendPrayerBlast("tuesday", req, res);

// ─── CRON AUTO-FIRE (called from server.js) ───────────────────────────────────

async function fireSundayCron()  { await sendPrayerBlast("sunday",  { body: { sendSMS: true } }, makeMockRes("Sunday"));  }
async function fireMondayCron()  { await sendPrayerBlast("monday",  { body: { sendSMS: true } }, makeMockRes("Monday"));  }
async function fireTuesdayCron() { await sendPrayerBlast("tuesday", { body: { sendSMS: true } }, makeMockRes("Tuesday")); }

function makeMockRes(label) {
  return {
    json:   (d) => console.log(`[CRON] ${label} result:`, JSON.stringify(d.summary || d)),
    status: (c) => ({ json: (d) => console.error(`[CRON] ${label} error ${c}:`, d) })
  };
}

module.exports = { sendSundayPrayer, sendMondayPrayer, sendTuesdayPrayer, fireSundayCron, fireMondayCron, fireTuesdayCron };
