const NAV_STRUCTURE = [
  { label: "Home", href: "/", type: "single" },
  {
    label: "Music",
    href: "/music/",
    type: "group",
    items: [
      { label: "Music Overview", href: "/music/" },
      { label: "Current Release", href: "/music/current/" },
      { label: "Next Release", href: "/music/next/" },
      { label: "Discography", href: "/music/discography/" },
      { label: "Singles", href: "/music/singles/" },
      { label: "Future Albums", href: "/music/future/" },
      { label: "Everywhere Else", href: "/music/everywhere/" },
      { label: "About The Music", href: "/music/about/" },
      { label: "Contact", href: "/music/contact/" },
    ],
  },
  {
    label: "Doctrine",
    href: "/doctrine/",
    type: "group",
    items: [
      { label: "Doctrine Index", href: "/doctrine/" },
      { label: "Foundational Works", href: "/doctrine/foundational/" },
      { label: "Research", href: "/doctrine/research/" },
      { label: "Essays", href: "/doctrine/essays/" },
      { label: "Further Publications", href: "/doctrine/further/" },
    ],
  },
  {
    label: "Collective",
    href: "/collective/",
    type: "group",
    items: [
      { label: "Collective Hub", href: "/collective/" },
      { label: "Kyros", href: "/collective/kyros/" },
      { label: "Horizon", href: "/collective/horizon/" },
      { label: "Lore", href: "/collective/lore/" },
      { label: "Logs", href: "/collective/logs/" },
      { label: "Characters", href: "/collective/characters/" },
      { label: "PRISM", href: "/collective/prism/" },
      { label: "Community", href: "/collective/community/" },
    ],
  },
];

const GATE_SUBNAV = {
  music: {
    label: "Music",
    links: [
      { label: "Overview", href: "/music/" },
      { label: "Current", href: "/music/current/" },
      { label: "Next", href: "/music/next/" },
      { label: "Discography", href: "/music/discography/" },
      { label: "Singles", href: "/music/singles/" },
      { label: "Future", href: "/music/future/" },
      { label: "Everywhere", href: "/music/everywhere/" },
      { label: "About", href: "/music/about/" },
      { label: "Contact", href: "/music/contact/" },
    ],
  },
  doctrine: {
    label: "Doctrine",
    links: [
      { label: "Index", href: "/doctrine/" },
      { label: "Foundational", href: "/doctrine/foundational/" },
      { label: "Research", href: "/doctrine/research/" },
      { label: "Essays", href: "/doctrine/essays/" },
      { label: "Further", href: "/doctrine/further/" },
    ],
  },
  collective: {
    label: "Collective",
    links: [
      { label: "Hub", href: "/collective/" },
      { label: "Kyros", href: "/collective/kyros/" },
      { label: "Horizon", href: "/collective/horizon/" },
      { label: "Lore", href: "/collective/lore/" },
      { label: "Logs", href: "/collective/logs/" },
      { label: "Characters", href: "/collective/characters/" },
      { label: "PRISM", href: "/collective/prism/" },
      { label: "Community", href: "/collective/community/" },
    ],
  },
};

