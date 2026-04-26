import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

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

function renderDashboard(userData) {
    const content = document.getElementById("content");
    const completed = userData?.completedPages?.length || 0;
    const progress = Math.min(completed * 10, 100);

    content.innerHTML = `
        <div class="dashboard">
            <h1>Dashboard</h1>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>Current Level</h3>
                    <p id="dashLevel">${userData?.difficulty || "Guest"}</p>
                </div>

                <div class="dashboard-card">
                    <h3>Progress</h3>
                    <div class="progress-bar">
                        <div id="progressFill" class="progress-fill" style="width:${progress}%"></div>
                    </div>
                    <p id="progressText">${progress}% complete</p>
                </div>

                <div class="dashboard-card">
                    <h3>Lessons Completed</h3>
                    <p id="lessonsCompleted">${completed}</p>
                </div>

                <div class="dashboard-card">
                    <h3>Accessibility</h3>
                    <p id="accessText">${userData?.highContrast ? "High contrast" : "Normal contrast"}</p>
                </div>
            </div>
        </div>
    `;
}

async function ensureUserDoc(user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            email: user.email || "",
            difficulty: "beginner",
            completedPages: [],
            fontSize: 16,
            highContrast: false
        });
    }

    return (await getDoc(ref)).data();
}

async function showPage(pageTitle, pdfFile) {
    const content = document.getElementById("content");

    if (pageTitle === "Dashboard") {
        const user = auth.currentUser;
        if (!user) {
            renderDashboard(null);
            return;
        }

        const userData = await ensureUserDoc(user);
        renderDashboard(userData);
        return;
    }

    console.log("showPage called with:", pdfFile);

    if (!pdfFile) {
        content.innerHTML = "<p>No PDF specified.</p>";
        return;
    }

    const pdfPath = pdfFile.startsWith("/pdfs/")
        ? pdfFile
        : `/pdfs/${pdfFile}`;

    console.log("PDF path:", pdfPath);

    content.innerHTML = `<p>Loading: ${pdfFile}</p>`;

    try {
        const response = await fetch(pdfPath);
        console.log("Fetch status:", response.status, response.ok);

        if (!response.ok) {
            content.innerHTML = `<p>File not found: ${pdfPath}</p>`;
            return;
        }

        const pdf = await pdfjsLib.getDocument(pdfPath).promise;
        console.log("PDF loaded, pages:", pdf.numPages);

        let html = `<div class="pdf-document">`;

        for (let i = 1; i <= pdf.numPages; i++) {
            console.log("Reading page:", i);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const items = textContent.items
                .map(item => ({
                    text: item.str.trim(),
                    x: item.transform[4],
                    y: item.transform[5],
                    fontSize: Math.abs(item.transform[0])
                }))
                .filter(item => item.text);

            items.sort((a, b) => b.y - a.y || a.x - b.x);

            const lines = [];
            let currentLine = null;
            const yTolerance = 3;

            for (const item of items) {
                if (!currentLine || Math.abs(currentLine.y - item.y) > yTolerance) {
                    currentLine = { y: item.y, items: [item] };
                    lines.push(currentLine);
                } else {
                    currentLine.items.push(item);
                }
            }

            const blocks = [];
            let paragraph = [];
            let bulletList = [];

            for (const line of lines) {
                const lineText = line.items
                    .sort((a, b) => a.x - b.x)
                    .map(i => i.text)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim();

                if (!lineText) continue;

                const isBullet = /^•\s*/.test(lineText);
                const isHeading = line.items.some(i => i.fontSize >= 18) ||
                    /^[A-Z][A-Za-z0-9\s:&-]{3,}$/.test(lineText);

                if (isHeading) {
                    if (paragraph.length) {
                        blocks.push({ type: "paragraph", text: paragraph.join(" ") });
                        paragraph = [];
                    }
                    if (bulletList.length) {
                        blocks.push({ type: "bullets", items: bulletList });
                        bulletList = [];
                    }
                    blocks.push({ type: "heading", text: lineText });
                } else if (isBullet) {
                    if (paragraph.length) {
                        blocks.push({ type: "paragraph", text: paragraph.join(" ") });
                        paragraph = [];
                    }
                    bulletList.push(lineText.replace(/^•\s*/, ""));
                } else {
                    if (bulletList.length) {
                        blocks.push({ type: "bullets", items: bulletList });
                        bulletList = [];
                    }
                    paragraph.push(lineText);
                }
            }

            if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
            if (bulletList.length) blocks.push({ type: "bullets", items: bulletList });

            blocks.forEach(block => {
                if (block.type === "heading") {
                    html += `<h2 class="pdf-heading">${block.text}</h2>`;
                } else if (block.type === "bullets") {
                    html += `<ul class="pdf-list">`;
                    block.items.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                } else {
                    html += `<p>${block.text}</p>`;
                }
            });
        }

        html += `</div>`;
        content.innerHTML = html || "<p>No text found in PDF.</p>";

    } catch (err) {
        console.error("PDF load failed:", err);
        content.innerHTML = "<p>Failed to load PDF text.</p>";
    }
}

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

window.registerUser = async function () {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;

    if (password !== password2) {
        alert("Passwords do not match");
        return;
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
            email: email,
            difficulty: document.getElementById("registerKnowledge").value || "beginner",
            completedPages: [],
            fontSize: 16,
            highContrast: false
        });
        alert("User registered!");
        closeLoginModal();
    } catch (err) {
        alert(err.message);
        console.error(err);
    }
};

window.loginUser = async function () {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login successful!");
        closeLoginModal();
    } catch (err) {
        alert(err.message);
        console.error(err);
    }
};

async function loadAllPages() {
    const sidebar = document.getElementById("sidebarLinks");
    const content = document.getElementById("content");
    if (!sidebar || !content) return;

    sidebar.innerHTML = "";
    content.innerHTML = "";

    try {
        const snapshot = await getDocs(
            query(collection(db, "pages"), orderBy("Order", "asc"))
        );

        if (snapshot.empty) {
            content.innerHTML = "<p>No pages found.</p>";
            return;
        }

        let firstPage = null;

        snapshot.forEach(doc => {
            const data = doc.data();

            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = "#";
            a.textContent = data.title;

            a.addEventListener("click", (e) => {
                e.preventDefault();
                showPage(data.title, data.pdf);
            });

            li.appendChild(a);
            sidebar.appendChild(li);

            if (!firstPage) firstPage = data;
        });

        if (firstPage) {
            showPage(firstPage.title, firstPage.pdf);
        }

    } catch (err) {
        console.error("Firestore error:", err);
        content.innerHTML = "<p>Error loading pages.</p>";
    }
}

window.addEventListener('DOMContentLoaded', loadAllPages);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await ensureUserDoc(user);
    }
});