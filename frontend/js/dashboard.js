const dashboardState = {
  products: [],
  customers: [],
  suppliers: [],
  sales: [],
  purchases: [],
  productCount: 0,
  errors: [],
};

const dashboardElements = {
  error: document.querySelector("[data-dashboard-error]"),
  errorCard: document.querySelector("[data-dashboard-error-card]"),
  refresh: document.querySelector("[data-refresh-dashboard]"),
  loading: document.querySelector("[data-dashboard-loading]"),
  aiLoading: document.querySelector("[data-ai-card-loading]"),
  activityTableWrap: document.querySelector("[data-activity-table-wrap]"),
  activityTable: document.querySelector("[data-activity-table]"),
  activityEmpty: document.querySelector("[data-activity-empty]"),
  activityCount: document.querySelector("[data-activity-count]"),
  aiCard: document.querySelector("[data-ai-card]"),
  aiEmpty: document.querySelector("[data-ai-empty]"),
  kpis: {
    sales: document.querySelector('[data-dashboard-kpi="sales"]'),
    purchases: document.querySelector('[data-dashboard-kpi="purchases"]'),
    products: document.querySelector('[data-dashboard-kpi="products"]'),
    customers: document.querySelector('[data-dashboard-kpi="customers"]'),
  },
  notes: {
    sales: document.querySelector('[data-dashboard-note="sales"]'),
    purchases: document.querySelector('[data-dashboard-note="purchases"]'),
    products: document.querySelector('[data-dashboard-note="products"]'),
    customers: document.querySelector('[data-dashboard-note="customers"]'),
  },
};

function formatCurrency(value) {
  const number = Number(value || 0);
  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMetricLabel(count, singular, plural) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showElement(element) {
  element?.classList.remove("hide");
}

function hideElement(element) {
  element?.classList.add("hide");
}

function setAlert(element, message) {
  if (!element) return;

  element.textContent = message || "";
  element.classList.toggle("is-visible", Boolean(message));
}

function normalizeList(data, key) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
}

function normalizeProducts(data) {
  return {
    products: normalizeList(data, "products"),
    total: Number(data?.totalProducts ?? (Array.isArray(data) ? data.length : 0)),
  };
}

function sumBy(items, field) {
  return items.reduce((total, item) => total + Number(item?.[field] || 0), 0);
}

function getReferenceName(reference, fallback = "-") {
  if (!reference) return fallback;
  if (typeof reference === "string") return reference;
  return reference.name || reference.productCode || reference.invoiceNumber || reference._id || fallback;
}

function getActivityDate(item) {
  return item.dateValue ? new Date(item.dateValue).getTime() : 0;
}

function getPurchaseProducts(purchase) {
  return Array.isArray(purchase?.products) ? purchase.products : [];
}

function getProductsImported(purchase) {
  return getPurchaseProducts(purchase).reduce((total, item) => total + Number(item?.quantity || 0), 0);
}

function isAiPurchase(purchase) {
  return getPurchaseProducts(purchase).some((item) => {
    const product = item.productId;

    if (!product || typeof product === "string") return false;

    return String(product.productCode || "").startsWith("AI-") ||
      String(product.category || "").toLowerCase() === "imported";
  });
}

function getLatestPurchase(purchases) {
  return [...purchases]
    .filter((purchase) => purchase?.invoiceNumber)
    .sort((a, b) => new Date(b.purchaseDate || b.createdAt || 0) - new Date(a.purchaseDate || a.createdAt || 0))[0] || null;
}

function getLatestAiOrPurchase() {
  const aiPurchase = [...dashboardState.purchases]
    .filter((purchase) => purchase?.invoiceNumber && isAiPurchase(purchase))
    .sort((a, b) => new Date(b.purchaseDate || b.createdAt || 0) - new Date(a.purchaseDate || a.createdAt || 0))[0];

  return {
    purchase: aiPurchase || getLatestPurchase(dashboardState.purchases),
    isAi: Boolean(aiPurchase),
  };
}

