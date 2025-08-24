async function registerUser() {
    console.log('Attempting user registration...');
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;

  try {
    // Send registration data to backend
    const res = await fetch('/newUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, passwordConfirm })
    });

    if (!res.ok) {
      const errorData = await res.json();
      showError(errorData.message || 'Registration failed. Please try again later.');
      return;
    }

    const result = await res.json();

    if (result.message !== 'OK') {
        console.log(result.message);
      showError(result.message);
      return;
    }
    console.log('Registration successful:', result.message);
    // Success: show registration completed message and gallery button
    showError("");
    console.log('Registration successful:', result.message);
    const successDiv = document.getElementById('successMsg');
    successDiv.innerHTML = '<span style="color:#4fc3dc;font-size:1.2rem;font-weight:bold;">Registration completed successfully!</span><br>' +
      '<button id="galleryBtn" style="margin-top:18px;padding:10px 28px;border-radius:999px;background:linear-gradient(90deg,#ff5e5e 0%,#4fc3dc 100%);color:#fff;font-size:1rem;font-weight:600;border:none;cursor:pointer;">Pokemon Gallery</button>';
    successDiv.style.display = 'block';
    document.getElementById('galleryBtn').onclick = function() {
      // Redirect to search.html (authentication will be handled by auth.js)
      window.location.href = 'search.html';
    };


  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showError('Unable to connect to server. Please check if the server is running.');
    } else {
      showError('Registration failed. Please try again later.');
    }
  }
}

function showError(msg) {
  const errorDiv = document.getElementById('errorMsg');
  if (!msg) {
    errorDiv.style.display = 'none';
    errorDiv.innerText = '';
  } else {
    errorDiv.style.display = 'block';
    errorDiv.innerText = msg;
  }
}

// Add this at the end of register.js to handle form submission and prevent page reload

document.getElementById('registerForm').onsubmit = function(e) {
  e.preventDefault();
  registerUser();
};