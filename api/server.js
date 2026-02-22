/**
 * server.js — Buddha Business System API
 * Deploy to: Railway, Render, Vercel, or any Node.js host
 */
require("dotenv").config({ path: require("path").join(__dirname, "../config/.env") });
const express = require("express");
const { classifyApplication } = require("./classifier");
const { buildGHLPayload } = require("./ghl-formatter");
const { selectPrayerTemplate } = require("./prayer-router");
const { selectProductOffer } = require("./product-router");
const { sendTuesdayPrayer } = require("./tuesday-prayer");

const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Buddha Business System API",
    status: "running",
    version: "1.0.0",
    endpoints: [
      "POST /classify — Classify an application",
      "POST /webhook/make — Make.com webhook endpoint",
      "POST /webhook/ghl — GHL form submission webhook",
      "GET  /health — Health check",
      "GET  /products — Product catalog",
      "GET  /pipelines — Pipeline stage config",
      "POST /prayer/tuesday — Send Tuesday prayer email+SMS to all prayer-request contacts"
    ]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/products", (req, res) => {
  const { PRODUCT_CATALOG } = require("./product-router");
  res.json({ products: PRODUCT_CATALOG });
});

app.get("/pipelines", (req, res) => {
  res.json(require("../pipelines/pipeline-stages.json"));
});

app.post("/classify", async (req, res) => {
  try {
    const applicationData = req.body;
    console.log(`[CLASSIFY] ${applicationData.name || applicationData.full_name || "Unknown"} — ${applicationData.email || "no email"}`);

    const classification = await classifyApplication(applicationData);
    const prayer = selectPrayerTemplate(classification);
    const offers = selectProductOffer(classification);
    const ghlPayload = buildGHLPayload(classification, prayer, offers);

    res.json({
      success: true,
      classification,
      prayer,
      offers,
      ghl: ghlPayload,
      automation_instructions: {
        immediate_actions: buildImmediateActions(classification),
        day1_actions: buildDay1Actions(classification, offers),
        nurture_sequence: selectNurtureSequence(classification)
      }
    });
  } catch (error) {
    console.error(`[CLASSIFY ERROR] ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Make.com webhook — returns flattened format for Make modules
app.post("/webhook/make", async (req, res) => {
  try {
    const data = req.body;
    const classification = await classifyApplication(data);
    const prayer = selectPrayerTemplate(classification);
    const offers = selectProductOffer(classification);
    const ghlPayload = buildGHLPayload(classification, prayer, offers);

    res.json({
      contact_tags: [
        ...(classification.health_tags || []),
        ...(classification.education_tags || []),
        ...(classification.spiritual_tags || []),
        `prayer-${classification.prayer_category || "general"}`,
        `score-${classification.lead_quality_score || 5}`,
        "prayer-outreach-prospect"
      ],
      primary_pipeline: classification.primary_pipeline,
      lead_score: classification.lead_quality_score,
      prayer_subject: prayer.subject,
      prayer_greeting: prayer.greeting,
      prayer_body: prayer.body,
      prayer_closing: prayer.closing,
      prayer_signature: prayer.signature,
      prayer_category: classification.prayer_category,
      product_offers: offers,
      top_offer_name: offers[0]?.name,
      top_offer_price: offers[0]?.price,
      top_offer_link: offers[0]?.stripe_link,
      ghl_update: ghlPayload,
      needs_doctor_booking: classification.needs_doctor_booking,
      needs_enrollment_call: classification.needs_enrollment_call,
      is_urgent: classification.is_urgent,
      urgency: classification.urgency,
      estimated_ltv: ghlPayload.opportunity.monetary_value,
      notes: ghlPayload.notes,
      tasks: ghlPayload.tasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GHL native webhook (form submission trigger)
app.post("/webhook/ghl", async (req, res) => {
  try {
    // GHL sends different field names — normalize
    const data = {
      name: req.body.full_name || req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      business_name: req.body.company_name || req.body.business_name,
      prayer_request: req.body.prayer_request || req.body.message,
      health_concerns: req.body.health_concerns,
      education_interest: req.body.education_interest,
      tree_interest: req.body.tree_interest
    };

    const classification = await classifyApplication(data);
    const prayer = selectPrayerTemplate(classification);
    const offers = selectProductOffer(classification);
    const ghlPayload = buildGHLPayload(classification, prayer, offers);

    res.json({
      success: true,
      contactId: req.body.contact_id,
      classification,
      prayer,
      offers,
      ghl: ghlPayload
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function buildImmediateActions(c) {
  const actions = ["send_prayer_email", "add_tags", "create_opportunity"];
  if (c.is_urgent) actions.push("alert_admin_sms");
  if (c.needs_doctor_booking) actions.push("create_doctor_task");
  if (c.needs_enrollment_call) actions.push("create_enrollment_task");
  return actions;
}

function buildDay1Actions(c, offers) {
  const actions = ["send_tree_offer"];
  if (offers.some(o => o.sku === "BOOK-001" || o.sku === "BOOK-002")) {
    actions.push("send_book_recommendation");
  }
  actions.push("schedule_followup_sms");
  return actions;
}

function selectNurtureSequence(c) {
  if (c.primary_pipeline === "health") return "health-to-hospital";
  if (c.primary_pipeline === "education") return "education-to-enrollment";
  if (c.primary_pipeline === "hospital") return "health-to-hospital";
  return "prayer-to-tree";
}

// Tuesday Prayer — bulk email + SMS to all prayer-request contacts
app.post("/prayer/tuesday", sendTuesdayPrayer);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🕌 Buddha Business System running on port ${PORT}`);
});