function setLoadingState(isLoading) {
  dashboardElements.refresh.disabled = isLoading;

  Object.values(dashboardElements.kpis).forEach((element) => {
    element?.classList.toggle("dashboard-value-loading", isLoading);
  });

  if (isLoading) {
    showElement(dashboardElements.loading);
    showElement(dashboardElements.aiLoading);
    hideElement(dashboardElements.activityTableWrap);
    hideElement(dashboardElements.activityEmpty);
    hideElement(dashboardElements.aiCard);
    hideElement(dashboardElements.aiEmpty);
    dashboardElements.activityCount.textContent = "Loading";
  } else {
    hideElement(dashboardElements.loading);
    hideElement(dashboardElements.aiLoading);
  }
}

function renderKpis() {
  const totalSales = sumBy(dashboardState.sales, "totalAmount");
  const totalPurchases = sumBy(dashboardState.purchases, "totalAmount");

  dashboardElements.kpis.sales.textContent = formatCurrency(totalSales);
  dashboardElements.kpis.purchases.textContent = formatCurrency(totalPurchases);
  dashboardElements.kpis.products.textContent = formatNumber(dashboardState.productCount);
  dashboardElements.kpis.customers.textContent = formatNumber(dashboardState.customers.length);

  dashboardElements.notes.sales.textContent = `${formatMetricLabel(dashboardState.sales.length, "Sale", "Sales")} Recorded`;
  dashboardElements.notes.purchases.textContent = `${formatMetricLabel(dashboardState.purchases.length, "Purchase", "Purchases")} Recorded`;
  dashboardElements.notes.products.textContent = `${formatMetricLabel(dashboardState.productCount, "Active Product", "Active Products")}`;
  dashboardElements.notes.customers.textContent = `${formatMetricLabel(dashboardState.customers.length, "Registered Customer", "Registered Customers")}`;
}

function buildActivity() {
  const sales = dashboardState.sales.map((sale) => ({
    type: "Sale",
    reference: sale.invoiceNumber || sale._id || "-",
    status: "Completed",
    amount: sale.totalAmount,
    dateValue: sale.saleDate || sale.createdAt,
  }));

  const purchases = dashboardState.purchases.map((purchase) => ({
    type: "Purchase",
    reference: purchase.invoiceNumber || purchase._id || "-",
    status: isAiPurchase(purchase) ? "AI Import" : "Recorded",
    amount: purchase.totalAmount,
    dateValue: purchase.purchaseDate || purchase.createdAt,
  }));

  return [...sales, ...purchases]
    .sort((a, b) => getActivityDate(b) - getActivityDate(a))
    .slice(0, 8);
}

function renderActivity() {
  const activity = buildActivity();
  const total = dashboardState.sales.length + dashboardState.purchases.length;

  dashboardElements.activityCount.textContent = `${formatNumber(total)} Records`;

  if (activity.length === 0) {
    hideElement(dashboardElements.activityTableWrap);
    showElement(dashboardElements.activityEmpty);
    return;
  }

  hideElement(dashboardElements.activityEmpty);
  showElement(dashboardElements.activityTableWrap);

  dashboardElements.activityTable.innerHTML = activity.map((item) => `
    <tr>
      <td class="font-semibold">${escapeHtml(item.type)}</td>
      <td class="dashboard-reference">${escapeHtml(item.reference)}</td>
      <td><span class="badge dashboard-status-badge ${item.status === "AI Import" ? "badge-warning" : "badge-success"}">${escapeHtml(item.status)}</span></td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${escapeHtml(formatDate(item.dateValue))}</td>
    </tr>
  `).join("");
}

function renderAiMetric(label, value) {
  if (value === undefined || value === null || value === "" || value === "-") return "";

  return `
    <div>
      <p class="stat-label">${escapeHtml(label)}</p>
      <p class="font-semibold">${escapeHtml(value)}</p>
    </div>
  `;
}

