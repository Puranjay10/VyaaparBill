const purchasesState = {
  purchases: [],
  filteredPurchases: [],
  suppliers: [],
  products: [],
  page: 1,
  limit: 5,
  totalPages: 1,
  searchTerm: "",
  isLoading: false,
  productRows: [],
};

const purchaseElements = {
  count: document.querySelector("[data-purchase-count]"),
  loading: document.querySelector("[data-purchases-loading]"),
  empty: document.querySelector("[data-purchases-empty]"),
  tableWrap: document.querySelector("[data-purchases-table-wrap]"),
  table: document.querySelector("[data-purchases-table]"),
  error: document.querySelector("[data-purchases-error]"),
  search: document.querySelector("[data-purchase-search]"),
  paginationInfo: document.querySelector("[data-purchase-pagination-info]"),
  prevPage: document.querySelector("[data-purchase-prev-page]"),
  nextPage: document.querySelector("[data-purchase-next-page]"),
  formModal: document.querySelector("[data-purchase-modal]"),
  form: document.querySelector("[data-purchase-form]"),
  formError: document.querySelector("[data-purchase-form-error]"),
  productsError: document.querySelector("[data-purchase-products-error]"),
  supplierSelect: document.querySelector('[data-purchase-field="supplierId"]'),
  invoiceNumber: document.querySelector('[data-purchase-field="invoiceNumber"]'),
  productRowsTable: document.querySelector("[data-purchase-products-table]"),
  addRow: document.querySelector("[data-add-purchase-row]"),
  total: document.querySelector("[data-purchase-total]"),
  saveButton: document.querySelector("[data-save-purchase]"),
  saveSpinner: document.querySelector("[data-purchase-save-spinner]"),
  saveText: document.querySelector("[data-purchase-save-text]"),
  detailModal: document.querySelector("[data-purchase-detail-modal]"),
  detailBody: document.querySelector("[data-purchase-detail-body]"),
};

