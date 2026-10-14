export const pages = [
  { href: "/", n: "01", label: "Home", desktop: false },
  { href: "/parties", n: "02", label: "Birthday parties", desktop: true },
  { href: "/online", n: "03", label: "Online sessions", desktop: true },
  { href: "/about", n: "04", label: "About us", desktop: true },
  { href: "/faq", n: "05", label: "FAQ", desktop: true },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
