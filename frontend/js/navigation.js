function setActiveNavigation() {
  const navLinks = document.querySelectorAll("[data-nav-link]");
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

  navLinks.forEach((link) => {
    const target = link.getAttribute("href");

    if (target === currentPage) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
}

document.addEventListener("DOMContentLoaded", setActiveNavigation);

window.VBNavigation = {
  setActiveNavigation,
};
// });
