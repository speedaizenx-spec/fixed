// FindIt School Lost & Found System - Professional Version

// ===== APPLICATION STATE =====
const state = {
    currentUser: null,
    users: [],
    items: [],
    currentPage: 'home',
    notifications: [],
    search: {
        lost: '',
        found: ''
    }
};

// ===== DOM ELEMENTS =====
const elements = {
    // Navigation
    navMenu: document.getElementById('navMenu'),
    mobileToggle: document.getElementById('mobileToggle'),
    navLinks: document.querySelectorAll('.nav-link'),
    authBtn: document.getElementById('authBtn'),
    userProfile: document.getElementById('userProfile'),
    profileTrigger: document.getElementById('profileTrigger'),
    profileMenu: document.getElementById('profileMenu'),
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),
    viewProfileBtn: document.getElementById('viewProfileBtn'),
    myReportsBtn: document.getElementById('myReportsBtn'),
    myInboxBtn: document.getElementById('myInboxBtn'),
    
    // Pages
    pages: document.querySelectorAll('.page'),
    
    // Auth Modals
    modals: {
        signin: document.getElementById('signinModal'),
        signup: document.getElementById('signupModal'),
        forgotPassword: document.getElementById('forgotPasswordModal'),
        profile: document.getElementById('profileModal')
    },
    
    // Forms
    forms: {
        signin: document.getElementById('signinForm'),
        signup: document.getElementById('signupForm'),
        forgotPassword: document.getElementById('forgotPasswordForm'),
        itemReport: document.getElementById('itemReportForm'),
        contact: document.getElementById('contactForm')
    },
    
    // Report Form
    reporterGrade: document.getElementById('reporterGrade'),
    itemImage: document.getElementById('itemImage'),
    selectImageBtn: document.getElementById('selectImageBtn'),
    imagePreview: document.getElementById('imagePreview'),
    previewImage: document.getElementById('previewImage'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    uploadBox: document.getElementById('uploadBox'),
    submitReportBtn: document.getElementById('submitReportBtn'),
    
    // Search
    searchLostInput: document.getElementById('searchLostInput'),
    searchFoundInput: document.getElementById('searchFoundInput'),
    clearLostSearch: document.getElementById('clearLostSearch'),
    clearFoundSearch: document.getElementById('clearFoundSearch'),
    
    // Items Containers
    lostItemsGrid: document.getElementById('lostItemsGrid'),
    foundItemsGrid: document.getElementById('foundItemsGrid'),
    noLostItems: document.getElementById('noLostItems'),
    noFoundItems: document.getElementById('noFoundItems'),
    
    // Profile
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileGrade: document.getElementById('profileGrade'),
    reportedCount: document.getElementById('reportedCount'),
    recoveredCount: document.getElementById('recoveredCount')
};

// ===== INITIALIZATION =====
function init() {
    loadData();
    setupEventListeners();
    checkAuth();
    showPage('home');
    
    setTimeout(() => {
        document.querySelector('.intro-animation').style.display = 'none';
    }, 2000);
    
    console.log('FindIt System Initialized');
}

// ===== DATA MANAGEMENT =====
function loadData() {
    try {
        // Load users
        const savedUsers = localStorage.getItem('findit_users');
        if (savedUsers) {
            state.users = JSON.parse(savedUsers);
        } else {
            // Add default admin user
            state.users = [{
                id: 1,
                name: 'Admin',
                email: 'howardemia37@gmail.com',
                password: 'admin123',
                grade: 'Grade 12',
                createdAt: new Date().toISOString(),
                reportedItems: [],
                recoveredItems: []
            }];
            saveUsers();
        }
        
        // Load items
        const savedItems = localStorage.getItem('findit_items');
        state.items = savedItems ? JSON.parse(savedItems) : [];
        
        // Load current user
        const savedUser = localStorage.getItem('findit_currentUser');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            const user = state.users.find(u => u.email === userData.email);
            if (user && user.password === userData.password) {
                state.currentUser = user;
            } else {
                localStorage.removeItem('findit_currentUser');
            }
        }
        
        // Cleanup old found items (20 days)
        cleanupOldItems();
    } catch (error) {
        console.error('Error loading data:', error);
        resetData();
    }
}

function saveData() {
    localStorage.setItem('findit_items', JSON.stringify(state.items));
    saveUsers();
    if (state.currentUser) {
        localStorage.setItem('findit_currentUser', JSON.stringify({
            email: state.currentUser.email,
            password: state.currentUser.password
        }));
    }
}

