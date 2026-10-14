/**
 * Story Lab — creates the 5 Google Forms used on the website, each with its own
 * response spreadsheet, inside the Google account that runs it (storylabkid@gmail.com).
 *
 * How to run:
 *   1. Signed in as storylabkid@gmail.com, open https://script.google.com/create
 *   2. Replace the editor contents with this file, save, select `createStoryLabForms`, click Run
 *   3. Approve the permissions prompt (Forms + Sheets + Drive, your own account only)
 *   4. Copy the 5 links printed in the Execution log into src/lib/site.ts → site.forms
 */

const AGE_OPTIONS = ["3–5 years", "6–10 years"];
const LANGS = ["English", "Hindi", "Both — a mix of Hindi & English"];
const HEARD = ["Instagram", "WhatsApp group", "Friend / family", "School", "Google", "Attended a Story Lab party", "Other"];

function createStoryLabForms() {
  const links = {
    party: buildPartyForm_(),
    online: buildOnlineForm_(),
    feedback: buildFeedbackForm_(),
    survey: buildSurveyForm_(),
    hiring: buildHiringForm_(),
  };
  Logger.log("Paste these into src/lib/site.ts → site.forms:\n" + JSON.stringify(links, null, 2));
}

// ---------- helpers ----------

function newForm_(title, description, confirmation) {
  const form = FormApp.create(title)
    .setDescription(description)
    .setConfirmationMessage(confirmation)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(false);
  const sheet = SpreadsheetApp.create(title + " (Responses)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  return form;
}

function text_(form, title, required, help) {
  const item = form.addTextItem().setTitle(title).setRequired(required);
  if (help) item.setHelpText(help);
  return item;
}

function phone_(form) {
  const v = FormApp.createTextValidation()
    .requireTextMatchesPattern("^[+0-9 ]{10,15}$")
    .setHelpText("Please enter a valid phone number, e.g. +91 98765 43210")
    .build();
  return text_(form, "WhatsApp number", true, "We'll confirm everything on WhatsApp.").setValidation(v);
}

function email_(form, required) {
  const v = FormApp.createTextValidation().requireTextIsEmail().build();
  return text_(form, "Email", required).setValidation(v);
}

function choice_(form, title, options, required, other) {
  const item = form.addMultipleChoiceItem().setTitle(title).setChoiceValues(options).setRequired(required);
  if (other) item.showOtherOption(true);
  return item;
}

function checks_(form, title, options, required) {
  return form.addCheckboxItem().setTitle(title).setChoiceValues(options).setRequired(required);
}

function para_(form, title, required, help) {
  const item = form.addParagraphTextItem().setTitle(title).setRequired(required);
  if (help) item.setHelpText(help);
  return item;
}

function short_(form) {
  const url = form.getPublishedUrl();
  try {
    return form.shortenFormUrl(url);
  } catch (e) {
    return url;
  }
}

// ---------- 1. Birthday party booking ----------

function buildPartyForm_() {
  const form = newForm_(
    "Story Lab — Get a Birthday Party Quote",
    "A live storyteller, props and an original story where the birthday child is the hero (45 minutes).\n\nTell us about your party and we'll WhatsApp you a free, no-obligation quote within a few hours. Weekends fill up fast!",
    "Thank you! 🎂 We'll WhatsApp you your quote and date availability within a few hours."
  );

  form.addSectionHeaderItem().setTitle("About you");
  text_(form, "Parent's name", true);
  phone_(form);
  email_(form, false);

  form.addPageBreakItem().setTitle("The birthday child");
  text_(form, "Birthday child's name", true, "We weave their name into the story.");
  choice_(form, "Age they're turning", ["3", "4", "5", "6", "7", "8", "9", "10"], true);
  para_(form, "What do they love right now?", false, "Favourite animals, characters, colours, hobbies — anything we can put in their story.");

  form.addPageBreakItem().setTitle("The party");
  form.addDateItem().setTitle("Party date").setRequired(true);
  form.addTimeItem().setTitle("Preferred start time").setRequired(true);
  text_(form, "Venue / area", true, "Party venue name and area, e.g. a party hall, clubhouse or café (we don't do shows at homes)");
  text_(form, "City", true);
  choice_(form, "How many kids are expected?", ["Up to 10", "11–20", "21–30", "More than 30"], true);
  checks_(form, "Guests' age groups", AGE_OPTIONS, true);
  checks_(form, "Preferred storytelling language", LANGS, true);
  text_(form, "Party theme (if any)", false);
  choice_(form, "How did you hear about Story Lab?", HEARD, false);
  para_(form, "Anything else we should know?", false);

  return short_(form);
}

// ---------- 2. Story Lab Online booking ----------

function buildOnlineForm_() {
  const form = newForm_(
    "Story Lab Online — Book the 5-Session Pack (₹999)",
    "5 live small-group storytelling sessions (40 minutes each, up to 6 kids per group). By session five, your child tells a story of their own.\n\nSeats in each batch are limited — fill this in and we'll WhatsApp you the payment link to confirm your seat.",
    "You're in the queue! 💻 We'll WhatsApp you the payment link (₹999) and your batch details shortly. Your seat is confirmed once payment is done."
  );

  form.addSectionHeaderItem().setTitle("About you");
  text_(form, "Parent's name", true);
  phone_(form);
  email_(form, true);

  form.addPageBreakItem().setTitle("Your child");
  text_(form, "Child's name", true);
  choice_(form, "Child's age group", AGE_OPTIONS, true);
  form.addListItem().setTitle("Child's exact age").setChoiceValues(["3", "4", "5", "6", "7", "8", "9", "10"]).setRequired(true);
  checks_(form, "Languages spoken at home", LANGS, true);
  para_(form, "What kind of stories does your child love?", false);

  form.addPageBreakItem().setTitle("Your batch");
  checks_(form, "Which slots work for you?", ["Weekday evening (5–7 pm)", "Saturday morning", "Saturday evening", "Sunday morning", "Sunday evening"], true);
  choice_(form, "Device your child will join from", ["Laptop / desktop", "Tablet", "Phone"], true);
  choice_(form, "How did you hear about Story Lab?", HEARD, false);
  para_(form, "Anything we should know? (shyness, attention, special needs — we'll take care)", false);

  return short_(form);
}

// ---------- 3. Feedback ----------

function buildFeedbackForm_() {
  const form = newForm_(
    "Story Lab — Share Your Feedback 💌",
    "Thank you for being part of Story Lab! Two minutes of your time helps us make every story better — and helps other parents decide.",
    "Thank you so much! 💛 Your feedback is read by our whole team."
  );

  text_(form, "Your name", true);
  choice_(form, "Which Story Lab experience did you attend?", ["Birthday Story Party", "Story Lab Online"], true);
  form.addDateItem().setTitle("Date of the session / party").setRequired(false);
  choice_(form, "Child's age group", AGE_OPTIONS, true);
  form.addScaleItem().setTitle("Overall, how was it?").setBounds(1, 5).setLabels("Not great", "Loved it!").setRequired(true);
  form.addScaleItem().setTitle("How engaged was your child?").setBounds(1, 5).setLabels("Distracted", "Totally hooked").setRequired(true);
  form.addScaleItem().setTitle("How likely are you to recommend Story Lab to a friend?").setBounds(0, 10).setLabels("Not likely", "Extremely likely").setRequired(true);
  para_(form, "What did your child love the most?", false);
  para_(form, "What could we do better?", false);

  form.addPageBreakItem().setTitle("Help other parents");
  para_(form, "In a sentence or two, what would you tell another parent about Story Lab?", false, "We may feature this on our website.");
  choice_(form, "Can we feature your words on our website and social media?", [
    "Yes, with my name and child's age",
    "Yes, with first name only",
    "Yes, anonymously",
    "No, please keep it private",
  ], true);
  choice_(form, "Would you book Story Lab again?", ["Yes, definitely", "Maybe", "No"], true);
  phone_(form).setRequired(false);

  return short_(form);
}

// ---------- 4. Parent survey (market research) ----------

function buildSurveyForm_() {
  const form = newForm_(
    "Story Lab — 2-Minute Parent Survey",
    "We're building Story Lab: live storytelling for kids aged 3–10 — at birthday parties and in small online groups. A human touch in the world of AI. Your honest answers shape what we build. Thank you!",
    "Thank you! 🙏 Your answers really help. Leave your WhatsApp number at the end if you'd like an early-bird offer when we launch."
  );

  checks_(form, "Your child's age group(s)", AGE_OPTIONS, true);
  text_(form, "City", true);
  choice_(form, "How often does your child hear stories now?", ["Daily", "A few times a week", "Weekly", "Rarely"], true);
  checks_(form, "What do you want stories to build in your child?", ["Imagination", "Confidence & speaking", "Language skills", "Values", "Screen-free time"], true);
  choice_(form, "Would your child join live online storytelling sessions?", ["Yes", "Maybe", "No"], true);
  // Asked before revealing the price, so answers aren't anchored to ₹999.
  choice_(form, "What would you pay for a pack of 5 live online sessions?", ["Under ₹500", "₹500–999", "₹1,000–1,999", "₹2,000+"], true);
  choice_(form, "At ₹999 for 5 live sessions, would you buy?", ["Definitely", "Probably", "Unlikely", "No"], true);
  checks_(form, "Best time for sessions", ["Weekday evening", "Saturday", "Sunday"], true);
  checks_(form, "Preferred language(s)", LANGS, true);

  form.addPageBreakItem().setTitle("Birthday parties");
  choice_(form, "Have you hired entertainment for a child's birthday party?", ["Yes", "No"], true);
  choice_(form, "Roughly what did you spend on it?", ["Under ₹5,000", "₹5,000–10,000", "₹10,000–20,000", "₹20,000+", "Haven't hired any"], false);
  choice_(form, "Would you book a live storyteller for your child's party at ₹10,000?", ["Yes", "Maybe", "No"], true);
  para_(form, "Why / why not?", false);
  para_(form, "What would make you say yes immediately?", false);

  form.addPageBreakItem().setTitle("Stay in touch (optional)");
  phone_(form).setRequired(false).setTitle("WhatsApp number — for an early-bird offer when we launch");

  return short_(form);
}

// ---------- 5. Storyteller hiring ----------

function buildHiringForm_() {
  const form = newForm_(
    "Story Lab — We're Hiring Storytellers 🎙️",
    "Love kids, stories and a bit of drama? Story Lab is a women-founded storytelling studio for children aged 3–10 — live at birthday parties and in small online groups, in Hindi and English. Tell us about yourself!",
    "Thank you! 🌟 Neha & Anamika read every application. If it's a fit, we'll WhatsApp you to set up a short story audition."
  );

  form.addSectionHeaderItem().setTitle("About you");
  text_(form, "Full name", true);
  phone_(form);
  email_(form, true);
  text_(form, "City / area", true);

  form.addPageBreakItem().setTitle("Your storytelling");
  checks_(form, "Which can you do?", ["Live birthday parties (in person)", "Online sessions", "Both"], true);
  checks_(form, "Languages you tell stories in", ["Hindi", "English"], true);
  checks_(form, "Age groups you enjoy working with", AGE_OPTIONS, true);
  choice_(form, "Experience with children", ["None yet — but I'm a natural", "Under 1 year", "1–3 years", "3+ years"], true);
  checks_(form, "Your background", ["Teacher / educator", "Theatre / drama", "Puppetry", "Voice / RJ / anchoring", "Parent", "Other"], false);
  para_(form, "Tell us about a time you held a room full of kids", true);
  text_(form, "Link to a video of you telling a story (optional)", false, "Instagram, YouTube or Google Drive link — 1–2 minutes is perfect.");

  form.addPageBreakItem().setTitle("Availability");
  checks_(form, "When are you available?", ["Weekday mornings", "Weekday evenings", "Saturdays", "Sundays"], true);
  para_(form, "Anything else we should know?", false);

  return short_(form);
}

// ---------- one-off: move the live forms from ages 0–10 to 3–10 (keeps links + responses) ----------

const LIVE_FORM_IDS = [
  "1Enu0C48oC78ayr8GzwIhAlPXAjpeAb2rMP-9ooCCU0w", // party quote
  "1VqzjUGgQ7GIEWsDYAVKVPpX9-e30eCu8CxrmHPHPhkg", // online booking
  "1UnYwMiEaw2HFnptyBIjaj3P4Rjm1aA9uB3tHm0PSLIU", // feedback
  "1YMM6UrlRze0EK2_ugx5MZ8W6G3M2veu2D2aS6sqxsm4", // parent survey
  "1TNXtbclXvqmODkXNfvuTvPdwNCPNC5w6ghyDE6-zFi4", // hiring
];

function updateAgesTo3to10() {
  const ages = ["3", "4", "5", "6", "7", "8", "9", "10"];
  const log = [];
  LIVE_FORM_IDS.forEach((id) => {
    const form = FormApp.openById(id);
    form.setDescription(form.getDescription().replace(/0–10/g, "3–10"));
    form.getItems().forEach((item) => {
      const type = item.getType();
      const title = item.getTitle();
      let typed = null;
      if (type === FormApp.ItemType.MULTIPLE_CHOICE) typed = item.asMultipleChoiceItem();
      if (type === FormApp.ItemType.CHECKBOX) typed = item.asCheckboxItem();
      if (type === FormApp.ItemType.LIST) typed = item.asListItem();
      if (!typed) return;
      const values = typed.getChoices().map((c) => c.getValue());
      if (values.includes("0–2 years")) {
        typed.setChoiceValues(AGE_OPTIONS);
        log.push(form.getTitle() + " → " + title);
      } else if (title === "Age they're turning" || title === "Child's exact age") {
        typed.setChoiceValues(ages);
        log.push(form.getTitle() + " → " + title);
      }
    });
  });
  Logger.log("Updated:\n" + log.join("\n"));
}