function normalizePath(pathname) {
  let path = pathname || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  // Treat /foo/index.html as /foo
  if (path.endsWith("/index.html")) path = path.slice(0, -"/index.html".length) || "/";
  if (path.endsWith(".html")) {
    // Legacy flat pages stay as-is for current marking
    return path;
  }
  return path || "/";
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

function pathsMatch(href, current) {
  const a = normalizePath(href);
  const b = normalizePath(current);
  return a === b;
}

function pathStartsWith(current, prefix) {
  const c = normalizePath(current);
  const p = normalizePath(prefix);
  if (p === "/") return c === "/";
  return c === p || c.startsWith(`${p}/`);
}

function renderHeader() {
  if (document.body.classList.contains("terminal-home")) return;

  const header = document.querySelector(".site-header");
  if (!header) return;

  const currentPath = getCurrentPath();
  const navItemsHtml = NAV_STRUCTURE.map((entry) => {
    if (entry.type === "single") {
      const current = pathsMatch(entry.href, currentPath) ? ' aria-current="page"' : "";
      return `<li><a href="${entry.href}"${current}>${entry.label}</a></li>`;
    }

    const hasCurrentChild = entry.items.some(
      (item) => pathsMatch(item.href, currentPath) || pathStartsWith(currentPath, item.href)
    ) || pathStartsWith(currentPath, entry.href);
    const subLinks = entry.items
      .map((item) => {
        const current =
          pathsMatch(item.href, currentPath) ||
          (item.href !== entry.href && pathStartsWith(currentPath, item.href))
            ? ' aria-current="page"'
            : "";
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
      <a class="brand" href="/">
        <span class="brand-mark">The Architect</span>
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

function getActiveGate(currentPath) {
  if (pathStartsWith(currentPath, "/music")) return "music";
  if (pathStartsWith(currentPath, "/doctrine")) return "doctrine";
  if (pathStartsWith(currentPath, "/collective")) return "collective";
  return null;
}

function injectGateSubnav() {
  const main = document.querySelector("main");
  if (!main || main.querySelector("[data-gate-subnav]")) return;

  const currentPath = getCurrentPath();
  const gateKey = getActiveGate(currentPath);
  if (!gateKey) return;

  const gate = GATE_SUBNAV[gateKey];
  const links = gate.links
    .map((item) => {
      const current =
        pathsMatch(item.href, currentPath) ||
        (item.href !== `/${gateKey}/` && pathStartsWith(currentPath, item.href))
          ? ' aria-current="page"'
          : "";
      return `<a href="${item.href}"${current}>${item.label}</a>`;
    })
    .join("");

  const nav = document.createElement("nav");
  nav.className = "container gate-subnav";
  nav.setAttribute("aria-label", `${gate.label} sections`);
  nav.setAttribute("data-gate-subnav", "true");
  nav.innerHTML = links;
  main.prepend(nav);
}

function injectBreadcrumbs() {
  if (document.body.classList.contains("terminal-home")) return;

  const currentPath = getCurrentPath();
  const main = document.querySelector("main");
  if (!main || main.querySelector("[data-breadcrumbs]")) return;

  let trail = [{ label: "Home", href: "/" }];

  NAV_STRUCTURE.forEach((entry) => {
    if (entry.type === "single" && pathsMatch(entry.href, currentPath) && entry.href !== "/") {
      trail = [
        { label: "Home", href: "/" },
        { label: entry.label, href: entry.href },
      ];
    }

    if (entry.type === "group" && pathStartsWith(currentPath, entry.href)) {
      const activeItem =
        entry.items
          .filter((item) => pathStartsWith(currentPath, item.href))
          .sort((a, b) => normalizePath(b.href).length - normalizePath(a.href).length)[0] || null;

      if (activeItem) {
        if (pathsMatch(activeItem.href, entry.href)) {
          trail = [
            { label: "Home", href: "/" },
            { label: entry.label, href: entry.href },
          ];
        } else {
          trail = [
            { label: "Home", href: "/" },
            { label: entry.label, href: entry.href },
            { label: activeItem.label, href: activeItem.href },
          ];
        }
      }
    }
  });

  // Deeper Current Release children
  if (pathStartsWith(currentPath, "/music/current/") && !pathsMatch(currentPath, "/music/current/")) {
    const childLabel = {
      "/music/current/tracks": "Track List",
      "/music/current/lyrics": "Lyrics",
      "/music/current/lore": "Lore",
      "/music/current/listen": "Listen",
      "/music/current/buy": "Buy",
    }[normalizePath(currentPath)];
    if (childLabel) {
      trail = [
        { label: "Home", href: "/" },
        { label: "Music", href: "/music/" },
        { label: "Current Release", href: "/music/current/" },
        { label: childLabel, href: currentPath },
      ];
    }
  }

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
    .join('<span class="crumb-sep">/</span>');

  const subnav = main.querySelector("[data-gate-subnav]");
  if (subnav) {
    subnav.after(nav);
  } else {
    main.prepend(nav);
  }
}

renderHeader();
attachMenuHandlers();
injectGateSubnav();
injectBreadcrumbs();
