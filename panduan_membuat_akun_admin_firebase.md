# Panduan Membuat & Mengaktifkan Akun Admin di Firebase (`p-c410f`)

Karena platform **AI Modul Generator** menggunakan **Firebase Authentication** dan otorisasi berbasis **UID Admin** pada **Firebase Realtime Database**, memiliki akun di Firebase saja belum otomatis menjadikan akun tersebut sebagai Admin. Ikuti langkah-langkah berikut untuk membuat sekaligus memberikan hak akses Admin penuh.

---

## Langkah 1: Aktifkan Metode Login Email & Password

1. Buka [Firebase Console](https://console.firebase.google.com/) dan pilih proyek Anda: **`p-c410f`**.
2. Pada panel menu sebelah kiri, klik **Build → Authentication**.
3. Jika baru pertama kali dibuka, klik tombol **Get started**.
4. Buka tab **Sign-in method**.
5. Klik pada opsi **Email/Password**.
6. Geser tombol **Enable** menjadi aktif (biru), lalu klik **Save**.

---

## Langkah 2: Buat Akun Admin di Firebase Authentication

1. Masih di halaman **Authentication**, pindah ke tab **Users**.
2. Klik tombol **Add user** di pojok kanan atas tabel pengguna.
3. Masukkan **Email** khusus admin (contoh: `admin@sekolahanda.sch.id`) dan **Password** yang kuat (minimal 8 karakter kombinasi huruf besar, kecil, dan angka).
4. Klik **Add user**.
5. Setelah akun muncul di daftar pengguna, arahkan kursor ke kolom **User UID**, lalu klik ikon **Copy UID** (simpan kode UID ini untuk langkah berikutnya).

---

## Langkah 3: Berikan Hak Akses (Otorisasi) Admin

Anda dapat memilih salah satu dari dua cara berikut:

### Cara A: Daftarkan UID Secara Manual di Realtime Database (Direkomendasikan)
Cara ini paling pasti dan langsung mengunci akun pertama Anda sebagai Admin resmi:

1. Di Firebase Console proyek **`p-c410f`**, buka menu **Build → Realtime Database**.
2. Pastikan Anda sudah memasang **Security Rules** tambahan pada tab **Rules** dan menekan **Publish**.
3. Pindah ke tab **Data**.
4. Arahkan kursor ke baris paling atas (URL root database Anda), lalu klik ikon **`+`** (Add child).
5. Isi **Name** dengan:
   ```text
   admins
   ```
6. Klik ikon **`+`** di sebelah kanan `admins` yang baru dibuat, lalu isi:
   - **Name:** Tempelkan **User UID** yang sudah Anda salin pada Langkah 2.
   - **Value:** Ketik `true` (pastikan tanpa tanda kutip agar terbaca sebagai tipe data *Boolean*).
7. Klik **Add**. Struktur data Anda akan terlihat seperti berikut:
   ```text
   p-c410f-default-rtdb
    └── admins
         └── "xYz123AbC456UidAdminAnda": true
   ```

### Cara B: Aktivasi Otomatis Saat Login Pertama Kali
1. Pastikan **Security Rules** sudah dipasang di Realtime Database dan node `admins` belum ada di database.
2. Buka website **AI Modul Generator** Anda, gulir ke bagian paling bawah footer, lalu klik tombol **`ADMIN`**.
3. Masukkan Email dan Password yang dibuat pada Langkah 2.
4. Sistem website akan mendeteksi bahwa belum ada admin yang terdaftar, lalu secara otomatis mendaftarkan UID Anda ke `/admins/{UID}: true` dan langsung membuka **Dashboard Pusat Kendali Admin**.

---

## Langkah 4: Menguji Login Dashboard Admin

1. Buka halaman utama website **AI Modul Generator**.
2. Gulir ke bagian paling bawah **Footer**, lalu klik tombol kecil **`ADMIN`** di sebelah kanan bawah.
3. Masukkan **Email** dan **Password** akun admin Anda pada jendela login yang muncul, lalu klik **Masuk ke Pusat Kendali Admin**.
4. Jika berhasil, Anda akan langsung masuk ke tampilan **Dashboard Admin (13 Menu)** dan dapat mulai mengatur tampilan, teks, tombol, maupun **Master Brain AI**.

---

## Cara Menambahkan Akun Admin Tambahan (Jika Diperlukan)

1. Ulangi **Langkah 2** di **Authentication → Users** untuk membuat akun email/password baru bagi rekan admin Anda, lalu salin **User UID**-nya.
2. Buka **Realtime Database → Data**, klik ikon **`+`** pada node `admins`, masukkan **User UID** baru tersebut sebagai *Name*, dan beri nilai `true` sebagai *Value*, lalu klik **Add**.

> **Catatan Keamanan:** Jika ada pengguna yang memiliki akun Firebase Authentication pada proyek `p-c410f` namun **User UID**-nya tidak tercantum dengan nilai `true` di dalam node `admins`, sistem akan otomatis menolak aksesnya saat mencoba masuk melalui tombol `ADMIN`.