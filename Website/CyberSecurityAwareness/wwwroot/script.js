// Page Navigation
window.showPage = function (pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const selected = document.getElementById(pageId);
    if (selected) selected.classList.add('active');
};

// Account Form
window.submitForm = function () {
    const email = document.getElementById('email').value;
    const job = document.getElementById('job').value;
    const knowledge = document.getElementById('knowledge').value;

    document.getElementById('formResult').innerHTML = `
        <h3>Thank you for submitting your info!</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Job:</strong> ${job}</p>
        <p><strong>Knowledge:</strong> ${knowledge}</p>
    `;
};

// Modal Controls
window.openLoginModal = function () {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    switchModalTab('login');
};

window.closeLoginModal = function () {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
};

window.switchModalTab = function (tab) {
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
};

// Firebase Setup 
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC1KivyeCMDdOcnba-JGVN93A53luH0NIU",
    authDomain: "comp-3000-cyber-security-aware.firebaseapp.com",
    projectId: "comp-3000-cyber-security-aware",
    storageBucket: "comp-3000-cyber-security-aware.firebasestorage.app",
    messagingSenderId: "523744636201",
    appId: "1:523744636201:web:eca59074e537f60f221b38"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Functions
window.registerUser = async function () {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    if (password !== password2) { alert("Passwords do not match"); return; }
    try { await createUserWithEmailAndPassword(auth, email, password); alert("User registered!"); closeLoginModal(); }
    catch (err) { alert(err.message); console.error(err); }
}

window.loginUser = async function () {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try { await signInWithEmailAndPassword(auth, email, password); alert("Login successful!"); closeLoginModal(); }
    catch (err) { alert(err.message); console.error(err); }
}

//  Load Firestore Pages 
window.loadPageContent = async function (pageId) {
    try {
        const pageRef = doc(db, "pages", pageId);
        const pageSnap = await getDoc(pageRef);
        if (pageSnap.exists()) {
            const data = pageSnap.data();
            document.getElementById(pageId).innerHTML = `<h1>${data.title}</h1><p>${data.content}</p>`;
        }
    } catch (err) { console.error(err); }
}

// Load pages after DOM ready
window.addEventListener('DOMContentLoaded', () => {
    ['home', 'phishing', 'dataProtection'].forEach(id => loadPageContent(id));
});