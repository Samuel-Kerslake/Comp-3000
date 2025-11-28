// Show the appropriate page when a tab is clicked
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    const selected = document.getElementById(pageId);
    if (selected) selected.classList.add('active');
}

// Form submission on Account Info page (existing)
function submitForm() {
    const email = document.getElementById('email').value;
    const job = document.getElementById('job').value;
    const knowledge = document.getElementById('knowledge').value;
    const resultDiv = document.getElementById('formResult');
    resultDiv.innerHTML = `
    <h3>Thank you for submitting your information!</h3>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Job Title:</strong> ${job}</p>
    <p><strong>Cybersecurity Knowledge:</strong> ${knowledge}</p>
  `;
}

/* ---------------- Modal code ---------------- */
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    switchModalTab('login');
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

function switchModalTab(tab) {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.remove('active');

    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('loginTab').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('registerTab').classList.add('active');
    }
}

function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    alert('Login attempt for: ' + (email || '(no email)'));
    closeLoginModal();
}

function registerUser() {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const pass2 = document.getElementById('regPassword2').value;

    if (!email || !pass) {
        alert('Please provide email and password');
        return;
    }

    if (pass !== pass2) {
        alert('Passwords do not match');
        return;
    }

    alert('Account created for: ' + email);
    closeLoginModal();
}

// Close modal when clicking outside the box
document.addEventListener('click', function (e) {
    const modal = document.getElementById('loginModal');
    if (!modal || !modal.classList.contains('active')) return;

    // prevent close when clicking login icon
    if (e.target.id === "loginIcon" || e.target.closest('#loginIcon')) return;

    const box = modal.querySelector('.modal-box');

    // prevent close when clicking inside the modal 
    if (e.target.closest('.modal-box')) return;

    closeLoginModal();
});