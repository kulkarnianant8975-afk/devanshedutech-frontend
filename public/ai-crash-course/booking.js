(() => {
  'use strict';

  // Creative previews are authored examples, not a live AI generation service.
  const tabs = [...document.querySelectorAll('[data-preview]')];
  function activateTab(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activateTab(tabs[next]);
      tabs[next].focus();
    });
  });

  const form = document.getElementById('enquiryForm');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const name = form.elements.studentName.value.trim();
    const goal = form.elements.studentGoal.value;
    const intro = name ? `Hi, I'm ${name}.` : 'Hi!';
    const interest = goal ? ` I'm a ${goal.toLowerCase()}.` : '';
    const message = `${intro}${interest} I'm interested in the 30-day AI Crash Course at Devansh Edu-Tech starting 2 November 2026. Please share the batch timing, course details and admission process. I understand the full fee is ₹3,999, including ₹500 to book and ₹3,499 remaining.`;
    // Opens a draft; the visitor chooses whether to send it in WhatsApp.
    window.location.assign(`https://wa.me/917972217407?text=${encodeURIComponent(message)}`);
  });

  const raw = window.AI_COURSE_CONFIG?.paymentUrl;
  const button = document.getElementById('payButton');
  const state = document.getElementById('paymentState');
  if (!raw || !button || !state) return;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !['rzp.io', 'rzp.me', 'pages.razorpay.com'].includes(url.hostname) || url.username || url.password) return;
    button.href = url.href;
    button.hidden = false;
    state.textContent = 'Continue to Razorpay to enter your registration details and pay ₹500. Your booking is confirmed after payment verification by the institute.';
  } catch { /* Keep the contact fallback for missing or invalid payment setup. */ }
})();
