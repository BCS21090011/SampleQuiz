// AdminUserManagement.js - Admin user management functionality
// Uses Flask-injected authentication variables for admin verification

let allUsers = [];
let statusContainer;
let usersTableBody;
let createModal, editModal;
let createUserForm, editUserForm;

/**
 * Initialize the page
 */
async function init() {
    // Check authentication and admin role (using bridged variables from Flask)
    if (!isAuthed || userRole !== 'ADMIN') {
        alert('Access denied. This page is only accessible to administrators.');
        window.location.href = '/';
        return;
    }

    // Get DOM elements
    statusContainer = document.getElementById('statusContainer');
    usersTableBody = document.getElementById('usersTableBody');
    createModal = document.getElementById('createModal');
    editModal = document.getElementById('editModal');
    createUserForm = document.getElementById('createUserForm');
    editUserForm = document.getElementById('editUserForm');

    // Attach event listeners
    document.getElementById('createUserBtn').addEventListener('click', openCreateModal);
    document.getElementById('refreshBtn').addEventListener('click', loadUsers);
    document.getElementById('backBtn').addEventListener('click', () => window.location.href = '/');

    document.getElementById('cancelCreateBtn').addEventListener('click', () => createModal.classList.remove('active'));
    document.getElementById('cancelEditBtn').addEventListener('click', () => editModal.classList.remove('active'));

    createUserForm.addEventListener('submit', handleCreateUser);
    editUserForm.addEventListener('submit', handleEditUser);

    // Close modals when clicking overlay
    createModal.addEventListener('click', (e) => {
        if (e.target === createModal) createModal.classList.remove('active');
    });
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.remove('active');
    });

    // Load users
    await loadUsers();
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

    if (type === 'success') {
        setTimeout(() => statusDiv.remove(), 5000);
    }
}

/**
 * Load all users from API
 */
async function loadUsers() {
    try {
        showStatus('Loading users...', 'info');

        const response = await fetch('/API/Users', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 403) {
                showStatus('Access denied. Admin privileges required.', 'error');
                return;
            }
            throw new Error(`Failed to load users: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.users) {
            allUsers = data.users;
            displayUsers(allUsers);
            showStatus(`Loaded ${allUsers.length} user(s)`, 'success');
        } else {
            showStatus('Failed to load users', 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Display users in the table
 */
function displayUsers(users) {
    usersTableBody.innerHTML = '';

    if (!users || users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');

        // ID
        const idCell = document.createElement('td');
        idCell.textContent = user.ID;
        row.appendChild(idCell);

        // Username
        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.UserName;
        row.appendChild(usernameCell);

        // Email
        const emailCell = document.createElement('td');
        emailCell.textContent = user.UserEmail || '-';
        row.appendChild(emailCell);

        // Role
        const roleCell = document.createElement('td');
        const roleBadge = document.createElement('span');
        roleBadge.className = `role-badge ${user.UserRole === 'ADMIN' ? 'admin' : 'player'}`;
        roleBadge.textContent = user.UserRole || 'PLAYER';
        roleCell.appendChild(roleBadge);
        row.appendChild(roleCell);

        // Member Since
        const memberCell = document.createElement('td');
        if (user.CreationDatetime) {
            const date = new Date(user.CreationDatetime);
            memberCell.textContent = date.toLocaleDateString();
        } else {
            memberCell.textContent = '-';
        }
        row.appendChild(memberCell);

        // Actions
        const actionsCell = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'small';
        editBtn.onclick = () => openEditModal(user);
        actionsDiv.appendChild(editBtn);

        // Role button (only for non-admin users)
        if (user.UserRole !== 'ADMIN') {
            const roleBtn = document.createElement('button');
            roleBtn.textContent = 'Make Admin';
            roleBtn.className = 'small';
            roleBtn.onclick = () => assignRole(user.ID, 'ADMIN');
            actionsDiv.appendChild(roleBtn);
        } else if (user.ID !== userID) {
            // Can demote other admins (but not yourself)
            const demoteBtn = document.createElement('button');
            demoteBtn.textContent = 'Demote';
            demoteBtn.className = 'small';
            demoteBtn.onclick = () => assignRole(user.ID, 'PLAYER');
            actionsDiv.appendChild(demoteBtn);
        }

        // Delete button (can't delete yourself)
        if (user.ID !== userID) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'small danger';
            deleteBtn.onclick = () => deleteUser(user.ID, user.UserName);
            actionsDiv.appendChild(deleteBtn);
        }

        actionsCell.appendChild(actionsDiv);
        row.appendChild(actionsCell);

        usersTableBody.appendChild(row);
    });
}

/**
 * Open create user modal
 */
function openCreateModal() {
    createUserForm.reset();
    createModal.classList.add('active');
}

/**
 * Handle create user form submission
 */
async function handleCreateUser(e) {
    e.preventDefault();

    const username = document.getElementById('createUsername').value;
    const password = document.getElementById('createPassword').value;
    const email = document.getElementById('createEmail').value || null;
    const birthdate = document.getElementById('createBirthdate').value || null;
    const gender = document.getElementById('createGender').value || null;

    try {
        const response = await fetch('/API/Register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                password,
                useremail: email,
                userbirthdate: birthdate,
                usergender: gender
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus(`User "${username}" created successfully!`, 'success');
            createModal.classList.remove('active');
            await loadUsers();
        } else {
            showStatus(data.message || 'Failed to create user', 'error');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Open edit user modal
 */
function openEditModal(user) {
    document.getElementById('editUserId').value = user.ID;
    document.getElementById('editEmail').value = user.UserEmail || '';
    document.getElementById('editBirthdate').value = user.UserBirthDate || '';
    document.getElementById('editGender').value = user.UserGender || '';

    editModal.classList.add('active');
}

/**
 * Handle edit user form submission
 */
async function handleEditUser(e) {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const email = document.getElementById('editEmail').value || null;
    const birthdate = document.getElementById('editBirthdate').value || null;
    const gender = document.getElementById('editGender').value || null;

    try {
        const response = await fetch(`/API/User/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                useremail: email,
                userbirthdate: birthdate,
                usergender: gender
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus('User updated successfully!', 'success');
            editModal.classList.remove('active');
            await loadUsers();
        } else {
            showStatus(data.message || 'Failed to update user', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Assign role to user
 */
async function assignRole(userId, role) {
    const action = role === 'ADMIN' ? 'promote' : 'demote';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }

    try {
        const response = await fetch(`/API/User/${userId}/AssignRole`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ role })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus(`User role updated to ${role}`, 'success');
            await loadUsers();
        } else {
            showStatus(data.message || 'Failed to assign role', 'error');
        }
    } catch (error) {
        console.error('Error assigning role:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Delete user
 */
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/API/User/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus(`User "${username}" deleted successfully`, 'success');
            await loadUsers();
        } else {
            showStatus(data.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
