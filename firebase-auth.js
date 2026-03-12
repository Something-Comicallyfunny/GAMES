// Firebase auth + allowlist gate + admin allowlist UI
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBm_XJn8mooYxUG5MzEySZSAFctRHH0Ebk",
  authDomain: "games-4d098.firebaseapp.com",
  projectId: "games-4d098",
  storageBucket: "games-4d098.firebasestorage.app",
  messagingSenderId: "297423342450",
  appId: "1:297423342450:web:91299ca6eaf89b5a83ebeb",
  measurementId: "G-217MSBNJ52",
};

const ADMIN_EMAIL = "ezradixon29@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const normalizeEmail = (email) => (email || "").trim().toLowerCase();
const emailId = (email) => encodeURIComponent(normalizeEmail(email));
const isAdmin = (user) => normalizeEmail(user?.email) === normalizeEmail(ADMIN_EMAIL);

const styles = `
  html.access-locked body > *:not(.access-overlay):not(.auth-overlay):not(.auth-badge):not(.admin-overlay) { filter: blur(12px); pointer-events: none; user-select: none; }
  .auth-badge { position: fixed; top: 16px; right: 16px; z-index: 9000; display: flex; gap: 8px; align-items: center; font-family: "Space Grotesk", Arial, sans-serif; }
  .auth-chip { background: rgba(24,27,41,0.9); border: 1px solid rgba(255,255,255,0.15); color: #e7ecf4; padding: 8px 10px; border-radius: 10px; font-size: 14px; }
  .auth-btn { background: linear-gradient(135deg, #ff9a3c, #4dd0e1); color: #0f111a; border: 0; border-radius: 10px; padding: 9px 12px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
  .auth-btn.secondary { background: rgba(255,255,255,0.08); color: #e7ecf4; border: 1px solid rgba(255,255,255,0.15); box-shadow: none; }
  .auth-overlay, .access-overlay, .admin-overlay { position: fixed; inset: 0; background: rgba(10,12,18,0.78); backdrop-filter: blur(12px); display: none; place-items: center; z-index: 9500; }
  .auth-overlay.open, .access-overlay.open, .admin-overlay.open { display: grid; }
  .auth-card, .access-card, .admin-card { width: min(460px, 94vw); background: rgba(24,27,41,0.94); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 22px; box-shadow: 0 24px 60px rgba(0,0,0,0.5); color: #e7ecf4; font-family: "Space Grotesk", Arial, sans-serif; }
  .auth-card h2, .access-card h2, .admin-card h2 { margin: 0 0 8px; font-size: 22px; }
  .auth-card p, .access-card p, .admin-card p { margin: 0 0 14px; color: #a4acbc; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .auth-field label { font-size: 13px; color: #c6ccda; }
  .auth-field input { padding: 11px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); color: #e7ecf4; font-size: 15px; }
  .auth-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .auth-error { color: #ff9a3c; min-height: 18px; font-weight: 600; margin-top: 8px; }
  .pill { display: inline-flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); }
  .pill .remove { background: transparent; border: 0; color: #ff9a3c; cursor: pointer; font-weight: 700; }
  .admin-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
  .admin-form { display: flex; gap: 8px; margin-top: 10px; }
  .admin-form input { flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); color: #e7ecf4; }
`;

const injectStyles = () => {
  const style = document.createElement("style");
  style.textContent = styles;
  document.head.appendChild(style);
};

