// tls_checker.js

document.addEventListener('DOMContentLoaded', () => {
    // Menyeleksi form dan elemen-elemen di dalamnya
    const tlsForm = document.getElementById('tls-form');
    const hostnameInput = document.getElementById('hostname-input');
    const checkButton = document.getElementById('check-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const buttonText = document.getElementById('button-text');

    // Menangani event submit pada form
    tlsForm.addEventListener('submit', (event) => {
        // Mencegah perilaku default dari form submission (yang akan me-reload halaman)
        event.preventDefault();

        // Mengambil nilai hostname dari input dan menghapus spasi di awal/akhir
        const hostnameToScan = hostnameInput.value.trim();

        // Validasi dasar: memastikan hostname tidak kosong
        if (!hostnameToScan) {
            alert('Silakan masukkan hostname yang valid.');
            return;
        }

        // Menampilkan status loading pada tombol
        buttonText.textContent = 'Mengarahkan...';
        loadingSpinner.classList.remove('hidden');
        checkButton.disabled = true;

        // Membangun URL target untuk ssllabs.com
        // Parameter 'd' digunakan untuk mengirim hostname yang akan di-scan
        const targetUrl = `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(hostnameToScan)}`;

        // Memberi jeda singkat agar pengguna melihat status loading sebelum tab baru terbuka
        setTimeout(() => {
            // Membuka halaman hasil di tab browser baru
            window.open(targetUrl, '_blank');

            // Mengembalikan tombol ke kondisi semula setelah beberapa saat
            setTimeout(() => {
                buttonText.textContent = 'Cek Sekarang';
                loadingSpinner.classList.add('hidden');
                checkButton.disabled = false;
                hostnameInput.value = ''; // Mengosongkan kolom input
            }, 500);

        }, 1000); // Jeda 1 detik untuk menampilkan status loading
    });

    console.log("TLS Checker script loaded and ready.");
});
