const suppliersState = {
  suppliers: [],
  filteredSuppliers: [],
  page: 1,
  limit: 5,
  totalPages: 1,
  searchTerm: "",
  isLoading: false,
  editingSupplierId: null,
  deletingSupplierId: null,
};

const supplierFields = [
  "name",
  "email",
  "phone",
  "gstNumber",
  "address",
];

const supplierElements = {
  count: document.querySelector("[data-supplier-count]"),
  loading: document.querySelector("[data-suppliers-loading]"),
  empty: document.querySelector("[data-suppliers-empty]"),
  tableWrap: document.querySelector("[data-suppliers-table-wrap]"),
  table: document.querySelector("[data-suppliers-table]"),
  error: document.querySelector("[data-suppliers-error]"),
  search: document.querySelector("[data-supplier-search]"),
  paginationInfo: document.querySelector("[data-supplier-pagination-info]"),
  prevPage: document.querySelector("[data-supplier-prev-page]"),
  nextPage: document.querySelector("[data-supplier-next-page]"),
  formModal: document.querySelector("[data-supplier-modal]"),
  form: document.querySelector("[data-supplier-form]"),
  formTitle: document.querySelector("[data-supplier-modal-title]"),
  formError: document.querySelector("[data-supplier-form-error]"),
  saveButton: document.querySelector("[data-save-supplier]"),
  saveSpinner: document.querySelector("[data-supplier-save-spinner]"),
  saveText: document.querySelector("[data-supplier-save-text]"),
  deleteModal: document.querySelector("[data-delete-supplier-modal]"),
  deleteName: document.querySelector("[data-delete-supplier-name]"),
  deleteError: document.querySelector("[data-delete-supplier-error]"),
  confirmDelete: document.querySelector("[data-confirm-delete-supplier]"),
  deleteSpinner: document.querySelector("[data-delete-supplier-spinner]"),
  deleteText: document.querySelector("[data-delete-supplier-text]"),
};

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

function setActionLoading(config) {
  config.button.disabled = config.isLoading;
  config.spinner.classList.toggle("hide", !config.isLoading);
  config.text.textContent = config.isLoading ? config.loadingText : config.defaultText;
}

function setLoadingState(isLoading) {
  suppliersState.isLoading = isLoading;
  supplierElements.prevPage.disabled = isLoading || suppliersState.page <= 1;
  supplierElements.nextPage.disabled = isLoading || suppliersState.page >= suppliersState.totalPages;
}

function normalizeSuppliersResponse(data) {
  return Array.isArray(data) ? data : [];
}

function getSupplierSearchText(supplier) {
  return [
    supplier.name,
    supplier.email,
    supplier.phone,
    supplier.gstNumber,
    supplier.address,
  ].join(" ").toLowerCase();
}

function applySupplierFilters() {
  const searchTerm = suppliersState.searchTerm.toLowerCase();

  suppliersState.filteredSuppliers = searchTerm
    ? suppliersState.suppliers.filter((supplier) => getSupplierSearchText(supplier).includes(searchTerm))
    : [...suppliersState.suppliers];

  suppliersState.totalPages = Math.max(Math.ceil(suppliersState.filteredSuppliers.length / suppliersState.limit), 1);

  if (suppliersState.page > suppliersState.totalPages) {
    suppliersState.page = suppliersState.totalPages;
  }
}

function getCurrentPageSuppliers() {
  const start = (suppliersState.page - 1) * suppliersState.limit;
  return suppliersState.filteredSuppliers.slice(start, start + suppliersState.limit);
}

