// lp/auth-guard.js
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

// URL Halaman Login Utama
const LOGIN_URL = "https://ssfile.github.io/lp/";

// 1. Sembunyikan seluruh halaman sejak milidetik pertama agar isi tidak bocor
document.documentElement.style.visibility = "hidden";

// 2. Cek status autentikasi Firebase
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Belum login -> kirim ke halaman login dengan membawa link tujuan
    const targetUrl = encodeURIComponent(window.location.href);
    window.location.replace(`${LOGIN_URL}?redirect=${targetUrl}`);
    return;
  }

  try {
    // 3. Verifikasi apakah UID terdaftar sebagai member aktif atau admin di Realtime Database
    const [memberSnap, adminSnap] = await Promise.all([
      get(ref(database, `members/${user.uid}/active`)),
      get(ref(database, `admins/${user.uid}`))
    ]);

    const isMemberActive = memberSnap.exists() && memberSnap.val() === true;
    const isAdmin = adminSnap.exists() && adminSnap.val() === true;

    if (!isMemberActive && !isAdmin) {
      await signOut(auth);
      alert("Akun Anda belum terdaftar sebagai member aktif. Silakan hubungi admin.");
      window.location.replace(LOGIN_URL);
      return;
    }

    // 4. Terverifikasi -> Tampilkan halaman
    document.documentElement.style.visibility = "visible";

    // Simpan info user di window agar bisa dipakai oleh tombol Logout atau profil
    window.currentMember = {
      uid: user.uid,
      email: user.email,
      isAdmin
    };
  } catch (error) {
    console.error("Error verifikasi member:", error);
    window.location.replace(LOGIN_URL);
  }
});

// Fungsi Logout global untuk dipasang di tombol Keluar pada halaman member
window.memberLogout = async function () {
  await signOut(auth);
  window.location.replace(LOGIN_URL);
};
