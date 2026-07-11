const aiState = {
  selectedFile: null,
  invoice: null,
  preview: null,
  processingTimer: null,
  stageIndex: 0,
  supplierWasNew: false,
  newProductCount: 0,
};

const stages = [
  {
    key: "uploading",
    title: "Uploading PDF",
    text: "Sending the invoice securely to VyaaparBill.",
  },
  {
    key: "ocr",
    title: "OCR Processing",
    text: "Reading text and tables from the PDF invoice.",
  },
  {
    key: "gemini",
    title: "Gemini AI Analysis",
    text: "Extracting supplier, invoice, and product details.",
  },
  {
    key: "preview",
    title: "Building Purchase Preview",
    text: "Matching suppliers and products against your inventory.",
  },
];

const aiElements = {
  error: document.querySelector("[data-ai-error]"),
  dropZone: document.querySelector("[data-drop-zone]"),
  fileInput: document.querySelector("[data-ai-file]"),
  fileName: document.querySelector("[data-file-name]"),
  processButton: document.querySelector("[data-process-invoice]"),
  resetButton: document.querySelector("[data-reset-ai]"),
  workflowStatus: document.querySelector("[data-workflow-status]"),
  processingPanel: document.querySelector("[data-processing-panel]"),
  processingTitle: document.querySelector("[data-processing-title]"),
  processingText: document.querySelector("[data-processing-text]"),
  previewPanel: document.querySelector("[data-preview-panel]"),
  supplierStatus: document.querySelector("[data-supplier-status]"),
  supplierCard: document.querySelector("[data-supplier-card]"),
  invoiceCard: document.querySelector("[data-invoice-card]"),
  productCount: document.querySelector("[data-product-count]"),
  productsPreview: document.querySelector("[data-products-preview]"),
  summaryProducts: document.querySelector("[data-summary-products]"),
  summaryNewProducts: document.querySelector("[data-summary-new-products]"),
  summaryTotal: document.querySelector("[data-summary-total]"),
  summarySupplier: document.querySelector("[data-summary-supplier]"),
  confirmButton: document.querySelector("[data-confirm-purchase]"),
  confirmSpinner: document.querySelector("[data-confirm-spinner]"),
  confirmText: document.querySelector("[data-confirm-text]"),
  duplicatePanel: document.querySelector("[data-duplicate-panel]"),
  duplicateInvoiceNumber: document.querySelector("[data-duplicate-invoice-number]"),
  successPanel: document.querySelector("[data-success-panel]"),
  successProducts: document.querySelector("[data-success-products]"),
  successSupplier: document.querySelector("[data-success-supplier]"),
  productsEmpty: document.querySelector("[data-products-empty]"),
  importAnother: document.querySelector("[data-import-another]"),
  importDifferent: document.querySelector("[data-import-different]"),
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

function setStage(stageKey, status) {
  const stage = document.querySelector(`[data-stage="${stageKey}"]`);

  if (!stage) return;

  const icon = stage.querySelector("i");
  const badge = stage.querySelector(".badge");
  const marker = stage.querySelector(".ai-timeline-marker");

  stage.classList.toggle("is-active", status === "active");
  stage.classList.toggle("is-complete", status === "done");

  icon.className = status === "done"
    ? "fa-solid fa-circle-check text-success"
    : status === "active"
      ? "fa-solid fa-circle-notch fa-spin text-primary"
      : "fa-regular fa-circle text-secondary";

  badge.textContent = status === "done" ? "Done" : status === "active" ? "Running" : "Waiting";
  badge.classList.toggle("badge-success", status === "done");
  marker?.classList.toggle("is-active", status === "active");
  marker?.classList.toggle("is-complete", status === "done");
}

function resetStages() {
  stages.forEach((stage) => setStage(stage.key, "waiting"));
  aiElements.workflowStatus.textContent = "Ready";
  aiElements.workflowStatus.classList.add("badge-success");
}

function startProcessingAnimation() {
  window.clearInterval(aiState.processingTimer);
  aiState.stageIndex = 0;
  showElement(aiElements.processingPanel);
  hideElement(aiElements.previewPanel);
  hideElement(aiElements.successPanel);
  hideElement(aiElements.duplicatePanel);
  aiElements.workflowStatus.textContent = "Processing";
  aiElements.workflowStatus.classList.remove("badge-success");

  function tick() {
    stages.forEach((stage, index) => {
      if (index < aiState.stageIndex) {
        setStage(stage.key, "done");
      } else if (index === aiState.stageIndex) {
        setStage(stage.key, "active");
      } else {
        setStage(stage.key, "waiting");
      }
    });

    const stage = stages[aiState.stageIndex] || stages[stages.length - 1];
    aiElements.processingTitle.textContent = stage.title;
    aiElements.processingText.textContent = stage.text;
    aiState.stageIndex = Math.min(aiState.stageIndex + 1, stages.length - 1);
  }

  tick();
  aiState.processingTimer = window.setInterval(tick, 1400);
}

function finishProcessingAnimation() {
  window.clearInterval(aiState.processingTimer);
  stages.forEach((stage) => setStage(stage.key, "done"));
  aiElements.workflowStatus.textContent = "Preview Ready";
  aiElements.workflowStatus.classList.add("badge-success");
  hideElement(aiElements.processingPanel);
}

function failProcessingAnimation() {
  window.clearInterval(aiState.processingTimer);
  aiElements.workflowStatus.textContent = "Needs Review";
  aiElements.workflowStatus.classList.remove("badge-success");
  hideElement(aiElements.processingPanel);
}

function isPdf(file) {
  return file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf");
}

function selectFile(file) {
  setAlert(aiElements.error, "");

  if (!file) return;

  if (!isPdf(file)) {
    aiState.selectedFile = null;
    aiElements.fileName.textContent = "PDF required";
    aiElements.processButton.disabled = true;
    setAlert(aiElements.error, "Please select a PDF invoice file.");
    return;
  }

  aiState.selectedFile = file;
  aiElements.fileName.textContent = file.name;
  aiElements.processButton.disabled = false;
  aiElements.dropZone.classList.add("has-file");
}

function getPreviewProducts() {
  return Array.isArray(aiState.preview?.products) ? aiState.preview.products : [];
}

function getInvoiceProducts() {
  return Array.isArray(aiState.invoice?.products) ? aiState.invoice.products : [];
}

function calculateEstimatedTotal() {
  return getInvoiceProducts().reduce((total, item) => {
    return total + (Number(item.quantity || 0) * Number(item.purchasePrice || 0));
  }, 0);
}

function getProductPreview(index) {
  return getPreviewProducts()[index] || {};
}

function renderSupplierCard() {
  const supplier = aiState.invoice?.supplier || {};
  const supplierPreview = aiState.preview?.supplier || {};
  const exists = Boolean(supplierPreview.exists);

  aiState.supplierWasNew = !exists;
  aiElements.supplierStatus.textContent = exists ? "Existing Supplier" : "New Supplier";
  aiElements.supplierStatus.classList.toggle("badge-success", exists);
  aiElements.supplierStatus.classList.toggle("badge-warning", !exists);

  aiElements.supplierCard.innerHTML = `
    <div class="ai-info-stack">
      <div class="ai-info-head">
        <p class="stat-label">Supplier Name</p>
        <p class="ai-entity-name">${escapeHtml(supplier.name || supplierPreview.name || "-")}</p>
      </div>
      <div class="ai-info-grid">
        <div class="ai-info-row">
          <i class="fa-solid fa-id-card" aria-hidden="true"></i>
          <div>
            <p class="stat-label">GSTIN</p>
            <p>${escapeHtml(supplier.gstNumber || "Not found")}</p>
          </div>
        </div>
        <div class="ai-info-row">
          <i class="fa-solid fa-phone" aria-hidden="true"></i>
          <div>
            <p class="stat-label">Phone</p>
            <p>${escapeHtml(supplier.phone || "Not found")}</p>
          </div>
        </div>
        <div class="ai-info-row">
          <i class="fa-solid fa-envelope" aria-hidden="true"></i>
          <div>
            <p class="stat-label">Email</p>
            <p>${escapeHtml(supplier.email || "Not found")}</p>
          </div>
        </div>
        <div class="ai-info-row ai-info-row-wide">
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
          <div>
            <p class="stat-label">Address</p>
            <p>${escapeHtml(supplier.address || "Not found")}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderInvoiceCard() {
  aiElements.invoiceCard.innerHTML = `
    <div class="ai-invoice-metrics">
      <div class="ai-invoice-metric">
        <p class="stat-label">Invoice Number</p>
        <p class="ai-invoice-value">${escapeHtml(aiState.invoice?.invoiceNumber || "-")}</p>
      </div>
      <div class="ai-invoice-metric">
        <p class="stat-label">Invoice Date</p>
        <p class="ai-invoice-value">${escapeHtml(aiState.invoice?.invoiceDate || "-")}</p>
      </div>
      <div class="ai-invoice-metric is-total">
        <p class="stat-label">Estimated Total</p>
        <p class="ai-invoice-value">${formatCurrency(calculateEstimatedTotal())}</p>
      </div>
    </div>
  `;
}

function renderProductsPreview() {
  const products = getInvoiceProducts();
  if (products.length === 0) {
    showElement(aiElements.productsEmpty);
    aiElements.productsPreview.innerHTML = "";
    aiElements.productCount.textContent = "0 Items";
    aiState.newProductCount = 0;
    return;
  }

  hideElement(aiElements.productsEmpty);

  const rows = products.map((item, index) => {
    const preview = getProductPreview(index);
    const exists = Boolean(preview.exists);
    const quantity = Number(item.quantity || preview.quantity || 0);
    const purchasePrice = Number(item.purchasePrice || preview.purchasePrice || 0);
    const gstRate = Number(item.gstRate || preview.gstRate || 0);

    return `
      <tr>
        <td class="font-semibold">${escapeHtml(item.name || preview.name || "-")}</td>
        <td><span class="badge ${exists ? "badge-success" : "badge-warning"}">${exists ? "Existing Product" : "New Product"}</span></td>
        <td>${formatNumber(quantity)}</td>
        <td>${formatCurrency(purchasePrice)}</td>
        <td>${formatNumber(gstRate)}%</td>
        <td>${formatCurrency(quantity * purchasePrice)}</td>
      </tr>
    `;
  }).join("");

  aiState.newProductCount = getPreviewProducts().filter((product) => !product.exists).length;
  aiElements.productCount.textContent = `${formatNumber(products.length)} Item${products.length === 1 ? "" : "s"}`;
  aiElements.productsPreview.innerHTML = rows;
}

function renderSummary() {
  const products = getInvoiceProducts();

  aiElements.summaryProducts.textContent = formatNumber(products.length);
  aiElements.summaryNewProducts.textContent = formatNumber(aiState.newProductCount);
  aiElements.summaryTotal.textContent = formatCurrency(calculateEstimatedTotal());
  aiElements.summarySupplier.textContent = aiState.supplierWasNew ? "Add" : "Reuse";
}

function renderPreview(data) {
  aiState.invoice = data?.invoice || null;
  aiState.preview = data?.preview || null;

  if (!aiState.invoice || !aiState.preview) {
    throw new Error("AI response did not include a purchase preview.");
  }

  renderSupplierCard();
  renderInvoiceCard();
  renderProductsPreview();
  renderSummary();
  showElement(aiElements.previewPanel);
  aiElements.previewPanel.classList.add("is-visible");
}

async function processInvoice(event) {
  event?.preventDefault();
  event?.stopPropagation();

  if (!aiState.selectedFile) {
    setAlert(aiElements.error, "Select a PDF invoice before processing.");
    return;
  }

  setAlert(aiElements.error, "");
  aiElements.processButton.disabled = true;
  startProcessingAnimation();

  try {
    const data = await window.VBApi.AiApi.processInvoice(aiState.selectedFile);
    finishProcessingAnimation();
    renderPreview(data);
    showToast(data?.message || "Purchase preview generated successfully.");
  } catch (error) {
    failProcessingAnimation();
    aiElements.processButton.disabled = false;
    setAlert(aiElements.error, error.message || "Unable to process invoice.");
  }
}

function renderSuccess() {
  hideElement(aiElements.previewPanel);
  hideElement(aiElements.processingPanel);
  hideElement(aiElements.duplicatePanel);
  showElement(aiElements.successPanel);
  aiElements.successPanel.classList.add("is-visible");
  aiElements.workflowStatus.textContent = "Completed";
  aiElements.workflowStatus.classList.add("badge-success");
  aiElements.successProducts.textContent = formatNumber(aiState.newProductCount);
  aiElements.successSupplier.textContent = aiState.supplierWasNew ? "Created" : "Reused";
}

function isDuplicateInvoiceError(error) {
  return /already been imported/i.test(error?.message || "");
}

function showDuplicateInvoiceWarning() {
  hideElement(aiElements.previewPanel);
  hideElement(aiElements.processingPanel);
  hideElement(aiElements.successPanel);
  showElement(aiElements.duplicatePanel);
  aiElements.duplicatePanel.classList.add("is-visible");
  aiElements.workflowStatus.textContent = "Duplicate";
  aiElements.workflowStatus.classList.remove("badge-success");
  aiElements.duplicateInvoiceNumber.textContent = aiState.invoice?.invoiceNumber || "-";
}

async function confirmPurchase(event) {
  event?.preventDefault();
  event?.stopPropagation();

  if (!aiState.invoice) {
    setAlert(aiElements.error, "No invoice preview is ready to confirm.");
    return;
  }

  setAlert(aiElements.error, "");
  setActionLoading({
    button: aiElements.confirmButton,
    spinner: aiElements.confirmSpinner,
    text: aiElements.confirmText,
    isLoading: true,
    loadingText: "Confirming...",
    defaultText: "Confirm Purchase",
  });

  try {
    const data = await window.VBApi.AiApi.confirmPurchase(aiState.invoice);
    showToast(data?.message || "Purchase created successfully.");
    renderSuccess();
  } catch (error) {
    if (isDuplicateInvoiceError(error)) {
      showDuplicateInvoiceWarning();
    } else {
      setAlert(aiElements.error, error.message || "Unable to confirm purchase.");
    }
  } finally {
    setActionLoading({
      button: aiElements.confirmButton,
      spinner: aiElements.confirmSpinner,
      text: aiElements.confirmText,
      isLoading: false,
      loadingText: "",
      defaultText: "Confirm Purchase",
    });
  }
}

function resetWorkflow() {
  window.clearInterval(aiState.processingTimer);
  aiState.selectedFile = null;
  aiState.invoice = null;
  aiState.preview = null;
  aiState.supplierWasNew = false;
  aiState.newProductCount = 0;
  aiElements.fileInput.value = "";
  aiElements.fileName.textContent = "No file selected";
  aiElements.dropZone.classList.remove("has-file");
  aiElements.processButton.disabled = true;
  setAlert(aiElements.error, "");
  hideElement(aiElements.processingPanel);
  hideElement(aiElements.previewPanel);
  hideElement(aiElements.successPanel);
  hideElement(aiElements.duplicatePanel);
  aiElements.previewPanel.classList.remove("is-visible");
  aiElements.successPanel.classList.remove("is-visible");
  aiElements.duplicatePanel.classList.remove("is-visible");
  resetStages();
}

function bindAiEvents() {
  aiElements.fileInput?.addEventListener("change", (event) => {
    selectFile(event.target.files?.[0]);
  });

  aiElements.dropZone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    aiElements.dropZone.classList.add("card");
  });

  aiElements.dropZone?.addEventListener("dragleave", () => {
    aiElements.dropZone.classList.remove("card");
  });

  aiElements.dropZone?.addEventListener("drop", (event) => {
    event.preventDefault();
    aiElements.dropZone.classList.remove("card");
    selectFile(event.dataTransfer.files?.[0]);
  });

  aiElements.processButton?.addEventListener("click", processInvoice);
  aiElements.confirmButton?.addEventListener("click", confirmPurchase);
  aiElements.resetButton?.addEventListener("click", resetWorkflow);
  aiElements.importAnother?.addEventListener("click", resetWorkflow);
  aiElements.importDifferent?.addEventListener("click", resetWorkflow);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.VBAuth?.getToken()) return;

  bindAiEvents();
  resetWorkflow();
});
