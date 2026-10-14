// Callback data for every inline button. Team actions start with "t:" so presses outside the team chat can be refused.
import { InlineKeyboard } from "grammy";

const TEAM = "t:";

export const BUTTON = {
  skip: "sk",
  choose: "cd",
  shelfPage: "sh",
  borrow: "bw",
  confirmBorrow: "bc",
  approveMember: `${TEAM}ma`,
  declineMember: `${TEAM}md`,
  listBook: `${TEAM}ba`,
  rejectBook: `${TEAM}br`,
  paid: `${TEAM}lp`,
  cancelBorrow: `${TEAM}lc`,
  returned: `${TEAM}lr`,
  ownerPaid: `${TEAM}po`,
} as const;

export const TEAM_BUTTON = new RegExp(`^${TEAM}`);

// Argument patterns for `pressed`.
export const MEMBER_ID = "\\d+";
export const BOOK_ID = "B\\d+";
export const BORROW_ID = "L\\d+";
export const NUMBER = "\\d+";
export const ANY = ".+";

/** Callback data for a button: the action, then its arguments. */
export const callback = (action: string, ...args: (string | number)[]) => [action, ...args].join(":");

/** Matches a button's callback data, capturing each argument. */
export const pressed = (action: string, ...args: string[]) =>
  new RegExp(`^${[action, ...args.map((arg) => `(${arg})`)].join(":")}$`);

// The channel's Borrow button opens the bot with /start borrow_<book id>.
export const BORROW_START = "borrow_";
export const borrowLink = (botUsername: string, bookId: string) => `https://t.me/${botUsername}?start=${BORROW_START}${bookId}`;

export const paymentButtons = (borrowId: string) =>
  new InlineKeyboard().text("💰 Paid", callback(BUTTON.paid, borrowId)).text("✖ Cancel", callback(BUTTON.cancelBorrow, borrowId));
