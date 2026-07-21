// Page-specific behavior for the Skills (Mercury) page goes here.
document.querySelectorAll('.diag-bar-fill[data-fill]').forEach((bar) => {
  bar.style.width = `${bar.dataset.fill}%`;
});
