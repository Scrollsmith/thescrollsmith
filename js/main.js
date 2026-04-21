const NAV_STRUCTURE = [
  { label: "Home", href: "index.html", type: "single" },
  {
    label: "Music",
    href: "music.html",
    type: "group",
    items: [
      { label: "Music Overview", href: "music.html" },
      { label: "Albums", href: "music-albums.html" },
      { label: "Unreleased", href: "music-unreleased.html" },
      { label: "Beats", href: "music-beats.html" },
      { label: "Lyrics", href: "music-lyrics.html" },
    ],
  },
  {
    label: "Kyros",
    href: "kyros.html",
    type: "group",
    items: [
      { label: "Kyros Overview", href: "kyros.html" },
      { label: "About Kyros", href: "kyros-about.html" },
      { label: "Mythology", href: "kyros-mythology.html" },
      { label: "The Aion Archive", href: "kyros-aion-archive.html" },
      { label: "Kyrosian Lore", href: "kyrosian-lore.html" },
      { label: "Meet Kyros", href: "meet-kyros.html" },
    ],
  },
  {
    label: "The Codex",
    href: "codex.html",
    type: "group",
    items: [
      { label: "Codex Overview", href: "codex.html" },
      { label: "The Codex (Myths)", href: "codex-myths.html" },
      { label: "The Concepts", href: "codex-concepts.html" },
      { label: "The Eras", href: "codex-eras.html" },
      { label: "Clues", href: "codex-clues.html" },
      { label: "Symbols", href: "codex-symbols.html" },
      { label: "Philosophy", href: "codex-philosophy.html" },
      { label: "The Signal", href: "codex-signal.html" },
    ],
  },
  {
    label: "Projects",
    href: "projects.html",
    type: "group",
    items: [
      { label: "Projects Overview", href: "projects.html" },
      { label: "What's Next", href: "projects-whats-next.html" },
      { label: "Upcoming Projects", href: "projects-upcoming.html" },
      { label: "Announcements", href: "projects-announcements.html" },
    ],
  },
  { label: "Contact", href: "contact.html", type: "single" },
];

function getCurrentPage() {
  const parts = window.location.pathname.split("/");
  const file = parts[parts.length - 1];
  return file && file.includes(".html") ? file : "index.html";
}

function renderHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const currentPage = getCurrentPage();
  const navItemsHtml = NAV_STRUCTURE.map((entry) => {
    if (entry.type === "single") {
      const current = entry.href === currentPage ? ' aria-current="page"' : "";
      return `<li><a href="${entry.href}"${current}>${entry.label}</a></li>`;
    }

    const hasCurrentChild = entry.items.some((item) => item.href === currentPage);
    const subLinks = entry.items
      .map((item) => {
        const current = item.href === currentPage ? ' aria-current="page"' : "";
        return `<li><a href="${item.href}"${current}>${item.label}</a></li>`;
      })
      .join("");

    return `
      <li class="nav-item-group${hasCurrentChild ? " is-current-group" : ""}" data-open="${hasCurrentChild ? "true" : "false"}">
        <button class="nav-drop-btn" data-submenu-toggle aria-expanded="${hasCurrentChild ? "true" : "false"}">${entry.label}</button>
        <ul class="sub-menu">${subLinks}</ul>
      </li>
    `;
  }).join("");

  header.innerHTML = `
    <div class="container header-row">
      <a class="brand" href="index.html">
        <span class="brand-mark">Mythic Signal</span>
        <span class="brand-name">THE SCROLLSMITH</span>
      </a>
      <button class="menu-toggle" data-menu-toggle aria-expanded="false" aria-label="Open menu">Menu</button>
      <nav class="main-nav" data-main-nav data-open="false">
        <ul>${navItemsHtml}</ul>
      </nav>
    </div>
  `;
}

