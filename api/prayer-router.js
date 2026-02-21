/**
 * prayer-router.js — Select prayer template based on classification
 */

const PRAYER_TEMPLATES = {
  grief: {
    subject: "A Prayer for Your Heart — From Buddha Digital Temple",
    greeting: "Beloved one,",
    body: `In this moment of profound loss, we hold space for your grief.

The Buddha taught that attachment brings suffering, but love — true love — transcends even death.

Your loved one's energy has not disappeared. It has transformed, like water becoming clouds becoming rain.

We have planted a sacred tree in their honor. As it grows, may it remind you that life continues, transforms, and returns in ways we cannot always see.`,
    closing: "With deepest compassion and prayer,",
    signature: "The Prayer Ministry — Buddha Digital Temple"
  },

  health: {
    subject: "Healing Prayers Sent — Buddha Digital Temple",
    greeting: "Dear {name},",
    body: `The Medicine Buddha holds a lapis lazuli jar containing the medicine for all suffering.

We have spoken your name in our healing meditation today.

Your body has an innate wisdom — the same intelligence that heals a cut without your conscious effort. We pray that this wisdom activates fully, that inflammation subsides, that peace flows through every cell.

Our Ayurvedic physician, Dr. Hubbard, is available for a complimentary consultation if you'd like to explore holistic healing alongside your current care.`,
    closing: "In healing light,",
    signature: "The Prayer Ministry — Buddha Digital Temple"
  },

  financial: {
    subject: "Abundance Prayers Activated — Buddha Digital Temple",
    greeting: "Dear {name},",
    body: `The Buddha did not teach poverty. He taught non-attachment — which is very different.

You deserve abundance. Your family deserves security. Your dreams deserve funding.

We have activated the Jambhala (Wealth Buddha) mantra in your name today.

Remember: wealth flows to those who serve. Your prayer tells us you are ready to serve at a higher level.

Consider planting a sacred tree ($27) as a seed of your new abundance. Every seed planted in faith returns multiplied.`,
    closing: "In abundant blessings,",
    signature: "The Prayer Ministry — Buddha Digital Temple"
  },

  relationship: {
    subject: "Love & Harmony Prayers — Buddha Digital Temple",
    greeting: "Dear {name},",
    body: `The Buddha taught that all beings desire happiness and freedom from suffering. This includes those who have hurt us, and those we have hurt.

We have chanted the Metta (Loving-Kindness) meditation with your name today.

May you be happy. May you be healthy. May you be safe. May you live with ease.

And may those around you feel this same energy radiating from your heart.`,
    closing: "With loving-kindness,",
    signature: "The Prayer Ministry — Buddha Digital Temple"
  },

  spiritual: {
    subject: "Your Spiritual Journey Awaits — Buddha Digital Temple",
    greeting: "Dear Seeker,",
    body: `You are being called. The fact that you reached out to us is not coincidence.

The Buddha said: 'When the student is ready, the teacher appears.'

We have added you to our daily meditation circle.

Your spiritual awakening is already happening — this prayer request is proof.

We offer free resources, sacred tree plantings, and educational programs designed for exactly where you are on your path.`,
    closing: "On the path together,",
    signature: "The Prayer Ministry — Buddha Digital Temple"
  },

  general: {
    subject: "Your Prayers Have Been Received — Buddha Digital Temple",
    greeting: "Dear {name},",
    body: `Thank you for trusting us with your prayer.

Every prayer that enters our temple is spoken aloud in our meditation hall.

The Buddha taught that intention is everything — and your intention to seek help, to reach out, to ask for support — that intention alone has power.

We are with you. You are not alone.`,
    closing: "In peace and prayer,",
    signature: "The Prayer Ministry — Buddha Digital Temple"
  }
};

function selectPrayerTemplate(classification) {
  const category = classification.prayer_category || "general";
  const template = PRAYER_TEMPLATES[category] || PRAYER_TEMPLATES.general;
  return {
    ...template,
    category,
    personalization_fields: ["name", "specific_concern"]
  };
}

module.exports = { selectPrayerTemplate, PRAYER_TEMPLATES };
