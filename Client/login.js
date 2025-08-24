document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const errorDiv = document.createElement('div');
  errorDiv.id = 'loginError';
  errorDiv.style = 'color:#ff5e5e; font-size:1.1rem; font-weight:600; margin-bottom:12px; text-align:center;';
  form.insertBefore(errorDiv, form.firstChild);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to search.html (authentication will be handled by auth.js)
        window.location.href = 'search.html';
      } else {
        errorDiv.textContent = data.message || 'Login failed.';
      }
    } catch (err) {
      errorDiv.textContent = 'Server error. Please try again.';
    }
  });
});