function formatCurrency(value) {
  const number = Number(value || 0);
  return `Rs. ${number.toLocaleString("en-IN", {
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

function showToast(message) {
  if (window.VBApp?.showToast) {
    window.VBApp.showToast(message);
  }
}

function setActionLoading(config) {
  config.button.disabled = config.isLoading;
  config.spinner.classList.toggle("hide", !config.isLoading);
  config.text.textContent = config.isLoading ? config.loadingText : config.defaultText;
}

function setLoadingState(isLoading) {
  purchasesState.isLoading = isLoading;
  purchaseElements.prevPage.disabled = isLoading || purchasesState.page <= 1;
  purchaseElements.nextPage.disabled = isLoading || purchasesState.page >= purchasesState.totalPages;
}

function normalizePurchasesResponse(data) {
  return Array.isArray(data) ? data : [];
}

function normalizeProductsResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.products) ? data.products : [];
}

function normalizeSuppliersResponse(data) {
  return Array.isArray(data) ? data : [];
}

function getReferenceName(reference, fallback = "-") {
  if (!reference) return fallback;
  if (typeof reference === "string") return reference;
  return reference.name || reference.productCode || reference.invoiceNumber || reference._id || fallback;
}

function getPurchaseProducts(purchase) {
  return Array.isArray(purchase?.products) ? purchase.products : [];
}

function getProductLabel(product) {
  const code = product.productCode ? `${product.productCode} - ` : "";
  return `${code}${product.name || "Unnamed Product"}`;
}

function getPurchaseProductSummary(purchase) {
  const products = getPurchaseProducts(purchase);

  if (products.length === 0) return "-";

  return products.map((item) => {
    const productName = getReferenceName(item.productId, "Product");
    const quantity = formatNumber(item.quantity);
    return `${productName} (${quantity})`;
  }).join(", ");
}

function getPurchaseSearchText(purchase) {
  return [
    purchase.invoiceNumber,
    getReferenceName(purchase.supplierId, ""),
    getPurchaseProductSummary(purchase),
    purchase.totalAmount,
    formatDate(purchase.purchaseDate),
  ].join(" ").toLowerCase();
}

function applyPurchaseFilters() {
  const searchTerm = purchasesState.searchTerm.toLowerCase();

  purchasesState.filteredPurchases = searchTerm
    ? purchasesState.purchases.filter((purchase) => getPurchaseSearchText(purchase).includes(searchTerm))
    : [...purchasesState.purchases];

  purchasesState.totalPages = Math.max(Math.ceil(purchasesState.filteredPurchases.length / purchasesState.limit), 1);

  if (purchasesState.page > purchasesState.totalPages) {
    purchasesState.page = purchasesState.totalPages;
  }
}

function getCurrentPagePurchases() {
  const start = (purchasesState.page - 1) * purchasesState.limit;
  return purchasesState.filteredPurchases.slice(start, start + purchasesState.limit);
}

function renderPurchasesTable(purchases) {
  purchaseElements.table.innerHTML = purchases.map((purchase) => `
    <tr>
      <td class="font-semibold">${escapeHtml(purchase.invoiceNumber)}</td>
      <td>${escapeHtml(getReferenceName(purchase.supplierId))}</td>
      <td>${escapeHtml(getPurchaseProductSummary(purchase))}</td>
      <td>${formatCurrency(purchase.totalAmount)}</td>
      <td>${escapeHtml(formatDate(purchase.purchaseDate))}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" type="button" data-view-purchase="${escapeHtml(purchase._id)}" aria-label="View ${escapeHtml(purchase.invoiceNumber)}">
            <i class="fa-regular fa-eye" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderPurchases() {
  applyPurchaseFilters();

  const pagePurchases = getCurrentPagePurchases();
  const total = purchasesState.filteredPurchases.length;
  const label = total === 1 ? "Purchase" : "Purchases";

  purchaseElements.count.textContent = `${formatNumber(total)} ${label}`;
  purchaseElements.paginationInfo.textContent = purchasesState.searchTerm
    ? `Showing ${formatNumber(total)} search result${total === 1 ? "" : "s"}`
    : `Page ${purchasesState.page} of ${purchasesState.totalPages}`;

  purchaseElements.prevPage.disabled = purchasesState.page <= 1;
  purchaseElements.nextPage.disabled = purchasesState.page >= purchasesState.totalPages;

  if (pagePurchases.length === 0) {
    hideElement(purchaseElements.tableWrap);
    showElement(purchaseElements.empty);
    return;
  }

  hideElement(purchaseElements.empty);
  showElement(purchaseElements.tableWrap);
  renderPurchasesTable(pagePurchases);
}

async function loadPurchases() {
  setAlert(purchaseElements.error, "");
  showElement(purchaseElements.loading);
  hideElement(purchaseElements.empty);
  hideElement(purchaseElements.tableWrap);
  setLoadingState(true);

  try {
    const data = await window.VBApi.PurchaseApi.list();
    purchasesState.purchases = normalizePurchasesResponse(data);
    renderPurchases();
  } catch (error) {
    purchasesState.purchases = [];
    purchasesState.filteredPurchases = [];
    purchasesState.totalPages = 1;
    setAlert(purchaseElements.error, error.message || "Unable to load purchases.");
  } finally {
    hideElement(purchaseElements.loading);
    setLoadingState(false);
  }
}

async function loadPurchaseDependencies() {
  const [suppliersData, productsData] = await Promise.all([
    window.VBApi.SupplierApi.list(),
    window.VBApi.ProductApi.list({
      page: 1,
      limit: 1000,
      sort: "name",
    }),
  ]);

  purchasesState.suppliers = normalizeSuppliersResponse(suppliersData);
  purchasesState.products = normalizeProductsResponse(productsData);
}

function renderSupplierOptions() {
  purchaseElements.supplierSelect.innerHTML = `
    <option value="">Select supplier</option>
    ${purchasesState.suppliers.map((supplier) => `
      <option value="${escapeHtml(supplier._id)}">${escapeHtml(supplier.name)}</option>
    `).join("")}
  `;
}

function getProductOptions(selectedId = "") {
  return `
    <option value="">Select product</option>
    ${purchasesState.products.map((product) => `
      <option value="${escapeHtml(product._id)}" ${product._id === selectedId ? "selected" : ""}>${escapeHtml(getProductLabel(product))}</option>
    `).join("")}
  `;
}

function createEmptyProductRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: "",
    quantity: "",
    purchasePrice: "",
  };
}

