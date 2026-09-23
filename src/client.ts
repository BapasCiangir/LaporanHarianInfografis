// src/client.js

const API_BASE = 'http://localhost:3000/api';
let authToken = localStorage.getItem('bapas_admin_token') || null;
let isAdmin = !!authToken;

// 1. Ambil Data dari Database via API
async function fetchReportData() {
  try {
    updateSyncStatus('saving', 'Memuat Data...');
    const response = await fetch(`${API_BASE}/report`);
    if (!response.ok) throw new Error("Gagal mengambil data");
    
    const data = await response.json();
    applyDataToUI(data);
    updateSyncStatus('connected', 'Tersinkron dengan Database');
  } catch (err) {
    console.error(err);
    updateSyncStatus('connecting', 'Gagal Terhubung');
  }
}

// 2. Terapkan Data DB ke DOM HTML
function applyDataToUI(data) {
  // Mapping field DB ke atribut data-key pada HTML
  const fieldMapping = {
    'pegawaiHadir': data.pegawaiHadir,
    'pegawaiCuti': data.pegawaiCuti,
    'pegawaiDL': data.pegawaiDL,
    'klien-pb-dl': data.klienPbDl,
    'klien-pb-al': data.klienPbAl,
    'klien-pb-dp': data.klienPbDp,
    'klien-pb-ap': data.klienPbAp,
    'klien-cb-dl': data.klienCbDl,
    'klien-cb-al': data.klienCbAl,
    'klien-cb-dp': data.klienCbDp,
    'klien-cb-ap': data.klienCbAp,
    'perkara-narkotika': data.perkaraNarkotika,
    'perkara-terorisme': data.perkaraTerorisme,
    'perkara-korupsi': data.perkaraKorupsi,
    'perkara-pidum': data.perkaraPidum,
    'petugas-nama': data.petugasNama,
    // Tambahkan mapping field lain sesuai kebutuhan data-key di HTML
  };

  Object.keys(fieldMapping).forEach(key => {
    const el = document.querySelector(`[data-key="${key}"]`);
    if (el && fieldMapping[key] !== undefined) {
      el.innerText = fieldMapping[key];
    }
  });

  if (data.fotoPiketiBase64) {
    const imgEl = document.getElementById('previewFoto');
    if (imgEl) imgEl.src = data.fotoPiketiBase64;
  }

  // Panggil ulang kalkulasi di JS
  if (typeof calculatePegawai === 'function') calculatePegawai();
  if (typeof calculateKlienTable === 'function') calculateKlienTable();
}

// 3. Simpan Data Perubahan ke Database via API
async function saveReportDataToDB(payload) {
  if (!authToken) return;

  try {
    updateSyncStatus('saving', 'Menyimpan...');
    const response = await fetch(`${API_BASE}/report`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401 || response.status === 403) {
      alert("Sesi login berakhir. Silakan login kembali.");
      logoutAdmin();
      return;
    }

    if (!response.ok) throw new Error("Gagal menyimpan data");

    updateSyncStatus('connected', 'Tersimpan ke Database');
  } catch (err) {
    console.error(err);
    updateSyncStatus('connecting', 'Gagal Menyimpan');
  }
}

// 4. Admin Login Handler
window.handleAdminLogin = async function() {
  if (!isAdmin) {
    const password = prompt("Masukkan Password Admin:");
    const username = "admin";

    if (!password) return;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        authToken = data.token;
        localStorage.setItem('bapas_admin_token', authToken);
        isAdmin = true;
        setAdminUIState(true);
      } else {
        alert(data.message || "Login gagal");
      }
    } catch (err) {
      alert("Kesalahan koneksi saat login");
    }
  } else {
    logoutAdmin();
  }
};

function logoutAdmin() {
  authToken = null;
  localStorage.removeItem('bapas_admin_token');
  isAdmin = false;
  setAdminUIState(false);
}

function setAdminUIState(enabled) {
  const editables = document.querySelectorAll('.editable');
  const adminPanel = document.getElementById('adminPanel');
  const editStatusText = document.getElementById('editStatusText');
  const btnLogin = document.getElementById('btnLogin');

  editables.forEach(el => {
    el.contentEditable = enabled ? "true" : "false";
    if (enabled) {
      el.classList.add('border-b', 'border-amber-400/50');
    } else {
      el.classList.remove('border-b', 'border-amber-400/50');
    }
  });

  if (adminPanel) adminPanel.classList.toggle('hidden', !enabled);
  if (editStatusText) {
    editStatusText.innerText = enabled ? "Mode Edit AKTIF (Logged in as Admin)" : "Mode Terkunci (Login Admin untuk Edit)";
  }
  if (btnLogin) {
    btnLogin.innerHTML = enabled ? '<i class="fa-solid fa-lock"></i> Logout Admin' : '<i class="fa-solid fa-key"></i> Login Admin';
    btnLogin.className = enabled 
      ? 'bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition'
      : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition';
  }
}

// 5. Inisialisasi Otomatis & Listener Realtime Polling
document.addEventListener('DOMContentLoaded', () => {
  fetchReportData();
  
  // Polling data tiap 5 detik agar device lain menerima perubahan secara aktual
  setInterval(fetchReportData, 5000);

  if (authToken) {
    setAdminUIState(true);
  }
});
