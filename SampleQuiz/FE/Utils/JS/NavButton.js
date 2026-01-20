// NavButton.js - Global navigation component for login/profile button
// Uses Flask-injected authentication variables

/**
 * Creates and injects a navigation button in the top-right corner
 * Shows "Login" when not authenticated, "Profile" when authenticated
 * @param {boolean} isAuthed - Flask-injected authentication status
 * @param {string|null} userRole - Flask-injected user role (ADMIN, PLAYER, etc.)
 * @param {string|null} authError - Flask-injected auth error message
 */
function createNavButton(isAuthed, userRole, authError) {
    // Create container
    const navContainer = document.createElement('div');
    navContainer.id = 'nav-button-container';
    navContainer.className = 'nav-button-container';

    if (!isAuthed) {
        // Show Login button
        const loginBtn = document.createElement('button');
        loginBtn.id = 'nav-login-btn';
        loginBtn.className = 'nav-btn nav-login';
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => {
            const currentPath = window.location.pathname;
            window.location.href = `/Login?dest=${encodeURIComponent(currentPath)}`;
        };
        navContainer.appendChild(loginBtn);
    } else {
        // Show Profile button (authenticated)
        const profileBtn = document.createElement('button');
        profileBtn.id = 'nav-profile-btn';
        profileBtn.className = 'nav-btn nav-profile';

        // Add admin badge if user is admin
        if (userRole === 'ADMIN') {
            const badge = document.createElement('span');
            badge.className = 'nav-admin-badge';
            badge.textContent = 'ADMIN';
            profileBtn.appendChild(badge);
        }

        const icon = document.createElement('span');
        icon.className = 'nav-profile-icon';
        icon.textContent = '👤';
        profileBtn.appendChild(icon);

        const text = document.createElement('span');
        text.className = 'nav-profile-text';
        text.textContent = 'Profile';
        profileBtn.appendChild(text);

        profileBtn.onclick = () => {
            window.location.href = '/UserProfile';
        };

        navContainer.appendChild(profileBtn);
    }

    // Inject into body
    document.body.appendChild(navContainer);
}

/**
 * Initialize navigation button on page load
 * Expects bridged variables: isAuthed, userRole, authError (from Flask)
 */
function initNavButton() {
    // These variables should be bridged from Flask in the template (without _flask suffix)
    const isAuthenticated = typeof isAuthed !== 'undefined' ? isAuthed : false;
    const role = typeof userRole !== 'undefined' ? userRole : null;
    const error = typeof authError !== 'undefined' ? authError : null;

    createNavButton(isAuthenticated, role, error);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavButton);
} else {
    initNavButton();
}
