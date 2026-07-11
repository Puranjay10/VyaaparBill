const globalSearchState = {
  query: "",
  activeIndex: -1,
  isOpen: false,
  isLoading: false,
  resultItems: [],
  debounceTimer: null,
  productsByQuery: new Map(),
  customers: null,
  suppliers: null,
  purchases: null,
};

const globalSearchElements = {
  input: document.querySelector("[data-global-search-input]"),
  dropdown: document.querySelector("[data-global-search-dropdown]"),
};

const globalSearchGroups = [
  {
    key: "products",
    label: "Products",
    icon: "fa-solid fa-box",
    href: "products.html",
  },
  {
    key: "customers",
    label: "Customers",
    icon: "fa-solid fa-user",
    href: "customers.html",
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: "fa-solid fa-truck",
    href: "suppliers.html",
  },
  {
    key: "purchases",
    label: "Purchases",
    icon: "fa-solid fa-receipt",
    href: "purchases.html",
  },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isObjectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function cleanText(value) {
  if (value === undefined || value === null) return "";

  const text = String(value).trim();

  return text && !isObjectId(text) ? text : "";
}

function normalizeList(data, key) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
}

function normalizeProducts(data) {
  return normalizeList(data, "products");
}

function normalizeQuery(value) {
  return cleanText(value).toLowerCase();
}

function getReferenceName(reference) {
  if (!reference) return "";
  if (typeof reference === "string") return cleanText(reference);
  return cleanText(reference.name) ||
    cleanText(reference.productCode) ||
    cleanText(reference.invoiceNumber);
}

function compactParts(parts) {
  return parts
    .map(cleanText)
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}

