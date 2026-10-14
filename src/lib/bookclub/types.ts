export type MemberStatus = "pending" | "approved" | "declined";
export type Member = {
  telegramId: string;
  name: string;
  flat: string;
  phone: string;
  childName: string;
  status: MemberStatus;
  joinedAt: string;
};

export type BookStatus = "pending" | "listed" | "rejected";
export type Book = {
  id: string;
  title: string;
  author: string;
  matchKey: string;
  condition: string;
  photoFileId: string;
  ownerId: string;
  status: BookStatus;
  addedAt: string;
};

export type BorrowState = "requested" | "out" | "returned" | "cancelled";
export type Borrow = {
  id: string;
  bookId: string;
  borrowerId: string;
  requestedAt: string;
  paidAt: string;
  dueAt: string;
  returnedAt: string;
  ownerPaidAt: string;
  state: BorrowState;
};

export type Flow = "join" | "add";
export type Session = { telegramId: string; flow: Flow; step: string; draft: Record<string, string> };