function attachMenuHandlers() {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-main-nav]");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.dataset.open === "true";
      nav.dataset.open = String(!isOpen);
      menuButton.setAttribute("aria-expanded", String(!isOpen));
    });
  }

  const submenuButtons = document.querySelectorAll("[data-submenu-toggle]");
  submenuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest(".nav-item-group");
      if (!group) return;
      const isOpen = group.dataset.open === "true";
      group.dataset.open = String(!isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

function injectChapterNavigation() {
  const currentPage = getCurrentPage();
  const subsectionChains = [
    ["music.html", "music-albums.html", "music-unreleased.html", "music-beats.html", "music-lyrics.html"],
    ["kyros.html", "kyros-about.html", "kyros-mythology.html", "kyros-aion-archive.html", "kyrosian-lore.html", "meet-kyros.html"],
    ["codex.html", "codex-myths.html", "codex-concepts.html", "codex-eras.html", "codex-clues.html", "codex-symbols.html", "codex-philosophy.html", "codex-signal.html"],
    ["projects.html", "projects-whats-next.html", "projects-upcoming.html", "projects-announcements.html"],
  ];

  const chain = subsectionChains.find((group) => group.includes(currentPage));
  if (!chain) return;

  const index = chain.indexOf(currentPage);
  if (index <= 0) return;

  const overview = chain[0];
  const prev = chain[index - 1];
  const next = index < chain.length - 1 ? chain[index + 1] : null;

  const main = document.querySelector("main");
  if (!main || main.querySelector("[data-chapter-nav]")) return;

  const section = document.createElement("section");
  section.className = "panel chapter-nav";
  section.setAttribute("data-chapter-nav", "true");
  section.innerHTML = `
    <p class="kicker">Chapter Navigation</p>
    <h2>Move Through The Scroll</h2>
    <div class="button-row">
      <a class="btn btn-secondary" href="${overview}">Back To Overview</a>
      <a class="btn btn-secondary" href="${prev}">Previous Section</a>
      ${next ? `<a class="btn btn-primary" href="${next}">Next Section</a>` : `<a class="btn btn-primary" href="${overview}">Return To Overview</a>`}
    </div>
  `;

  main.appendChild(section);
}

function injectBreadcrumbs() {
  const currentPage = getCurrentPage();
  const main = document.querySelector("main");
  if (!main || main.querySelector("[data-breadcrumbs]")) return;

  let trail = [{ label: "Home", href: "index.html" }];

  NAV_STRUCTURE.forEach((entry) => {
    if (entry.type === "single" && entry.href === currentPage && entry.href !== "index.html") {
      trail = [
        { label: "Home", href: "index.html" },
        { label: entry.label, href: entry.href },
      ];
    }

    if (entry.type === "group") {
      const activeItem = entry.items.find((item) => item.href === currentPage);
      if (activeItem) {
        if (activeItem.href === entry.href) {
          trail = [
            { label: "Home", href: "index.html" },
            { label: entry.label, href: entry.href },
          ];
        } else {
          trail = [
            { label: "Home", href: "index.html" },
            { label: entry.label, href: entry.href },
            { label: activeItem.label, href: activeItem.href },
          ];
        }
      }
    }
  });

  const nav = document.createElement("nav");
  nav.className = "container breadcrumbs";
  nav.setAttribute("aria-label", "Breadcrumb");
  nav.setAttribute("data-breadcrumbs", "true");

  nav.innerHTML = trail
    .map((item, index) => {
      const isLast = index === trail.length - 1;
      if (isLast) return `<span aria-current="page">${item.label}</span>`;
      return `<a href="${item.href}">${item.label}</a>`;
    })
    .join('<span class="crumb-sep">></span>');

  main.prepend(nav);
}

function injectCluesBackToTop() {
  const currentPage = getCurrentPage();
  if (currentPage !== "codex-clues-index.html") return;

  const entries = document.querySelectorAll('section.panel[id^="ci-"]');
  entries.forEach((entry) => {
    if (entry.querySelector(".clue-backtop")) return;
    const p = document.createElement("p");
    p.className = "muted clue-backtop";
    p.innerHTML = '<a href="#clues-top">Back to top</a>';
    entry.appendChild(p);
  });
}

renderHeader();
attachMenuHandlers();
injectBreadcrumbs();
injectChapterNavigation();
injectCluesBackToTop();
