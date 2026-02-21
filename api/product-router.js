/**
 * product-router.js — Select product offers based on classification
 * Revenue Funnel: Free Prayer → $27 Tree → $54 Book → $297 Course → $5K+ Enrollment
 */

const PRODUCT_CATALOG = {
  trees: {
    sku: "TREE-001",
    name: "Sacred Tree Planting",
    price: 27,
    stripe_link: "https://buy.stripe.com/6oU4gsaVr1obbfE2Cq1Nu00",
    description: "Plant a sacred tree in the Peace Park. Certificate included."
  },
  tree_bundle: {
    sku: "BUNDLE-001",
    name: "Sacred Tree Bundle (3 Trees)",
    price: 75,
    stripe_link: "https://buy.stripe.com/3cI3co6Fb5Er0B090O1Nu01",
    description: "3 sacred trees — plant for family, loved ones, or new beginnings."
  },
  book_medicine_buddha: {
    sku: "BOOK-001",
    name: "The Medicine Buddha Method",
    price: 54,
    stripe_link: "https://buy.stripe.com/REPLACE_BOOK_LINK",
    description: "Ancient healing wisdom meets modern wellness."
  },
  book_billionaire_mudras: {
    sku: "BOOK-002",
    name: "Billionaire Mudras: 9 Sacred Hand Seals of Wealth Power",
    price: 54,
    stripe_link: "https://buy.stripe.com/REPLACE_MUDRA_LINK",
    description: "The 9 sacred hand seals for wealth activation."
  },
  book_spiritual_reparations: {
    sku: "BOOK-003",
    name: "Spiritual Reparations",
    price: 54,
    stripe_link: "https://buy.stripe.com/REPLACE_REPARATIONS_LINK",
    description: "Healing generational wounds through spiritual practice."
  },
  course_reiki: {
    sku: "COURSE-001",
    name: "Reiki Certification",
    price: 297,
    stripe_link: "https://buy.stripe.com/REPLACE_REIKI_LINK",
    description: "Become a certified Reiki practitioner."
  },
  course_vajra: {
    sku: "COURSE-002",
    name: "Vajra Master Certification",
    price: 997,
    stripe_link: "https://buy.stripe.com/REPLACE_VAJRA_LINK",
    description: "Advanced Vajrayana practitioner certification."
  },
  digital_temple: {
    sku: "TEMPLE-001",
    name: "Digital Temple Membership",
    price: 27,
    stripe_link: "https://buy.stripe.com/aFaeV60gN1ob1F43Gu1Nu02",
    description: "Monthly live prayer calls, guided meditations, Dharma teachings."
  },
  hospital_consult: {
    sku: "HOSP-001",
    name: "Ayurvedic Consultation",
    price: 0,
    description: "Free initial consultation with Dr. Jeffrey B. Hubbard."
  },
  supplement_ashwagandha: {
    sku: "SUPP-001",
    name: "Ashwagandha Complex",
    price: 39,
    stripe_link: "https://buy.stripe.com/REPLACE_SUPPLEMENT_LINK",
    description: "Adaptogenic stress relief formula."
  },
  bachelors: {
    sku: "EDU-001",
    name: "Bachelor's in Divinity",
    price: 5000,
    description: "4-year religious studies degree. Wyoming religious exemption."
  },
  mba: {
    sku: "EDU-002",
    name: "Spiritual MBA",
    price: 7500,
    description: "Business + spiritual leadership program."
  },
  phd: {
    sku: "EDU-003",
    name: "PhD in Metaphysical Sciences",
    price: 15000,
    description: "Doctoral program in metaphysical healing sciences."
  },
  family_circle_cert: {
    sku: "FC-001",
    name: "Family Circle Certification",
    price: 1000,
    description: "AI-powered family wellness certification."
  }
};

function selectProductOffer(classification) {
  const offers = [];

  // Everyone gets the tree offer first (entry point)
  offers.push({ ...PRODUCT_CATALOG.trees, priority: 1, timing: "immediate" });

  // Health tags → Hospital consult + supplements
  if (classification.health_tags && classification.health_tags.length > 0) {
    offers.push({ ...PRODUCT_CATALOG.hospital_consult, priority: 2, timing: "day1" });
    offers.push({ ...PRODUCT_CATALOG.supplement_ashwagandha, priority: 3, timing: "day3" });
    offers.push({ ...PRODUCT_CATALOG.book_medicine_buddha, priority: 4, timing: "day1" });
  }

  // Education tags → Degree programs
  if (classification.education_tags && classification.education_tags.length > 0) {
    if (classification.education_tags.includes("edu-mba")) {
      offers.push({ ...PRODUCT_CATALOG.mba, priority: 2, timing: "day3" });
    }
    if (classification.education_tags.includes("edu-phd")) {
      offers.push({ ...PRODUCT_CATALOG.phd, priority: 2, timing: "day3" });
    }
    if (classification.education_tags.includes("edu-bachelors")) {
      offers.push({ ...PRODUCT_CATALOG.bachelors, priority: 2, timing: "day3" });
    }
    if (classification.education_tags.includes("edu-reiki")) {
      offers.push({ ...PRODUCT_CATALOG.course_reiki, priority: 2, timing: "day3" });
    }
    if (classification.education_tags.includes("edu-vajra")) {
      offers.push({ ...PRODUCT_CATALOG.course_vajra, priority: 2, timing: "day3" });
    }
  }

  // Spiritual tags → Certifications + books
  if (classification.spiritual_tags && classification.spiritual_tags.length > 0) {
    offers.push({ ...PRODUCT_CATALOG.course_reiki, priority: 3, timing: "day5" });
    offers.push({ ...PRODUCT_CATALOG.book_billionaire_mudras, priority: 4, timing: "day1" });
  }

  // Financial prayer → Billionaire Mudras book
  if (classification.prayer_category === "financial") {
    offers.push({ ...PRODUCT_CATALOG.book_billionaire_mudras, priority: 2, timing: "day1" });
  }

  // Sort by priority
  offers.sort((a, b) => a.priority - b.priority);
  return offers;
}

module.exports = { selectProductOffer, PRODUCT_CATALOG };
