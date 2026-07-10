const toast = document.querySelector("[data-toast]");

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

window.VBApp = {
  showToast,
};