const createUI = () => {
  const authOverlay = document.createElement("div");
  authOverlay.className = "auth-overlay";
  authOverlay.innerHTML = `
    <div class="auth-card">
      <h2>Sign in</h2>
      <p>Use Google or email/password.</p>
      <div class="auth-actions">
        <button class="auth-btn auth-google" type="button">Continue with Google</button>
      </div>
      <div class="auth-field">
        <label>Email</label>
        <input type="email" class="auth-email" placeholder="you@example.com" autocomplete="username" />
      </div>
      <div class="auth-field">
        <label>Password</label>
        <input type="password" class="auth-pass" placeholder="••••••••" autocomplete="current-password" />
      </div>
      <div class="auth-actions">
        <button class="auth-btn auth-signin" type="button">Sign in</button>
        <button class="auth-btn secondary auth-signup" type="button">Create account</button>
        <button class="auth-btn secondary auth-close" type="button">Close</button>
      </div>
      <div class="auth-error"></div>
    </div>
  `;

  const accessOverlay = document.createElement("div");
  accessOverlay.className = "access-overlay";
  accessOverlay.innerHTML = `
    <div class="access-card">
      <h2>Access restricted</h2>
      <p class="access-msg">Sign in to continue.</p>
      <div class="auth-actions">
        <button class="auth-btn access-open-auth" type="button">Sign in</button>
        <button class="auth-btn secondary access-signout" type="button">Sign out</button>
      </div>
    </div>
  `;

  const adminOverlay = document.createElement("div");
  adminOverlay.className = "admin-overlay";
  adminOverlay.innerHTML = `
    <div class="admin-card">
      <h2>Allowlist</h2>
      <p>Only admin (${ADMIN_EMAIL}) can edit. Allowed emails get full site access.</p>
      <div class="admin-list"></div>
      <form class="admin-form">
        <input type="email" class="admin-input" placeholder="user@example.com" required />
        <button class="auth-btn" type="submit">Add</button>
      </form>
      <div class="auth-error admin-error"></div>
      <div class="auth-actions" style="margin-top:14px;">
        <button class="auth-btn secondary admin-close" type="button">Close</button>
      </div>
    </div>
  `;

  const badge = document.createElement("div");
  badge.className = "auth-badge";
  badge.innerHTML = `
    <span class="auth-chip auth-status">Signed out</span>
    <button class="auth-btn auth-open" type="button">Sign in</button>
    <button class="auth-btn secondary admin-open" type="button" style="display:none;">Admin</button>
  `;

  document.body.append(authOverlay, accessOverlay, adminOverlay, badge);

  return { authOverlay, accessOverlay, adminOverlay, badge };
};

const showError = (el, msg) => { el.textContent = msg || ""; };

const fetchAllowed = async () => {
  const snap = await getDocs(collection(db, "allowedEmails"));
  return snap.docs.map((d) => normalizeEmail(d.data().email || d.id));
};

const setAllowed = async (email) => {
  const clean = normalizeEmail(email);
  if (!clean) throw new Error("Email required");
  await setDoc(doc(db, "allowedEmails", emailId(clean)), { email: clean, addedAt: Date.now() });
};

const removeAllowed = async (email) => {
  const clean = normalizeEmail(email);
  if (!clean) return;
  await deleteDoc(doc(db, "allowedEmails", emailId(clean)));
};

const isAllowed = async (email) => {
  const clean = normalizeEmail(email);
  if (!clean) return false;
  if (clean === normalizeEmail(ADMIN_EMAIL)) return true;
  const ref = doc(db, "allowedEmails", emailId(clean));
  const snap = await getDoc(ref);
  return snap.exists();
};

