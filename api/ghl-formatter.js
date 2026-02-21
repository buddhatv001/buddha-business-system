/**
 * ghl-formatter.js — Build GoHighLevel-ready payloads
 */

const PIPELINE_ID = process.env.GHL_PIPELINE_ID || "49F7RFQVknBq6KczBYgD";

const STAGE_IDS = {
  prayer: process.env.GHL_STAGE_NEW_PROSPECT || "b5cbe3d1",
  health: process.env.GHL_STAGE_NEW_PROSPECT || "b5cbe3d1",
  education: process.env.GHL_STAGE_NEW_PROSPECT || "b5cbe3d1",
  tree: process.env.GHL_STAGE_NEW_PROSPECT || "b5cbe3d1",
  hospital: process.env.GHL_STAGE_NEW_PROSPECT || "b5cbe3d1"
};

function buildGHLPayload(classification, prayer, offers) {
  return {
    // Contact update fields
    contact_update: {
      tags: [
        ...(classification.health_tags || []),
        ...(classification.education_tags || []),
        ...(classification.spiritual_tags || []),
        `prayer-${classification.prayer_category || "general"}`,
        `score-${classification.lead_quality_score || 5}`,
        `urgency-${classification.urgency || "low"}`,
        "prayer-outreach-prospect"
      ],
      customFields: [
        { key: "prayer_focus", field_value: classification.prayer_category || "general" },
        { key: "source_campaign", field_value: "prayer-outreach" }
      ]
    },
    // Pipeline opportunity
    opportunity: {
      pipeline_id: PIPELINE_ID,
      stage_id: STAGE_IDS[classification.primary_pipeline] || STAGE_IDS.prayer,
      monetary_value: estimateLifetimeValue(classification),
      source: "prayer_funnel",
      title: `Prayer Lead — ${classification.summary || "New Contact"}`
    },
    // Notes to add
    notes: `AI Classification: ${classification.summary || "N/A"}\n` +
           `Lead Score: ${classification.lead_quality_score || 5}/10\n` +
           `Urgency: ${classification.urgency || "low"}\n` +
           `Prayer Category: ${classification.prayer_category || "general"}\n` +
           `Recommended Products: ${offers.map(o => o.name).join(", ")}`,
    // Email to send
    email: {
      subject: prayer.subject,
      body: prayer.body,
      template_id: `prayer_${classification.prayer_category || "general"}_template`
    },
    // Tasks to create
    tasks: buildTasks(classification)
  };
}

function getPipelineId(pipeline) {
  // All currently route to the single Prayer Outreach pipeline
  return PIPELINE_ID;
}

function estimateLifetimeValue(c) {
  let value = 27; // Base tree
  if (c.education_tags && c.education_tags.length > 0) {
    if (c.education_tags.includes("edu-phd")) value += 15000;
    else if (c.education_tags.includes("edu-mba")) value += 7500;
    else value += 5000;
  }
  if (c.health_tags && c.health_tags.length > 0) value += 500;
  if ((c.lead_quality_score || 5) >= 8) value = Math.round(value * 1.5);
  return Math.round(value);
}

function buildTasks(c) {
  const tasks = [];
  if (c.needs_doctor_booking) {
    tasks.push({ title: "Book Ayurvedic Consult", assignee: "hospital_team", due: "+1day", priority: "high" });
  }
  if (c.needs_enrollment_call) {
    tasks.push({ title: "Schedule Enrollment Call", assignee: "enrollment_team", due: "+2days", priority: "medium" });
  }
  if (c.is_urgent) {
    tasks.push({ title: "URGENT: Review Prayer Request — Crisis Possible", assignee: "admin", due: "+1hour", priority: "urgent" });
  }
  return tasks;
}

module.exports = { buildGHLPayload, getPipelineId, estimateLifetimeValue };
