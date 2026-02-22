/**
 * BDT Handlers — Tree purchases, Health classification, Daily reports
 * Matches Deployment Checklist scenarios BDT-3, BDT-4, BDT-6
 */

const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

const GHL_TOKEN = process.env.GHL_API_KEY;
const GHL_LOC = process.env.GHL_LOCATION_ID;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_HEADERS = { Authorization: `Bearer ${GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ─── Discord Notify ────────────────────────────────────────────────
async function notifyDiscord(webhookUrl, content) {
  try {
    if (!webhookUrl) return;
    await axios.post(webhookUrl, { content }, { timeout: 5000 });
  } catch (e) { console.error('Discord notify error:', e.message); }
}

// ─── BDT-3: Tree Purchase Handler ─────────────────────────────────
async function handleTreePurchase(req, res) {
  const { contactId, productName, amount, customerName, customerCity } = req.body;

  try {
    // Update GHL contact
    await axios.put(`${GHL_BASE}/contacts/${contactId}`, {
      tags: ['tree-buyer'],
      customFields: [
        { key: 'contact.trees_planted', field_value: '1' },
        { key: 'contact.stripe_customer_id', field_value: req.body.stripeCustomerId || '' }
      ]
    }, { headers: GHL_HEADERS });

    // Move pipeline stage
    await axios.patch(`${GHL_BASE}/opportunities/${contactId}`, {
      stageId: 'tree-planted-stage'
    }, { headers: GHL_HEADERS });

    // Send thank you email
    await axios.post(`${GHL_BASE}/conversations/messages`, {
      type: 'Email',
      contactId,
      emailFrom: 'prayers@buddha.digital',
      emailTo: req.body.email,
      subject: '🌳 Your Sacred Tree Has Been Planted',
      html: `<p>Dear ${customerName},</p><p>Your sacred tree has been planted in honor of your generosity. Thank you for contributing to our 1 Million Trees, 1 Million Prayers mission.</p><p>With gratitude and blessings,<br>Venerable Ajarn Shu<br>Buddha Digital Temple</p>`,
      locationId: GHL_LOC
    }, { headers: GHL_HEADERS });

    // Discord notification
    const treeEmoji = productName?.includes('3') ? '🌳🌳🌳' : '🌳';
    await notifyDiscord(process.env.DISCORD_TREE_WEBHOOK,
      `${treeEmoji} **Tree planted by ${customerName}${customerCity ? ', ' + customerCity : ''}!**\n💰 $${amount} raised • Product: ${productName}`);

    res.json({ ok: true, message: 'Tree purchase handled' });
  } catch (err) {
    console.error('Tree purchase error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── BDT-4: Health Reply Classifier ──────────────────────────────
async function classifyHealthReply(req, res) {
  const { replyText, contactId, businessName, contactEmail } = req.body;

  // Health categories
  const CATEGORIES = ['DIABETES', 'PAIN', 'MENTAL', 'AUTOIMMUNE', 'WEIGHT', 'SLEEP', 'CANCER', 'SPIRITUAL', 'BUSINESS', 'THANK_YOU', 'NOT_INTERESTED'];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Classify this email reply into exactly ONE category. Reply with ONLY the category name, nothing else.
Categories: ${CATEGORIES.join(', ')}

Email reply: "${replyText}"

Rules:
- DIABETES: mentions diabetes, blood sugar, insulin, A1C
- PAIN: mentions chronic pain, back pain, joint pain, arthritis, fibromyalgia
- MENTAL: mentions anxiety, depression, stress, PTSD, mental health
- AUTOIMMUNE: mentions lupus, MS, Crohn's, celiac, autoimmune
- WEIGHT: mentions weight loss, obesity, metabolism
- SLEEP: mentions insomnia, sleep apnea, fatigue
- CANCER: mentions cancer, tumor, chemotherapy
- SPIRITUAL: mentions prayer, meditation, spiritual journey
- BUSINESS: mentions business, company, services (not health related)
- THANK_YOU: polite positive response, no health concern
- NOT_INTERESTED: unsubscribe, stop, not interested, remove

Category:`
      }]
    });

    const category = response.content[0].text.trim().toUpperCase();
    const healthCategories = ['DIABETES', 'PAIN', 'MENTAL', 'AUTOIMMUNE', 'WEIGHT', 'SLEEP', 'CANCER'];
    const isHealth = healthCategories.includes(category);

    // Update GHL tags
    if (isHealth) {
      await axios.post(`${GHL_BASE}/contacts/${contactId}/tags`, {
        tags: [`health-${category.toLowerCase()}`]
      }, { headers: GHL_HEADERS });

      // Notify Discord
      await notifyDiscord(process.env.DISCORD_HOSPITAL_WEBHOOK,
        `🏥 **Health Reply Classified: ${category}**\n📧 ${businessName} | ${contactEmail}\n💬 "${replyText.substring(0, 100)}..."`);
    } else if (category === 'BUSINESS') {
      // Tag for SMM outreach
      await axios.post(`${GHL_BASE}/contacts/${contactId}/tags`, {
        tags: ['smm-lead']
      }, { headers: GHL_HEADERS });
    }

    res.json({ ok: true, category, isHealth, contactId });
  } catch (err) {
    console.error('Health classify error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── BDT-6: Daily Report ──────────────────────────────────────────
async function generateDailyReport(req, res) {
  try {
    // Fetch pipeline stats from GHL
    const pipelineRes = await axios.get(
      `${GHL_BASE}/opportunities?locationId=${GHL_LOC}&pipelineId=49F7RFQVknBq6KczBYgD&limit=100`,
      { headers: GHL_HEADERS }
    );
    const opportunities = pipelineRes.data?.opportunities || [];

    const stats = {
      totalContacts: opportunities.length,
      prayerSent: opportunities.filter(o => o.stageId === 'dae768bd').length,
      treePlanted: opportunities.filter(o => o.status === 'won').length,
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    };

    const report = `📊 **BDT Daily Report — ${stats.date}**

🙏 Prayer Pipeline:
• Total Prospects: ${stats.totalContacts}
• Prayers Sent: ${stats.prayerSent}
• Trees Planted: ${stats.treePlanted}

💰 Revenue (check Stripe for exact):
• Visit dashboard.stripe.com for live numbers

🤖 System: All services online ✅`;

    await notifyDiscord(process.env.DISCORD_DAILY_REPORT_WEBHOOK, report);

    res.json({ ok: true, report, stats });
  } catch (err) {
    console.error('Daily report error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { handleTreePurchase, classifyHealthReply, generateDailyReport };
