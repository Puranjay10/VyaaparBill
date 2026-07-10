const productsState = {
  products: [],
  page: 1,
  limit: 5,
  totalPages: 1,
  totalProducts: 0,
  searchTerm: "",
  isLoading: false,
  editingProductId: null,
  deletingProductId: null,
};

const productFields = [
  "name",
  "productCode",
  "category",
  "quantity",
  "purchasePrice",
  "sellingPrice",
  "gstRate",
  "supplier",
];

const requiredProductFields = [
  "name",
  "productCode",
  "category",
  "quantity",
  "purchasePrice",
  "sellingPrice",
  "gstRate",
  "supplier",
];

const productElements = {
  count: document.querySelector("[data-product-count]"),
  loading: document.querySelector("[data-products-loading]"),
  empty: document.querySelector("[data-products-empty]"),
  tableWrap: document.querySelector("[data-products-table-wrap]"),
  table: document.querySelector("[data-products-table]"),
  error: document.querySelector("[data-products-error]"),
  search: document.querySelector("[data-product-search]"),
  paginationInfo: document.querySelector("[data-pagination-info]"),
  prevPage: document.querySelector("[data-prev-page]"),
  nextPage: document.querySelector("[data-next-page]"),
  formModal: document.querySelector("[data-product-modal]"),
  form: document.querySelector("[data-product-form]"),
  formTitle: document.querySelector("[data-product-modal-title]"),
  formError: document.querySelector("[data-product-form-error]"),
  saveButton: document.querySelector("[data-save-product]"),
  saveSpinner: document.querySelector("[data-product-save-spinner]"),
  saveText: document.querySelector("[data-product-save-text]"),
  deleteModal: document.querySelector("[data-delete-modal]"),
  deleteName: document.querySelector("[data-delete-product-name]"),
  deleteError: document.querySelector("[data-delete-error]"),
  confirmDelete: document.querySelector("[data-confirm-delete]"),
  deleteSpinner: document.querySelector("[data-delete-spinner]"),
  deleteText: document.querySelector("[data-delete-text]"),
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

function setLoadingState(isLoading) {
  productsState.isLoading = isLoading;
  productElements.prevPage.disabled = isLoading || productsState.page <= 1 || Boolean(productsState.searchTerm);
  productElements.nextPage.disabled = isLoading || productsState.page >= productsState.totalPages || Boolean(productsState.searchTerm);
}

function setActionLoading(config) {
  config.button.disabled = config.isLoading;
  config.spinner.classList.toggle("hide", !config.isLoading);
  config.text.textContent = config.isLoading ? config.loadingText : config.defaultText;
}

function normalizeProductsResponse(data) {
  if (Array.isArray(data)) {
    return {
      products: data,
      totalProducts: data.length,
      currentPage: 1,
      totalPages: 1,
    };
  }

  return {
    products: Array.isArray(data?.products) ? data.products : [],
    totalProducts: Number(data?.totalProducts || 0),
    currentPage: Number(data?.currentPage || 1),
    totalPages: Number(data?.totalPages || 1),
  };
}

async function fetchProducts() {
  if (productsState.searchTerm) {
    return window.VBApi.ProductApi.search(productsState.searchTerm);
  }

  return window.VBApi.ProductApi.list({
    page: productsState.page,
    limit: productsState.limit,
    sort: "-createdAt",
  });
}

function renderProductsTable() {
  productElements.table.innerHTML = productsState.products.map((product) => `
    <tr>
      <td class="font-semibold">${escapeHtml(product.productCode)}</td>
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${formatNumber(product.quantity)}</td>
      <td>${formatCurrency(product.purchasePrice)}</td>
      <td>${formatCurrency(product.sellingPrice)}</td>
      <td>${formatNumber(product.gstRate)}%</td>
      <td>${escapeHtml(product.supplier || "-")}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" type="button" data-edit-product="${escapeHtml(product._id)}" aria-label="Edit ${escapeHtml(product.name)}">
            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
          </button>
          <button class="icon-btn" type="button" data-delete-product="${escapeHtml(product._id)}" aria-label="Delete ${escapeHtml(product.name)}">
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderProducts() {
  const hasProducts = productsState.products.length > 0;
  const label = productsState.totalProducts === 1 ? "Product" : "Products";

  productElements.count.textContent = `${formatNumber(productsState.totalProducts)} ${label}`;
  productElements.paginationInfo.textContent = productsState.searchTerm
    ? `Showing ${formatNumber(productsState.products.length)} search result${productsState.products.length === 1 ? "" : "s"}`
    : `Page ${productsState.page} of ${productsState.totalPages}`;

  productElements.prevPage.disabled = productsState.page <= 1 || Boolean(productsState.searchTerm);
  productElements.nextPage.disabled = productsState.page >= productsState.totalPages || Boolean(productsState.searchTerm);

  if (!hasProducts) {
    hideElement(productElements.tableWrap);
    showElement(productElements.empty);
    return;
  }

  hideElement(productElements.empty);
  showElement(productElements.tableWrap);
  renderProductsTable();
}

async function loadProducts() {
  setAlert(productElements.error, "");
  showElement(productElements.loading);
  hideElement(productElements.empty);
  hideElement(productElements.tableWrap);
  setLoadingState(true);

  try {
    const data = await fetchProducts();
    const normalized = normalizeProductsResponse(data);

    productsState.products = normalized.products;
    productsState.totalProducts = normalized.totalProducts;
    productsState.page = normalized.currentPage;
    productsState.totalPages = Math.max(normalized.totalPages, 1);

    renderProducts();
  } catch (error) {
    productsState.products = [];
    productsState.totalProducts = 0;
    productsState.totalPages = 1;
    setAlert(productElements.error, error.message || "Unable to load products.");
  } finally {
    hideElement(productElements.loading);
    setLoadingState(false);
  }
}

function getProductById(id) {
  return productsState.products.find((product) => product._id === id);
}

function clearFieldErrors() {
  document.querySelectorAll("[data-field-error]").forEach((element) => {
    element.textContent = "";
    element.classList.remove("is-visible");
  });
}

function setFieldError(field, message) {
  const element = document.querySelector(`[data-field-error="${field}"]`);

  if (!element) return;

  element.textContent = message;
  element.classList.add("is-visible");
}

function getField(field) {
  return document.querySelector(`[data-product-field="${field}"]`);
}

function resetProductForm() {
  productElements.form.reset();
  clearFieldErrors();
  setAlert(productElements.formError, "");
  getField("gstRate").value = "18";
}

function fillProductForm(product) {
  productFields.forEach((field) => {
    const input = getField(field);

    if (input) {
      input.value = product?.[field] ?? "";
    }
  });
}

function openProductModal(product = null) {
  productsState.editingProductId = product?._id || null;
  resetProductForm();
  fillProductForm(product);
  productElements.formTitle.textContent = product ? "Edit Product" : "Add Product";
  productElements.saveText.textContent = product ? "Update Product" : "Save Product";
  productElements.formModal.classList.add("is-visible");
  getField("name")?.focus();
}

function closeProductModal() {
  productElements.formModal.classList.remove("is-visible");
  productsState.editingProductId = null;
}

function buildProductPayload() {
  return {
    name: getField("name").value.trim(),
    productCode: getField("productCode").value.trim(),
    category: getField("category").value.trim(),
    quantity: Number(getField("quantity").value),
    purchasePrice: Number(getField("purchasePrice").value),
    sellingPrice: Number(getField("sellingPrice").value),
    gstRate: Number(getField("gstRate").value),
    supplier: getField("supplier").value.trim(),
  };
}

function validateProductPayload(payload) {
  clearFieldErrors();
  setAlert(productElements.formError, "");

  for (const field of requiredProductFields) {
    const value = payload[field];
    const isEmpty = value === "" || value === null || value === undefined || Number.isNaN(value);

    if (isEmpty) {
      setFieldError(field, "This field is required.");
      getField(field)?.focus();
      return false;
    }
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity < 0) {
    setFieldError("quantity", "Quantity must be 0 or greater.");
    getField("quantity")?.focus();
    return false;
  }

  for (const field of ["purchasePrice", "sellingPrice", "gstRate"]) {
    if (payload[field] < 0) {
      setFieldError(field, "Value must be 0 or greater.");
      getField(field)?.focus();
      return false;
    }
  }

  return true;
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const payload = buildProductPayload();

  if (!validateProductPayload(payload)) return;

  setActionLoading({
    button: productElements.saveButton,
    spinner: productElements.saveSpinner,
    text: productElements.saveText,
    isLoading: true,
    loadingText: productsState.editingProductId ? "Updating..." : "Saving...",
    defaultText: productsState.editingProductId ? "Update Product" : "Save Product",
  });

  try {
    if (productsState.editingProductId) {
      await window.VBApi.ProductApi.update(productsState.editingProductId, payload);
      showToast("Product updated successfully.");
    } else {
      await window.VBApi.ProductApi.create(payload);
      productsState.page = 1;
      productsState.searchTerm = "";
      productElements.search.value = "";
      showToast("Product added successfully.");
    }

    closeProductModal();
    await loadProducts();
  } catch (error) {
    setAlert(productElements.formError, error.message || "Unable to save product.");
  } finally {
    setActionLoading({
      button: productElements.saveButton,
      spinner: productElements.saveSpinner,
      text: productElements.saveText,
      isLoading: false,
      loadingText: "",
      defaultText: productsState.editingProductId ? "Update Product" : "Save Product",
    });
  }
}

function openDeleteModal(product) {
  productsState.deletingProductId = product._id;
  productElements.deleteName.textContent = product.name || "this product";
  setAlert(productElements.deleteError, "");
  productElements.deleteModal.classList.add("is-visible");
}

function closeDeleteModal() {
  productElements.deleteModal.classList.remove("is-visible");
  productsState.deletingProductId = null;
}

async function handleDeleteConfirm() {
  if (!productsState.deletingProductId) return;

  setActionLoading({
    button: productElements.confirmDelete,
    spinner: productElements.deleteSpinner,
    text: productElements.deleteText,
    isLoading: true,
    loadingText: "Deleting...",
    defaultText: "Delete Product",
  });

  try {
    await window.VBApi.ProductApi.remove(productsState.deletingProductId);
    closeDeleteModal();
    showToast("Product deleted successfully.");

    if (productsState.products.length === 1 && productsState.page > 1) {
      productsState.page -= 1;
    }

    await loadProducts();
  } catch (error) {
    setAlert(productElements.deleteError, error.message || "Unable to delete product.");
  } finally {
    setActionLoading({
      button: productElements.confirmDelete,
      spinner: productElements.deleteSpinner,
      text: productElements.deleteText,
      isLoading: false,
      loadingText: "",
      defaultText: "Delete Product",
    });
  }
}

function handleTableClick(event) {
  const editButton = event.target.closest("[data-edit-product]");
  const deleteButton = event.target.closest("[data-delete-product]");

  if (editButton) {
    const product = getProductById(editButton.dataset.editProduct);

    if (product) {
      openProductModal(product);
    }
  }

  if (deleteButton) {
    const product = getProductById(deleteButton.dataset.deleteProduct);

    if (product) {
      openDeleteModal(product);
    }
  }
}

function debounce(callback, wait = 350) {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

function bindProductEvents() {
  document.querySelector("[data-add-product]")?.addEventListener("click", () => openProductModal());
  document.querySelector("[data-refresh-products]")?.addEventListener("click", loadProducts);
  productElements.form?.addEventListener("submit", handleProductSubmit);
  productElements.table?.addEventListener("click", handleTableClick);
  productElements.confirmDelete?.addEventListener("click", handleDeleteConfirm);

  document.querySelectorAll("[data-close-product-modal]").forEach((button) => {
    button.addEventListener("click", closeProductModal);
  });

  document.querySelectorAll("[data-close-delete-modal]").forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  productElements.formModal?.addEventListener("click", (event) => {
    if (event.target === productElements.formModal) {
      closeProductModal();
    }
  });

  productElements.deleteModal?.addEventListener("click", (event) => {
    if (event.target === productElements.deleteModal) {
      closeDeleteModal();
    }
  });

  productElements.prevPage?.addEventListener("click", () => {
    if (productsState.page > 1) {
      productsState.page -= 1;
      loadProducts();
    }
  });

  productElements.nextPage?.addEventListener("click", () => {
    if (productsState.page < productsState.totalPages) {
      productsState.page += 1;
      loadProducts();
    }
  });

  productElements.search?.addEventListener("input", debounce((event) => {
    productsState.searchTerm = event.target.value.trim();
    productsState.page = 1;
    loadProducts();
  }));

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeProductModal();
    closeDeleteModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.VBAuth?.getToken()) return;

  bindProductEvents();
  loadProducts();
});
