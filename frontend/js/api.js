const API_BASE_URL = "http://localhost:5000/api";

class ApiClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status || 0;
    this.data = options.data || null;
  }
}

function getApiToken() {
  return localStorage.getItem("token");
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function extractApiErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((error) => error.msg || error.message).filter(Boolean).join(" ");
  }
  return fallback;
}

async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  const token = getApiToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body: options.body instanceof FormData || options.body === undefined
        ? options.body
        : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiClientError("Server unavailable. Please check that the backend is running.");
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("login.html");
    throw new ApiClientError("Session expired. Please sign in again.", {
      status: response.status,
      data,
    });
  }

  if (!response.ok) {
    throw new ApiClientError(
      extractApiErrorMessage(data, "Something went wrong. Please try again."),
      {
        status: response.status,
        data,
      }
    );
  }

  return data;
}

const ProductApi = {
  list(params) {
    return apiRequest(`/products${buildQuery(params)}`);
  },

  search(name) {
    return apiRequest(`/products/search${buildQuery({ name })}`);
  },

  getById(id) {
    return apiRequest(`/products/${id}`);
  },

  create(payload) {
    return apiRequest("/products", {
      method: "POST",
      body: payload,
    });
  },

  update(id, payload) {
    return apiRequest(`/products/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  remove(id) {
    return apiRequest(`/products/${id}`, {
      method: "DELETE",
    });
  },
};

const SupplierApi = {
  list() {
    return apiRequest("/suppliers");
  },

  getById(id) {
    return apiRequest(`/suppliers/${id}`);
  },

  create(payload) {
    return apiRequest("/suppliers", {
      method: "POST",
      body: payload,
    });
  },

  update(id, payload) {
    return apiRequest(`/suppliers/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  remove(id) {
    return apiRequest(`/suppliers/${id}`, {
      method: "DELETE",
    });
  },
};

const CustomerApi = {
  list() {
    return apiRequest("/customers");
  },

  getById(id) {
    return apiRequest(`/customers/${id}`);
  },

  create(payload) {
    return apiRequest("/customers", {
      method: "POST",
      body: payload,
    });
  },

  update(id, payload) {
    return apiRequest(`/customers/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  remove(id) {
    return apiRequest(`/customers/${id}`, {
      method: "DELETE",
    });
  },
};

const PurchaseApi = {
  list() {
    return apiRequest("/purchases");
  },

  create(payload) {
    return apiRequest("/purchases", {
      method: "POST",
      body: payload,
    });
  },
};

const SaleApi = {
  list() {
    return apiRequest("/sales");
  },

  getById(id) {
    return apiRequest(`/sales/${id}`);
  },

  create(payload) {
    return apiRequest("/sales", {
      method: "POST",
      body: payload,
    });
  },
};

const InvoiceApi = {
  getById(id) {
    return apiRequest(`/invoices/${id}`);
  },

  getDownloadUrl(id) {
    return `${API_BASE_URL}/invoices/${id}/download`;
  },
};

window.VBApi = {
  request: apiRequest,
  buildQuery,
  ProductApi,
  SupplierApi,
  CustomerApi,
  PurchaseApi,
  SaleApi,
  InvoiceApi,
  ApiClientError,
};
