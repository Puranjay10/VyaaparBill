const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "user";
const LOGIN_URL = "http://localhost:5000/api/auth/login";
const REGISTER_URL = "http://localhost:5000/api/auth/register";

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser() {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
}

function isObjectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function cleanDisplayValue(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();

  return trimmed && !isObjectId(trimmed) ? trimmed : "";
}

function getUserDisplayName(user) {
  return cleanDisplayValue(user?.name) ||
    cleanDisplayValue(user?.fullName) ||
    cleanDisplayValue(user?.displayName) ||
    cleanDisplayValue(user?.email) ||
    "User";
}

function getUserInitials(user) {
  const name = cleanDisplayValue(user?.name) ||
    cleanDisplayValue(user?.fullName) ||
    cleanDisplayValue(user?.displayName);

  if (name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  return getUserDisplayName(user).charAt(0).toUpperCase() || "U";
}

function normalizeLoginResponse(data, fallbackUser = {}) {
  const token = data.token || data.jwt || data.accessToken;
  const responseUser = data.user || data.loggedInUser || data.data?.user;
  const topLevelUser = {
    name: data.name,
    fullName: data.fullName,
    displayName: data.displayName,
    email: data.email,
    role: data.role,
  };
  const hasTopLevelUser = Object.values(topLevelUser).some(Boolean);
  const user = responseUser || (hasTopLevelUser ? topLevelUser : fallbackUser) || {};

  return {
    token,
    user,
  };
}

function storeSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user || {}));
}

function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.location.href = "login.html";
}

function requireAuth() {
  if (!getToken()) {
    window.location.replace("login.html");
  }
}

function redirectIfAuthenticated() {
  if (getToken()) {
    window.location.replace("dashboard.html");
  }
}

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error.message === "string" && error.message) return error.message;
  if (Array.isArray(error.errors) && error.errors[0]?.msg) return error.errors[0].msg;
  if (error.message) return error.message;
  return fallback;
}

function setButtonLoading(config) {
  const submitButton = document.querySelector(config.buttonSelector);
  const spinner = document.querySelector(config.spinnerSelector);
  const buttonText = document.querySelector(config.textSelector);

  if (!submitButton || !spinner || !buttonText) return;

  submitButton.disabled = config.isLoading;
  spinner.classList.toggle("hide", !config.isLoading);
  buttonText.textContent = config.isLoading ? config.loadingText : config.defaultText;
}

function setLoginLoading(isLoading) {
  setButtonLoading({
    buttonSelector: "[data-login-submit]",
    spinnerSelector: "[data-login-spinner]",
    textSelector: "[data-login-button-text]",
    isLoading,
    loadingText: "Signing in...",
    defaultText: "Sign In",
  });
}

function setRegisterLoading(isLoading) {
  setButtonLoading({
    buttonSelector: "[data-register-submit]",
    spinnerSelector: "[data-register-spinner]",
    textSelector: "[data-register-button-text]",
    isLoading,
    loadingText: "Creating account...",
    defaultText: "Create Account",
  });
}

function showAuthError(message) {
  const errorBox = document.querySelector("[data-auth-error]");

  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.classList.add("is-visible");
}

function clearAuthError() {
  const errorBox = document.querySelector("[data-auth-error]");

  if (!errorBox) return;

  errorBox.textContent = "";
  errorBox.classList.remove("is-visible");
}

function showAuthSuccess(message) {
  const successBox = document.querySelector("[data-auth-success]");

  if (successBox) {
    successBox.textContent = message;
    successBox.classList.add("is-visible");
  }

  if (window.VBApp?.showToast) {
    window.VBApp.showToast(message);
  }
}

function clearAuthSuccess() {
  const successBox = document.querySelector("[data-auth-success]");

  if (!successBox) return;

  successBox.textContent = "";
  successBox.classList.remove("is-visible");
}

async function postJson(url, payload, fallbackMessage) {
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error("Network error. Please check that the backend server is running.");
  }

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const fallback = response.status >= 500
      ? "Server unavailable. Please try again later."
      : fallbackMessage;

    throw new Error(getErrorMessage(data, fallback));
  }

  return data;
}

async function login(email, password) {
  const data = await postJson(LOGIN_URL, { email, password }, "Invalid credentials");

  const session = normalizeLoginResponse(data, { email });

  if (!session.token) {
    throw new Error("Login succeeded, but no token was returned by the server.");
  }

  storeSession(session.token, session.user);
  return session;
}

async function register({ name, email, password, role }) {
  return postJson(
    REGISTER_URL,
    {
      name,
      email,
      password,
      role,
    },
    "Registration failed. Please check your details."
  );
}

function setupLoginForm() {
  const form = document.querySelector("[data-login-form]");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAuthError();

    const emailInput = document.querySelector("[data-login-email]");
    const passwordInput = document.querySelector("[data-login-password]");
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!email) {
      showAuthError("Email is required.");
      emailInput?.focus();
      return;
    }

    if (!password) {
      showAuthError("Password is required.");
      passwordInput?.focus();
      return;
    }

    setLoginLoading(true);

    try {
      await login(email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      showAuthError(getErrorMessage(error, "Unable to sign in. Please try again."));
    } finally {
      setLoginLoading(false);
    }
  });
}

function setupRegisterForm() {
  const form = document.querySelector("[data-register-form]");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAuthError();
    clearAuthSuccess();

    const nameInput = document.querySelector("[data-register-name]");
    const emailInput = document.querySelector("[data-register-email]");
    const passwordInput = document.querySelector("[data-register-password]");
    const confirmPasswordInput = document.querySelector("[data-register-confirm-password]");
    const roleInput = document.querySelector("[data-register-role]");

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";
    const role = roleInput?.value || "staff";

    if (!name) {
      showAuthError("Name is required.");
      nameInput?.focus();
      return;
    }

    if (!email) {
      showAuthError("Email is required.");
      emailInput?.focus();
      return;
    }

    if (!password) {
      showAuthError("Password is required.");
      passwordInput?.focus();
      return;
    }

    if (password.length < 6) {
      showAuthError("Password must be at least 6 characters.");
      passwordInput?.focus();
      return;
    }

    if (!confirmPassword) {
      showAuthError("Confirm password is required.");
      confirmPasswordInput?.focus();
      return;
    }

    if (password !== confirmPassword) {
      showAuthError("Confirm password must match password.");
      confirmPasswordInput?.focus();
      return;
    }

    setRegisterLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
      });

      showAuthSuccess("Account created successfully. Redirecting to login...");

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } catch (error) {
      showAuthError(getErrorMessage(error, "Registration failed. Please try again."));
    } finally {
      setRegisterLoading(false);
    }
  });
}

function setupLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", logout);
  });
}

function hydrateUserMenu() {
  const user = getStoredUser();
  const username = getUserDisplayName(user);
  const initials = getUserInitials(user);

  document.querySelectorAll("[data-username]").forEach((element) => {
    element.textContent = username;
  });

  document.querySelectorAll("[data-avatar]").forEach((element) => {
    element.textContent = initials;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.hasAttribute("data-require-auth")) {
    requireAuth();
    hydrateUserMenu();
  }

  if (document.body.hasAttribute("data-auth-page")) {
    redirectIfAuthenticated();
    setupLoginForm();
    setupRegisterForm();
  }

  setupLogoutButtons();
});

window.VBAuth = {
  getToken,
  getStoredUser,
  login,
  register,
  logout,
  requireAuth,
};
