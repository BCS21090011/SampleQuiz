// UserProfile.js - User profile page functionality
// Uses Flask-injected authentication variables

let currentUserData = null;
let isEditMode = false;

// DOM elements
let usernameEl, emailEl, birthdateEl, genderEl, roleEl, memberSinceEl;
let editInfoBtn, cancelEditBtn, saveInfoBtn;
let changePasswordBtn, newPasswordInput, confirmPasswordInput;
let logoutBtn, backBtn;
let statusContainer, infoGrid;

/**
 * Initialize the page
 */
async function init() {
    // Check authentication (using bridged variable from Flask)
    if (!isAuthed) {
        showStatus('You must be logged in to view this page. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = `/Login?dest=${encodeURIComponent(window.location.pathname)}`;
        }, 2000);
        return;
    }

    // Get DOM elements
    usernameEl = document.getElementById('username');
    emailEl = document.getElementById('email');
    birthdateEl = document.getElementById('birthdate');
    genderEl = document.getElementById('gender');
    roleEl = document.getElementById('role');
    memberSinceEl = document.getElementById('memberSince');

    editInfoBtn = document.getElementById('editInfoBtn');
    cancelEditBtn = document.getElementById('cancelEditBtn');
    saveInfoBtn = document.getElementById('saveInfoBtn');

    changePasswordBtn = document.getElementById('changePasswordBtn');
    newPasswordInput = document.getElementById('newPassword');
    confirmPasswordInput = document.getElementById('confirmPassword');

    logoutBtn = document.getElementById('logoutBtn');
    backBtn = document.getElementById('backBtn');

    statusContainer = document.getElementById('statusContainer');
    infoGrid = document.getElementById('infoGrid');

    // Attach event listeners
    editInfoBtn.addEventListener('click', enterEditMode);
    cancelEditBtn.addEventListener('click', cancelEdit);
    saveInfoBtn.addEventListener('click', saveUserInfo);
    changePasswordBtn.addEventListener('click', changePassword);
    logoutBtn.addEventListener('click', logout);
    backBtn.addEventListener('click', () => window.location.href = '/');

    // Admin buttons (if user is admin)
    const adminToolsCard = document.getElementById('adminToolsCard');
    const adminUsersBtn = document.getElementById('adminUsersBtn');
    const adminResultsBtn = document.getElementById('adminResultsBtn');

    if (userRole === 'ADMIN' && adminToolsCard) {
        adminToolsCard.style.display = 'block';
        adminUsersBtn.addEventListener('click', () => window.location.href = '/AdminUserManagement');
        adminResultsBtn.addEventListener('click', () => window.location.href = '/AdminResultsHistory');
    }

    // Load user data
    await loadUserData();
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;

    statusContainer.innerHTML = '';
    statusContainer.appendChild(statusDiv);

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.remove();
        }, 5000);
    }
}

/**
 * Load user data from API
 */
async function loadUserData() {
    try {
        const response = await fetch('/API/User', {
            method: 'GET',
            credentials: 'include' // Include cookies
        });

        if (!response.ok) {
            if (response.status === 401) {
                showStatus('Session expired. Please log in again.', 'error');
                setTimeout(() => window.location.href = '/Login', 2000);
                return;
            }
            throw new Error(`Failed to load user data: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.user) {
            currentUserData = data.user;
            displayUserData(currentUserData);
        } else {
            showStatus('Failed to load user data', 'error');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Display user data in the UI
 */
function displayUserData(user) {
    usernameEl.textContent = user.UserName || 'N/A';
    emailEl.textContent = user.UserEmail || 'Not set';
    emailEl.className = user.UserEmail ? 'info-value' : 'info-value empty';

    birthdateEl.textContent = user.UserBirthDate || 'Not set';
    birthdateEl.className = user.UserBirthDate ? 'info-value' : 'info-value empty';

    genderEl.textContent = user.UserGender || 'Not set';
    genderEl.className = user.UserGender ? 'info-value' : 'info-value empty';

    roleEl.textContent = user.UserRole || 'PLAYER';

    if (user.CreationDatetime) {
        const date = new Date(user.CreationDatetime);
        memberSinceEl.textContent = date.toLocaleDateString();
    } else {
        memberSinceEl.textContent = 'Unknown';
    }
}

/**
 * Enter edit mode
 */
function enterEditMode() {
    isEditMode = true;

    // Replace display elements with input fields
    const emailRow = emailEl.parentElement;
    emailEl.remove();
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'emailInput';
    emailInput.value = currentUserData.UserEmail || '';
    emailInput.placeholder = 'Enter email';
    emailRow.appendChild(emailInput);

    const birthdateRow = birthdateEl.parentElement;
    birthdateEl.remove();
    const birthdateInput = document.createElement('input');
    birthdateInput.type = 'date';
    birthdateInput.id = 'birthdateInput';
    birthdateInput.value = currentUserData.UserBirthDate || '';
    birthdateRow.appendChild(birthdateInput);

    const genderRow = genderEl.parentElement;
    genderEl.remove();
    const genderSelect = document.createElement('select');
    genderSelect.id = 'genderInput';
    genderSelect.innerHTML = `
        <option value="">Not set</option>
        <option value="MALE" ${currentUserData.UserGender === 'MALE' ? 'selected' : ''}>Male</option>
        <option value="FEMALE" ${currentUserData.UserGender === 'FEMALE' ? 'selected' : ''}>Female</option>
        <option value="OTHER" ${currentUserData.UserGender === 'OTHER' ? 'selected' : ''}>Other</option>
    `;
    genderRow.appendChild(genderSelect);

    // Show/hide buttons
    editInfoBtn.classList.add('hidden');
    cancelEditBtn.classList.remove('hidden');
    saveInfoBtn.classList.remove('hidden');
}

/**
 * Cancel edit mode
 */
function cancelEdit() {
    isEditMode = false;

    // Restore original display
    displayUserData(currentUserData);

    // Show/hide buttons
    editInfoBtn.classList.remove('hidden');
    cancelEditBtn.classList.add('hidden');
    saveInfoBtn.classList.add('hidden');
}

/**
 * Save user info changes
 */
async function saveUserInfo() {
    const emailInput = document.getElementById('emailInput');
    const birthdateInput = document.getElementById('birthdateInput');
    const genderInput = document.getElementById('genderInput');

    const updates = {
        useremail: emailInput.value || null,
        userbirthdate: birthdateInput.value || null,
        usergender: genderInput.value || null
    };

    try {
        // Use bridged userID variable from Flask
        const response = await fetch(`/API/User/${userID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus('Profile updated successfully!', 'success');

            // Reload user data
            await loadUserData();

            // Exit edit mode
            isEditMode = false;
            editInfoBtn.classList.remove('hidden');
            cancelEditBtn.classList.add('hidden');
            saveInfoBtn.classList.add('hidden');
        } else {
            showStatus(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Change password
 */
async function changePassword() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword || !confirmPassword) {
        showStatus('Please enter and confirm your new password', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showStatus('Passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 4) {
        showStatus('Password must be at least 4 characters long', 'error');
        return;
    }

    try {
        changePasswordBtn.disabled = true;

        // Use bridged userID variable from Flask
        const response = await fetch(`/API/User/${userID}/password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                userpassword: newPassword
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus('Password changed successfully!', 'success');
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } else {
            showStatus(data.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        changePasswordBtn.disabled = false;
    }
}

/**
 * Logout user
 */
async function logout() {
    try {
        const response = await fetch('/API/Logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            showStatus('Logged out successfully. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            showStatus('Logout failed', 'error');
        }
    } catch (error) {
        console.error('Error logging out:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
