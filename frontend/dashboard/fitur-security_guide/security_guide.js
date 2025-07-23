// security_guide.js

// Menunggu hingga seluruh konten halaman (DOM) selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    
    // Menargetkan elemen grid tempat kartu akan ditampilkan
    const cardGrid = document.getElementById('card-grid');

    // Daftar file HTML untuk setiap kartu yang akan dimuat
    const cardFiles = [
        'card/card_ssl.html',
        'card/card_security.html',
        'card/card_authentication.html',
        'card/card_data_protection.html'
    ];

    // Melakukan iterasi untuk setiap file kartu
    cardFiles.forEach(cardFile => {
        // Menggunakan fetch API untuk mengambil konten dari file HTML
        fetch(cardFile)
            .then(response => {
                // Memeriksa apakah request berhasil (status code 200-299)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // Mengembalikan konten sebagai teks
                return response.text();
            })
            .then(html => {
                // Menambahkan konten HTML kartu ke dalam grid
                cardGrid.innerHTML += html;
            })
            .catch(error => {
                // Menampilkan pesan error di konsol jika fetch gagal
                console.error(`Error loading card: ${cardFile}`, error);
                // Anda bisa menampilkan pesan error di UI jika diperlukan
                cardGrid.innerHTML += `<p class="text-red-500">Gagal memuat kartu: ${cardFile}</p>`;
            });
    });

    console.log("Security Guide script loaded and card are being fetched.");
});
