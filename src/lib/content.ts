// Page copy that isn't a setting. Prices, forms and dates live in site.ts.
import { site } from "@/lib/site";

export const partySteps = [
  ["Tell us about your child", "Name, age, favourite things, party theme."],
  ["We write their story", "An original tale where they're the hero, ready 3 days before."],
  ["Showtime", "We arrive 30 minutes early, set up, and run the show end to end."],
];

export const partyIncludes = [
  "A trained storyteller, live at your venue",
  "An original story starring the birthday child",
  "Props, puppets and sound effects kids get to handle",
  "An act-it-out segment where every child gets a role",
  "A story-themed craft or colouring take-home",
  "A personalised story card for the birthday child",
];

export const onlineSessions = [
  ["The Spark", "Where do stories come from? Kids collect ideas from their own world."],
  ["Heroes & Helpers", "Inventing a character with a want, a fear and a funny habit."],
  ["Trouble Ahead", "Every good story needs a problem. Building the twist."],
  ["Say It Out Loud", "Voices, pauses and expressions — telling, not just reading."],
  ["Story Day", "Your child tells their finished story to the group. Recording shared with you."],
];

export const ageBands = [
  ["3–5 years · Story Explorers", "Call-and-response stories, animal voices and act-it-out moments."],
  ["6–10 years · Story Makers", "Plot twists, characters and kids inventing their own stories."],
];

export const faqs: [string, string][] = [
  [
    "How many kids can join a party?",
    `A standard party covers ${site.party.kids}. For bigger groups we bring a second storyteller — your quote will include it.`,
  ],
  [
    "Which languages do you tell stories in?",
    "Hindi and English — or a natural mix of both, the way most families speak at home. Tell us your preference when you book.",
  ],
  [
    "Do you travel to our venue?",
    `Yes — homes, clubhouses, cafés and party venues across ${site.city}. Travel outside city limits is quoted separately.`,
  ],
  [
    "How do online sessions work?",
    `Small live groups on video, ${site.online.perSession} each. You pick a weekly slot after buying; your child keeps the same group and storyteller for all ${site.online.sessions} sessions.`,
  ],
];
