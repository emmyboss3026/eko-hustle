// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  YOUR BUSINESS DETAILS: fill these in ONCE. Every legal page reads them.     │
// │  Anything still in [BRACKETS] shows in red on the pages until you replace it.│
// └──────────────────────────────────────────────────────────────────────────────┘
window.LEGAL = {
  owner: "[YOUR FULL NAME OR COMPANY NAME]",
  address: "[STREET AND NUMBER, POSTCODE CITY, COUNTRY]",
  email: "[CONTACT EMAIL]",
  phone: "", // optional
  vat: "", // only if you have a VAT/UID number
  country: "[COUNTRY WHOSE LAW APPLIES, e.g. Austria]",
  authority: "[YOUR DATA PROTECTION AUTHORITY, e.g. Österreichische Datenschutzbehörde, dsb.gv.at]",
  updated: "29 October 2026",
};

// Fill <span data-legal="..."></span>, link e-mails, add the menu, and flag what still needs filling in.
(function () {
  const L = window.LEGAL;
  document.querySelectorAll("[data-legal]").forEach(el => {
    const v = L[el.getAttribute("data-legal")] || "";
    if (el.getAttribute("data-legal") === "email" && v && !v.startsWith("[")) {
      const a = document.createElement("a");
      a.href = "mailto:" + v;
      a.textContent = v;
      el.replaceChildren(a);
    } else el.textContent = v;
    if (v.startsWith("[")) el.classList.add("todo-field");
  });
  const pages = [["privacy", "Privacy"], ["terms", "Terms"], ["refunds", "Refunds"], ["cookies", "Cookies"], ["imprint", "Business details"], ["credits", "Credits & licences"]];
  const nav = document.createElement("nav");
  nav.className = "legal-nav";
  nav.innerHTML = '<a href="/">← Back to the game</a>' + pages.map(([p, n]) => `<a href="/${p}.html"${location.pathname.endsWith(p + ".html") ? ' aria-current="page"' : ""}>${n}</a>`).join("");
  document.body.prepend(nav);
})();
