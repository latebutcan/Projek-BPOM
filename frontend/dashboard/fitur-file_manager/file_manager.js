import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, serverTimestamp, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Konfigurasi dan Inisialisasi Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Elemen DOM ---
const addDocumentForm = document.getElementById('add-document-form');
const docNameInput = document.getElementById('doc-name');
const docTypeRadios = document.querySelectorAll('input[name="doc-type"]');
const urlInputContainer = document.getElementById('url-input-container');
const fileInputContainer = document.getElementById('file-input-container');
const docLinkInput = document.getElementById('doc-link');
const docUploadInput = document.getElementById('doc-upload');
const documentList = document.getElementById('document-list');
const loadingDocs = document.getElementById('loading-docs');

let userId = null;
let documentsCollectionRef = null;
let unsubscribe = null; // Untuk listener onSnapshot

// --- Fungsi-fungsi ---

/**
 * Menambahkan dokumen baru ke Firestore.
 * @param {string} name - Nama dokumen.
 * @param {string} source - Sumber dokumen (URL atau nama file).
 * @param {'url' | 'file'} type - Tipe dokumen.
 */
async function addDocument(name, source, type) {
    if (!userId) {
        alert("Error: Pengguna belum terautentikasi.");
        return;
    }
    try {
        await addDoc(documentsCollectionRef, {
            name: name,
            source: source,
            type: type,
            createdAt: serverTimestamp()
        });
        console.log("Dokumen berhasil ditambahkan!");
    } catch (error) {
        console.error("Error menambahkan dokumen: ", error);
        alert("Gagal menambahkan dokumen. Silakan coba lagi.");
    }
}

/**
 * Menghapus dokumen dari Firestore.
 * @param {string} id - ID dokumen yang akan dihapus.
 */
async function deleteDocument(id) {
    if (!userId) {
        alert("Error: Pengguna belum terautentikasi.");
        return;
    }
    try {
        await deleteDoc(doc(db, documentsCollectionRef.path, id));
        console.log("Dokumen berhasil dihapus!");
    } catch (error) {
        console.error("Error menghapus dokumen: ", error);
        alert("Gagal menghapus dokumen. Silakan coba lagi.");
    }
}


/**
 * Mengambil dan menampilkan dokumen dari Firestore secara real-time.
 */
function fetchAndRenderDocuments() {
    if (unsubscribe) unsubscribe(); // Hentikan listener sebelumnya jika ada

    const q = query(collection(db, `/artifacts/${appId}/users/${userId}/documents`));

    unsubscribe = onSnapshot(q, (snapshot) => {
        if (loadingDocs) loadingDocs.style.display = 'none';
        
        documentList.innerHTML = ''; // Kosongkan daftar sebelum render ulang

        if (snapshot.empty) {
            documentList.innerHTML = '<p class="text-gray-500">Belum ada dokumen yang disimpan.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const docData = doc.data();
            const docId = doc.id;

            const card = document.createElement('div');
            card.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg border';
            
            const icon = docData.type === 'url' ? 
                `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>` :
                `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>`;

            const sourceDisplay = docData.type === 'url' ? 
                `<a href="${docData.source}" target="_blank" class="text-sm text-blue-600 hover:underline truncate">${docData.source}</a>` :
                `<span class="text-sm text-gray-600 truncate">${docData.source}</span>`;

            card.innerHTML = `
                <div class="flex items-center flex-1 min-w-0">
                    ${icon}
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-800 truncate">${docData.name}</p>
                        ${sourceDisplay}
                    </div>
                </div>
                <button data-id="${docId}" class="delete-btn ml-4 text-red-500 hover:text-red-700 p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            `;
            documentList.appendChild(card);
        });
    });
}

/**
 * Mengatur visibilitas input berdasarkan pilihan radio button.
 */
function toggleInputFields() {
    const selectedType = document.querySelector('input[name="doc-type"]:checked').value;
    if (selectedType === 'url') {
        urlInputContainer.classList.remove('hidden');
        fileInputContainer.classList.add('hidden');
        docLinkInput.required = true;
        docUploadInput.required = false;
    } else {
        urlInputContainer.classList.add('hidden');
        fileInputContainer.classList.remove('hidden');
        docLinkInput.required = false;
        docUploadInput.required = true;
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            documentsCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/documents`);
            fetchAndRenderDocuments();
        } else if (initialAuthToken) {
            try {
                await signInWithCustomToken(auth, initialAuthToken);
            } catch (error) {
                console.error("Gagal sign-in dengan custom token:", error);
                await signInAnonymously(auth);
            }
        } else {
            await signInAnonymously(auth);
        }
    });
    
    // Listener untuk radio buttons
    docTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleInputFields);
    });

    // Listener untuk form submission
    addDocumentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const docName = docNameInput.value.trim();
        const selectedType = document.querySelector('input[name="doc-type"]:checked').value;

        if (selectedType === 'url') {
            const docLink = docLinkInput.value.trim();
            if (docName && docLink) {
                addDocument(docName, docLink, 'url');
            }
        } else {
            const file = docUploadInput.files[0];
            if (docName && file) {
                // Catatan: Ini hanya menyimpan NAMA file, bukan kontennya.
                addDocument(docName, file.name, 'file');
            }
        }
        addDocumentForm.reset();
        toggleInputFields(); // Kembalikan ke tampilan default
    });

    documentList.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const docId = deleteButton.dataset.id;
            // Hindari penggunaan confirm()
            if (confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
                deleteDocument(docId);
            }
        }
    });
    
    // Inisialisasi tampilan form
    toggleInputFields();
});
