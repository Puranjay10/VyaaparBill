const salesState = {
  sales: [],
  filteredSales: [],
  customers: [],
  products: [],
  invoicesBySaleId: {},
  currentInvoiceId: null,
  page: 1,
  limit: 5,
  totalPages: 1,
  searchTerm: "",
  isLoading: false,
  productRows: [],
};

const saleElements = {
  count: document.querySelector("[data-sale-count]"),
  loading: document.querySelector("[data-sales-loading]"),
  empty: document.querySelector("[data-sales-empty]"),
  tableWrap: document.querySelector("[data-sales-table-wrap]"),
  table: document.querySelector("[data-sales-table]"),
  error: document.querySelector("[data-sales-error]"),
  search: document.querySelector("[data-sale-search]"),
  paginationInfo: document.querySelector("[data-sale-pagination-info]"),
  prevPage: document.querySelector("[data-sale-prev-page]"),
  nextPage: document.querySelector("[data-sale-next-page]"),
  formModal: document.querySelector("[data-sale-modal]"),
  form: document.querySelector("[data-sale-form]"),
  formError: document.querySelector("[data-sale-form-error]"),
  productsError: document.querySelector("[data-sale-products-error]"),
  customerSelect: document.querySelector('[data-sale-field="customerId"]'),
  productRowsTable: document.querySelector("[data-sale-products-table]"),
  addRow: document.querySelector("[data-add-sale-row]"),
  total: document.querySelector("[data-sale-total]"),
  saveButton: document.querySelector("[data-save-sale]"),
  saveSpinner: document.querySelector("[data-sale-save-spinner]"),
  saveText: document.querySelector("[data-sale-save-text]"),
  detailModal: document.querySelector("[data-sale-detail-modal]"),
  detailBody: document.querySelector("[data-sale-detail-body]"),
  invoiceModal: document.querySelector("[data-invoice-modal]"),
  invoiceBody: document.querySelector("[data-invoice-body]"),
  viewInvoice: document.querySelector("[data-view-invoice]"),
  downloadInvoice: document.querySelector("[data-download-invoice]"),
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
  salesState.isLoading = isLoading;
  saleElements.prevPage.disabled = isLoading || salesState.page <= 1;
  saleElements.nextPage.disabled = isLoading || salesState.page >= salesState.totalPages;
}

function normalizeSalesResponse(data) {
  return Array.isArray(data) ? data : [];
}

function normalizeProductsResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.products) ? data.products : [];
}

function normalizeCustomersResponse(data) {
  return Array.isArray(data) ? data : [];
}

function getReferenceName(reference, fallback = "-") {
  if (!reference) return fallback;
  if (typeof reference === "string") return reference;
  return reference.name || reference.productCode || reference.invoiceNumber || reference._id || fallback;
}

function getReferenceEmail(reference) {
  if (!reference || typeof reference === "string") return "-";
  return reference.email || "-";
}

function getReferencePhone(reference) {
  if (!reference || typeof reference === "string") return "-";
  return reference.phone || "-";
}

function getSaleProducts(sale) {
  return Array.isArray(sale?.products) ? sale.products : [];
}

function getProductLabel(product) {
  const code = product.productCode ? `${product.productCode} - ` : "";
  const stock = product.quantity !== undefined ? ` (${formatNumber(product.quantity)} in stock)` : "";
  return `${code}${product.name || "Unnamed Product"}${stock}`;
}

function getProductById(id) {
  return salesState.products.find((product) => product._id === id);
}

function getSaleProductSummary(sale) {
  const products = getSaleProducts(sale);

  if (products.length === 0) return "-";

  return products.map((item) => {
    const productName = getReferenceName(item.productId, "Product");
    const quantity = formatNumber(item.quantity);
    return `${productName} (${quantity})`;
  }).join(", ");
}

function getInvoiceForSale(sale) {
  return salesState.invoicesBySaleId[sale._id] || null;
}

function getSaleSearchText(sale) {
  const invoice = getInvoiceForSale(sale);

  return [
    getReferenceName(sale.customerId, ""),
    getSaleProductSummary(sale),
    sale.totalAmount,
    formatDate(sale.saleDate),
    invoice?.invoiceNumber,
  ].join(" ").toLowerCase();
}

function applySaleFilters() {
  const searchTerm = salesState.searchTerm.toLowerCase();

  salesState.filteredSales = searchTerm
    ? salesState.sales.filter((sale) => getSaleSearchText(sale).includes(searchTerm))
    : [...salesState.sales];

  salesState.totalPages = Math.max(Math.ceil(salesState.filteredSales.length / salesState.limit), 1);

  if (salesState.page > salesState.totalPages) {
    salesState.page = salesState.totalPages;
  }
}