function renderSuppliersTable(suppliers) {
  supplierElements.table.innerHTML = suppliers.map((supplier) => `
    <tr>
      <td class="font-semibold">${escapeHtml(supplier.name)}</td>
      <td>${escapeHtml(supplier.email)}</td>
      <td>${escapeHtml(supplier.phone)}</td>
      <td>${escapeHtml(supplier.gstNumber)}</td>
      <td>${escapeHtml(supplier.address)}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" type="button" data-edit-supplier="${escapeHtml(supplier._id)}" aria-label="Edit ${escapeHtml(supplier.name)}">
            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
          </button>
          <button class="icon-btn" type="button" data-delete-supplier="${escapeHtml(supplier._id)}" aria-label="Delete ${escapeHtml(supplier.name)}">
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderSuppliers() {
  applySupplierFilters();

  const pageSuppliers = getCurrentPageSuppliers();
  const total = suppliersState.filteredSuppliers.length;
  const label = total === 1 ? "Supplier" : "Suppliers";

  supplierElements.count.textContent = `${formatNumber(total)} ${label}`;
  supplierElements.paginationInfo.textContent = suppliersState.searchTerm
    ? `Showing ${formatNumber(total)} search result${total === 1 ? "" : "s"}`
    : `Page ${suppliersState.page} of ${suppliersState.totalPages}`;

  supplierElements.prevPage.disabled = suppliersState.page <= 1;
  supplierElements.nextPage.disabled = suppliersState.page >= suppliersState.totalPages;

  if (pageSuppliers.length === 0) {
    hideElement(supplierElements.tableWrap);
    showElement(supplierElements.empty);
    return;
  }

  hideElement(supplierElements.empty);
  showElement(supplierElements.tableWrap);
  renderSuppliersTable(pageSuppliers);
}

async function loadSuppliers() {
  setAlert(supplierElements.error, "");
  showElement(supplierElements.loading);
  hideElement(supplierElements.empty);
  hideElement(supplierElements.tableWrap);
  setLoadingState(true);

  try {
    const data = await window.VBApi.SupplierApi.list();
    suppliersState.suppliers = normalizeSuppliersResponse(data);
    renderSuppliers();
  } catch (error) {
    suppliersState.suppliers = [];
    suppliersState.filteredSuppliers = [];
    suppliersState.totalPages = 1;
    setAlert(supplierElements.error, error.message || "Unable to load suppliers.");
  } finally {
    hideElement(supplierElements.loading);
    setLoadingState(false);
  }
}

function getSupplierById(id) {
  return suppliersState.suppliers.find((supplier) => supplier._id === id);
}

function getField(field) {
  return document.querySelector(`[data-supplier-field="${field}"]`);
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

function resetSupplierForm() {
  supplierElements.form.reset();
  clearFieldErrors();
  setAlert(supplierElements.formError, "");
}

function fillSupplierForm(supplier) {
  supplierFields.forEach((field) => {
    const input = getField(field);

    if (input) {
      input.value = supplier?.[field] ?? "";
    }
  });
}

function openSupplierModal(supplier = null) {
  suppliersState.editingSupplierId = supplier?._id || null;
  resetSupplierForm();
  fillSupplierForm(supplier);
  supplierElements.formTitle.textContent = supplier ? "Edit Supplier" : "Add Supplier";
  supplierElements.saveText.textContent = supplier ? "Update Supplier" : "Save Supplier";
  supplierElements.formModal.classList.add("is-visible");
  getField("name")?.focus();
}

function closeSupplierModal() {
  supplierElements.formModal.classList.remove("is-visible");
  suppliersState.editingSupplierId = null;
}

function buildSupplierPayload() {
  return {
    name: getField("name").value.trim(),
    email: getField("email").value.trim(),
    phone: getField("phone").value.trim(),
    gstNumber: getField("gstNumber").value.trim(),
    address: getField("address").value.trim(),
  };
}

function validateSupplierPayload(payload) {
  clearFieldErrors();
  setAlert(supplierElements.formError, "");

  for (const field of supplierFields) {
    if (!payload[field]) {
      setFieldError(field, "This field is required.");
      getField(field)?.focus();
      return false;
    }
  }

  return true;
}

async function handleSupplierSubmit(event) {
  event.preventDefault();

  const payload = buildSupplierPayload();

  if (!validateSupplierPayload(payload)) return;

  setActionLoading({
    button: supplierElements.saveButton,
    spinner: supplierElements.saveSpinner,
    text: supplierElements.saveText,
    isLoading: true,
    loadingText: suppliersState.editingSupplierId ? "Updating..." : "Saving...",
    defaultText: suppliersState.editingSupplierId ? "Update Supplier" : "Save Supplier",
  });

  try {
    if (suppliersState.editingSupplierId) {
      await window.VBApi.SupplierApi.update(suppliersState.editingSupplierId, payload);
      showToast("Supplier updated successfully.");
    } else {
      await window.VBApi.SupplierApi.create(payload);
      suppliersState.page = 1;
      suppliersState.searchTerm = "";
      supplierElements.search.value = "";
      showToast("Supplier added successfully.");
    }

    closeSupplierModal();
    await loadSuppliers();
  } catch (error) {
    setAlert(supplierElements.formError, error.message || "Unable to save supplier.");
  } finally {
    setActionLoading({
      button: supplierElements.saveButton,
      spinner: supplierElements.saveSpinner,
      text: supplierElements.saveText,
      isLoading: false,
      loadingText: "",
      defaultText: suppliersState.editingSupplierId ? "Update Supplier" : "Save Supplier",
    });
  }
}

function openDeleteModal(supplier) {
  suppliersState.deletingSupplierId = supplier._id;
  supplierElements.deleteName.textContent = supplier.name || "this supplier";
  setAlert(supplierElements.deleteError, "");
  supplierElements.deleteModal.classList.add("is-visible");
}

function closeDeleteModal() {
  supplierElements.deleteModal.classList.remove("is-visible");
  suppliersState.deletingSupplierId = null;
}

async function handleDeleteConfirm() {
  if (!suppliersState.deletingSupplierId) return;

  setActionLoading({
    button: supplierElements.confirmDelete,
    spinner: supplierElements.deleteSpinner,
    text: supplierElements.deleteText,
    isLoading: true,
    loadingText: "Deleting...",
    defaultText: "Delete Supplier",
  });

  try {
    await window.VBApi.SupplierApi.remove(suppliersState.deletingSupplierId);
    closeDeleteModal();
    showToast("Supplier deleted successfully.");

    if (getCurrentPageSuppliers().length === 1 && suppliersState.page > 1) {
      suppliersState.page -= 1;
    }

    await loadSuppliers();
  } catch (error) {
    setAlert(supplierElements.deleteError, error.message || "Unable to delete supplier.");
  } finally {
    setActionLoading({
      button: supplierElements.confirmDelete,
      spinner: supplierElements.deleteSpinner,
      text: supplierElements.deleteText,
      isLoading: false,
      loadingText: "",
      defaultText: "Delete Supplier",
    });
  }
}

function handleTableClick(event) {
  const editButton = event.target.closest("[data-edit-supplier]");
  const deleteButton = event.target.closest("[data-delete-supplier]");

  if (editButton) {
    const supplier = getSupplierById(editButton.dataset.editSupplier);

    if (supplier) {
      openSupplierModal(supplier);
    }
  }

  if (deleteButton) {
    const supplier = getSupplierById(deleteButton.dataset.deleteSupplier);

    if (supplier) {
      openDeleteModal(supplier);
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

function bindSupplierEvents() {
  document.querySelector("[data-add-supplier]")?.addEventListener("click", () => openSupplierModal());
  document.querySelector("[data-refresh-suppliers]")?.addEventListener("click", loadSuppliers);
  supplierElements.form?.addEventListener("submit", handleSupplierSubmit);
  supplierElements.table?.addEventListener("click", handleTableClick);
  supplierElements.confirmDelete?.addEventListener("click", handleDeleteConfirm);

  document.querySelectorAll("[data-close-supplier-modal]").forEach((button) => {
    button.addEventListener("click", closeSupplierModal);
  });

  document.querySelectorAll("[data-close-delete-supplier-modal]").forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  supplierElements.formModal?.addEventListener("click", (event) => {
    if (event.target === supplierElements.formModal) {
      closeSupplierModal();
    }
  });

  supplierElements.deleteModal?.addEventListener("click", (event) => {
    if (event.target === supplierElements.deleteModal) {
      closeDeleteModal();
    }
  });

  supplierElements.prevPage?.addEventListener("click", () => {
    if (suppliersState.page > 1) {
      suppliersState.page -= 1;
      renderSuppliers();
    }
  });

  supplierElements.nextPage?.addEventListener("click", () => {
    if (suppliersState.page < suppliersState.totalPages) {
      suppliersState.page += 1;
      renderSuppliers();
    }
  });

  supplierElements.search?.addEventListener("input", debounce((event) => {
    suppliersState.searchTerm = event.target.value.trim();
    suppliersState.page = 1;
    renderSuppliers();
  }));

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeSupplierModal();
    closeDeleteModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.VBAuth?.getToken()) return;

  bindSupplierEvents();
  loadSuppliers();
});
