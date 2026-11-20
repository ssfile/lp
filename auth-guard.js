import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALys9RlMEKT4zbviTLKiOgh41VwO7bN1k",
  authDomain: "p-c410f.firebaseapp.com",
  databaseURL: "https://p-c410f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "p-c410f",
  storageBucket: "p-c410f.firebasestorage.app",
  messagingSenderId: "41031214989",
  appId: "1:41031214989:web:5d9c9db7cc97168eafffc4"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);

// URL Halaman Login / Landing Utama
const LOGIN_URL = "https://ssfile.github.io/lp/";
const APP_ID = "default-app-id";
const STORAGE_KEY = "aksa_ai_realtime_state_v3";

// Sembunyikan halaman sementara selama proses verifikasi sesi
document.documentElement.style.visibility = "hidden";

let verificationCompleted = false;

function redirectToLogin(reason = "") {
  const currentUrl = window.location.href.split("#")[0].split("?")[0];
  const isAlreadyOnLanding =
    currentUrl === LOGIN_URL ||
    currentUrl === "https://ssfile.github.io/lp" ||
    currentUrl === "https://ssfile.github.io/lp/index.html";

  if (isAlreadyOnLanding) {
    document.documentElement.style.visibility = "visible";
    return;
  }

  const targetUrl = encodeURIComponent(window.location.href);
  const queryStr = reason ? `?redirect=${targetUrl}&reason=${encodeURIComponent(reason)}` : `?redirect=${targetUrl}`;
  window.location.replace(`${LOGIN_URL}${queryStr}`);
}

function getStoredMemberCandidate() {
  try {
    // 1. Cek sesi eksplisit jika tersimpan di sessionStorage / localStorage
    const explicitRaw = sessionStorage.getItem("aksa_member_session") || localStorage.getItem("aksa_member_session");
    if (explicitRaw) {
      const parsed = JSON.parse(explicitRaw);
      if (parsed && parsed.email && parsed.active !== false) return parsed;
    }

    // 2. Cek dari state Aksa AI Studio (aksa_ai_realtime_state_v3)
    const stateRaw = localStorage.getItem(STORAGE_KEY);
    if (stateRaw) {
      const parsedState = JSON.parse(stateRaw);
      if (parsedState?.currentMemberSession?.email) {
        return parsedState.currentMemberSession;
      }
      if (Array.isArray(parsedState?.members)) {
        const activeLocal = parsedState.members.find((m) => m && m.email && m.active !== false);
        if (activeLocal) return activeLocal;
      }
    }
  } catch (_) {}
  return null;
}

async function verifyFirestoreMember(candidate) {
  if (!candidate || !candidate.email) return null;
  try {
    const emailLower = String(candidate.email).trim().toLowerCase();
    const customersCol = collection(firestore, "artifacts", APP_ID, "public", "data", "customers");
    const q = query(customersCol, where("email", "==", candidate.email));
    const snap = await getDocs(q);

    let matched = null;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (String(data.email || "").toLowerCase() === emailLower && data.active !== false) {
        matched = { uid: docSnap.id, ...data };
      }
    });

    if (matched) return matched;

    // Fallback: jika baru ditambahkan secara lokal sebelum sync cloud selesai
    if (candidate.active !== false && candidate.password) {
      return candidate;
    }
  } catch (err) {
    console.warn("Cek Firestore member:", err?.message || err);
    if (candidate.active !== false && candidate.password) {
      return candidate;
    }
  }
  return null;
}

async function checkMembershipAndUnlock(user) {
  // JALUR A: Login menggunakan Firebase Authentication (RTDB members/{uid} atau admins/{uid})
  if (user) {
    try {
      const [memberNodeSnap, adminNodeSnap] = await Promise.all([
        get(ref(database, `members/${user.uid}`)),
        get(ref(database, `admins/${user.uid}`))
      ]);

      const memberVal = memberNodeSnap.exists() ? memberNodeSnap.val() : null;
      const isMemberActive =
        memberVal === true ||
        memberVal === "true" ||
        (memberVal && typeof memberVal === "object" && (memberVal.active === true || memberVal.active === "true"));

      const isAdmin = adminNodeSnap.exists() && (adminNodeSnap.val() === true || adminNodeSnap.val() === "true");

      if (isMemberActive || isAdmin) {
        verificationCompleted = true;
        document.documentElement.style.visibility = "visible";
        window.currentMember = {
          uid: user.uid,
          email: user.email,
          isAdmin
        };
        return;
      }
    } catch (error) {
      console.error("Gagal memeriksa RTDB member:", error);
    }
  }

  // JALUR B: Login menggunakan Portal Member Aksa AI Studio (Firestore customers / localStorage)
  const localCandidate = getStoredMemberCandidate();
  if (localCandidate) {
    const verifiedMember = await verifyFirestoreMember(localCandidate);
    if (verifiedMember) {
      verificationCompleted = true;
      document.documentElement.style.visibility = "visible";
      window.currentMember = {
        uid: verifiedMember.uid || verifiedMember.id || "member",
        email: verifiedMember.email,
        name: verifiedMember.name || "Member",
        isAdmin: false
      };
      return;
    }
  }

  if (user) {
    await signOut(auth);
    redirectToLogin("not_member");
  } else {
    redirectToLogin("not_logged_in");
  }
}

const unsubscribe = onAuthStateChanged(auth, async (user) => {
  if (!verificationCompleted) {
    unsubscribe();
    await checkMembershipAndUnlock(user);
  }
});

window.memberLogout = async function () {
  try {
    sessionStorage.removeItem("aksa_member_session");
    localStorage.removeItem("aksa_member_session");
    await signOut(auth);
  } catch (_) {}
  window.location.replace(LOGIN_URL);
};