function getCurrentPageSales() {
  const start = (salesState.page - 1) * salesState.limit;
  return salesState.filteredSales.slice(start, start + salesState.limit);
}

function getInvoiceActions(invoice) {
  if (!invoice?._id) return "-";

  return `
    <button class="icon-btn" type="button" data-open-invoice="${escapeHtml(invoice._id)}" aria-label="View invoice ${escapeHtml(invoice.invoiceNumber)}">
      <i class="fa-regular fa-eye" aria-hidden="true"></i>
    </button>
    <a class="icon-btn" href="${escapeHtml(window.VBApi.InvoiceApi.getDownloadUrl(invoice._id))}" target="_blank" rel="noopener" aria-label="Download invoice ${escapeHtml(invoice.invoiceNumber)}">
      <i class="fa-solid fa-download" aria-hidden="true"></i>
    </a>
  `;
}

function renderSalesTable(sales) {
  saleElements.table.innerHTML = sales.map((sale) => {
    const invoice = getInvoiceForSale(sale);
    const invoiceLabel = invoice?.invoiceNumber || "-";

    return `
      <tr>
        <td class="font-semibold">${escapeHtml(getReferenceName(sale.customerId))}</td>
        <td>${escapeHtml(getSaleProductSummary(sale))}</td>
        <td>${formatCurrency(sale.totalAmount)}</td>
        <td>${escapeHtml(formatDate(sale.saleDate))}</td>
        <td>${escapeHtml(invoiceLabel)}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn" type="button" data-view-sale="${escapeHtml(sale._id)}" aria-label="View sale">
              <i class="fa-regular fa-eye" aria-hidden="true"></i>
            </button>
            ${getInvoiceActions(invoice)}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderSales() {
  applySaleFilters();

  const pageSales = getCurrentPageSales();
  const total = salesState.filteredSales.length;
  const label = total === 1 ? "Sale" : "Sales";

  saleElements.count.textContent = `${formatNumber(total)} ${label}`;
  saleElements.paginationInfo.textContent = salesState.searchTerm
    ? `Showing ${formatNumber(total)} search result${total === 1 ? "" : "s"}`
    : `Page ${salesState.page} of ${salesState.totalPages}`;

  saleElements.prevPage.disabled = salesState.page <= 1;
  saleElements.nextPage.disabled = salesState.page >= salesState.totalPages;

  if (pageSales.length === 0) {
    hideElement(saleElements.tableWrap);
    showElement(saleElements.empty);
    return;
  }

  hideElement(saleElements.empty);
  showElement(saleElements.tableWrap);
  renderSalesTable(pageSales);
}

async function loadSales() {
  setAlert(saleElements.error, "");
  showElement(saleElements.loading);
  hideElement(saleElements.empty);
  hideElement(saleElements.tableWrap);
  setLoadingState(true);

  try {
    const data = await window.VBApi.SaleApi.list();
    salesState.sales = normalizeSalesResponse(data);
    renderSales();
  } catch (error) {
    salesState.sales = [];
    salesState.filteredSales = [];
    salesState.totalPages = 1;
    setAlert(saleElements.error, error.message || "Unable to load sales.");
  } finally {
    hideElement(saleElements.loading);
    setLoadingState(false);
  }
}

async function loadSaleDependencies() {
  const [customersData, productsData] = await Promise.all([
    window.VBApi.CustomerApi.list(),
    window.VBApi.ProductApi.list({
      page: 1,
      limit: 1000,
      sort: "name",
    }),
  ]);

  salesState.customers = normalizeCustomersResponse(customersData);
  salesState.products = normalizeProductsResponse(productsData);
}

function renderCustomerOptions() {
  saleElements.customerSelect.innerHTML = `
    <option value="">Select customer</option>
    ${salesState.customers.map((customer) => `
      <option value="${escapeHtml(customer._id)}">${escapeHtml(customer.name)}</option>
    `).join("")}
  `;
}

function getProductOptions(selectedId = "") {
  return `
    <option value="">Select product</option>
    ${salesState.products.map((product) => `
      <option value="${escapeHtml(product._id)}" ${product._id === selectedId ? "selected" : ""}>${escapeHtml(getProductLabel(product))}</option>
    `).join("")}
  `;
}

function createEmptyProductRow() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: "",
    quantity: "",
    sellingPrice: "",
  };
}

function calculateRowTotal(row) {
  return Number(row.quantity || 0) * Number(row.sellingPrice || 0);
}

function calculateTotalAmount() {
  return salesState.productRows.reduce((total, row) => total + calculateRowTotal(row), 0);
}

function updateSaleTotals() {
  salesState.productRows.forEach((row) => {
    const lineTotal = document.querySelector(`[data-sale-row-total="${row.id}"]`);

    if (lineTotal) {
      lineTotal.textContent = formatCurrency(calculateRowTotal(row));
    }
  });

  saleElements.total.textContent = formatCurrency(calculateTotalAmount());
}

function renderSaleRows() {
  saleElements.productRowsTable.innerHTML = salesState.productRows.map((row, index) => `
    <tr>
      <td>
        <label class="sr-only" for="sale-product-${escapeHtml(row.id)}">Product</label>
        <select class="form-select" id="sale-product-${escapeHtml(row.id)}" data-sale-row-field="productId" data-row-id="${escapeHtml(row.id)}">
          ${getProductOptions(row.productId)}
        </select>
      </td>
      <td>
        <label class="sr-only" for="sale-quantity-${escapeHtml(row.id)}">Quantity</label>
        <input class="form-input" id="sale-quantity-${escapeHtml(row.id)}" type="number" min="1" step="1" value="${escapeHtml(row.quantity)}" data-sale-row-field="quantity" data-row-id="${escapeHtml(row.id)}">
      </td>
      <td>
        <label class="sr-only" for="sale-price-${escapeHtml(row.id)}">Selling Price</label>
        <input class="form-input" id="sale-price-${escapeHtml(row.id)}" type="number" min="0" step="0.01" value="${escapeHtml(row.sellingPrice)}" data-sale-row-field="sellingPrice" data-row-id="${escapeHtml(row.id)}">
      </td>
      <td data-sale-row-total="${escapeHtml(row.id)}">${formatCurrency(calculateRowTotal(row))}</td>
      <td>
        <button class="icon-btn" type="button" data-remove-sale-row="${escapeHtml(row.id)}" aria-label="Remove row ${index + 1}" ${salesState.productRows.length === 1 ? "disabled" : ""}>
          <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
  `).join("");

  saleElements.total.textContent = formatCurrency(calculateTotalAmount());
}

function clearFieldErrors() {
  document.querySelectorAll("[data-field-error]").forEach((element) => {
    element.textContent = "";
    element.classList.remove("is-visible");
  });
}

function resetSaleForm() {
  saleElements.form.reset();
  setAlert(saleElements.formError, "");
  setAlert(saleElements.productsError, "");
  clearFieldErrors();
  salesState.productRows = [createEmptyProductRow()];
  renderSaleRows();
}

function setFieldError(field, message) {
  const element = document.querySelector(`[data-field-error="${field}"]`);

  if (!element) return;

  element.textContent = message;
  element.classList.add("is-visible");
}

async function openSaleModal() {
  setAlert(saleElements.formError, "");
  saleElements.formModal.classList.add("is-visible");

  try {
    if (salesState.customers.length === 0 || salesState.products.length === 0) {
      await loadSaleDependencies();
    }

    renderCustomerOptions();
    resetSaleForm();
    saleElements.customerSelect?.focus();
  } catch (error) {
    setAlert(saleElements.formError, error.message || "Unable to load sale form data.");
  }
}

function closeSaleModal() {
  saleElements.formModal.classList.remove("is-visible");
}

function buildSalePayload() {
  return {
    customerId: saleElements.customerSelect.value,
    products: salesState.productRows.map((row) => ({
      productId: row.productId,
      quantity: Number(row.quantity),
      sellingPrice: Number(row.sellingPrice),
    })),
    totalAmount: calculateTotalAmount(),
  };
}

function validateSalePayload(payload) {
  setAlert(saleElements.formError, "");
  setAlert(saleElements.productsError, "");
  clearFieldErrors();

  if (!payload.customerId) {
    setFieldError("customerId", "Customer is required.");
    saleElements.customerSelect?.focus();
    return false;
  }

  if (payload.products.length === 0) {
    setAlert(saleElements.productsError, "At least one product is required.");
    return false;
  }

  for (let index = 0; index < payload.products.length; index += 1) {
    const item = payload.products[index];
    const rowNumber = index + 1;

    if (!item.productId) {
      setAlert(saleElements.productsError, `Product is required in row ${rowNumber}.`);
      return false;
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      setAlert(saleElements.productsError, `Quantity must be greater than 0 in row ${rowNumber}.`);
      return false;
    }

    if (Number.isNaN(item.sellingPrice) || item.sellingPrice < 0) {
      setAlert(saleElements.productsError, `Selling price must be 0 or greater in row ${rowNumber}.`);
      return false;
    }
  }

  if (payload.totalAmount < 0) {
    setAlert(saleElements.productsError, "Total amount must be positive.");
    return false;
  }

  return true;
}

function openInvoiceModal(invoice) {
  if (!invoice?._id) return;

  salesState.currentInvoiceId = invoice._id;
  saleElements.invoiceBody.innerHTML = `
    <div class="grid form-preview-grid">
      <div class="card stat-card">
        <p class="stat-label">Invoice Number</p>
        <p class="stat-value">${escapeHtml(invoice.invoiceNumber)}</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Total Amount</p>
        <p class="stat-value">${formatCurrency(invoice.totalAmount)}</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">GST Amount</p>
        <p class="stat-value">${formatCurrency(invoice.gstAmount)}</p>
      </div>
    </div>
    ${Array.isArray(invoice.items) && invoice.items.length > 0 ? `
      <div class="table-wrap section-gap">
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Selling Price</th>
              <th>GST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item) => `
              <tr>
                <td class="font-semibold">${escapeHtml(item.productName)}</td>
                <td>${formatNumber(item.quantity)}</td>
                <td>${formatCurrency(item.sellingPrice)}</td>
                <td>${formatNumber(item.gstRate)}%</td>
                <td>${formatCurrency(item.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
  `;
  saleElements.downloadInvoice.href = window.VBApi.InvoiceApi.getDownloadUrl(invoice._id);
  saleElements.invoiceModal.classList.add("is-visible");
}

function closeInvoiceModal() {
  saleElements.invoiceModal.classList.remove("is-visible");
  salesState.currentInvoiceId = null;
}

async function viewCurrentInvoice() {
  if (!salesState.currentInvoiceId) return;

  try {
    const invoice = await window.VBApi.InvoiceApi.getById(salesState.currentInvoiceId);
    openInvoiceModal(invoice);
  } catch (error) {
    setAlert(saleElements.error, error.message || "Unable to load invoice.");
  }
}

async function handleSaleSubmit(event) {
  event.preventDefault();

  const payload = buildSalePayload();

  if (!validateSalePayload(payload)) return;

  setActionLoading({
    button: saleElements.saveButton,
    spinner: saleElements.saveSpinner,
    text: saleElements.saveText,
    isLoading: true,
    loadingText: "Creating...",
    defaultText: "Create Sale",
  });

  try {
    const data = await window.VBApi.SaleApi.create(payload);
    closeSaleModal();
    salesState.page = 1;
    salesState.searchTerm = "";
    saleElements.search.value = "";
    salesState.products = [];
    showToast(data?.message || "Sale created successfully.");
    await loadSales();

    if (data?.invoice) {
      if (data.sale?._id) {
        salesState.invoicesBySaleId[data.sale._id] = data.invoice;
        renderSales();
      }

      openInvoiceModal(data.invoice);
    }
  } catch (error) {
    setAlert(saleElements.formError, error.message || "Unable to create sale.");
  } finally {
    setActionLoading({
      button: saleElements.saveButton,
      spinner: saleElements.saveSpinner,
      text: saleElements.saveText,
      isLoading: false,
      loadingText: "",
      defaultText: "Create Sale",
    });
  }
}

function getSaleById(id) {
  return salesState.sales.find((sale) => sale._id === id);
}

function renderSaleDetail(sale) {
  const invoice = getInvoiceForSale(sale);
  const rows = getSaleProducts(sale).map((item) => `
    <tr>
      <td class="font-semibold">${escapeHtml(getReferenceName(item.productId, "Product"))}</td>
      <td>${formatNumber(item.quantity)}</td>
      <td>${formatCurrency(item.sellingPrice)}</td>
      <td>${formatCurrency(Number(item.quantity || 0) * Number(item.sellingPrice || 0))}</td>
    </tr>
  `).join("");

  saleElements.detailBody.innerHTML = `
    <div class="grid form-preview-grid">
      <div class="card stat-card">
        <p class="stat-label">Customer</p>
        <p class="stat-value">${escapeHtml(getReferenceName(sale.customerId))}</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Total Amount</p>
        <p class="stat-value">${formatCurrency(sale.totalAmount)}</p>
      </div>
      <div class="card stat-card">
        <p class="stat-label">Invoice</p>
        <p class="stat-value">${escapeHtml(invoice?.invoiceNumber || "-")}</p>
      </div>
    </div>

    <div class="section-gap">
      <p class="pagination-info mb-0">${escapeHtml(getReferenceEmail(sale.customerId))} | ${escapeHtml(getReferencePhone(sale.customerId))} | ${escapeHtml(formatDate(sale.saleDate))}</p>
    </div>

    <div class="table-wrap section-gap">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Selling Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function openSaleDetail(sale) {
  renderSaleDetail(sale);
  saleElements.detailModal.classList.add("is-visible");
}

function closeSaleDetail() {
  saleElements.detailModal.classList.remove("is-visible");
}

function handleTableClick(event) {
  const viewButton = event.target.closest("[data-view-sale]");
  const invoiceButton = event.target.closest("[data-open-invoice]");

  if (viewButton) {
    const sale = getSaleById(viewButton.dataset.viewSale);

    if (sale) {
      openSaleDetail(sale);
    }
  }

  if (invoiceButton) {
    const invoice = Object.values(salesState.invoicesBySaleId).find((item) => item._id === invoiceButton.dataset.openInvoice);

    if (invoice) {
      openInvoiceModal(invoice);
    }
  }
}

function handleProductRowsInput(event) {
  const field = event.target.dataset.saleRowField;
  const rowId = event.target.dataset.rowId;

  if (!field || !rowId) return;

  const row = salesState.productRows.find((item) => item.id === rowId);

  if (!row) return;

  row[field] = event.target.value;

  if (field === "productId") {
    const product = getProductById(row.productId);

    if (product) {
      row.sellingPrice = product.sellingPrice ?? "";
      renderSaleRows();
      return;
    }
  }

  updateSaleTotals();
}

function handleProductRowsClick(event) {
  const removeButton = event.target.closest("[data-remove-sale-row]");

  if (!removeButton || salesState.productRows.length === 1) return;

  salesState.productRows = salesState.productRows.filter((row) => row.id !== removeButton.dataset.removeSaleRow);
  renderSaleRows();
}

function debounce(callback, wait = 350) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

function bindSaleEvents() {
  document.querySelector("[data-add-sale]")?.addEventListener("click", openSaleModal);
  document.querySelector("[data-refresh-sales]")?.addEventListener("click", loadSales);
  saleElements.form?.addEventListener("submit", handleSaleSubmit);
  saleElements.table?.addEventListener("click", handleTableClick);
  saleElements.productRowsTable?.addEventListener("input", handleProductRowsInput);
  saleElements.productRowsTable?.addEventListener("change", handleProductRowsInput);
  saleElements.productRowsTable?.addEventListener("click", handleProductRowsClick);
  saleElements.addRow?.addEventListener("click", () => {
    salesState.productRows.push(createEmptyProductRow());
    renderSaleRows();
  });
  saleElements.viewInvoice?.addEventListener("click", viewCurrentInvoice);

  document.querySelectorAll("[data-close-sale-modal]").forEach((button) => {
    button.addEventListener("click", closeSaleModal);
  });

  document.querySelectorAll("[data-close-sale-detail-modal]").forEach((button) => {
    button.addEventListener("click", closeSaleDetail);
  });

  document.querySelectorAll("[data-close-invoice-modal]").forEach((button) => {
    button.addEventListener("click", closeInvoiceModal);
  });

  saleElements.formModal?.addEventListener("click", (event) => {
    if (event.target === saleElements.formModal) {
      closeSaleModal();
    }
  });

  saleElements.detailModal?.addEventListener("click", (event) => {
    if (event.target === saleElements.detailModal) {
      closeSaleDetail();
    }
  });

  saleElements.invoiceModal?.addEventListener("click", (event) => {
    if (event.target === saleElements.invoiceModal) {
      closeInvoiceModal();
    }
  });

  saleElements.prevPage?.addEventListener("click", () => {
    if (salesState.page > 1) {
      salesState.page -= 1;
      renderSales();
    }
  });

  saleElements.nextPage?.addEventListener("click", () => {
    if (salesState.page < salesState.totalPages) {
      salesState.page += 1;
      renderSales();
    }
  });

  saleElements.search?.addEventListener("input", debounce((event) => {
    salesState.searchTerm = event.target.value.trim();
    salesState.page = 1;
    renderSales();
  }));

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeSaleModal();
    closeSaleDetail();
    closeInvoiceModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.VBAuth?.getToken()) return;

  bindSaleEvents();
  loadSales();
});