function saveUsers() {
    localStorage.setItem('findit_users', JSON.stringify(state.users));
}

function resetData() {
    localStorage.clear();
    state.users = [];
    state.items = [];
    state.currentUser = null;
    loadData();
}

// ===== CLEANUP OLD ITEMS =====
function cleanupOldItems() {
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    
    state.items = state.items.filter(item => {
        if (item.status === 'found') {
            const itemDate = new Date(item.createdAt);
            return itemDate > twentyDaysAgo;
        }
        return true;
    });
    
    saveData();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Mobile Toggle
    elements.mobileToggle.addEventListener('click', () => {
        elements.navMenu.classList.toggle('show');
    });
    
    // Navigation Links
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
            elements.navMenu.classList.remove('show');
        });
    });
    
    // Footer Links
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Hero Section Buttons
    document.querySelectorAll('.hero-report-btn, .hero-found-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const page = btn.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Auth Button
    elements.authBtn.addEventListener('click', () => showModal('signin'));
    
    // Profile Menu
    elements.profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.profileMenu.classList.toggle('show');
    });
    
    // Close profile menu when clicking outside
    document.addEventListener('click', () => {
        elements.profileMenu.classList.remove('show');
    });
    
    // Profile Actions
    elements.viewProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('profile');
        updateProfile();
        elements.profileMenu.classList.remove('show');
    });
    
    elements.myReportsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('lost');
        filterMyItems();
        elements.profileMenu.classList.remove('show');
    });
    
    elements.myInboxBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Inbox feature coming soon!', 'info');
        elements.profileMenu.classList.remove('show');
    });
    
    elements.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        elements.profileMenu.classList.remove('show');
    });
    
    // Modal Close Buttons
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    
    // Auth Form Switches
    document.querySelectorAll('.switch-to-signup').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            showModal('signup');
        });
    });
    
    document.querySelectorAll('.switch-to-signin').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            showModal('signin');
        });
    });
    
    document.querySelectorAll('.forgot-password-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            showModal('forgotPassword');
        });
    });
    
    // Form Submissions
    elements.forms.signin.addEventListener('submit', handleSignIn);
    elements.forms.signup.addEventListener('submit', handleSignUp);
    elements.forms.forgotPassword.addEventListener('submit', handleForgotPassword);
    elements.forms.itemReport.addEventListener('submit', handleItemReport);
    elements.forms.contact.addEventListener('submit', handleContact);
    
    // Toggle Password Visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            const input = document.getElementById(target);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // Image Upload
    elements.selectImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.itemImage.click();
    });
    
    elements.itemImage.addEventListener('change', handleImageUpload);
    elements.removeImageBtn.addEventListener('click', removeImage);
    
    elements.uploadBox.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn')) {
            elements.itemImage.click();
        }
    });
    
    // Search Functionality
    elements.searchLostInput.addEventListener('input', debounce(() => {
        state.search.lost = elements.searchLostInput.value;
        displayItems('lost');
    }, 300));
    
    elements.searchFoundInput.addEventListener('input', debounce(() => {
        state.search.found = elements.searchFoundInput.value;
        displayItems('found');
    }, 300));
    
    elements.clearLostSearch.addEventListener('click', () => {
        elements.searchLostInput.value = '';
        state.search.lost = '';
        displayItems('lost');
    });
    
    elements.clearFoundSearch.addEventListener('click', () => {
        elements.searchFoundInput.value = '';
        state.search.found = '';
        displayItems('found');
    });
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('itemDate').value = today;
    
    // Date input fix for 6-digit year
    document.getElementById('itemDate').addEventListener('input', function(e) {
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
    });
}

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
    // Update active page
    elements.pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });
    
    // Update active nav link
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
    
    state.currentPage = pageId;
    
    // Page-specific actions
    switch(pageId) {
        case 'lost':
            displayItems('lost');
            break;
        case 'found':
            displayItems('found');
            break;
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== AUTHENTICATION =====
function checkAuth() {
    if (state.currentUser) {
        elements.authBtn.style.display = 'none';
        elements.userProfile.style.display = 'block';
        elements.userName.textContent = state.currentUser.name.split(' ')[0];
    } else {
        elements.authBtn.style.display = 'flex';
        elements.userProfile.style.display = 'none';
    }
}

function handleSignIn(e) {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    const user = state.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        state.currentUser = user;
        saveData();
        checkAuth();
        closeAllModals();
        showNotification(`Welcome back, ${user.name}!`, 'success');
        elements.forms.signin.reset();
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function handleSignUp(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const grade = document.getElementById('signupGrade').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (!name || !email || !grade || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Check if user exists
    if (state.users.some(u => u.email === email)) {
        showNotification('Email already registered', 'error');
        return;
    }
    
    // Create user
    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        grade: `Grade ${grade}`,
        createdAt: new Date().toISOString(),
        reportedItems: [],
        recoveredItems: []
    };
    
    state.users.push(newUser);
    state.currentUser = newUser;
    saveData();
    checkAuth();
    
    closeAllModals();
    showNotification('Account created successfully!', 'success');
    elements.forms.signup.reset();
}

function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    const user = state.users.find(u => u.email === email);
    
    if (!user) {
        showNotification('Email not found', 'error');
        return;
    }
    
    // Show success message (in real app, this would send email)
    closeAllModals();
    showModal('signin');
    showNotification(`Password reset instructions sent to ${email}`, 'success');
    elements.forms.forgotPassword.reset();
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('findit_currentUser');
    checkAuth();
    showNotification('Signed out successfully', 'success');
    showPage('home');
}

// ===== ITEM MANAGEMENT =====
function handleItemReport(e) {
    e.preventDefault();
    
    if (!state.currentUser) {
        showNotification('Please sign in to submit reports', 'warning');
        showModal('signin');
        return;
    }
    
    // Get form values
    const itemData = {
        id: Date.now(),
        name: document.getElementById('itemName').value.trim(),
        category: document.getElementById('itemCategory').value,
        description: document.getElementById('itemDescription').value.trim(),
        date: document.getElementById('itemDate').value,
        location: document.getElementById('itemLocation').value.trim(),
        status: document.querySelector('input[name="itemStatus"]:checked').value,
        grade: document.getElementById('reporterGrade').value,
        reporterId: state.currentUser.id,
        reporterName: state.currentUser.name,
        reporterEmail: state.currentUser.email,
        image: elements.previewImage.src || '',
        createdAt: new Date().toISOString(),
        isFound: false,
        comments: [],
        likes: 0
    };
    
    // Validation
    if (!itemData.name || !itemData.category || !itemData.description || 
        !itemData.date || !itemData.location || !itemData.grade) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Add item
    state.items.unshift(itemData);
    state.currentUser.reportedItems.push(itemData.id);
    
    saveData();
    showNotification(`Item reported as ${itemData.status}!`, 'success');
    
    // Reset form
    elements.forms.itemReport.reset();
    removeImage();
    document.getElementById('itemDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('reporterGrade').value = '12';
    
    // Redirect to items page
    setTimeout(() => {
        showPage(itemData.status);
    }, 1500);
}

function displayItems(type) {
    const container = type === 'lost' ? elements.lostItemsGrid : elements.foundItemsGrid;
    const noItems = type === 'lost' ? elements.noLostItems : elements.noFoundItems;
    const searchQuery = state.search[type].toLowerCase();
    
    // Filter items
    let items = state.items.filter(item => item.status === type);
    
    // Apply search filter
    if (searchQuery) {
        items = items.filter(item => 
            item.name.toLowerCase().includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery) ||
            item.location.toLowerCase().includes(searchQuery) ||
            item.category.toLowerCase().includes(searchQuery)
        );
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Display items
    if (items.length === 0) {
        noItems.style.display = 'block';
    } else {
        noItems.style.display = 'none';
        items.forEach(item => {
            const itemCard = createItemCard(item);
            container.appendChild(itemCard);
        });
    }
}

function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = item.id;
    
    const badgeClass = item.status === 'lost' ? 'badge-lost' : 'badge-found';
    const badgeText = item.status === 'lost' ? 'LOST' : 'FOUND';
    
    // Show image only if exists
    let imageHtml = '';
    if (item.image) {
        imageHtml = `<img src="${item.image}" class="item-image" alt="${item.name}">`;
    } else {
        // No image - show placeholder
        imageHtml = '<div class="item-image empty">No Image</div>';
    }
    
    card.innerHTML = `
        ${imageHtml}
        <div class="item-content">
            <div class="item-header">
                <h3 class="item-title">${item.name}</h3>
                <span class="item-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="item-meta">
                <span><i class="far fa-calendar"></i> ${formatDate(item.date)}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
                <span><i class="fas fa-tag"></i> ${item.category}</span>
            </div>
            <p class="item-description">${item.description}</p>
            <div class="item-footer">
                <div class="reporter-info">
                    <div class="reporter-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="reporter-name">${item.reporterName} • ${item.grade}</span>
                </div>
                <button class="btn btn-outline btn-view" data-id="${item.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
    `;
    
    // Add event listener for view button
    card.querySelector('.btn-view').addEventListener('click', (e) => {
        e.stopPropagation();
        showItemDetail(item.id);
    });
    
    // Make card clickable
    card.addEventListener('click', () => {
        showItemDetail(item.id);
    });
    
    return card;
}

function showItemDetail(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Create modal content
    const modalContent = `
        <div class="modal" id="itemDetailModal">
            <div class="modal-content" style="max-width: 700px; padding: 2rem;">
                <button class="close-modal-btn">&times;</button>
                <h2 style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem;">
                    <i class="fas ${item.status === 'lost' ? 'fa-search' : 'fa-hand-holding-heart'}"></i>
                    ${item.name}
                </h2>
                
                ${item.image ? 
                    `<img src="${item.image}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1.5rem;">` :
                    `<div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); height: 200px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius); margin-bottom: 1.5rem; color: var(--gray);">
                        <i class="fas fa-image" style="font-size: 3rem; margin-right: 1rem;"></i>
                        <span>No image uploaded</span>
                    </div>`
                }
                
                <div style="display: grid; gap: 1.5rem;">
                    <div>
                        <h3 style="margin-bottom: 0.5rem; color: var(--primary);">Description</h3>
                        <p style="color: var(--dark); line-height: 1.6;">${item.description}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <h4 style="margin-bottom: 0.3rem; color: var(--gray); font-size: 0.9rem;">Category</h4>
                            <p style="color: var(--dark);">${item.category}</p>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 0.3rem; color: var(--gray); font-size: 0.9rem;">Date</h4>
                            <p style="color: var(--dark);">${formatDate(item.date)}</p>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 0.3rem; color: var(--gray); font-size: 0.9rem;">Location</h4>
                            <p style="color: var(--dark);">${item.location}</p>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 0.3rem; color: var(--gray); font-size: 0.9rem;">Status</h4>
                            <p style="color: var(--dark); font-weight: 500; text-transform: uppercase;">${item.status}</p>
                        </div>
                    </div>
                    
                    <div style="background: var(--gray-light); padding: 1rem; border-radius: var(--radius);">
                        <h4 style="margin-bottom: 0.5rem; color: var(--dark);">Reporter Information</h4>
                        <p style="color: var(--dark);"><strong>Name:</strong> ${item.reporterName}</p>
                        <p style="color: var(--dark);"><strong>Grade:</strong> ${item.grade}</p>
                        <p style="color: var(--dark);"><strong>Email:</strong> ${item.reporterEmail}</p>
                    </div>
                    
                    <!-- Comments Section -->
                    <div style="border-top: 2px solid var(--gray-light); padding-top: 1.5rem;">
                        <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; color: var(--primary);">
                            <i class="fas fa-comments"></i> Comments (${item.comments ? item.comments.length : 0})
                        </h3>
                        
                        <div id="comments-${item.id}" style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem;">
                            ${item.comments && item.comments.length > 0 ? 
                                item.comments.map(comment => `
                                    <div style="margin-bottom: 1rem; padding: 0.75rem; background: white; border-radius: var(--radius); border: 1px solid var(--gray-light);">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <strong style="color: var(--dark);">${comment.userName}</strong>
                                                <span style="color: var(--gray); font-size: 0.8rem;">${timeAgo(comment.createdAt)}</span>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <button onclick="likeComment(${item.id}, ${comment.id})" style="background: none; border: none; color: ${comment.liked ? 'var(--primary)' : 'var(--gray)'}; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                                                    <i class="fas fa-thumbs-up"></i>
                                                    <span>${comment.likes || 0}</span>
                                                </button>
                                                <button onclick="showReplyForm(${item.id}, ${comment.id})" style="background: none; border: none; color: var(--gray); cursor: pointer;">
                                                    <i class="fas fa-reply"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <p style="color: var(--dark); margin: 0;">${comment.text}</p>
                                        
                                        <!-- Replies -->
                                        ${comment.replies && comment.replies.length > 0 ? `
                                            <div style="margin-top: 0.75rem; padding-left: 1rem; border-left: 2px solid var(--gray-light);">
                                                ${comment.replies.map(reply => `
                                                    <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.02); border-radius: var(--radius);">
                                                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                                            <strong style="color: var(--dark); font-size: 0.9rem;">${reply.userName}</strong>
                                                            <span style="color: var(--gray); font-size: 0.7rem;">${timeAgo(reply.createdAt)}</span>
                                                        </div>
                                                        <p style="color: var(--dark); margin: 0; font-size: 0.9rem;">${reply.text}</p>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                        
                                        <!-- Reply Form (hidden by default) -->
                                        <div id="reply-form-${item.id}-${comment.id}" style="display: none; margin-top: 0.5rem;">
                                            <textarea id="reply-text-${item.id}-${comment.id}" placeholder="Write a reply..." style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-light); border-radius: var(--radius); margin-bottom: 0.5rem; resize: vertical;"></textarea>
                                            <div style="display: flex; gap: 0.5rem;">
                                                <button onclick="submitReply(${item.id}, ${comment.id})" class="btn btn-primary" style="padding: 0.5rem 1rem;">
                                                    Reply
                                                </button>
                                                <button onclick="hideReplyForm(${item.id}, ${comment.id})" class="btn btn-outline" style="padding: 0.5rem 1rem;">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('') : 
                                '<p style="color: var(--gray); text-align: center;">No comments yet. Be the first to comment!</p>'
                            }
                        </div>
                        
                        ${state.currentUser ? `
                            <div>
                                <textarea id="comment-input-${item.id}" placeholder="Add a comment..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-light); border-radius: var(--radius); margin-bottom: 0.5rem; resize: vertical;"></textarea>
                                <button onclick="addComment(${item.id})" class="btn btn-primary">
                                    <i class="fas fa-paper-plane"></i> Post Comment
                                </button>
                            </div>
                        ` : `
                            <div style="text-align: center; padding: 1rem; background: var(--gray-light); border-radius: var(--radius);">
                                <p style="color: var(--gray); margin: 0;">Please <a href="#" onclick="showModal(\'signin\'); return false;" style="color: var(--primary);">sign in</a> to add comments</p>
                            </div>
                        `}
                    </div>
                    
                    ${item.status === 'lost' ? `
                        <div style="background: linear-gradient(135deg, var(--success) 0%, #4cc9f0 100%); color: white; padding: 1rem; border-radius: var(--radius);">
                            <h4 style="margin-bottom: 0.5rem;"><i class="fas fa-info-circle"></i> How to Claim</h4>
                            <p>Visit the school office (Mon-Fri, 8:00 AM - 5:00 PM) with your student ID.</p>
                            <p style="margin-top: 0.5rem;"><strong>Item ID:</strong> ${item.id}</p>
                        </div>
                    ` : ''}
                    
                    ${state.currentUser && (state.currentUser.id === item.reporterId || state.currentUser.email === 'howardemia37@gmail.com') ? `
                        <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                            <button class="btn btn-success" onclick="markItemAsFound(${item.id})">
                                <i class="fas fa-check"></i> Mark as Found
                            </button>
                            ${state.currentUser.email === 'howardemia37@gmail.com' ? `
                                <button class="btn btn-warning" onclick="adminLikeItem(${item.id})">
                                    <i class="fas fa-star"></i> Admin Like
                                </button>
                            ` : ''}
                            <button class="btn btn-outline" onclick="deleteItem(${item.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Create and show modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalContent;
    document.body.appendChild(modalContainer);
    
    const modal = modalContainer.querySelector('#itemDetailModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Close button event
    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => modalContainer.remove(), 300);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            setTimeout(() => modalContainer.remove(), 300);
        }
    });
}

function markItemAsFound(itemId) {
    const itemIndex = state.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    state.items[itemIndex].isFound = true;
    state.items[itemIndex].foundAt = new Date().toISOString();
    state.items[itemIndex].status = 'found';
    
    if (state.currentUser && !state.currentUser.recoveredItems.includes(itemId)) {
        state.currentUser.recoveredItems.push(itemId);
    }
    
    saveData();
    
    // Close modal
    const modal = document.querySelector('#itemDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            const modalContainer = modal.parentElement;
            if (modalContainer) modalContainer.remove();
        }, 300);
    }
    
    showNotification('Item marked as found!', 'success');
    displayItems('lost');
    displayItems('found');
    updateProfile();
}

function adminLikeItem(itemId) {
    if (!state.currentUser || state.currentUser.email !== 'howardemia37@gmail.com') {
        showNotification('Only admin can use this feature', 'error');
        return;
    }
    
    const itemIndex = state.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    // Ask for like count
    const likeCount = prompt('Enter number of admin likes to add:');
    if (!likeCount || isNaN(likeCount)) return;
    
    const count = parseInt(likeCount);
    if (count <= 0) return;
    
    if (!state.items[itemIndex].adminLikes) {
        state.items[itemIndex].adminLikes = 0;
    }
    
    state.items[itemIndex].adminLikes += count;
    saveData();
    
    showNotification(`Added ${count} admin likes!`, 'success');
    
    // Refresh the modal
    const modal = document.querySelector('#itemDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            const modalContainer = modal.parentElement;
            if (modalContainer) modalContainer.remove();
            showItemDetail(itemId);
        }, 300);
    }
}

function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const itemIndex = state.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const item = state.items[itemIndex];
    
    // Check permissions
    if (state.currentUser.email !== 'howardemia37@gmail.com' && state.currentUser.id !== item.reporterId) {
        showNotification('You can only delete your own items', 'error');
        return;
    }
    
    state.items.splice(itemIndex, 1);
    
    // Remove from user's reported items
    if (state.currentUser) {
        state.currentUser.reportedItems = state.currentUser.reportedItems.filter(id => id !== itemId);
    }
    
    saveData();
    
    // Close modal
    const modal = document.querySelector('#itemDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            const modalContainer = modal.parentElement;
            if (modalContainer) modalContainer.remove();
        }, 300);
    }
    
    showNotification('Item deleted successfully', 'success');
    displayItems(state.currentPage);
    updateProfile();
}

// ===== COMMENTS SYSTEM =====
function addComment(itemId) {
    if (!state.currentUser) {
        showNotification('Please sign in to add comments', 'warning');
        showModal('signin');
        return;
    }
    
    const commentInput = document.getElementById(`comment-input-${itemId}`);
    const text = commentInput.value.trim();
    
    if (!text) {
        showNotification('Comment cannot be empty', 'error');
        return;
    }
    
    const itemIndex = state.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    if (!state.items[itemIndex].comments) {
        state.items[itemIndex].comments = [];
    }
    
    const newComment = {
        id: Date.now(),
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        text: text,
        likes: 0,
        liked: false,
        replies: [],
        createdAt: new Date().toISOString()
    };
    
    state.items[itemIndex].comments.unshift(newComment);
    saveData();
    
    // Clear input
    commentInput.value = '';
    
    // Refresh comments display
    const modal = document.querySelector('#itemDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            const modalContainer = modal.parentElement;
            if (modalContainer) modalContainer.remove();
            showItemDetail(itemId);
        }, 300);
    }
    
    showNotification('Comment added successfully', 'success');
}

function likeComment(itemId, commentId) {
    if (!state.currentUser) {
        showNotification('Please sign in to like comments', 'warning');
        showModal('signin');
        return;
    }
    
    const itemIndex = state.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const commentIndex = state.items[itemIndex].comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    const comment = state.items[itemIndex].comments[commentIndex];
    
    if (comment.liked) {
        comment.likes--;
        comment.liked = false;
    } else {
        comment.likes++;
        comment.liked = true;
    }
    
    saveData();
    
    // Refresh the modal
    const modal = document.querySelector('#itemDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            const modalContainer = modal.parentElement;
            if (modalContainer) modalContainer.remove();
            showItemDetail(itemId);
        }, 300);
    }
}

function showReplyForm(itemId, commentId) {
    const replyForm = document.getElementById(`reply-form-${itemId}-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'block';
    }
}

