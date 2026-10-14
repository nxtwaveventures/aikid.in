export const pages = [
  { href: "/", label: "Home" },
  { href: "/parties", label: "Parties" },
  { href: "/online", label: "Online" },
  { href: "/book-club", label: "Book Club" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
