// Authentication utility functions

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch('http://localhost:3000/auth/status');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking auth status:', error);
        return { authenticated: false, user: null };
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('http://localhost:3000/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.message === 'Logged out successfully') {
            // Redirect to login page
            window.location.href = 'login.html';
        } else {
            console.error('Logout failed:', data.message);
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Even if logout fails, redirect to login page
        window.location.href = 'login.html';
    }
}

// Redirect to login if not authenticated
async function requireAuth() {
    const authStatus = await checkAuthStatus();
    if (!authStatus.authenticated) {
        window.location.href = 'login.html';
        return false;
    }
    return authStatus.user;
}

// Initialize authentication for protected pages
async function initAuth() {
    const user = await requireAuth();
    if (user) {
        return user;
    }
    return null;
}
