/* ============================================================
   contact.js — page-specific behavior for the Contact (Mars) page.

   The form has no backend wired up yet, so submitting it validates the
   fields, then builds a mailto: link and opens the visitor's email
   client — works immediately, zero setup, zero account needed.

   If you'd rather receive submissions in-page (no email client popup),
   swap in Option B below: sign up for a form-backend service (Formspree,
   Getform, etc.), drop your endpoint into the fetch() call, and delete
   the mailto: line in Option A.
   ============================================================ */

(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusEl = document.getElementById('cf-status');
  const YOUR_EMAIL = 'you@example.com'; // <-- replace with your real address

  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = 'console-status' + (kind ? ' is-' + kind : '');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      setStatus('All fields are required before transmitting.', 'error');
      return;
    }
    if (!isValidEmail(email)) {
      setStatus("That return frequency doesn't look like a valid email.", 'error');
      return;
    }

    
    const subject = encodeURIComponent(`Portfolio message from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${YOUR_EMAIL}?subject=${subject}&body=${body}`;
    setStatus('Opening your email client to send this…', 'success');

    /* ---- Option B: send in-page instead, no popup ----
    fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then((res) => {
      if (res.ok) {
        setStatus('Transmission received. Talk soon.', 'success');
        form.reset();
      } else {
        setStatus('Something went wrong — try again or use a direct channel.', 'error');
      }
    });
    */
  });
})();