function calculateRowTotal(row) {
  return Number(row.quantity || 0) * Number(row.purchasePrice || 0);
}

function calculateTotalAmount() {
  return purchasesState.productRows.reduce((total, row) => total + calculateRowTotal(row), 0);
}

function updatePurchaseTotals() {
  purchasesState.productRows.forEach((row) => {
    const lineTotal = document.querySelector(`[data-purchase-row-total="${row.id}"]`);

    if (lineTotal) {
      lineTotal.textContent = formatCurrency(calculateRowTotal(row));
    }
  });

  purchaseElements.total.textContent = formatCurrency(calculateTotalAmount());
}

function renderPurchaseRows() {
  purchaseElements.productRowsTable.innerHTML = purchasesState.productRows.map((row, index) => `
    <tr>
      <td>
        <label class="sr-only" for="purchase-product-${escapeHtml(row.id)}">Product</label>
        <select class="form-select" id="purchase-product-${escapeHtml(row.id)}" data-purchase-row-field="productId" data-row-id="${escapeHtml(row.id)}">
          ${getProductOptions(row.productId)}
        </select>
      </td>
      <td>
        <label class="sr-only" for="purchase-quantity-${escapeHtml(row.id)}">Quantity</label>
        <input class="form-input" id="purchase-quantity-${escapeHtml(row.id)}" type="number" min="1" step="1" value="${escapeHtml(row.quantity)}" data-purchase-row-field="quantity" data-row-id="${escapeHtml(row.id)}">
      </td>
      <td>
        <label class="sr-only" for="purchase-price-${escapeHtml(row.id)}">Purchase Price</label>
        <input class="form-input" id="purchase-price-${escapeHtml(row.id)}" type="number" min="0" step="0.01" value="${escapeHtml(row.purchasePrice)}" data-purchase-row-field="purchasePrice" data-row-id="${escapeHtml(row.id)}">
      </td>
      <td data-purchase-row-total="${escapeHtml(row.id)}">${formatCurrency(calculateRowTotal(row))}</td>
      <td>
        <button class="icon-btn" type="button" data-remove-purchase-row="${escapeHtml(row.id)}" aria-label="Remove row ${index + 1}" ${purchasesState.productRows.length === 1 ? "disabled" : ""}>
          <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
  `).join("");

  purchaseElements.total.textContent = formatCurrency(calculateTotalAmount());
}

function resetPurchaseForm() {
  purchaseElements.form.reset();
  setAlert(purchaseElements.formError, "");
  setAlert(purchaseElements.productsError, "");
  document.querySelectorAll("[data-field-error]").forEach((element) => {
    element.textContent = "";
    element.classList.remove("is-visible");
  });
  purchasesState.productRows = [createEmptyProductRow()];
  renderPurchaseRows();
}

function setFieldError(field, message) {
  const element = document.querySelector(`[data-field-error="${field}"]`);

  if (!element) return;

  element.textContent = message;
  element.classList.add("is-visible");
}

async function openPurchaseModal() {
  setAlert(purchaseElements.formError, "");
  purchaseElements.formModal.classList.add("is-visible");

  try {
    if (purchasesState.suppliers.length === 0 || purchasesState.products.length === 0) {
      await loadPurchaseDependencies();
    }

    renderSupplierOptions();
    resetPurchaseForm();
    purchaseElements.invoiceNumber?.focus();
  } catch (error) {
    setAlert(purchaseElements.formError, error.message || "Unable to load purchase form data.");
  }
}

function closePurchaseModal() {
  purchaseElements.formModal.classList.remove("is-visible");
}

