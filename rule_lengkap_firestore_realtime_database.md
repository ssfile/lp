# Rule Lengkap Firebase — Landing Page + AI Modul Generator (`p-c410f`)

Rule yang Anda lampirkan sebelumnya adalah **Cloud Firestore Security Rules** (`service cloud.firestore`), sedangkan website **AI Modul Generator** terhubung ke **Firebase Realtime Database** (`p-c410f-default-rtdb.asia-southeast1.firebasedatabase.app`) dalam proyek Firebase yang sama (**`p-c410f`**).

Di dalam satu proyek Firebase, **Firestore Database** dan **Realtime Database** memiliki tab **Rules** masing-masing yang terpisah:

1. **Tab Firestore Database → Rules** (menggunakan sintaks `rules_version = '2'`).
2. **Tab Realtime Database → Rules** (menggunakan format JSON `{ "rules": { ... } }`).

---

## 1. Rule Lengkap Cloud Firestore (Gabungan Rule Lama + Web Modul)

Salin seluruh kode di bawah ini dan tempelkan ke **Firebase Console → Build → Firestore Database → Rules**, lalu klik **Publish**.

> **Catatan Keamanan:** Karena landing page Anda memiliki member/user yang bisa login (`request.auth != null`), rule web modul di bawah ini dilengkapi fungsi `isModulAdmin()` agar member biasa dari landing page tidak dapat mengubah pengaturan tampilan maupun **Master Brain AI** milik web modul.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // =========================================================================
    // FUNGSI HELPER OTORISASI ADMIN WEB MODUL
    // Mengecek Custom Claim 'admin: true' ATAU dokumen UID pada koleksi /admins
    // =========================================================================
    function isModulAdmin() {
      return request.auth != null && (
        request.auth.token.admin == true ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }

    // =========================================================================
    // A. RULE LAMA LANDING PAGE (TIDAK DIUBAH)
    // =========================================================================

    // Koleksi users:
    // - Admin yang sudah login (Email & Password) dapat membaca, menambah, mengubah, dan menghapus data member/users
    // - User yang login dengan UID miliknya sendiri dapat membaca profilnya
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }

    // Koleksi publik & data pengaturan website:
    // - Pengunjung dapat membaca katalog fitur, paket all-in-one, FAQ, dan pengaturan tampilan
    // - Admin yang sudah login dapat menulis/mengubah/menghapus seluruh data tersebut
    match /artifacts/{appId}/public/data/{collectionName}/{docId} {
      allow read: if collectionName in ['features', 'pricing', 'siteSettings', 'faq', 'customers'];
      allow write: if request.auth != null;
    }

    // =========================================================================
    // B. RULE TAMBAHAN UNTUK AI MODUL GENERATOR
    // =========================================================================

    // Daftar UID Admin resmi web modul
    match /admins/{adminUid} {
      allow read: if request.auth != null && (request.auth.uid == adminUid || isModulAdmin());
      allow write: if isModulAdmin();
    }

    // Konfigurasi publik website modul (baca publik tanpa login, tulis khusus admin)
    match /websiteConfig/{docId} {
      allow read: if true;
      allow write: if isModulAdmin();
    }

    match /generatorConfig/{docId} {
      allow read: if true;
      allow write: if isModulAdmin();
    }

    match /masterBrain/{docId} {
      allow read: if true;
      allow write: if isModulAdmin();
    }

    match /systemConfig/{docId} {
      allow read: if true;
      allow write: if isModulAdmin();
    }

    // Konfigurasi sensitif & internal dashboard admin (tertutup untuk publik & member biasa)
    match /aiConfig/{docId} {
      allow read, write: if isModulAdmin();
    }

    match /draftConfig/{docId} {
      allow read, write: if isModulAdmin();
    }

    match /history/{docId} {
      allow read, write: if isModulAdmin();
    }
  }
}
```

---

## 2. Rule Wajib Firebase Realtime Database (Untuk Penyimpanan Live Web Modul)

Karena aplikasi `index.html` AI Modul Generator membaca dan menyimpan pengaturan tampilan, konten, dan **Master Brain AI** secara *real-time* ke **Firebase Realtime Database**, pastikan Anda juga memasang blok JSON berikut di **Firebase Console → Build → Realtime Database → Rules**, lalu klik **Publish**:

```json
{
  "rules": {
    "websiteConfig": {
      ".read": true,
      ".write": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)"
    },
    "generatorConfig": {
      ".read": true,
      ".write": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)"
    },
    "masterBrain": {
      ".read": true,
      ".write": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)"
    },
    "aiConfig": {
      ".read": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)",
      ".write": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)"
    },
    "systemConfig": {
      ".read": true,
      ".write": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)",
      "stats": {
        ".read": true,
        "totalModulesGenerated": {
          ".write": true,
          ".validate": "newData.isNumber() && (!data.exists() || newData.val() === data.val() + 1)"
        },
        "lastGeneratedAt": {
          ".write": true,
          ".validate": "newData.isNumber() && newData.val() <= now + 60000"
        }
      }
    },
    "draftConfig": {
      ".read": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)",
      ".write": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)"
    },
    "history": {
      ".read": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)",
      ".write": "auth != null && (auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)"
    },
    "admins": {
      ".read": "auth != null",
      ".write": "auth != null && (!data.exists() || auth.token.admin === true || root.child('admins').child(auth.uid).val() === true)"
    }
  }
}
```

---

## 3. Ringkasan Pemasangan Kedua Rules

| Lokasi di Firebase Console (`p-c410f`) | Kode yang Ditempel | Fungsi |
| :--- | :--- | :--- |
| **Build → Firestore Database → Rules** | Kode **Bagian 1** (`rules_version = '2'; ...`) | Menjaga seluruh fungsi landing page lama Anda tetap berjalan + melindungi koleksi Firestore dengan verifikasi `isModulAdmin()`. |
| **Build → Realtime Database → Rules** | Kode **Bagian 2** (`{ "rules": { ... } }`) | Mengaktifkan akses baca publik tanpa login & hak tulis eksklusif Dashboard Admin pada website **AI Modul Generator**. |