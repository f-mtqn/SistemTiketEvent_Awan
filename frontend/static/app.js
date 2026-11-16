/* app.js — Router / navigation */

const pages = {
  events: () => Events.renderList(),
  buyers: () => Buyers.renderList(),
  orders: () => Orders.renderList(),
};

function navigate(page) {
  // Update sidebar active state
  document.querySelectorAll('.sidebar-link').forEach(el => {
    if (el.dataset.page === page) {
      el.setAttribute('aria-current', 'page');
    } else {
      el.removeAttribute('aria-current');
    }
  });

  const renderer = pages[page];
  if (renderer) renderer();
}

// Click handlers for sidebar
document.querySelectorAll('.sidebar-link').forEach(el => {
  el.addEventListener('click', (ev) => {
    ev.preventDefault();
    navigate(el.dataset.page);
    // Update URL hash without scrolling
    history.pushState(null, '', '#' + el.dataset.page);
  });
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '') || 'events';
  navigate(hash);
});

// Initial render
const initPage = location.hash.replace('#', '') || 'events';
navigate(initPage);