function getSearchText(parts) {
  return parts
    .map((part) => cleanText(part).toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function createUrl(href, query) {
  const url = new URL(href, window.location.href);
  url.searchParams.set("search", query);
  return `${url.pathname.split("/").pop()}${url.search}`;
}

function renderState(title, text, icon = "fa-solid fa-magnifying-glass") {
  globalSearchElements.dropdown.innerHTML = `
    <div class="global-search-state">
      <i class="${icon}" aria-hidden="true"></i>
      <div>
        <p>${escapeHtml(title)}</p>
        <span>${escapeHtml(text)}</span>
      </div>
    </div>
  `;
  openDropdown();
}

function openDropdown() {
  globalSearchState.isOpen = true;
  globalSearchElements.dropdown.classList.remove("hide");
}

function closeDropdown() {
  globalSearchState.isOpen = false;
  globalSearchState.activeIndex = -1;
  globalSearchElements.dropdown.classList.add("hide");
}

function setActiveResult(index) {
  globalSearchState.activeIndex = index;

  document.querySelectorAll("[data-global-search-result]").forEach((element, elementIndex) => {
    element.classList.toggle("is-active", elementIndex === index);

    if (elementIndex === index) {
      element.scrollIntoView({ block: "nearest" });
    }
  });
}

function filterItems(items, query, getText) {
  const normalizedQuery = normalizeQuery(query);

  return items
    .filter((item) => getText(item).includes(normalizedQuery))
    .slice(0, 4);
}

async function loadCachedList(key, request, normalize) {
  if (globalSearchState[key]) return globalSearchState[key];

  const data = await request();
  globalSearchState[key] = normalize(data);
  return globalSearchState[key];
}

async function searchProducts(query) {
  const cacheKey = normalizeQuery(query);

  if (globalSearchState.productsByQuery.has(cacheKey)) {
    return globalSearchState.productsByQuery.get(cacheKey);
  }

  const data = await window.VBApi.ProductApi.search(query);
  const products = normalizeProducts(data).slice(0, 4);
  globalSearchState.productsByQuery.set(cacheKey, products);

  return products;
}

async function buildResults(query) {
  const [products, customers, suppliers, purchases] = await Promise.all([
    searchProducts(query),
    loadCachedList("customers", () => window.VBApi.CustomerApi.list(), (data) => normalizeList(data, "customers")),
    loadCachedList("suppliers", () => window.VBApi.SupplierApi.list(), (data) => normalizeList(data, "suppliers")),
    loadCachedList("purchases", () => window.VBApi.PurchaseApi.list(), (data) => normalizeList(data, "purchases")),
  ]);

  return {
    products: products.map((product) => ({
      title: cleanText(product.name) || cleanText(product.productCode),
      secondary: compactParts([product.productCode, product.category || product.supplier]),
      href: createUrl("products.html", query),
    })).filter((item) => item.title),
    customers: filterItems(customers, query, (customer) => getSearchText([
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
    ])).map((customer) => ({
      title: cleanText(customer.name),
      secondary: compactParts([customer.email, customer.phone]),
      href: createUrl("customers.html", query),
    })).filter((item) => item.title),
    suppliers: filterItems(suppliers, query, (supplier) => getSearchText([
      supplier.name,
      supplier.email,
      supplier.phone,
      supplier.gstNumber,
      supplier.address,
    ])).map((supplier) => ({
      title: cleanText(supplier.name),
      secondary: compactParts([supplier.gstNumber, supplier.email]),
      href: createUrl("suppliers.html", query),
    })).filter((item) => item.title),
    purchases: filterItems(purchases, query, (purchase) => getSearchText([
      purchase.invoiceNumber,
      getReferenceName(purchase.supplierId),
      purchase.totalAmount,
      purchase.purchaseDate,
    ])).map((purchase) => ({
      title: cleanText(purchase.invoiceNumber),
      secondary: compactParts([getReferenceName(purchase.supplierId), purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString("en-IN") : ""]),
      href: createUrl("purchases.html", query),
    })).filter((item) => item.title),
  };
}

function renderResults(results) {
  const sections = globalSearchGroups.map((group) => {
    const items = results[group.key] || [];

    if (items.length === 0) return "";

    return `
      <div class="global-search-section">
        <p class="global-search-section-title">${escapeHtml(group.label)}</p>
        ${items.map((item) => {
          const index = globalSearchState.resultItems.length;
          globalSearchState.resultItems.push(item);

          return `
            <a class="global-search-result" href="${escapeHtml(item.href)}" data-global-search-result="${index}">
              <span class="global-search-result-icon"><i class="${group.icon}" aria-hidden="true"></i></span>
              <span class="global-search-result-copy">
                <span class="global-search-result-title">${escapeHtml(item.title)}</span>
                ${item.secondary ? `<span class="global-search-result-meta">${escapeHtml(item.secondary)}</span>` : ""}
              </span>
            </a>
          `;
        }).join("")}
      </div>
    `;
  }).join("");

  if (!sections) {
    renderState("No results found", "Try a product, customer, supplier, or invoice number.", "fa-regular fa-folder-open");
    return;
  }

  globalSearchElements.dropdown.innerHTML = sections;
  openDropdown();
}

async function runSearch() {
  const query = globalSearchElements.input.value.trim();
  globalSearchState.query = query;
  globalSearchState.resultItems = [];
  globalSearchState.activeIndex = -1;

  if (query.length < 2) {
    closeDropdown();
    return;
  }

  renderState("Searching", "Checking products, customers, suppliers, and invoices.", "fa-solid fa-circle-notch fa-spin");
  globalSearchState.isLoading = true;

  try {
    const results = await buildResults(query);

    if (globalSearchState.query === query) {
      renderResults(results);
    }
  } catch (error) {
    if (globalSearchState.query === query) {
      renderState("Search unavailable", error.message || "Unable to load search results.", "fa-solid fa-triangle-exclamation");
    }
  } finally {
    globalSearchState.isLoading = false;
  }
}

function debouncedSearch() {
  window.clearTimeout(globalSearchState.debounceTimer);
  globalSearchState.debounceTimer = window.setTimeout(runSearch, 280);
}

function handleInput() {
  const query = globalSearchElements.input.value.trim();

  if (query.length < 2) {
    window.clearTimeout(globalSearchState.debounceTimer);
    closeDropdown();
    return;
  }

  debouncedSearch();
}

function navigateActiveResult() {
  const item = globalSearchState.resultItems[globalSearchState.activeIndex];

  if (item?.href) {
    window.location.href = item.href;
  }
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    closeDropdown();
    globalSearchElements.input.blur();
    return;
  }

  if (!globalSearchState.isOpen || globalSearchState.resultItems.length === 0) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    const nextIndex = globalSearchState.activeIndex >= globalSearchState.resultItems.length - 1
      ? 0
      : globalSearchState.activeIndex + 1;
    setActiveResult(nextIndex);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    const previousIndex = globalSearchState.activeIndex <= 0
      ? globalSearchState.resultItems.length - 1
      : globalSearchState.activeIndex - 1;
    setActiveResult(previousIndex);
  }

  if (event.key === "Enter" && globalSearchState.activeIndex >= 0) {
    event.preventDefault();
    navigateActiveResult();
  }
}

function handleDocumentClick(event) {
  if (!globalSearchElements.dropdown.closest(".global-search")?.contains(event.target)) {
    closeDropdown();
  }
}

function bindGlobalSearch() {
  if (!globalSearchElements.input || !globalSearchElements.dropdown || !window.VBApi) return;

  globalSearchElements.input.addEventListener("input", handleInput);
  globalSearchElements.input.addEventListener("keydown", handleKeydown);
  globalSearchElements.input.addEventListener("focus", () => {
    if (globalSearchElements.input.value.trim().length >= 2 && globalSearchElements.dropdown.innerHTML) {
      openDropdown();
    }
  });
  document.addEventListener("click", handleDocumentClick);
}

bindGlobalSearch();
