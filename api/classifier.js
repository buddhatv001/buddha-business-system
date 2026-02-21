/**
 * classifier.js — Claude AI Application Classifier
 * Takes raw form data → sends to Claude → returns structured classification
 */
require("dotenv").config({ path: require("path").join(__dirname, "../config/.env") });
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CLASSIFIER_SYSTEM_PROMPT = `You are the intake classifier for the Buddha Business Ecosystem.
You receive application/prayer request data and classify it for routing.

PROPERTIES:
1. Buddha University (buddhauniversity.org) — Bachelor's ($5K), PhD ($15K), Reiki & Vajra certs
2. Buddha Business School (buddhabusiness.school) — Spiritual MBA ($7,500)
3. Buddha Hospital (buddha.hospital) — Ayurvedic consults, supplements, healing

CLASSIFY INTO:
- health_tags: Array of health conditions mentioned (health-anxiety, health-diabetes, health-chronic-pain, health-cancer, health-addiction, health-insomnia, health-digestive, health-autoimmune, health-general)
- education_tags: Array of education interests (edu-bachelors, edu-phd, edu-mba, edu-reiki, edu-vajra, edu-meditation, edu-general)
- spiritual_tags: Array of spiritual interests (spirit-meditation, spirit-reiki, spirit-yoga, spirit-buddhism, spirit-interfaith, spirit-plant-medicine, spirit-healing)
- primary_pipeline: Which pipeline to route to (prayer, health, education, tree, hospital)
- lead_quality_score: 1-10 based on engagement signals
- urgency: low/medium/high/critical
- needs_doctor_booking: boolean — if health concern requires Ayurvedic consult
- needs_enrollment_call: boolean — if education interest warrants enrollment call
- is_urgent: boolean — if prayer request indicates crisis
- recommended_products: Array of product SKUs to offer
- prayer_category: grief/health/financial/relationship/spiritual/general
- summary: One-line summary of this contact

RESPOND ONLY IN VALID JSON. No markdown, no explanation.`;

async function classifyApplication(applicationData) {
  const userMessage = `Classify this application:
Name: ${applicationData.name || applicationData.full_name || "Unknown"}
Email: ${applicationData.email || "Not provided"}
Phone: ${applicationData.phone || "Not provided"}
Business: ${applicationData.business_name || applicationData.company || "Not provided"}
Prayer Request: ${applicationData.prayerRequest || applicationData.prayer_request || "None"}
Health Concerns: ${applicationData.healthConcerns || applicationData.health_concerns || "None"}
Education Interest: ${applicationData.educationInterest || applicationData.education_interest || "None"}
Tree Interest: ${applicationData.treeInterest || applicationData.tree_interest || "No"}
Additional Notes: ${applicationData.additionalNotes || applicationData.notes || "None"}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: CLASSIFIER_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }]
  });

  const text = response.content[0].text;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

module.exports = { classifyApplication };
