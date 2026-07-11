const customersState = {
  customers: [],
  filteredCustomers: [],
  page: 1,
  limit: 5,
  totalPages: 1,
  searchTerm: "",
  isLoading: false,
  editingCustomerId: null,
  deletingCustomerId: null,
};

const customerFields = [
  "name",
  "email",
  "phone",
  "address",
];

const requiredCustomerFields = [
  "name",
  "phone",
  "address",
];

const customerElements = {
  count: document.querySelector("[data-customer-count]"),
  loading: document.querySelector("[data-customers-loading]"),
  empty: document.querySelector("[data-customers-empty]"),
  tableWrap: document.querySelector("[data-customers-table-wrap]"),
  table: document.querySelector("[data-customers-table]"),
  error: document.querySelector("[data-customers-error]"),
  search: document.querySelector("[data-customer-search]"),
  paginationInfo: document.querySelector("[data-customer-pagination-info]"),
  prevPage: document.querySelector("[data-customer-prev-page]"),
  nextPage: document.querySelector("[data-customer-next-page]"),
  formModal: document.querySelector("[data-customer-modal]"),
  form: document.querySelector("[data-customer-form]"),
  formTitle: document.querySelector("[data-customer-modal-title]"),
  formError: document.querySelector("[data-customer-form-error]"),
  saveButton: document.querySelector("[data-save-customer]"),
  saveSpinner: document.querySelector("[data-customer-save-spinner]"),
  saveText: document.querySelector("[data-customer-save-text]"),
  deleteModal: document.querySelector("[data-delete-customer-modal]"),
  deleteName: document.querySelector("[data-delete-customer-name]"),
  deleteError: document.querySelector("[data-delete-customer-error]"),
  confirmDelete: document.querySelector("[data-confirm-delete-customer]"),
  deleteSpinner: document.querySelector("[data-delete-customer-spinner]"),
  deleteText: document.querySelector("[data-delete-customer-text]"),
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

function setActionLoading(config) {
  config.button.disabled = config.isLoading;
  config.spinner.classList.toggle("hide", !config.isLoading);
  config.text.textContent = config.isLoading ? config.loadingText : config.defaultText;
}

function setLoadingState(isLoading) {
  customersState.isLoading = isLoading;
  customerElements.prevPage.disabled = isLoading || customersState.page <= 1;
  customerElements.nextPage.disabled = isLoading || customersState.page >= customersState.totalPages;
}

function normalizeCustomersResponse(data) {
  return Array.isArray(data) ? data : [];
}

function getCustomerSearchText(customer) {
  return [
    customer.name,
    customer.email,
    customer.phone,
    customer.address,
    customer.outstandingBalance,
  ].join(" ").toLowerCase();
}

function applyCustomerFilters() {
  const searchTerm = customersState.searchTerm.toLowerCase();

  customersState.filteredCustomers = searchTerm
    ? customersState.customers.filter((customer) => getCustomerSearchText(customer).includes(searchTerm))
    : [...customersState.customers];

  customersState.totalPages = Math.max(Math.ceil(customersState.filteredCustomers.length / customersState.limit), 1);

  if (customersState.page > customersState.totalPages) {
    customersState.page = customersState.totalPages;
  }
}

function getCurrentPageCustomers() {
  const start = (customersState.page - 1) * customersState.limit;
  return customersState.filteredCustomers.slice(start, start + customersState.limit);
}

function renderCustomersTable(customers) {
  customerElements.table.innerHTML = customers.map((customer) => `
    <tr>
      <td class="font-semibold">${escapeHtml(customer.name)}</td>
      <td>${escapeHtml(customer.email || "-")}</td>
      <td>${escapeHtml(customer.phone)}</td>
      <td>${escapeHtml(customer.address)}</td>
      <td>${formatCurrency(customer.outstandingBalance)}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" type="button" data-edit-customer="${escapeHtml(customer._id)}" aria-label="Edit ${escapeHtml(customer.name)}">
            <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
          </button>
          <button class="icon-btn" type="button" data-delete-customer="${escapeHtml(customer._id)}" aria-label="Delete ${escapeHtml(customer.name)}">
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderCustomers() {
  applyCustomerFilters();

  const pageCustomers = getCurrentPageCustomers();
  const total = customersState.filteredCustomers.length;
  const label = total === 1 ? "Customer" : "Customers";

  customerElements.count.textContent = `${formatNumber(total)} ${label}`;
  customerElements.paginationInfo.textContent = customersState.searchTerm
    ? `Showing ${formatNumber(total)} search result${total === 1 ? "" : "s"}`
    : `Page ${customersState.page} of ${customersState.totalPages}`;

  customerElements.prevPage.disabled = customersState.page <= 1;
  customerElements.nextPage.disabled = customersState.page >= customersState.totalPages;

  if (pageCustomers.length === 0) {
    hideElement(customerElements.tableWrap);
    showElement(customerElements.empty);
    return;
  }

  hideElement(customerElements.empty);
  showElement(customerElements.tableWrap);
  renderCustomersTable(pageCustomers);
}

async function loadCustomers() {
  setAlert(customerElements.error, "");
  showElement(customerElements.loading);
  hideElement(customerElements.empty);
  hideElement(customerElements.tableWrap);
  setLoadingState(true);

  try {
    const data = await window.VBApi.CustomerApi.list();
    customersState.customers = normalizeCustomersResponse(data);
    renderCustomers();
  } catch (error) {
    customersState.customers = [];
    customersState.filteredCustomers = [];
    customersState.totalPages = 1;
    setAlert(customerElements.error, error.message || "Unable to load customers.");
  } finally {
    hideElement(customerElements.loading);
    setLoadingState(false);
  }
}

function getCustomerById(id) {
  return customersState.customers.find((customer) => customer._id === id);
}

function getField(field) {
  return document.querySelector(`[data-customer-field="${field}"]`);
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

function resetCustomerForm() {
  customerElements.form.reset();
  clearFieldErrors();
  setAlert(customerElements.formError, "");
}

function fillCustomerForm(customer) {
  customerFields.forEach((field) => {
    const input = getField(field);

    if (input) {
      input.value = customer?.[field] ?? "";
    }
  });
}

function openCustomerModal(customer = null) {
  customersState.editingCustomerId = customer?._id || null;
  resetCustomerForm();
  fillCustomerForm(customer);
  customerElements.formTitle.textContent = customer ? "Edit Customer" : "Add Customer";
  customerElements.saveText.textContent = customer ? "Update Customer" : "Save Customer";
  customerElements.formModal.classList.add("is-visible");
  getField("name")?.focus();
}

function closeCustomerModal() {
  customerElements.formModal.classList.remove("is-visible");
  customersState.editingCustomerId = null;
}

function buildCustomerPayload() {
  const email = getField("email").value.trim();
  const payload = {
    name: getField("name").value.trim(),
    phone: getField("phone").value.trim(),
    address: getField("address").value.trim(),
  };

  if (email) {
    payload.email = email;
  }

  return payload;
}

function validateCustomerPayload(payload) {
  clearFieldErrors();
  setAlert(customerElements.formError, "");

  for (const field of requiredCustomerFields) {
    if (!payload[field]) {
      setFieldError(field, "This field is required.");
      getField(field)?.focus();
      return false;
    }
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    setFieldError("email", "Enter a valid email.");
    getField("email")?.focus();
    return false;
  }

  return true;
}

async function handleCustomerSubmit(event) {
  event.preventDefault();

  const payload = buildCustomerPayload();

  if (!validateCustomerPayload(payload)) return;

  setActionLoading({
    button: customerElements.saveButton,
    spinner: customerElements.saveSpinner,
    text: customerElements.saveText,
    isLoading: true,
    loadingText: customersState.editingCustomerId ? "Updating..." : "Saving...",
    defaultText: customersState.editingCustomerId ? "Update Customer" : "Save Customer",
  });

  try {
    if (customersState.editingCustomerId) {
      await window.VBApi.CustomerApi.update(customersState.editingCustomerId, payload);
      showToast("Customer updated successfully.");
    } else {
      await window.VBApi.CustomerApi.create(payload);
      customersState.page = 1;
      customersState.searchTerm = "";
      customerElements.search.value = "";
      showToast("Customer added successfully.");
    }

    closeCustomerModal();
    await loadCustomers();
  } catch (error) {
    setAlert(customerElements.formError, error.message || "Unable to save customer.");
  } finally {
    setActionLoading({
      button: customerElements.saveButton,
      spinner: customerElements.saveSpinner,
      text: customerElements.saveText,
      isLoading: false,
      loadingText: "",
      defaultText: customersState.editingCustomerId ? "Update Customer" : "Save Customer",
    });
  }
}

function openDeleteModal(customer) {
  customersState.deletingCustomerId = customer._id;
  customerElements.deleteName.textContent = customer.name || "this customer";
  setAlert(customerElements.deleteError, "");
  customerElements.deleteModal.classList.add("is-visible");
}

function closeDeleteModal() {
  customerElements.deleteModal.classList.remove("is-visible");
  customersState.deletingCustomerId = null;
}

async function handleDeleteConfirm() {
  if (!customersState.deletingCustomerId) return;

  setActionLoading({
    button: customerElements.confirmDelete,
    spinner: customerElements.deleteSpinner,
    text: customerElements.deleteText,
    isLoading: true,
    loadingText: "Deleting...",
    defaultText: "Delete Customer",
  });

  try {
    await window.VBApi.CustomerApi.remove(customersState.deletingCustomerId);
    closeDeleteModal();
    showToast("Customer deleted successfully.");

    if (getCurrentPageCustomers().length === 1 && customersState.page > 1) {
      customersState.page -= 1;
    }

    await loadCustomers();
  } catch (error) {
    setAlert(customerElements.deleteError, error.message || "Unable to delete customer.");
  } finally {
    setActionLoading({
      button: customerElements.confirmDelete,
      spinner: customerElements.deleteSpinner,
      text: customerElements.deleteText,
      isLoading: false,
      loadingText: "",
      defaultText: "Delete Customer",
    });
  }
}

function handleTableClick(event) {
  const editButton = event.target.closest("[data-edit-customer]");
  const deleteButton = event.target.closest("[data-delete-customer]");

  if (editButton) {
    const customer = getCustomerById(editButton.dataset.editCustomer);

    if (customer) {
      openCustomerModal(customer);
    }
  }

  if (deleteButton) {
    const customer = getCustomerById(deleteButton.dataset.deleteCustomer);

    if (customer) {
      openDeleteModal(customer);
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

function applyInitialSearchFromUrl() {
  const searchTerm = new URLSearchParams(window.location.search).get("search")?.trim() || "";

  if (!searchTerm) return;

  customersState.searchTerm = searchTerm;
  customersState.page = 1;

  if (customerElements.search) {
    customerElements.search.value = searchTerm;
  }
}

function bindCustomerEvents() {
  document.querySelector("[data-add-customer]")?.addEventListener("click", () => openCustomerModal());
  document.querySelector("[data-refresh-customers]")?.addEventListener("click", loadCustomers);
  customerElements.form?.addEventListener("submit", handleCustomerSubmit);
  customerElements.table?.addEventListener("click", handleTableClick);
  customerElements.confirmDelete?.addEventListener("click", handleDeleteConfirm);

  document.querySelectorAll("[data-close-customer-modal]").forEach((button) => {
    button.addEventListener("click", closeCustomerModal);
  });

  document.querySelectorAll("[data-close-delete-customer-modal]").forEach((button) => {
    button.addEventListener("click", closeDeleteModal);
  });

  customerElements.formModal?.addEventListener("click", (event) => {
    if (event.target === customerElements.formModal) {
      closeCustomerModal();
    }
  });

  customerElements.deleteModal?.addEventListener("click", (event) => {
    if (event.target === customerElements.deleteModal) {
      closeDeleteModal();
    }
  });

  customerElements.prevPage?.addEventListener("click", () => {
    if (customersState.page > 1) {
      customersState.page -= 1;
      renderCustomers();
    }
  });

  customerElements.nextPage?.addEventListener("click", () => {
    if (customersState.page < customersState.totalPages) {
      customersState.page += 1;
      renderCustomers();
    }
  });

  customerElements.search?.addEventListener("input", debounce((event) => {
    customersState.searchTerm = event.target.value.trim();
    customersState.page = 1;
    renderCustomers();
  }));

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeCustomerModal();
    closeDeleteModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.VBAuth?.getToken()) return;

  bindCustomerEvents();
  applyInitialSearchFromUrl();
  loadCustomers();
});
