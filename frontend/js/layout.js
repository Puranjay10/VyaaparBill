const appNavigation = [
  {
    label: "Dashboard",
    href: "dashboard.html",
    icon: "fa-solid fa-chart-pie",
  },
  {
    label: "Products",
    href: "products.html",
    icon: "fa-solid fa-boxes-stacked",
  },
  {
    label: "Suppliers",
    href: "suppliers.html",
    icon: "fa-solid fa-truck",
  },
  {
    label: "Customers",
    href: "customers.html",
    icon: "fa-solid fa-users",
  },
  {
    label: "Purchases",
    href: "purchases.html",
    icon: "fa-solid fa-cart-shopping",
  },
  {
    label: "Sales",
    href: "sales.html",
    icon: "fa-solid fa-file-invoice-dollar",
  },
  {
    label: "AI Import",
    href: "ai-upload.html",
    icon: "fa-solid fa-wand-magic-sparkles",
    badge: "New",
  },
  {
    label: "Settings",
    href: "#",
    icon: "fa-solid fa-gear",
  },
];

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function renderSidebar() {
  const navItems = appNavigation.map((item) => `
    <a class="nav-link" href="${item.href}" data-nav-link>
      <i class="${item.icon}" aria-hidden="true"></i>
      <span>${item.label}</span>
      ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
    </a>
  `).join("");

  return `
    <aside class="sidebar" aria-label="Primary navigation">
      <div class="sidebar-header">
        <div class="brand-mark" aria-hidden="true">VB</div>
        <div class="brand-name">VyaaparBill</div>
      </div>

      <nav class="sidebar-nav">${navItems}</nav>

      <div class="sidebar-footer">ERP workspace foundation</div>
    </aside>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-btn menu-toggle" type="button" data-sidebar-toggle aria-label="Open navigation">
          <i class="fa-solid fa-bars" aria-hidden="true"></i>
        </button>

        <div class="search global-search">
          <label class="sr-only" for="global-search-input">Search</label>
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input class="search-input" id="global-search-input" type="search" placeholder="Search invoices, products, customers" autocomplete="off" data-global-search-input>
          <div class="global-search-dropdown hide" data-global-search-dropdown></div>
        </div>
      </div>

      <div class="topbar-actions">
        <button class="icon-btn" type="button" aria-label="Notifications">
          <i class="fa-regular fa-bell" aria-hidden="true"></i>
        </button>

        <div class="user-menu">
          <div class="avatar" aria-hidden="true" data-avatar>U</div>
          <span class="username" data-username>User</span>
        </div>

        <button class="btn btn-secondary" type="button" data-logout>
          <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
          <span>Logout</span>
        </button>
      </div>
    </header>
  `;
}

function renderAppLayout() {
  const mainContent = document.querySelector("main.content");

  if (!document.body.hasAttribute("data-app-layout") || !mainContent || document.querySelector(".app-shell")) {
    return;
  }

  const shell = document.createElement("div");
  shell.className = "app-shell";
  shell.innerHTML = `
    ${renderSidebar()}
    <div class="sidebar-overlay" data-sidebar-overlay></div>
    ${renderTopbar()}
  `;

  mainContent.parentNode.insertBefore(shell, mainContent);
  shell.appendChild(mainContent);
}

function bindLayoutEvents() {
  const sidebarToggle = document.querySelector("[data-sidebar-toggle]");
  const sidebarOverlay = document.querySelector("[data-sidebar-overlay]");

  sidebarToggle?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });

  sidebarOverlay?.addEventListener("click", closeSidebar);
}

function loadGlobalSearch() {
  if (!document.body.hasAttribute("data-app-layout") || document.querySelector('script[data-global-search-script]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = "js/search.js";
  script.dataset.globalSearchScript = "true";
  document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
  renderAppLayout();
  bindLayoutEvents();
  loadGlobalSearch();

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
    }
  });
});

window.VBLayout = {
  renderAppLayout,
  closeSidebar,
  loadGlobalSearch,
};