function hideReplyForm(itemId, commentId) {
    const replyForm = document.getElementById(`reply-form-${itemId}-${commentId}`);
    const replyText = document.getElementById(`reply-text-${itemId}-${commentId}`);
    if (replyForm) {
        replyForm.style.display = 'none';
        replyText.value = '';
    }
}

function submitReply(itemId, commentId) {
    if (!state.currentUser) {
        showNotification('Please sign in to reply', 'warning');
        showModal('signin');
        return;
    }
    
    const replyText = document.getElementById(`reply-text-${itemId}-${commentId}`);
    const text = replyText.value.trim();
    
    if (!text) {
        showNotification('Reply cannot be empty', 'error');
        return;
    }
    
    const itemIndex = state.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    const commentIndex = state.items[itemIndex].comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    if (!state.items[itemIndex].comments[commentIndex].replies) {
        state.items[itemIndex].comments[commentIndex].replies = [];
    }
    
    const reply = {
        id: Date.now(),
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        text: text,
        createdAt: new Date().toISOString()
    };
    
    state.items[itemIndex].comments[commentIndex].replies.push(reply);
    saveData();
    
    // Clear input and hide form
    replyText.value = '';
    hideReplyForm(itemId, commentId);
    
    // Refresh the modal
    const modal = document.querySelector('#itemDetailModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            const modalContainer = modal.parentElement;
            if (modalContainer) modalContainer.remove();
            showItemDetail(itemId);
        }, 300);
    }
    
    showNotification('Reply added successfully', 'success');
}