function renderAiCard() {
  const { purchase, isAi } = getLatestAiOrPurchase();
  const productsImported = getProductsImported(purchase);
  const purchaseDate = purchase.purchaseDate || purchase.createdAt;

  if (!purchase) {
    hideElement(dashboardElements.aiCard);
    showElement(dashboardElements.aiEmpty);
    return;
  }

  hideElement(dashboardElements.aiEmpty);
  showElement(dashboardElements.aiCard);

  dashboardElements.aiCard.innerHTML = `
    <div class="dashboard-ai-summary">
      <div class="stat-icon">
        <i class="fa-solid ${isAi ? "fa-wand-magic-sparkles" : "fa-receipt"}" aria-hidden="true"></i>
      </div>
      <div>
        <p class="stat-label">${isAi ? "Latest AI Import" : "Latest Purchase"}</p>
        <p class="dashboard-ai-reference">${escapeHtml(purchase.invoiceNumber || "-")}</p>
      </div>
    </div>
    <div class="dashboard-ai-metrics">
      ${renderAiMetric("Invoice Number", purchase.invoiceNumber)}
      ${renderAiMetric("Supplier", getReferenceName(purchase.supplierId))}
      ${productsImported > 0 ? renderAiMetric("Products Imported", formatNumber(productsImported)) : ""}
      ${purchase.totalAmount !== undefined && purchase.totalAmount !== null ? renderAiMetric("Estimated Total", formatCurrency(purchase.totalAmount)) : ""}
      ${purchaseDate ? renderAiMetric("Import Date", formatDate(purchaseDate)) : ""}
    </div>
    <a class="btn btn-secondary dashboard-ai-action" href="purchases.html">
      <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      <span>Open Purchases</span>
    </a>
  `;
}

function renderErrors() {
  if (dashboardState.errors.length === 0) {
    setAlert(dashboardElements.error, "");
    hideElement(dashboardElements.errorCard);
    return;
  }

  showElement(dashboardElements.errorCard);
  setAlert(
    dashboardElements.error,
    dashboardState.errors.map((item) => `${item.label}: ${item.message}`).join(" ")
  );
}

function renderDashboard() {
  renderKpis();
  renderActivity();
  renderAiCard();
  renderErrors();
}

async function loadResource(label, request, normalize) {
  try {
    const data = await request();
    return {
      label,
      data: normalize(data),
      error: null,
    };
  } catch (error) {
    return {
      label,
      data: [],
      error: error.message || `Unable to load ${label.toLowerCase()}.`,
    };
  }
}

async function loadDashboard() {
  setLoadingState(true);
  setAlert(dashboardElements.error, "");

  const results = await Promise.all([
    loadResource("Products", () => window.VBApi.ProductApi.list(), normalizeProducts),
    loadResource("Customers", () => window.VBApi.CustomerApi.list(), (data) => normalizeList(data, "customers")),
    loadResource("Suppliers", () => window.VBApi.SupplierApi.list(), (data) => normalizeList(data, "suppliers")),
    loadResource("Sales", () => window.VBApi.SaleApi.list(), (data) => normalizeList(data, "sales")),
    loadResource("Purchases", () => window.VBApi.PurchaseApi.list(), (data) => normalizeList(data, "purchases")),
  ]);

  const byLabel = Object.fromEntries(results.map((result) => [result.label, result]));

  dashboardState.products = byLabel.Products.data.products || [];
  dashboardState.productCount = byLabel.Products.data.total || 0;
  dashboardState.customers = byLabel.Customers.data;
  dashboardState.suppliers = byLabel.Suppliers.data;
  dashboardState.sales = byLabel.Sales.data;
  dashboardState.purchases = byLabel.Purchases.data;
  dashboardState.errors = results
    .filter((result) => result.error)
    .map((result) => ({
      label: result.label,
      message: result.error,
    }));

  setLoadingState(false);
  renderDashboard();
}

function bindDashboardEvents() {
  dashboardElements.refresh?.addEventListener("click", loadDashboard);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.VBAuth?.getToken()) return;

  bindDashboardEvents();
  loadDashboard();
});
