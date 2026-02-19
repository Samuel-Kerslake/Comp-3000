function showPage(pdfFile) {
    const content = document.getElementById("content");

    if (!pdfFile) {
        content.innerHTML = "<p>No PDF specified.</p>";
        return;
    }

    content.innerHTML = `
        <iframe 
            src="/pdfs/${pdfFile}" 
            width="100%" 
            height="800px"
            style="border:none;">
        </iframe>
    `;
}

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
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

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
const storage = getStorage(app);

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

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login successful!");
        closeLoginModal();
    } catch (err) { alert(err.message); console.error(err); }
};

// Load pages dynamically (titles from Firestore, PDFs locally)
async function loadAllPages() {
    const sidebar = document.getElementById("sidebarLinks");
    const content = document.getElementById("content");
    if (!sidebar || !content) return;

    sidebar.innerHTML = "";
    content.innerHTML = "";

    try {
        const snapshot = await getDocs(collection(db, "pages"));

        if (snapshot.empty) {
            content.innerHTML = "<p>No pages found.</p>";
            return;
        }

        let firstPage = null;

        snapshot.forEach(doc => {
            const data = doc.data();

            const link = document.createElement("li");
            link.innerHTML = `<a href="#">${data.title}</a>`;
            link.onclick = () => showPage(data.pdf);

            sidebar.appendChild(link);

            if (!firstPage) firstPage = data.pdf;
        });

        if (firstPage) showPage(firstPage);

    } catch (err) {
        console.error("Firestore error:", err);
        content.innerHTML = "<p>Error loading pages.</p>";
    }
}

// Initialize after DOM ready
window.addEventListener('DOMContentLoaded', loadAllPages);