function filterMyItems() {
    if (!state.currentUser) return;
    
    // Filter to show only user's items
    const myItems = state.items.filter(item => item.reporterId === state.currentUser.id);
    
    if (state.currentPage === 'lost') {
        elements.searchLostInput.value = state.currentUser.name;
        state.search.lost = state.currentUser.name;
    } else {
        elements.searchFoundInput.value = state.currentUser.name;
        state.search.found = state.currentUser.name;
    }
    
    displayItems(state.currentPage);
}

// ===== CONTACT FORM =====
function handleContact(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const type = document.getElementById('contactType').value;
    const message = document.getElementById('contactMessage').value.trim();
    
    // Validation
    if (!name || !email || !type || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Create contact message
    const contactData = {
        id: Date.now(),
        name,
        email,
        type,
        message,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // Save contact message
    const contacts = JSON.parse(localStorage.getItem('findit_contacts') || '[]');
    contacts.unshift(contactData);
    localStorage.setItem('findit_contacts', JSON.stringify(contacts));
    
    // Show success
    showNotification('Message sent successfully! We will respond within 24 hours.', 'success');
    
    // Reset form
    elements.forms.contact.reset();
}

// ===== PROFILE MANAGEMENT =====
function updateProfile() {
    if (!state.currentUser) return;
    
    elements.profileName.textContent = state.currentUser.name;
    elements.profileEmail.textContent = state.currentUser.email;
    elements.profileGrade.textContent = state.currentUser.grade;
    
    // Calculate stats
    const reportedItems = state.items.filter(item => item.reporterId === state.currentUser.id);
    const recoveredItems = reportedItems.filter(item => item.isFound);
    
    elements.reportedCount.textContent = reportedItems.length;
    elements.recoveredCount.textContent = recoveredItems.length;
}

// ===== MODAL MANAGEMENT =====
function showModal(modalId) {
    closeAllModals();
    elements.modals[modalId].classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    Object.values(elements.modals).forEach(modal => {
        if (modal) modal.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
    
    // Also close any dynamically created modals
    const dynamicModals = document.querySelectorAll('#itemDetailModal');
    dynamicModals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentElement) modal.parentElement.remove();
        }, 300);
    });
}

// ===== IMAGE UPLOAD =====
function handleImageUpload() {
    const file = this.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be less than 5MB', 'error');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImage.src = e.target.result;
        elements.imagePreview.style.display = 'block';
        elements.uploadBox.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    elements.previewImage.src = '';
    elements.imagePreview.style.display = 'none';
    elements.uploadBox.style.display = 'flex';
    elements.itemImage.value = '';
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const id = Date.now();
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.id = `notification-${id}`;
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <div class="notification-content">
            <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="removeNotification('notification-${id}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeNotification(`notification-${id}`);
    }, 5000);
}

function removeNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return formatDate(dateString);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== GLOBAL FUNCTIONS =====
window.markItemAsFound = markItemAsFound;
window.deleteItem = deleteItem;
window.removeNotification = removeNotification;
window.addComment = addComment;
window.likeComment = likeComment;
window.showReplyForm = showReplyForm;
window.hideReplyForm = hideReplyForm;
window.submitReply = submitReply;
window.adminLikeItem = adminLikeItem;

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', init);