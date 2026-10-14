// Page copy that isn't a setting. Prices, forms and dates live in site.ts.
import { site } from "@/lib/site";

export const partySteps = [
  ["Tell us about your child", "Name, age, favourite things, party theme."],
  ["We write their story", "An original tale where they're the hero, ready 3 days before."],
  ["Showtime", "We arrive 30 minutes early, set up, and run the show end to end."],
];

export const partyIncludes = [
  "A trained storyteller, live at your party venue",
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

export const bookClubSteps = [
  ["Share a novel", "Add a book your child has finished. We check it's right for readers aged 10+."],
  ["Kids borrow it", `₹${site.bookClub.price} for one week, paid before pickup.`],
  ["You earn", `₹${site.bookClub.ownerShare} every time your book is borrowed.`],
  ["Return in a week", "Bring it back and pick the next one."],
];

export const bookClubRules = [
  "Novels for readers aged 10 and up, checked by Story Lab",
  "One copy of each title on the shelf",
  "Families are approved by Story Lab before joining",
  "One book at a time per family",
];

export const ageBands = [
  ["3–5 years · Story Explorers", "Call-and-response stories, animal voices and act-it-out moments."],
  ["6–10 years · Story Makers", "Plot twists, characters and kids inventing their own stories."],
  ["10+ years · Book Club", "Novels shared between families, borrowed a week at a time."],
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
    "Where do you do parties?",
    `At party venues across ${site.city} — party halls, clubhouses and cafés. We don't do shows at homes. Travel outside city limits is quoted separately.`,
  ],
  [
    "How do online sessions work?",
    `Small live groups on video, ${site.online.perSession} each. You pick a weekly slot after buying; your child keeps the same group and storyteller for all ${site.online.sessions} sessions.`,
  ],
  [
    "How does the Book Club work?",
    `Families share novels their kids have finished. Other kids borrow them for ₹${site.bookClub.price} a week, and the owner earns ₹${site.bookClub.ownerShare} every time. It's starting in ${site.bookClub.societies.join(", ")}.`,
  ],
  [
    "What if a book comes back late or damaged?",
    "Tell us and we'll sort it out fairly with both families. Keep the book for one week; if you need longer, borrow it again.",
  ],
];

// Novels many families already have at home — the kind of books the club passes around. Covers from Open Library.
export const greatReads: { title: string; author: string; cover?: number }[] = [
  { title: "Wonder", author: "R. J. Palacio", cover: 8223160 },
  { title: "Harry Potter and the Philosopher's Stone", author: "J. K. Rowling", cover: 15155833 },
  { title: "Percy Jackson and the Lightning Thief", author: "Rick Riordan", cover: 7239831 },
  { title: "Diary of a Wimpy Kid", author: "Jeff Kinney", cover: 14376136 },
  { title: "Matilda", author: "Roald Dahl", cover: 12889769 },
  { title: "The Blue Umbrella", author: "Ruskin Bond", cover: 10389985 },
  { title: "Grandma's Bag of Stories", author: "Sudha Murty" },
  { title: "Charlie and the Chocolate Factory", author: "Roald Dahl", cover: 12459564 },
];
