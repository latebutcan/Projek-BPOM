// security_headers_checker.js

document.addEventListener('DOMContentLoaded', () => {
    // Menyeleksi form dan elemen-elemen di dalamnya
    const securityForm = document.getElementById('security-form');
    const urlInput = document.getElementById('url-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const buttonText = document.getElementById('button-text');

    // Menangani event submit pada form
    securityForm.addEventListener('submit', (event) => {
        // Mencegah perilaku default dari form submission (yang akan me-reload halaman)
        event.preventDefault();

        // Mengambil nilai URL dari input dan menghapus spasi di awal/akhir
        const urlToScan = urlInput.value.trim();

        // Validasi dasar: memastikan URL tidak kosong
        if (!urlToScan) {
            // Menggunakan UI kustom untuk notifikasi, bukan alert()
            alert('Silakan masukkan URL yang valid.');
            return;
        }

        // Menampilkan status loading pada tombol
        buttonText.textContent = 'Mengarahkan...';
        loadingSpinner.classList.remove('hidden');
        checkButton.disabled = true;

        // Membangun URL target untuk securityheaders.com
        // Parameter 'q' digunakan untuk mengirim URL yang akan di-scan
        // Parameter 'hide=on' dihapus untuk menghindari pemblokiran dari server
        // Pengguna akan diarahkan ke halaman dengan URL yang sudah terisi, lalu menekan "Scan" secara manual
        const targetUrl = `https://securityheaders.com/?q=${encodeURIComponent(urlToScan)}&followRedirects=on`;

        // Memberi jeda singkat agar pengguna melihat status loading sebelum tab baru terbuka
        setTimeout(() => {
            // Membuka halaman hasil di tab browser baru
            window.open(targetUrl, '_blank');

            // Mengembalikan tombol ke kondisi semula setelah beberapa saat
            setTimeout(() => {
                buttonText.textContent = 'Cek Sekarang';
                loadingSpinner.classList.add('hidden');
                checkButton.disabled = false;
                urlInput.value = ''; // Mengosongkan kolom input
            }, 500);

        }, 1000); // Jeda 1 detik untuk menampilkan status loading
    });

    console.log("Security Headers Checker script loaded and ready.");
});
