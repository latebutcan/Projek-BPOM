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
const addActivityForm = document.getElementById('add-activity-form');
const activityNameInput = document.getElementById('activity-name');
const activityDateInput = document.getElementById('activity-date');
const activityTimeInput = document.getElementById('activity-time');
const activityTypeInput = document.getElementById('activity-type');
const activityLocationInput = document.getElementById('activity-location');
const activityAttendanceInput = document.getElementById('activity-attendance');
const activityDescriptionInput = document.getElementById('activity-description');
const activityList = document.getElementById('activity-list');
const loadingActivities = document.getElementById('loading-activities');

let userId = null;
let activitiesCollectionRef = null;
let unsubscribe = null; // Untuk listener onSnapshot

// --- Fungsi-fungsi ---

/**
 * Menambahkan kegiatan baru ke Firestore.
 */
async function addActivity(activityData) {
    if (!userId) {
        alert("Error: Pengguna belum terautentikasi.");
        return;
    }
    try {
        await addDoc(activitiesCollectionRef, {
            ...activityData,
            createdAt: serverTimestamp()
        });
        console.log("Jadwal berhasil ditambahkan!");
    } catch (error) {
        console.error("Error menambahkan jadwal: ", error);
        alert("Gagal menambahkan jadwal. Silakan coba lagi.");
    }
}

/**
 * Menghapus kegiatan dari Firestore.
 * @param {string} id - ID kegiatan yang akan dihapus.
 */
async function deleteActivity(id) {
    if (!userId) {
        alert("Error: Pengguna belum terautentikasi.");
        return;
    }
    try {
        await deleteDoc(doc(db, activitiesCollectionRef.path, id));
        console.log("Jadwal berhasil dihapus!");
    } catch (error) {
        console.error("Error menghapus jadwal: ", error);
        alert("Gagal menghapus jadwal. Silakan coba lagi.");
    }
}

/**
 * Mengambil dan menampilkan jadwal dari Firestore secara real-time.
 */
function fetchAndRenderActivities() {
    if (unsubscribe) unsubscribe(); // Hentikan listener sebelumnya

    const q = query(collection(db, `/artifacts/${appId}/users/${userId}/activities`));

    unsubscribe = onSnapshot(q, (snapshot) => {
        if (loadingActivities) loadingActivities.style.display = 'none';
        
        activityList.innerHTML = ''; // Kosongkan daftar sebelum render ulang

        if (snapshot.empty) {
            activityList.innerHTML = '<p class="text-gray-500">Belum ada jadwal kegiatan.</p>';
            return;
        }

        const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sortir jadwal berdasarkan tanggal dan waktu
        activities.sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA - dateTimeB;
        });

        activities.forEach(activityData => {
            const card = document.createElement('div');
            card.className = 'p-4 bg-gray-50 rounded-lg border space-y-3';
            
            const activityDate = new Date(`${activityData.date}T00:00:00`);
            const formattedDate = activityDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const typeColors = {
                Online: 'bg-blue-100 text-blue-800',
                Offline: 'bg-green-100 text-green-800',
                Hybrid: 'bg-purple-100 text-purple-800',
            };
            const typeBadge = `<span class="text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${typeColors[activityData.type] || 'bg-gray-100 text-gray-800'}">${activityData.type}</span>`;
            
            let attendanceLinkHTML = '';
            if (activityData.attendanceLink) {
                attendanceLinkHTML = `
                <div class="flex items-center text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    <a href="${activityData.attendanceLink}" target="_blank" class="text-indigo-600 hover:underline">Link Absensi</a>
                </div>`;
            }

            let descriptionHTML = '';
            if (activityData.description) {
                descriptionHTML = `<p class="text-sm text-gray-500 pt-2 border-t mt-3">${activityData.description.replace(/\n/g, '<br>')}</p>`;
            }

            card.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center flex-wrap">
                            ${typeBadge}
                            <h4 class="font-semibold text-gray-800 truncate">${activityData.name}</h4>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">${formattedDate} - ${activityData.time}</p>
                    </div>
                    <button data-id="${activityData.id}" class="delete-btn ml-4 text-red-500 hover:text-red-700 p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <div class="space-y-2">
                    <div class="flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>${activityData.location}</span>
                    </div>
                    ${attendanceLinkHTML}
                </div>
                ${descriptionHTML}
            `;
            activityList.appendChild(card);
        });
    });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            activitiesCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/activities`);
            fetchAndRenderActivities();
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

    addActivityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activityData = {
            name: activityNameInput.value.trim(),
            date: activityDateInput.value,
            time: activityTimeInput.value,
            type: activityTypeInput.value,
            location: activityLocationInput.value.trim(),
            attendanceLink: activityAttendanceInput.value.trim(),
            description: activityDescriptionInput.value.trim()
        };
        
        if (activityData.name && activityData.date && activityData.time && activityData.location) {
            addActivity(activityData);
            addActivityForm.reset();
        }
    });

    activityList.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const activityId = deleteButton.dataset.id;
            if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
                deleteActivity(activityId);
            }
        }
    });
});
