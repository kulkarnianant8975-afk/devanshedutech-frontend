(() => {
  'use strict';
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
  } catch { /* Keep the honest contact fallback for missing or invalid setup. */ }
})();