function buildPurchasePayload() {
  return {
    invoiceNumber: purchaseElements.invoiceNumber.value.trim(),
    supplierId: purchaseElements.supplierSelect.value,
    products: purchasesState.productRows.map((row) => ({
      productId: row.productId,
      quantity: Number(row.quantity),
      purchasePrice: Number(row.purchasePrice),
    })),
    totalAmount: calculateTotalAmount(),
  };
}

function validatePurchasePayload(payload) {
  setAlert(purchaseElements.formError, "");
  setAlert(purchaseElements.productsError, "");
  document.querySelectorAll("[data-field-error]").forEach((element) => {
    element.textContent = "";
    element.classList.remove("is-visible");
  });

  if (!payload.invoiceNumber) {
    setFieldError("invoiceNumber", "Invoice number is required.");
    purchaseElements.invoiceNumber?.focus();
    return false;
  }

  if (!payload.supplierId) {
    setFieldError("supplierId", "Supplier is required.");
    purchaseElements.supplierSelect?.focus();
    return false;
  }

  if (payload.products.length === 0) {
    setAlert(purchaseElements.productsError, "At least one product is required.");
    return false;
  }

  for (let index = 0; index < payload.products.length; index += 1) {
    const item = payload.products[index];
    const rowNumber = index + 1;

    if (!item.productId) {
      setAlert(purchaseElements.productsError, `Product is required in row ${rowNumber}.`);
      return false;
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      setAlert(purchaseElements.productsError, `Quantity must be greater than 0 in row ${rowNumber}.`);
      return false;
    }

    if (Number.isNaN(item.purchasePrice) || item.purchasePrice < 0) {
      setAlert(purchaseElements.productsError, `Purchase price must be 0 or greater in row ${rowNumber}.`);
      return false;
    }
  }

  if (payload.totalAmount < 0) {
    setAlert(purchaseElements.productsError, "Total amount must be positive.");
    return false;
  }

  return true;
}

async function handlePurchaseSubmit(event) {
  event.preventDefault();

  const payload = buildPurchasePayload();

  if (!validatePurchasePayload(payload)) return;

  setActionLoading({
    button: purchaseElements.saveButton,
    spinner: purchaseElements.saveSpinner,
    text: purchaseElements.saveText,
    isLoading: true,
    loadingText: "Creating...",
    defaultText: "Create Purchase",
  });

  try {
    await window.VBApi.PurchaseApi.create(payload);
    closePurchaseModal();
    purchasesState.page = 1;
    purchasesState.searchTerm = "";
    purchaseElements.search.value = "";
    purchasesState.products = [];
    showToast("Purchase created successfully.");
    await loadPurchases();
  } catch (error) {
    setAlert(purchaseElements.formError, error.message || "Unable to create purchase.");
  } finally {
    setActionLoading({
      button: purchaseElements.saveButton,
      spinner: purchaseElements.saveSpinner,
      text: purchaseElements.saveText,
      isLoading: false,
      loadingText: "",
      defaultText: "Create Purchase",
    });
  }
}

function getPurchaseById(id) {
  return purchasesState.purchases.find((purchase) => purchase._id === id);
}