const wireAuth = () => {
  injectStyles();
  const { authOverlay, accessOverlay, adminOverlay, badge } = createUI();

  const email = authOverlay.querySelector(".auth-email");
  const pass = authOverlay.querySelector(".auth-pass");
  const err = authOverlay.querySelector(".auth-error");
  const btnSignIn = authOverlay.querySelector(".auth-signin");
  const btnSignUp = authOverlay.querySelector(".auth-signup");
  const btnClose = authOverlay.querySelector(".auth-close");
  const btnGoogle = authOverlay.querySelector(".auth-google");

  const status = badge.querySelector(".auth-status");
  const btnOpen = badge.querySelector(".auth-open");
  const btnAdmin = badge.querySelector(".admin-open");

  const accessMsg = accessOverlay.querySelector(".access-msg");
  const btnAccessOpenAuth = accessOverlay.querySelector(".access-open-auth");
  const btnAccessSignout = accessOverlay.querySelector(".access-signout");

  const adminList = adminOverlay.querySelector(".admin-list");
  const adminForm = adminOverlay.querySelector(".admin-form");
  const adminInput = adminOverlay.querySelector(".admin-input");
  const adminError = adminOverlay.querySelector(".admin-error");
  const adminClose = adminOverlay.querySelector(".admin-close");

  const openAuth = () => authOverlay.classList.add("open");
  const closeAuth = () => authOverlay.classList.remove("open");
  const lockPage = (msg) => {
    accessMsg.textContent = msg;
    accessOverlay.classList.add("open");
    document.documentElement.classList.add("access-locked");
  };
  const unlockPage = () => {
    accessOverlay.classList.remove("open");
    document.documentElement.classList.remove("access-locked");
  };

  const renderAdminList = (items) => {
    adminList.innerHTML = "";
    if (!items.length) {
      adminList.innerHTML = '<div class="auth-chip">No allowed emails yet.</div>';
      return;
    }
    items.forEach((em) => {
      const pill = document.createElement("div");
      pill.className = "pill";
      pill.innerHTML = `<span>${em}</span> <button class="remove" type="button" aria-label="Remove">✕</button>`;
      pill.querySelector(".remove").onclick = async () => {
        try {
          await removeAllowed(em);
          renderAdminList(await fetchAllowed());
        } catch (e) {
          showError(adminError, e.message || "Remove failed");
        }
      };
      adminList.appendChild(pill);
    });
  };

  const refreshAdmin = async () => {
    try {
      showError(adminError, "");
      renderAdminList(await fetchAllowed());
    } catch (e) {
      showError(adminError, e.message || "Load failed");
    }
  };

  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const value = normalizeEmail(adminInput.value);
      if (!value) {
        showError(adminError, "Email required");
        return;
      }
      await setAllowed(value);
      adminInput.value = "";
      showError(adminError, "Added");
      renderAdminList(await fetchAllowed());
    } catch (errAdd) {
      showError(adminError, errAdd.message || "Add failed");
    }
  });

  adminClose.onclick = () => adminOverlay.classList.remove("open");

  const setBadge = (text) => { status.textContent = text; };

  const signInEmail = async (mode) => {
    showError(err, "");
    if (!email.value || !pass.value) {
      showError(err, "Email and password required");
      return;
    }
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email.value, pass.value);
      } else {
        await createUserWithEmailAndPassword(auth, email.value, pass.value);
      }
      closeAuth();
    } catch (e) {
      showError(err, e.message || "Auth failed");
    }
  };

  btnSignIn.onclick = () => signInEmail("signin");
  btnSignUp.onclick = () => signInEmail("signup");
  btnClose.onclick = closeAuth;
  btnGoogle.onclick = async () => {
    showError(err, "");
    try {
      await signInWithPopup(auth, googleProvider);
      closeAuth();
    } catch (e) {
      showError(err, e.message || "Google sign-in failed");
    }
  };

  btnOpen.onclick = openAuth;
  btnAccessOpenAuth.onclick = () => {
    accessOverlay.classList.remove("open");
    openAuth();
  };
  btnAccessSignout.onclick = async () => { await signOut(auth); };

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setBadge("Signed out");
      btnOpen.textContent = "Sign in";
      btnOpen.onclick = openAuth;
      btnAdmin.style.display = "none";
      lockPage("Sign in to continue.");
      return;
    }

    const emailDisplay = user.email || "user";
    setBadge(`Signed in as ${emailDisplay}`);
    btnOpen.textContent = "Sign out";
    btnOpen.onclick = async () => { await signOut(auth); };

    if (isAdmin(user)) {
      btnAdmin.style.display = "inline-flex";
      btnAdmin.onclick = async () => {
        await refreshAdmin();
        adminOverlay.classList.add("open");
      };
    } else {
      btnAdmin.style.display = "none";
    }

    try {
      const allowed = await isAllowed(user.email);
      if (allowed) {
        unlockPage();
        accessOverlay.classList.remove("open");
      } else {
        lockPage("Access not granted. Contact admin.");
      }
    } catch (e) {
      lockPage(e.message || "Access check failed.");
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireAuth);
} else {
  wireAuth();
}
