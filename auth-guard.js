import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

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

// URL Halaman Login / Landing Utama
const LOGIN_URL = "https://ssfile.github.io/lp/";

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
  const query = reason ? `?redirect=${targetUrl}&reason=${encodeURIComponent(reason)}` : `?redirect=${targetUrl}`;
  window.location.replace(`${LOGIN_URL}${query}`);
}

async function checkMembershipAndUnlock(user) {
  if (!user) {
    redirectToLogin("not_logged_in");
    return;
  }

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

    if (!isMemberActive && !isAdmin) {
      console.warn("UID tidak terdaftar sebagai member aktif:", user.uid);
      await signOut(auth);
      redirectToLogin("not_member");
      return;
    }

    verificationCompleted = true;
    document.documentElement.style.visibility = "visible";
    window.currentMember = {
      uid: user.uid,
      email: user.email,
      isAdmin
    };
  } catch (error) {
    console.error("Gagal memverifikasi sesi member:", error);
    document.documentElement.style.visibility = "visible";
    alert("Gagal memverifikasi status member dari database: " + error.message);
  }
}

// Gunakan satu listener onAuthStateChanged sebagai sumber utama (menghindari race condition)
const unsubscribe = onAuthStateChanged(auth, async (user) => {
  if (!verificationCompleted) {
    unsubscribe();
    await checkMembershipAndUnlock(user);
  } else if (!user) {
    redirectToLogin("session_ended");
  }
});

// Fungsi tombol logout yang bisa dipanggil dari halaman member
window.memberLogout = async function () {
  await signOut(auth);
  window.location.replace(LOGIN_URL);
};