function renderPurchaseDetail(purchase) {
  const supplierName = getReferenceName(purchase.supplierId);
  const supplierEmail = purchase.supplierId?.email || "-";
  const supplierPhone = purchase.supplierId?.phone || "-";
  const rows = getPurchaseProducts(purchase).map((item) => `
    <tr>
      <td class="font-semibold">${escapeHtml(getReferenceName(item.productId, "Product"))}</td>
      <td>${formatNumber(item.quantity)}</td>
      <td>${formatCurrency(item.purchasePrice)}</td>
      <td>${formatCurrency(Number(item.quantity || 0) * Number(item.purchasePrice || 0))}</td>
    </tr>
  `).join("");

  purchaseElements.detailBody.innerHTML = `
    <div class="grid form-preview-grid">
      <div class="card stat-card">
        <p class="stat-label">Invoice Number</p>
        <p class="stat-value">${escapeHtml(purchase.invoiceNumber)}</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Supplier</p>
        <p class="stat-value">${escapeHtml(supplierName)}</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Total Amount</p>
        <p class="stat-value">${formatCurrency(purchase.totalAmount)}</p>
      </div>
    </div>

    <div class="section-gap">
      <p class="pagination-info mb-0">${escapeHtml(supplierEmail)} | ${escapeHtml(supplierPhone)} | ${escapeHtml(formatDate(purchase.purchaseDate))}</p>
    </div>

    <div class="table-wrap section-gap">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Purchase Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function openPurchaseDetail(purchase) {
  renderPurchaseDetail(purchase);
  purchaseElements.detailModal.classList.add("is-visible");
}

function closePurchaseDetail() {
  purchaseElements.detailModal.classList.remove("is-visible");
}

function handleTableClick(event) {
  const viewButton = event.target.closest("[data-view-purchase]");

  if (viewButton) {
    const purchase = getPurchaseById(viewButton.dataset.viewPurchase);

    if (purchase) {
      openPurchaseDetail(purchase);
    }
  }
}

function handleProductRowsInput(event) {
  const field = event.target.dataset.purchaseRowField;
  const rowId = event.target.dataset.rowId;

  if (!field || !rowId) return;

  const row = purchasesState.productRows.find((item) => item.id === rowId);

  if (!row) return;

  row[field] = event.target.value;
  updatePurchaseTotals();
}

function handleProductRowsClick(event) {
  const removeButton = event.target.closest("[data-remove-purchase-row]");

  if (!removeButton || purchasesState.productRows.length === 1) return;

  purchasesState.productRows = purchasesState.productRows.filter((row) => row.id !== removeButton.dataset.removePurchaseRow);
  renderPurchaseRows();
}

function debounce(callback, wait = 350) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

function bindPurchaseEvents() {
  document.querySelector("[data-add-purchase]")?.addEventListener("click", openPurchaseModal);
  document.querySelector("[data-refresh-purchases]")?.addEventListener("click", loadPurchases);
  purchaseElements.form?.addEventListener("submit", handlePurchaseSubmit);
  purchaseElements.table?.addEventListener("click", handleTableClick);
  purchaseElements.productRowsTable?.addEventListener("input", handleProductRowsInput);
  purchaseElements.productRowsTable?.addEventListener("change", handleProductRowsInput);
  purchaseElements.productRowsTable?.addEventListener("click", handleProductRowsClick);
  purchaseElements.addRow?.addEventListener("click", () => {
    purchasesState.productRows.push(createEmptyProductRow());
    renderPurchaseRows();
  });

  document.querySelectorAll("[data-close-purchase-modal]").forEach((button) => {
    button.addEventListener("click", closePurchaseModal);
  });

  document.querySelectorAll("[data-close-purchase-detail-modal]").forEach((button) => {
    button.addEventListener("click", closePurchaseDetail);
  });

  purchaseElements.formModal?.addEventListener("click", (event) => {
    if (event.target === purchaseElements.formModal) {
      closePurchaseModal();
    }
  });

  purchaseElements.detailModal?.addEventListener("click", (event) => {
    if (event.target === purchaseElements.detailModal) {
      closePurchaseDetail();
    }
  });

  purchaseElements.prevPage?.addEventListener("click", () => {
    if (purchasesState.page > 1) {
      purchasesState.page -= 1;
      renderPurchases();
    }
  });

  purchaseElements.nextPage?.addEventListener("click", () => {
    if (purchasesState.page < purchasesState.totalPages) {
      purchasesState.page += 1;
      renderPurchases();
    }
  });

  purchaseElements.search?.addEventListener("input", debounce((event) => {
    purchasesState.searchTerm = event.target.value.trim();
    purchasesState.page = 1;
    renderPurchases();
  }));

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closePurchaseModal();
    closePurchaseDetail();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.VBAuth?.getToken()) return;

  bindPurchaseEvents();
  loadPurchases();
});
