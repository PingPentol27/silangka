/**
 * ============================================================
 *  SILANGKA 2.1 — Backend API (Google Apps Script)
 *  Sistem Informasi Laporan Satwa Langka
 *  PT Arutmin Indonesia Tambang Senakin × BKSDA Kalimantan Selatan
 * ------------------------------------------------------------
 *  TEMPEL di: Google Sheet > Ekstensi > Apps Script > file Code.gs
 *  (hapus seluruh isi lama, lalu tempel seluruh file ini)
 *
 *  UPGRADE dari 2.0:
 *    1. Tempel file ini → Simpan.
 *    2. Pilih fungsi "setupAwal" → Jalankan → izinkan akses baru
 *       (dibutuhkan untuk Telegram). Data lama TIDAK terhapus.
 *    3. Pilih fungsi "pasangPemicu" → Jalankan (pengingat SLA tiap jam).
 *    4. Terapkan > Kelola deployment > ikon pensil > Versi: Versi baru > Terapkan.
 * ============================================================
 */

// ---------- KONSTANTA ----------
var VERSI = '2.1.0';

var SKEMA = {
  Pengguna: ['id', 'nama', 'email', 'wa', 'hash', 'salt', 'peran', 'instansi', 'aktif', 'dibuat', 'login_terakhir'],
  Sesi: ['token', 'user_id', 'kedaluwarsa', 'dibuat'],
  Laporan: ['id', 'dibuat', 'waktu_temuan', 'jenis', 'prioritas', 'spesies_id', 'spesies_nama', 'spesies_terverifikasi',
    'jumlah', 'kondisi', 'deskripsi', 'lat', 'lng', 'akurasi', 'wilayah', 'foto_ids', 'pelapor_id', 'pelapor_nama',
    'pelapor_wa', 'anonim', 'kode_hash', 'status', 'disposisi', 'petugas_id', 'direspons_pada', 'diverifikasi_pada',
    'diperbarui', 'client_id', 'perangkat', 'pj_id', 'pj_nama', 'sla_diingatkan'],
  Riwayat: ['id', 'laporan_id', 'waktu', 'status', 'judul', 'catatan', 'oleh', 'publik'],
  Spesies: ['id', 'nama', 'nama_latin', 'nama_lokal', 'kelompok', 'iucn', 'cites', 'dilindungi', 'endemik',
    'ciri', 'habitat', 'panduan', 'foto_url', 'sembunyikan_peta', 'aktif', 'urutan', 'catatan_verifikasi'],
  Survei: ['id', 'tanggal', 'lokasi', 'metode', 'tim', 'habitat', 'catatan', 'oleh', 'dibuat'],
  SurveiData: ['survei_id', 'spesies_id', 'nama', 'jumlah'],
  Rescue: ['id', 'kode', 'laporan_id', 'spesies_id', 'nama', 'asal', 'detail', 'tahap', 'pj', 'lokasi_rilis',
    'dokumen', 'status', 'dibuat', 'diperbarui'],
  RescueLog: ['id', 'rescue_id', 'waktu', 'tahap', 'catatan', 'oleh'],
  FotoMasuk: ['id', 'file_id', 'url', 'tag', 'judul', 'kredit', 'fokus', 'urutan', 'aktif', 'mulai', 'selesai', 'dibuat'],
  Audit: ['waktu', 'user_id', 'email', 'aksi', 'laporan_id', 'detail'],
  Pengaturan: ['kunci', 'nilai', 'keterangan']
};

var JENIS = {
  jumpa: { label: 'Perjumpaan satwa', prioritas: 'Normal' },
  luka: { label: 'Satwa terluka / sakit', prioritas: 'Darurat' },
  konflik: { label: 'Masuk permukiman / konflik', prioritas: 'Darurat' },
  mati: { label: 'Satwa mati', prioritas: 'Normal' },
  buru: { label: 'Perburuan / perdagangan', prioritas: 'Tinggi' },
  pelihara: { label: 'Dipelihara warga', prioritas: 'Tinggi' }
};
var BOBOT_PRIORITAS = { Darurat: 0, Tinggi: 1, Normal: 2 };
var STATUS_TERBUKA = ['Terkirim', 'Diterima', 'Diverifikasi', 'Ditindaklanjuti'];
var STATUS_TERVERIFIKASI = ['Diverifikasi', 'Ditindaklanjuti', 'Selesai'];
var TAHAP_RESCUE = ['Evakuasi', 'Pemeriksaan', 'Rehabilitasi', 'Habituasi', 'Pelepasliaran', 'Monitoring'];

var PERAN_STAF = ['admin', 'verifikator', 'superadmin'];
var PERAN_VERIF = ['verifikator', 'superadmin'];
var PERAN_ADMIN = ['admin', 'superadmin'];

var AKSI_PETUGAS = {
  terima: { status: 'Diterima', judul: 'Diterima petugas', peran: PERAN_STAF },
  verifikasi: { status: 'Diverifikasi', judul: 'Diverifikasi BKSDA', peran: PERAN_VERIF },
  tindaklanjut: { status: 'Ditindaklanjuti', judul: 'Ditangani petugas', peran: PERAN_VERIF },
  selesai: { status: 'Selesai', judul: 'Selesai', peran: PERAN_VERIF },
  tidakvalid: { status: 'Tidak Valid', judul: 'Dinyatakan tidak valid', peran: PERAN_VERIF },
  catatan: { status: null, judul: 'Catatan petugas', peran: PERAN_STAF },
  pesan: { status: null, judul: 'Pesan dari petugas', peran: PERAN_STAF },
  tugaskan: { status: null, judul: 'Penanggung jawab ditetapkan', peran: PERAN_STAF }
};

// Pengaturan yang boleh diubah dari aplikasi (menu Pengaturan, khusus superadmin)
var SETELAN_BOLEH_UBAH = ['NAMA_INSTANSI', 'NOMOR_DARURAT', 'WA_DARURAT', 'EMAIL_KONTAK', 'EMAIL_NOTIF',
  'SLA_DARURAT_JAM', 'SLA_TINGGI_JAM', 'SLA_NORMAL_JAM', 'LOGIN_GANTI_DETIK', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID',
  'JEDA_PETA_HARI'];

// ---------- ENTRY POINT ----------
function doGet() {
  return json_({ ok: true, app: 'SILANGKA API', versi: VERSI });
}

function doPost(e) {
  var res;
  try {
    SETELAN_ = null; TABEL_ = {};
    var p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var aksi = String(p.action || '');
    var user = p.token ? userDariToken_(p.token) : null;
    var rute = {
      // publik
      config: function () { return config_(); },
      species: function () { return { species: daftarSpesies_() }; },
      submitReport: function () { return kirimLaporan_(p, user); },
      track: function () { return lacak_(p, user); },
      addInfo: function () { return tambahInfo_(p, user); },
      publicMap: function () { return petaPublik_(p); },
      register: function () { return daftar_(p); },
      login: function () { return masuk_(p); },
      logout: function () { return keluar_(p); },
      me: function () { wajib_(user); return { user: profil_(user) }; },
      myReports: function () { wajib_(user); return { reports: laporanSaya_(user) }; },
      changePassword: function () { wajib_(user); return gantiPassword_(user, p); },
      // petugas — laporan & kasus
      dashboard: function () { izin_(user, PERAN_STAF); return dasbor_(p); },
      staffList: function () { izin_(user, PERAN_STAF); return { reports: antrean_(p, user) }; },
      staffDetail: function () { izin_(user, PERAN_STAF); return detailPetugas_(p, user); },
      staffPhoto: function () { izin_(user, PERAN_STAF); return fotoPetugas_(p); },
      staffAction: function () { izin_(user, PERAN_STAF); return aksiPetugas_(p, user); },
      staffMap: function () { izin_(user, PERAN_STAF); return petaOperasional_(user); },
      staffUsers: function () { izin_(user, PERAN_STAF); return { staff: daftarStaf_() }; },
      staffExport: function () { izin_(user, PERAN_STAF); return ekspor_(user); },
      // konservasi
      surveyData: function () { izin_(user, PERAN_STAF); return dataSurvei_(p); },
      surveySave: function () { izin_(user, PERAN_STAF); return simpanSurvei_(p, user); },
      rescueList: function () { izin_(user, PERAN_STAF); return { rescues: daftarRescue_() }; },
      rescueDetail: function () { izin_(user, PERAN_STAF); return { rescue: detailRescue_(p.id) }; },
      rescueSave: function () { izin_(user, PERAN_STAF); return simpanRescue_(p, user); },
      rescueStep: function () { izin_(user, PERAN_STAF); return langkahRescue_(p, user); },
      monthly: function () { izin_(user, PERAN_STAF); return laporanBulanan_(p, user); },
      // admin
      slidesAdmin: function () { izin_(user, PERAN_ADMIN); return { slides: daftarSlide_(true) }; },
      slideSave: function () { izin_(user, PERAN_ADMIN); return simpanSlide_(p, user); },
      slideMove: function () { izin_(user, PERAN_ADMIN); return geserSlide_(p); },
      slideDelete: function () { izin_(user, PERAN_ADMIN); return hapusSlide_(p, user); },
      settingsGet: function () { izin_(user, ['superadmin']); return ambilSetelan_(); },
      settingsSave: function () { izin_(user, ['superadmin']); return simpanSetelan_(p, user); },
      telegramTest: function () { izin_(user, PERAN_ADMIN); return ujiTelegram_(); },
      usersList: function () { izin_(user, ['superadmin']); return { users: daftarPengguna_() }; },
      userSave: function () { izin_(user, ['superadmin']); return simpanPengguna_(p, user); }
    };
    if (!rute[aksi]) throw new Error('Aksi tidak dikenal: ' + aksi);
    res = rute[aksi]();
    res.ok = true;
  } catch (err) {
    res = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return json_(res);
}

// ---------- SETUP & UPGRADE (jalankan dari editor) ----------
function setupAwal() {
  SETELAN_ = null; TABEL_ = {};
  var ss = SpreadsheetApp.getActive();
  Object.keys(SKEMA).forEach(function (nama) {
    var sh = ss.getSheetByName(nama) || ss.insertSheet(nama);
    var h = SKEMA[nama];
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#16514D').setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
    } else {
      // migrasi: tambah kolom baru di ujung tanpa mengubah data lama
      var ada = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      h.forEach(function (k) {
        if (ada.indexOf(k) < 0) {
          var kol = sh.getLastColumn() + 1;
          sh.getRange(1, kol).setValues([[k]]).setFontWeight('bold').setBackground('#16514D').setFontColor('#FFFFFF');
          ada.push(k);
        }
      });
    }
    sh.getRange(1, 1, sh.getMaxRows(), sh.getLastColumn()).setNumberFormat('@');
  });
  var awal = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1');
  if (awal && ss.getSheets().length > 1) ss.deleteSheet(awal);
  SETELAN_ = null;

  var folderId = setelan_('FOLDER_FOTO_ID') || DriveApp.createFolder('SILANGKA - Foto Laporan (PRIVAT)').getId();
  var folderPublik = setelan_('FOLDER_FOTO_PUBLIK_ID') || DriveApp.createFolder('SILANGKA - Foto Publik (layar masuk & kamus)').getId();

  var bawaan = [
    ['NAMA_INSTANSI', 'PT Arutmin Indonesia Tambang Senakin × BKSDA Kalimantan Selatan', 'Tampil di aplikasi'],
    ['NOMOR_DARURAT', '', 'Nomor call center resmi BKSDA Kalsel (isi sendiri)'],
    ['WA_DARURAT', '', 'Nomor WhatsApp petugas (opsional, format 628xx)'],
    ['EMAIL_KONTAK', '', 'Email kontak publik'],
    ['EMAIL_NOTIF', Session.getActiveUser().getEmail(), 'Penerima email laporan Darurat/Tinggi (pisahkan koma)'],
    ['GRID_DERAJAT', '0.05', 'Ukuran kotak peta publik (0.05 derajat ≈ 5,5 km)'],
    ['JEDA_PETA_HARI', '30', 'Laporan tampil di peta publik setelah sekian hari sejak diverifikasi'],
    ['BATAS_LAPORAN_PER_JAM', '15', 'Batas laporan per perangkat per jam (anti-spam)'],
    ['FOLDER_FOTO_ID', folderId, 'Folder foto laporan — JANGAN dibagikan publik'],
    ['FOLDER_FOTO_PUBLIK_ID', folderPublik, 'Folder foto layar masuk (boleh publik)'],
    ['SLA_DARURAT_JAM', '2', 'Batas respons pertama laporan Darurat (jam) — sepakati dengan BKSDA'],
    ['SLA_TINGGI_JAM', '24', 'Batas respons pertama laporan Tinggi (jam)'],
    ['SLA_NORMAL_JAM', '72', 'Batas respons pertama laporan Normal (jam)'],
    ['LOGIN_GANTI_DETIK', '6', 'Jeda pergantian foto layar masuk (detik)'],
    ['TELEGRAM_BOT_TOKEN', '', 'Token bot dari @BotFather (RAHASIA)'],
    ['TELEGRAM_CHAT_ID', '', 'ID grup/akun Telegram petugas penerima notifikasi']
  ];
  var t = tabel_('Pengaturan');
  bawaan.forEach(function (b) {
    if (!t.rows.some(function (r) { return r.kunci === b[0]; })) tambah_('Pengaturan', { kunci: b[0], nilai: b[1], keterangan: b[2] });
  });
  SETELAN_ = null;

  if (tabel_('Spesies').rows.length === 0) isiSpesies_();

  var email = Session.getActiveUser().getEmail() || 'admin@silangka.local';
  if (!tabel_('Pengguna').rows.some(function (r) { return r.peran === 'superadmin'; })) {
    var pw = 'Slk-' + Utilities.getUuid().slice(0, 8);
    var salt = Utilities.getUuid();
    tambah_('Pengguna', {
      id: 'U-' + Utilities.getUuid().slice(0, 8), nama: 'Superadmin SILANGKA', email: email.toLowerCase(), wa: '',
      hash: hash_(pw, salt), salt: salt, peran: 'superadmin', instansi: 'PT Arutmin Indonesia Tambang Senakin',
      aktif: 'TRUE', dibuat: sekarang_(), login_terakhir: ''
    });
    Logger.log('=== AKUN SUPERADMIN ===');
    Logger.log('Email    : ' + email);
    Logger.log('Password : ' + pw);
  }
  // Sentuh layanan URL agar izin akses eksternal (Telegram) diminta sekarang
  try { if (setelan_('TELEGRAM_BOT_TOKEN')) UrlFetchApp.getRequest('https://api.telegram.org'); } catch (e) { }
  Logger.log('Setup/upgrade ke versi ' + VERSI + ' selesai. Data lama tetap aman.');
}

/** Pasang pengingat SLA otomatis tiap jam (jalankan sekali dari editor). */
function pasangPemicu() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'cekSLA') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('cekSLA').timeBased().everyHours(1).create();
  Logger.log('Pemicu cekSLA terpasang (tiap 1 jam).');
}

/** Dipanggil pemicu: kirim pengingat untuk laporan yang lewat SLA dan belum direspons. */
function cekSLA() {
  SETELAN_ = null; TABEL_ = {};
  var t = tabel_('Laporan');
  var telat = t.rows.filter(function (r) {
    var s = sla_(r);
    return STATUS_TERBUKA.indexOf(r.status) > -1 && !r.direspons_pada && s.lewat && !r.sla_diingatkan;
  });
  if (!telat.length) return;
  var baris = telat.slice(0, 10).map(function (r) {
    return '• <b>' + r.id + '</b> ' + r.prioritas + ' — ' + ((JENIS[r.jenis] || {}).label || r.jenis) + ' (' + r.wilayah + ') · ' + sla_(r).label;
  });
  kirimTelegram_('⏰ <b>Pengingat SLA SILANGKA</b>\n' + telat.length + ' laporan lewat batas respons:\n' + baris.join('\n'));
  telat.forEach(function (r) { ubah_(t, r, { sla_diingatkan: sekarang_() }); });
}

function resetPasswordSuperadmin() {
  var t = tabel_('Pengguna');
  var u = t.rows.filter(function (r) { return r.peran === 'superadmin'; })[0];
  if (!u) throw new Error('Superadmin belum ada. Jalankan setupAwal.');
  var pw = 'Slk-' + Utilities.getUuid().slice(0, 8);
  var salt = Utilities.getUuid();
  ubah_(t, u, { hash: hash_(pw, salt), salt: salt });
  Logger.log('Email: ' + u.email + ' | Password baru: ' + pw);
}

function isiSpesies_() {
  var cek = 'Status perlu dicocokkan dengan PermenLHK P.106/2018, IUCN Red List & CITES terbaru oleh BKSDA';
  var data = [
    ['SP01', 'Bekantan', 'Nasalis larvatus', 'Kera belanda', 'Primata', 'EN', 'I', 'TRUE', 'Endemik Borneo', 'Jantan berhidung besar menjuntai; rambut coklat kemerahan, bagian bawah pucat; ekor panjang; hidup berkelompok.', 'Hutan mangrove, rawa gambut, dan hutan tepi sungai. Pemakan daun, buah muda, dan bunga.', 'Jaga jarak dan tetap tenang. Jangan memberi makan atau mengejar. Foto tanpa flash dan catat jumlah individu.', 'FALSE'],
    ['SP02', 'Lutung Dahi Putih', 'Presbytis frontata', 'Lutung', 'Primata', 'VU', 'II', 'TRUE', 'Endemik Borneo', 'Tubuh abu-abu kehitaman dengan bercak putih di dahi; ekor panjang; bergerak di tajuk pohon.', 'Hutan dataran rendah dan perbukitan, termasuk hutan sekunder.', 'Amati dari jauh. Jangan menebang atau mengganggu pohon tempatnya beraktivitas.', 'FALSE'],
    ['SP03', 'Kukang Kalimantan', 'Nycticebus borneanus', 'Kukang / Putri Malu', 'Primata', 'VU', 'I', 'TRUE', 'Endemik Borneo', 'Primata kecil aktif malam, mata besar, gerakan lambat, garis gelap di wajah. Gigitannya berbisa.', 'Hutan dan kebun berpohon; sering ditemukan di pohon rendah pada malam hari.', 'JANGAN dipegang (gigitan berbisa). Jangan dipelihara. Laporkan bila ditemukan di permukiman atau dijual.', 'TRUE'],
    ['SP04', 'Trenggiling Sunda', 'Manis javanica', 'Tenggiling', 'Mamalia', 'CR', 'I', 'TRUE', '', 'Tubuh tertutup sisik keras coklat; menggulung seperti bola saat terancam; aktif malam.', 'Hutan, kebun, dan semak; memakan semut dan rayap.', 'Satwa paling rawan perburuan. Jangan sebarkan lokasi di media sosial. Laporkan segera.', 'TRUE'],
    ['SP05', 'Beruang Madu', 'Helarctos malayanus', 'Beruang', 'Mamalia', 'VU', 'I', 'TRUE', '', 'Beruang terkecil, rambut hitam pendek, tanda dada kuning/oranye berbentuk U.', 'Hutan dataran rendah; kadang mendekati kebun dan permukiman untuk mencari makan.', 'Berbahaya bila terdesak. Menjauh perlahan, jangan lari atau memberi makan. Laporkan sebagai konflik bila masuk permukiman.', 'FALSE'],
    ['SP06', 'Kancil', 'Tragulus kanchil', 'Pelanduk', 'Mamalia', 'LC', '', 'TRUE', '', 'Mamalia kecil berkuku, tinggi sekitar sejengkal, punggung coklat, garis putih di leher.', 'Lantai hutan dan semak lebat dekat sumber air.', 'Jangan ditangkap atau dijerat. Laporkan jerat yang ditemukan sebagai dugaan perburuan.', 'FALSE'],
    ['SP07', 'Rangkong Badak', 'Buceros rhinoceros', 'Enggang', 'Burung', 'VU', 'II', 'TRUE', '', 'Burung besar hitam-putih dengan cula oranye-merah melengkung di atas paruh; kepakan sayap terdengar keras.', 'Hutan primer dan sekunder tua dengan pohon tinggi berbuah.', 'Jangan mengganggu pohon sarang. Lokasi sarang sangat rahasia.', 'TRUE'],
    ['SP08', 'Elang Brontok', 'Nisaetus cirrhatus', 'Elang', 'Burung', 'LC', 'II', 'TRUE', '', 'Elang besar dengan dua fase warna (terang dan gelap); terbang berputar di atas hutan.', 'Tepi hutan, perkebunan, dan area terbuka berpohon.', 'Jangan menembak atau mengambil anakan dari sarang.', 'FALSE'],
    ['SP09', 'Buaya Muara', 'Crocodylus porosus', 'Buaya', 'Reptil', 'LC', 'I/II', 'TRUE', '', 'Reptil besar berwarna kelabu kehijauan, moncong lebar.', 'Muara sungai, rawa, mangrove, dan sungai besar.', 'Berbahaya. Jauhi tepi air, jangan memberi makan. Laporkan bila mendekati permukiman.', 'FALSE'],
    ['SP10', 'Belangkas Bakau', 'Carcinoscorpius rotundicauda', 'Mimi / Belangkas', 'Pesisir', 'DD', '', 'TRUE', '', 'Hewan laut bercangkang tapal kuda, ekor runcing berbentuk bulat; bukan kepiting.', 'Pantai berlumpur dan hutan mangrove.', 'Jangan diambil untuk dikonsumsi atau dijual. Lepaskan bila tersangkut jaring.', 'FALSE']
  ];
  data.forEach(function (d, i) {
    tambah_('Spesies', {
      id: d[0], nama: d[1], nama_latin: d[2], nama_lokal: d[3], kelompok: d[4], iucn: d[5], cites: d[6], dilindungi: d[7],
      endemik: d[8], ciri: d[9], habitat: d[10], panduan: d[11], foto_url: '', sembunyikan_peta: d[12], aktif: 'TRUE',
      urutan: String(i + 1), catatan_verifikasi: cek
    });
  });
}

// ---------- PUBLIK ----------
function config_() {
  var total = tabel_('Laporan').rows.filter(function (r) { return STATUS_TERVERIFIKASI.indexOf(r.status) > -1; }).length;
  var dilepas = 0;
  try { dilepas = tabel_('Rescue').rows.filter(function (r) { return Number(r.tahap) >= 4; }).length; } catch (e) { }
  return {
    versi: VERSI, instansi: setelan_('NAMA_INSTANSI'), nomorDarurat: setelan_('NOMOR_DARURAT'),
    waDarurat: setelan_('WA_DARURAT'), emailKontak: setelan_('EMAIL_KONTAK'),
    totalTerverifikasi: total, totalSpesies: daftarSpesies_().length, totalDilepas: dilepas,
    slides: daftarSlide_(false), loginDetik: Number(setelan_('LOGIN_GANTI_DETIK') || 6), jenis: JENIS
  };
}

function daftarSpesies_() {
  return tabel_('Spesies').rows
    .filter(function (r) { return bool_(r.aktif); })
    .sort(function (a, b) { return Number(a.urutan || 999) - Number(b.urutan || 999); })
    .map(function (r) {
      return {
        id: r.id, nama: r.nama, latin: r.nama_latin, lokal: r.nama_lokal, kelompok: r.kelompok, iucn: r.iucn, cites: r.cites,
        dilindungi: bool_(r.dilindungi), endemik: r.endemik, ciri: r.ciri, habitat: r.habitat, panduan: r.panduan, foto: r.foto_url
      };
    });
}

function kirimLaporan_(p, user) {
  var r = p.report || {};
  if (!JENIS[r.jenis]) throw new Error('Jenis kejadian tidak valid.');
  var lat = Number(r.lat), lng = Number(r.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Lokasi belum diisi atau tidak valid.');
  if (!r.kode || String(r.kode).length < 6) throw new Error('Kode lacak tidak valid.');
  var fotos = (r.fotos || []).slice(0, 3);
  fotos.forEach(function (f) { if (String(f).length > 3000000) throw new Error('Ukuran foto terlalu besar.'); });

  var cache = CacheService.getScriptCache();
  var kunciRL = 'rl_' + String(r.perangkat || 'x').slice(0, 40);
  var jml = Number(cache.get(kunciRL) || 0);
  if (jml >= Number(setelan_('BATAS_LAPORAN_PER_JAM') || 15)) throw new Error('Terlalu banyak laporan dari perangkat ini. Coba lagi 1 jam lagi.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var id, jenis = JENIS[r.jenis], sp;
  try {
    var t = tabel_('Laporan');
    var dup = t.rows.filter(function (x) { return r.clientId && x.client_id === String(r.clientId); })[0];
    if (dup) return { id: dup.id, status: dup.status, duplikat: true };
    id = idLaporan_();
    var ids = simpanFoto_(fotos, setelan_('FOLDER_FOTO_ID'), id, false);
    sp = r.spesiesId ? daftarSpesies_().filter(function (s) { return s.id === r.spesiesId; })[0] : null;
    var anonim = bool_(r.anonim) || r.jenis === 'buru';
    var now = sekarang_();
    tambah_('Laporan', {
      id: id, dibuat: now, waktu_temuan: String(r.waktuTemuan || now), jenis: r.jenis, prioritas: jenis.prioritas,
      spesies_id: sp ? sp.id : '', spesies_nama: sp ? sp.nama : (bersih_(r.spesiesLain, 80) || 'Belum teridentifikasi'),
      spesies_terverifikasi: '', jumlah: String(Math.max(1, Math.min(999, Number(r.jumlah) || 1))),
      kondisi: bersih_(r.kondisi, 40), deskripsi: bersih_(r.deskripsi, 1500),
      lat: lat.toFixed(6), lng: lng.toFixed(6), akurasi: String(Math.round(Number(r.akurasi) || 0)),
      wilayah: wilayah_(lat, lng), foto_ids: ids.join(','),
      pelapor_id: anonim ? '' : (user ? user.id : ''), pelapor_nama: anonim ? '' : bersih_(user ? user.nama : r.nama, 80),
      pelapor_wa: anonim ? '' : bersih_(user ? user.wa : r.wa, 20), anonim: anonim ? 'TRUE' : 'FALSE',
      kode_hash: hash_(String(r.kode), id), status: 'Terkirim', disposisi: '', petugas_id: '', direspons_pada: '',
      diverifikasi_pada: '', diperbarui: now, client_id: String(r.clientId || ''), perangkat: String(r.perangkat || '').slice(0, 40),
      pj_id: '', pj_nama: '', sla_diingatkan: ''
    });
    catatRiwayat_(id, 'Terkirim', 'Laporan terkirim', r.offline ? 'Dibuat saat offline, terkirim otomatis.' : '', 'Pelapor', true);
    cache.put(kunciRL, String(jml + 1), 3600);
  } finally {
    lock.releaseLock();
  }
  if (jenis.prioritas !== 'Normal') notifikasi_(id, jenis, sp, lat, lng);
  return { id: id, status: 'Terkirim' };
}

function lacak_(p, user) {
  var r = tabel_('Laporan').rows.filter(function (x) { return x.id === String(p.id || '').trim().toUpperCase(); })[0];
  if (!r) throw new Error('Laporan tidak ditemukan.');
  var sah = (p.kode && hash_(String(p.kode).trim().toUpperCase(), r.id) === r.kode_hash) ||
    (user && (r.pelapor_id === user.id || PERAN_STAF.indexOf(user.peran) > -1));
  if (!sah) throw new Error('Kode lacak salah.');
  return { report: ringkasPublik_(r, true) };
}

function tambahInfo_(p, user) {
  var t = tabel_('Laporan');
  var r = t.rows.filter(function (x) { return x.id === String(p.id || ''); })[0];
  if (!r) throw new Error('Laporan tidak ditemukan.');
  var sah = (p.kode && hash_(String(p.kode).toUpperCase(), r.id) === r.kode_hash) || (user && r.pelapor_id === user.id);
  if (!sah) throw new Error('Tidak berhak menambah info.');
  var pesan = bersih_(p.pesan, 1000);
  var fotos = (p.fotos || []).slice(0, 2);
  if (!pesan && !fotos.length) throw new Error('Isi pesan atau foto.');
  var ids = simpanFoto_(fotos, setelan_('FOLDER_FOTO_ID'), r.id + '_tambahan_' + Date.now(), false);
  if (ids.length) ubah_(t, r, { foto_ids: [r.foto_ids].concat(ids).filter(String).join(','), diperbarui: sekarang_() });
  catatRiwayat_(r.id, '', 'Info tambahan dari pelapor', pesan + (ids.length ? ' (+' + ids.length + ' foto)' : ''), 'Pelapor', true);
  return { report: ringkasPublik_(tabel_('Laporan').rows.filter(function (x) { return x.id === r.id; })[0], true) };
}

function petaPublik_(p) {
  var grid = Number(setelan_('GRID_DERAJAT') || 0.05);
  var jeda = Number(setelan_('JEDA_PETA_HARI') || 30);
  var bulan = Math.max(1, Math.min(60, Number(p.bulan) || 12));
  var kelompok = String(p.kelompok || '');
  var batasJeda = Date.now() - jeda * 864e5, batasAwal = Date.now() - bulan * 30 * 864e5;
  var sp = {};
  tabel_('Spesies').rows.forEach(function (s) { sp[s.id] = s; });
  var sel = {};
  tabel_('Laporan').rows.forEach(function (r) {
    if (STATUS_TERVERIFIKASI.indexOf(r.status) < 0 || r.jenis === 'buru' || r.jenis === 'pelihara') return;
    var s = sp[r.spesies_terverifikasi || r.spesies_id];
    if (!s || bool_(s.sembunyikan_peta) || (kelompok && s.kelompok !== kelompok)) return;
    var tv = Date.parse(r.diverifikasi_pada || r.dibuat);
    if (!(tv <= batasJeda) || Date.parse(r.dibuat) < batasAwal) return;
    var la = Math.floor(Number(r.lat) / grid) * grid, lo = Math.floor(Number(r.lng) / grid) * grid;
    var k = la.toFixed(4) + ',' + lo.toFixed(4);
    sel[k] = (sel[k] || 0) + 1;
  });
  return {
    grid: grid, jedaHari: jeda,
    cells: Object.keys(sel).map(function (k) { var a = k.split(','); return { lat: Number(a[0]), lng: Number(a[1]), n: sel[k] }; })
  };
}

// ---------- AKUN ----------
function daftar_(p) {
  var email = String(p.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email tidak valid.');
  if (String(p.password || '').length < 8) throw new Error('Password minimal 8 karakter.');
  var nama = bersih_(p.nama, 80);
  if (!nama) throw new Error('Nama wajib diisi.');
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    if (tabel_('Pengguna').rows.some(function (r) { return r.email === email; })) throw new Error('Email sudah terdaftar. Silakan masuk.');
    var salt = Utilities.getUuid();
    tambah_('Pengguna', {
      id: 'U-' + Utilities.getUuid().slice(0, 8), nama: nama, email: email, wa: bersih_(p.wa, 20), hash: hash_(String(p.password), salt),
      salt: salt, peran: 'pelapor', instansi: bersih_(p.instansi, 80), aktif: 'TRUE', dibuat: sekarang_(), login_terakhir: ''
    });
  } finally { lock.releaseLock(); }
  return masuk_({ email: email, password: p.password });
}

function masuk_(p) {
  var email = String(p.email || '').trim().toLowerCase();
  var t = tabel_('Pengguna');
  var u = t.rows.filter(function (r) { return r.email === email; })[0];
  if (!u || hash_(String(p.password || ''), u.salt) !== u.hash) throw new Error('Email atau password salah.');
  if (!bool_(u.aktif)) throw new Error('Akun dinonaktifkan. Hubungi admin.');
  var token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  tambah_('Sesi', { token: token, user_id: u.id, kedaluwarsa: new Date(Date.now() + 30 * 864e5).toISOString(), dibuat: sekarang_() });
  ubah_(t, u, { login_terakhir: sekarang_() });
  CacheService.getScriptCache().put('tk_' + token, u.id, 21600);
  return { token: token, user: profil_(u) };
}

function keluar_(p) {
  if (!p.token) return {};
  CacheService.getScriptCache().remove('tk_' + p.token);
  var t = tabel_('Sesi');
  var s = t.rows.filter(function (r) { return r.token === p.token; })[0];
  if (s) ubah_(t, s, { kedaluwarsa: new Date(0).toISOString() });
  return {};
}

function gantiPassword_(user, p) {
  var t = tabel_('Pengguna');
  var u = t.rows.filter(function (r) { return r.id === user.id; })[0];
  if (hash_(String(p.lama || ''), u.salt) !== u.hash) throw new Error('Password lama salah.');
  if (String(p.baru || '').length < 8) throw new Error('Password baru minimal 8 karakter.');
  var salt = Utilities.getUuid();
  ubah_(t, u, { hash: hash_(String(p.baru), salt), salt: salt });
  return {};
}

function laporanSaya_(user) {
  return tabel_('Laporan').rows.filter(function (r) { return r.pelapor_id === user.id; })
    .reverse().slice(0, 100).map(function (r) { return ringkasPublik_(r, false); });
}

// ---------- SLA ----------
function targetSLA_(prio) {
  var k = { Darurat: 'SLA_DARURAT_JAM', Tinggi: 'SLA_TINGGI_JAM', Normal: 'SLA_NORMAL_JAM' }[prio] || 'SLA_NORMAL_JAM';
  return Number(setelan_(k) || { Darurat: 2, Tinggi: 24, Normal: 72 }[prio] || 72);
}
function sla_(r) {
  var target = targetSLA_(r.prioritas), mulai = Date.parse(r.dibuat);
  var respons = r.direspons_pada ? Date.parse(r.direspons_pada) : null;
  if (respons) {
    var dur = (respons - mulai) / 36e5;
    return { selesai: true, jam: dur, tepat: dur <= target, lewat: false, label: 'Respons ' + jamTeks_(dur), target: target };
  }
  if (STATUS_TERBUKA.indexOf(r.status) < 0) return { selesai: true, jam: null, tepat: false, lewat: false, label: r.status, target: target };
  var sisa = target - (Date.now() - mulai) / 36e5;
  return { selesai: false, jam: null, tepat: sisa >= 0, lewat: sisa < 0, label: sisa >= 0 ? 'Sisa ' + jamTeks_(sisa) : 'Lewat ' + jamTeks_(-sisa), target: target };
}
function jamTeks_(h) {
  if (h < 1) return Math.max(1, Math.round(h * 60)) + ' mnt';
  if (h < 48) return String(Math.round(h * 10) / 10).replace('.', ',') + ' jam';
  return Math.round(h / 24) + ' hari';
}
function median_(arr) {
  if (!arr.length) return null;
  var a = arr.slice().sort(function (x, y) { return x - y; }), m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

// ---------- DASHBOARD ----------
function dasbor_(p) {
  var hari = [7, 30, 365].indexOf(Number(p.hari)) > -1 ? Number(p.hari) : 30;
  var now = Date.now(), awal = now - hari * 864e5, awalPrev = awal - hari * 864e5;
  var rows = tabel_('Laporan').rows;
  var spMap = {};
  tabel_('Spesies').rows.forEach(function (s) { spMap[s.id] = s; });
  function namaSp(r) { var id = r.spesies_terverifikasi || r.spesies_id; return id && spMap[id] ? spMap[id].nama : r.spesies_nama; }
  var di = rows.filter(function (r) { return Date.parse(r.dibuat) >= awal; });
  var prev = rows.filter(function (r) { var t = Date.parse(r.dibuat); return t >= awalPrev && t < awal; });
  function respons(arr) { return arr.filter(function (r) { return r.direspons_pada; }).map(function (r) { return (Date.parse(r.direspons_pada) - Date.parse(r.dibuat)) / 36e5; }); }
  function distinctSp(arr) { var o = {}; arr.forEach(function (r) { var n = namaSp(r); if (n && n !== 'Belum teridentifikasi') o[n] = 1; }); return Object.keys(o).length; }
  var terbuka = rows.filter(function (r) { return STATUS_TERBUKA.indexOf(r.status) > -1; });
  var lewat = terbuka.filter(function (r) { return sla_(r).lewat; });

  // sparkline 8 ember
  function spark(fn) {
    var out = [], step = hari * 864e5 / 8;
    for (var i = 0; i < 8; i++) {
      var a = awal + i * step, b = a + step;
      out.push(fn(rows.filter(function (r) { var t = Date.parse(r.dibuat); return t >= a && t < b; })));
    }
    return out;
  }
  // tren mingguan 12 minggu
  var mingguan = [];
  for (var w = 11; w >= 0; w--) {
    var b0 = now - (w + 1) * 7 * 864e5, b1 = now - w * 7 * 864e5;
    var ws = rows.filter(function (r) { var t = Date.parse(r.dibuat); return t >= b0 && t < b1; });
    mingguan.push({
      label: Utilities.formatDate(new Date(b0 + 864e5), 'Asia/Makassar', 'dd/MM'),
      d: ws.filter(function (r) { return r.prioritas === 'Darurat'; }).length,
      t: ws.filter(function (r) { return r.prioritas === 'Tinggi'; }).length,
      n: ws.filter(function (r) { return r.prioritas === 'Normal'; }).length
    });
  }
  var jenis = {};
  di.forEach(function (r) { jenis[r.jenis] = (jenis[r.jenis] || 0) + 1; });
  var slaPrio = ['Darurat', 'Tinggi', 'Normal'].map(function (pr) {
    var arr = di.filter(function (r) { return r.prioritas === pr; });
    var dinilai = arr.filter(function (r) { var s = sla_(r); return s.selesai || s.lewat; });
    var tepat = dinilai.filter(function (r) { return sla_(r).tepat; });
    return { prioritas: pr, target: targetSLA_(pr), total: dinilai.length, pct: dinilai.length ? Math.round(tepat.length / dinilai.length * 100) : null };
  });
  var cnt = {}, cntPrev = {};
  di.forEach(function (r) { var n = namaSp(r); if (n !== 'Belum teridentifikasi') cnt[n] = (cnt[n] || 0) + 1; });
  prev.forEach(function (r) { var n = namaSp(r); cntPrev[n] = (cntPrev[n] || 0) + 1; });
  var latinOf = {};
  Object.keys(spMap).forEach(function (k) { latinOf[spMap[k].nama] = spMap[k].nama_latin; });
  var topSp = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 5).map(function (n) {
    return { nama: n, latin: latinOf[n] || '', n: cnt[n], tren: cnt[n] > (cntPrev[n] || 0) ? 'naik' : cnt[n] < (cntPrev[n] || 0) ? 'turun' : 'tetap' };
  });
  var pengguna = {};
  tabel_('Pengguna').rows.forEach(function (u) { pengguna[u.id] = u; });
  var tim = {};
  di.forEach(function (r) {
    var id = r.pj_id || r.petugas_id;
    if (!id || !pengguna[id]) return;
    tim[id] = tim[id] || { kasus: 0, resp: [] };
    tim[id].kasus++;
    if (r.direspons_pada && r.petugas_id === id) tim[id].resp.push((Date.parse(r.direspons_pada) - Date.parse(r.dibuat)) / 36e5);
  });
  var timArr = Object.keys(tim).map(function (id) {
    var m = median_(tim[id].resp);
    return { nama: pengguna[id].nama, peran: pengguna[id].peran, instansi: pengguna[id].instansi, kasus: tim[id].kasus, median: m == null ? '—' : jamTeks_(m) };
  }).sort(function (a, b) { return b.kasus - a.kasus; }).slice(0, 6);
  var audit = tabel_('Audit').rows.slice(-8).reverse().map(function (a) {
    var u = pengguna[a.user_id];
    return { waktu: a.waktu, nama: u ? u.nama : (a.email || 'Sistem'), aksi: a.aksi, laporan: a.laporan_id };
  });
  var feed = terbuka.slice().sort(function (a, b) {
    return (BOBOT_PRIORITAS[a.prioritas] - BOBOT_PRIORITAS[b.prioritas]) || String(b.dibuat).localeCompare(String(a.dibuat));
  }).slice(0, 6).map(ringkasStaf_);
  var mR = median_(respons(di)), mP = median_(respons(prev));
  var rescueAktif = 0;
  try { rescueAktif = tabel_('Rescue').rows.filter(function (r) { return r.status === 'Aktif'; }).length; } catch (e) { }
  return {
    hari: hari,
    kpi: {
      masuk: di.length, masukPrev: prev.length,
      menunggu: rows.filter(function (r) { return r.status === 'Terkirim' || r.status === 'Diterima'; }).length,
      belumDitugaskan: terbuka.filter(function (r) { return !r.pj_id; }).length,
      daruratTerbuka: terbuka.filter(function (r) { return r.prioritas === 'Darurat'; }).length,
      lewatSLA: lewat.length,
      medianJam: mR, medianPrevJam: mP, medianTeks: mR == null ? '—' : jamTeks_(mR),
      spesies: distinctSp(di), spesiesPrev: distinctSp(prev), rescueAktif: rescueAktif
    },
    spark: {
      masuk: spark(function (a) { return a.length; }),
      darurat: spark(function (a) { return a.filter(function (r) { return r.prioritas === 'Darurat'; }).length; }),
      spesies: spark(distinctSp)
    },
    mingguan: mingguan, jenis: jenis, sla: slaPrio, topSpesies: topSp, tim: timArr, audit: audit, feed: feed,
    lewat: lewat.slice(0, 3).map(ringkasStaf_)
  };
}

function ringkasStaf_(r) {
  var s = sla_(r);
  return {
    id: r.id, dibuat: r.dibuat, waktuTemuan: r.waktu_temuan, jenis: r.jenis, prioritas: r.prioritas,
    spesies: r.spesies_terverifikasi ? (spesiesNama_(r.spesies_terverifikasi) || r.spesies_nama) : r.spesies_nama,
    jumlah: r.jumlah, wilayah: r.wilayah, status: r.status, anonim: bool_(r.anonim),
    foto: r.foto_ids ? r.foto_ids.split(',').length : 0, pjId: r.pj_id, pjNama: r.pj_nama,
    sla: s.label, slaLewat: s.lewat, slaSelesai: s.selesai, slaTepat: s.tepat
  };
}

function antrean_(p, user) {
  var q = String(p.q || '').toLowerCase();
  var batasSelesai = Date.now() - 30 * 864e5;
  var rows = tabel_('Laporan').rows.filter(function (r) {
    if (p.status === 'terbuka' && STATUS_TERBUKA.indexOf(r.status) < 0) return false;
    if (p.status === 'papan' && STATUS_TERBUKA.indexOf(r.status) < 0 && Date.parse(r.diperbarui || r.dibuat) < batasSelesai) return false;
    if (p.status && ['terbuka', 'papan'].indexOf(p.status) < 0 && r.status !== p.status) return false;
    if (p.prioritas && r.prioritas !== p.prioritas) return false;
    if (p.jenis && r.jenis !== p.jenis) return false;
    if (p.saya && r.pj_id !== user.id) return false;
    if (p.belumDitugaskan && (r.pj_id || STATUS_TERBUKA.indexOf(r.status) < 0)) return false;
    if (p.lewat && !sla_(r).lewat) return false;
    if (q && (r.id + ' ' + r.spesies_nama + ' ' + r.wilayah + ' ' + r.deskripsi + ' ' + r.pj_nama).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  rows.sort(function (a, b) {
    var ta = STATUS_TERBUKA.indexOf(a.status) > -1 ? 0 : 1, tb = STATUS_TERBUKA.indexOf(b.status) > -1 ? 0 : 1;
    if (ta !== tb) return ta - tb;
    var pa = BOBOT_PRIORITAS[a.prioritas], pb = BOBOT_PRIORITAS[b.prioritas];
    if (pa !== pb) return pa - pb;
    return String(b.dibuat).localeCompare(String(a.dibuat));
  });
  return rows.slice(0, 400).map(ringkasStaf_);
}

function detailPetugas_(p, user) {
  var r = tabel_('Laporan').rows.filter(function (x) { return x.id === p.id; })[0];
  if (!r) throw new Error('Laporan tidak ditemukan.');
  if (!p.tanpaAudit) audit_(user, 'lihat_koordinat', r.id, '');
  var riwayat = tabel_('Riwayat').rows.filter(function (h) { return h.laporan_id === r.id; }).map(function (h) {
    return { waktu: h.waktu, status: h.status, judul: h.judul, catatan: h.catatan, oleh: h.oleh, publik: bool_(h.publik) };
  });
  var rescue = null;
  try { rescue = tabel_('Rescue').rows.filter(function (x) { return x.laporan_id === r.id; }).map(function (x) { return { id: x.id, kode: x.kode, tahap: TAHAP_RESCUE[Number(x.tahap)] }; })[0] || null; } catch (e) { }
  var s = sla_(r);
  return {
    report: {
      id: r.id, dibuat: r.dibuat, waktuTemuan: r.waktu_temuan, jenis: r.jenis, prioritas: r.prioritas,
      spesiesId: r.spesies_terverifikasi || r.spesies_id, spesies: r.spesies_nama,
      spesiesTerverifikasi: r.spesies_terverifikasi ? spesiesNama_(r.spesies_terverifikasi) : '',
      jumlah: r.jumlah, kondisi: r.kondisi, deskripsi: r.deskripsi, lat: Number(r.lat), lng: Number(r.lng),
      akurasi: r.akurasi, wilayah: r.wilayah, fotoIds: r.foto_ids ? r.foto_ids.split(',') : [],
      anonim: bool_(r.anonim), pelaporNama: r.pelapor_nama, pelaporWa: r.pelapor_wa,
      status: r.status, disposisi: r.disposisi, pjId: r.pj_id, pjNama: r.pj_nama,
      sla: s.label, slaLewat: s.lewat, slaTarget: s.target, riwayat: riwayat, rescue: rescue
    }
  };
}

function fotoPetugas_(p) {
  var f = DriveApp.getFileById(String(p.fileId));
  var parents = f.getParents(), ok = false, fid = setelan_('FOLDER_FOTO_ID');
  while (parents.hasNext()) { if (parents.next().getId() === fid) ok = true; }
  if (!ok) throw new Error('Foto tidak diizinkan.');
  return { mime: f.getMimeType(), data: Utilities.base64Encode(f.getBlob().getBytes()) };
}

function aksiPetugas_(p, user) {
  var def = AKSI_PETUGAS[p.aksi];
  if (!def) throw new Error('Aksi petugas tidak dikenal.');
  izin_(user, def.peran);
  var pjBaru = null;
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var t = tabel_('Laporan');
    var r = t.rows.filter(function (x) { return x.id === p.id; })[0];
    if (!r) throw new Error('Laporan tidak ditemukan.');
    var now = sekarang_();
    var ubahan = { diperbarui: now };
    if (p.aksi !== 'tugaskan') ubahan.petugas_id = user.id;
    if (!r.direspons_pada && ['catatan', 'tugaskan'].indexOf(p.aksi) < 0) ubahan.direspons_pada = now;
    if (def.status) ubahan.status = def.status;
    if (p.aksi === 'verifikasi') ubahan.diverifikasi_pada = now;
    if (p.spesiesId && PERAN_VERIF.indexOf(user.peran) > -1) ubahan.spesies_terverifikasi = String(p.spesiesId);
    if (p.disposisi && PERAN_VERIF.indexOf(user.peran) > -1) ubahan.disposisi = bersih_(p.disposisi, 120);
    var catatan = bersih_(p.catatan, 1000);
    if (p.aksi === 'tugaskan') {
      pjBaru = tabel_('Pengguna').rows.filter(function (u) { return u.id === p.pjId && PERAN_STAF.indexOf(u.peran) > -1; })[0];
      if (!pjBaru) throw new Error('Pilih petugas yang valid.');
      ubahan.pj_id = pjBaru.id; ubahan.pj_nama = pjBaru.nama;
      catatan = 'Ditugaskan ke ' + pjBaru.nama + (catatan ? ' — ' + catatan : '');
    }
    ubah_(t, r, ubahan);
    if (p.spesiesId) catatan = (catatan ? catatan + ' ' : '') + '(Spesies: ' + (spesiesNama_(p.spesiesId) || p.spesiesId) + ')';
    if (p.disposisi) catatan = (catatan ? catatan + ' ' : '') + '(Disposisi: ' + bersih_(p.disposisi, 120) + ')';
    var publik = ['catatan', 'tugaskan'].indexOf(p.aksi) > -1 ? false : (p.aksi === 'pesan' ? true : p.publik !== false);
    catatRiwayat_(r.id, def.status || '', def.judul, catatan, user.nama + ' (' + user.peran + ')', publik);
    audit_(user, 'aksi_' + p.aksi, r.id, catatan.slice(0, 200));
  } finally { lock.releaseLock(); }
  if (pjBaru) {
    var rr = tabel_('Laporan').rows.filter(function (x) { return x.id === p.id; })[0];
    kirimTelegram_('📌 <b>' + rr.id + '</b> ditugaskan ke <b>' + pjBaru.nama + '</b>\n' + rr.prioritas + ' · ' +
      ((JENIS[rr.jenis] || {}).label || '') + ' · ' + rr.spesies_nama + ' · ' + rr.wilayah + '\nOleh: ' + user.nama);
  }
  return detailPetugas_({ id: p.id, tanpaAudit: true }, user);
}

function petaOperasional_(user) {
  audit_(user, 'lihat_peta_operasional', '', '');
  var batas = Date.now() - 90 * 864e5;
  return {
    points: tabel_('Laporan').rows.filter(function (r) {
      return STATUS_TERBUKA.indexOf(r.status) > -1 || Date.parse(r.dibuat) >= batas;
    }).filter(function (r) { return r.status !== 'Tidak Valid'; }).map(function (r) {
      var o = ringkasStaf_(r); o.lat = Number(r.lat); o.lng = Number(r.lng); return o;
    })
  };
}

function daftarStaf_() {
  return tabel_('Pengguna').rows.filter(function (u) { return bool_(u.aktif) && PERAN_STAF.indexOf(u.peran) > -1; })
    .map(function (u) { return { id: u.id, nama: u.nama, peran: u.peran, instansi: u.instansi }; });
}

function ekspor_(user) {
  audit_(user, 'ekspor_data', '', 'Ekspor seluruh laporan');
  return {
    rows: tabel_('Laporan').rows.map(function (r) {
      return {
        id: r.id, dibuat: r.dibuat, waktu_temuan: r.waktu_temuan, jenis: (JENIS[r.jenis] || {}).label || r.jenis,
        prioritas: r.prioritas, spesies: r.spesies_terverifikasi ? spesiesNama_(r.spesies_terverifikasi) : r.spesies_nama,
        jumlah: r.jumlah, kondisi: r.kondisi, wilayah: r.wilayah, lat: r.lat, lng: r.lng, status: r.status,
        penanggung_jawab: r.pj_nama, sla: sla_(r).label, disposisi: r.disposisi, anonim: r.anonim
      };
    })
  };
}

// ---------- SURVEI & INDEKS KEHATI ----------
function indeks_(counts) {
  var keys = Object.keys(counts).filter(function (k) { return counts[k] > 0; });
  var N = keys.reduce(function (a, k) { return a + counts[k]; }, 0), S = keys.length;
  if (!N) return { N: 0, S: 0, H: 0, E: 0, kategori: '—' };
  var H = -keys.reduce(function (a, k) { var p = counts[k] / N; return a + p * Math.log(p); }, 0);
  var E = S > 1 ? H / Math.log(S) : 0;
  return { N: N, S: S, H: Math.round(H * 100) / 100, E: Math.round(E * 100) / 100, kategori: H < 1 ? 'Rendah' : H <= 3 ? 'Sedang' : 'Tinggi' };
}
function semester_(tgl) {
  var d = new Date(tgl);
  return d.getFullYear() + '-S' + (d.getMonth() < 6 ? 1 : 2);
}

function dataSurvei_(p) {
  var surv = tabel_('Survei').rows, dataAll = tabel_('SurveiData').rows;
  var lokasiList = [];
  surv.forEach(function (s) { if (s.lokasi && lokasiList.indexOf(s.lokasi) < 0) lokasiList.push(s.lokasi); });
  var lok = String(p.lokasi || '');
  var pilih = surv.filter(function (s) { return !lok || s.lokasi === lok; });
  var ids = {};
  pilih.forEach(function (s) { ids[s.id] = s; });
  var spMap = {};
  tabel_('Spesies').rows.forEach(function (s) { spMap[s.id] = s; });
  function kunci(d) { return d.spesies_id && spMap[d.spesies_id] ? spMap[d.spesies_id].nama : d.nama; }
  var counts = {}, perSem = {}, metodeOf = {};
  dataAll.forEach(function (d) {
    var s = ids[d.survei_id];
    if (!s) return;
    var k = kunci(d), n = Number(d.jumlah) || 0;
    counts[k] = (counts[k] || 0) + n;
    var sem = semester_(s.tanggal);
    perSem[sem] = perSem[sem] || {};
    perSem[sem][k] = (perSem[sem][k] || 0) + n;
    metodeOf[k] = metodeOf[k] || {};
    metodeOf[k][s.metode] = 1;
  });
  var idx = indeks_(counts);
  var semKeys = Object.keys(perSem).sort().slice(-8);
  var series = semKeys.map(function (k) { var x = indeks_(perSem[k]); return { label: k.replace('-', ' '), H: x.H, S: x.S }; });
  var latin = {}, iucn = {}, lindung = {};
  Object.keys(spMap).forEach(function (k) { latin[spMap[k].nama] = spMap[k].nama_latin; iucn[spMap[k].nama] = spMap[k].iucn; lindung[spMap[k].nama] = bool_(spMap[k].dilindungi); });
  var lastSem = semKeys[semKeys.length - 1], prevSem = semKeys[semKeys.length - 2];
  var rows = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).map(function (k) {
    var a = lastSem ? (perSem[lastSem][k] || 0) : 0, b = prevSem ? (perSem[prevSem][k] || 0) : 0;
    return {
      nama: k, latin: latin[k] || '', iucn: iucn[k] || '', dilindungi: !!lindung[k], n: counts[k],
      pi: idx.N ? Math.round(counts[k] / idx.N * 1000) / 1000 : 0, metode: Object.keys(metodeOf[k] || {}).join(', '),
      tren: !prevSem ? 'baru' : a > b ? 'naik' : a < b ? 'turun' : 'tetap'
    };
  });
  return {
    lokasiList: lokasiList, lokasi: lok, indeks: idx, series: series, rows: rows,
    jumlahSurvei: pilih.length, dilindungi: rows.filter(function (r) { return r.dilindungi; }).length,
    terbaru: pilih.slice(-10).reverse().map(function (s) {
      var tot = dataAll.filter(function (d) { return d.survei_id === s.id; }).reduce(function (a, d) { return a + (Number(d.jumlah) || 0); }, 0);
      return { id: s.id, tanggal: s.tanggal, lokasi: s.lokasi, metode: s.metode, tim: s.tim, total: tot };
    })
  };
}

function simpanSurvei_(p, user) {
  var s = p.survei || {};
  if (!s.tanggal || !bersih_(s.lokasi, 80)) throw new Error('Tanggal dan lokasi wajib diisi.');
  var items = (s.items || []).filter(function (i) { return (i.spesiesId || i.nama) && Number(i.jumlah) > 0; });
  if (!items.length) throw new Error('Isi minimal satu spesies dengan jumlah.');
  var id = 'SV-' + Utilities.getUuid().slice(0, 8);
  tambah_('Survei', {
    id: id, tanggal: String(s.tanggal).slice(0, 10), lokasi: bersih_(s.lokasi, 80), metode: bersih_(s.metode, 40),
    tim: bersih_(s.tim, 200), habitat: bersih_(s.habitat, 800), catatan: bersih_(s.catatan, 800), oleh: user.nama, dibuat: sekarang_()
  });
  items.forEach(function (i) {
    tambah_('SurveiData', { survei_id: id, spesies_id: bersih_(i.spesiesId, 20), nama: bersih_(i.nama, 80) || spesiesNama_(i.spesiesId), jumlah: String(Math.round(Number(i.jumlah))) });
  });
  audit_(user, 'simpan_survei', '', id + ' ' + s.lokasi);
  return dataSurvei_({ lokasi: s.lokasi });
}

// ---------- RESCUE & PELEPASLIARAN ----------
function daftarRescue_() {
  var logs = tabel_('RescueLog').rows;
  return tabel_('Rescue').rows.slice().reverse().map(function (r) {
    return {
      id: r.id, kode: r.kode, nama: r.nama, asal: r.asal, tahap: Number(r.tahap), tahapNama: TAHAP_RESCUE[Number(r.tahap)],
      status: r.status, pj: r.pj, laporanId: r.laporan_id, diperbarui: r.diperbarui,
      log: logs.filter(function (l) { return l.rescue_id === r.id; }).length
    };
  });
}
function detailRescue_(id) {
  var r = tabel_('Rescue').rows.filter(function (x) { return x.id === id; })[0];
  if (!r) throw new Error('Data rescue tidak ditemukan.');
  return {
    id: r.id, kode: r.kode, laporanId: r.laporan_id, spesiesId: r.spesies_id, nama: r.nama, asal: r.asal, detail: r.detail,
    tahap: Number(r.tahap), tahapList: TAHAP_RESCUE, pj: r.pj, lokasiRilis: r.lokasi_rilis, dokumen: r.dokumen,
    status: r.status, dibuat: r.dibuat, diperbarui: r.diperbarui,
    log: tabel_('RescueLog').rows.filter(function (l) { return l.rescue_id === r.id; }).reverse()
      .map(function (l) { return { waktu: l.waktu, tahap: l.tahap, catatan: l.catatan, oleh: l.oleh }; })
  };
}
function simpanRescue_(p, user) {
  var d = p.rescue || {};
  var t = tabel_('Rescue');
  var now = sekarang_();
  if (d.id) {
    var r = t.rows.filter(function (x) { return x.id === d.id; })[0];
    if (!r) throw new Error('Data rescue tidak ditemukan.');
    ubah_(t, r, { asal: bersih_(d.asal, 120) || r.asal, detail: bersih_(d.detail, 800), pj: bersih_(d.pj, 80), lokasi_rilis: bersih_(d.lokasiRilis, 200), dokumen: bersih_(d.dokumen, 800), diperbarui: now });
    audit_(user, 'ubah_rescue', r.laporan_id, r.kode);
    return { rescue: detailRescue_(d.id) };
  }
  var lap = d.laporanId ? tabel_('Laporan').rows.filter(function (x) { return x.id === d.laporanId; })[0] : null;
  var spId = d.spesiesId || (lap ? (lap.spesies_terverifikasi || lap.spesies_id) : '');
  var nama = spesiesNama_(spId) || bersih_(d.nama, 80) || (lap ? lap.spesies_nama : '');
  if (!nama) throw new Error('Pilih spesies.');
  var pref = nama.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  var yy = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yy');
  var urut = t.rows.filter(function (x) { return String(x.kode).indexOf(pref + '-' + yy) === 0; }).length + 1;
  var id = 'RS-' + Utilities.getUuid().slice(0, 8);
  var kode = pref + '-' + yy + '-' + ('0' + urut).slice(-2);
  tambah_('Rescue', {
    id: id, kode: kode, laporan_id: lap ? lap.id : '', spesies_id: spId, nama: nama,
    asal: bersih_(d.asal, 120) || (lap ? (JENIS[lap.jenis] || {}).label + ' · ' + lap.wilayah : ''),
    detail: bersih_(d.detail, 800), tahap: '0', pj: bersih_(d.pj, 80), lokasi_rilis: '', dokumen: bersih_(d.dokumen, 800),
    status: 'Aktif', dibuat: now, diperbarui: now
  });
  tambah_('RescueLog', { id: 'RL-' + Utilities.getUuid().slice(0, 8), rescue_id: id, waktu: now, tahap: TAHAP_RESCUE[0], catatan: bersih_(d.catatan, 800) || 'Kasus rescue dibuat.', oleh: user.nama });
  if (lap) catatRiwayat_(lap.id, '', 'Kasus rescue dibuat', kode, user.nama + ' (' + user.peran + ')', false);
  audit_(user, 'buat_rescue', lap ? lap.id : '', kode);
  return { rescue: detailRescue_(id) };
}
function langkahRescue_(p, user) {
  var t = tabel_('Rescue');
  var r = t.rows.filter(function (x) { return x.id === p.id; })[0];
  if (!r) throw new Error('Data rescue tidak ditemukan.');
  var tahap = Number(r.tahap), now = sekarang_(), catatan = bersih_(p.catatan, 800), ubahan = { diperbarui: now };
  if (p.aksi === 'maju') {
    if (tahap >= TAHAP_RESCUE.length - 1) throw new Error('Sudah di tahap terakhir.');
    tahap++; ubahan.tahap = String(tahap);
    if (p.lokasiRilis) ubahan.lokasi_rilis = bersih_(p.lokasiRilis, 200);
  } else if (p.aksi === 'selesai') { ubahan.status = 'Selesai'; }
  else if (p.aksi === 'mati') { ubahan.status = 'Mati'; }
  else if (p.aksi !== 'catat') throw new Error('Aksi tidak dikenal.');
  if (p.aksi === 'catat' && !catatan) throw new Error('Isi catatan.');
  ubah_(t, r, ubahan);
  var judul = { maju: 'Masuk tahap ' + TAHAP_RESCUE[tahap], selesai: 'Kasus selesai', mati: 'Satwa mati', catat: '' }[p.aksi];
  tambah_('RescueLog', { id: 'RL-' + Utilities.getUuid().slice(0, 8), rescue_id: r.id, waktu: now, tahap: TAHAP_RESCUE[tahap], catatan: [judul, catatan].filter(String).join(' — '), oleh: user.nama });
  audit_(user, 'rescue_' + p.aksi, r.laporan_id, r.kode);
  return { rescue: detailRescue_(r.id) };
}

// ---------- LAPORAN BULANAN ----------
function laporanBulanan_(p, user) {
  var bln = /^\d{4}-\d{2}$/.test(String(p.bulan)) ? String(p.bulan) : Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM');
  var y = Number(bln.slice(0, 4)), m = Number(bln.slice(5, 7)) - 1;
  var a = new Date(y, m, 1).getTime(), b = new Date(y, m + 1, 1).getTime(), ap = new Date(y, m - 1, 1).getTime();
  var rows = tabel_('Laporan').rows;
  var di = rows.filter(function (r) { var t = Date.parse(r.dibuat); return t >= a && t < b; });
  var prev = rows.filter(function (r) { var t = Date.parse(r.dibuat); return t >= ap && t < a; });
  var spMap = {};
  tabel_('Spesies').rows.forEach(function (s) { spMap[s.id] = s; });
  var jenis = {};
  Object.keys(JENIS).forEach(function (k) { jenis[k] = 0; });
  di.forEach(function (r) { jenis[r.jenis] = (jenis[r.jenis] || 0) + 1; });
  var per = {};
  di.forEach(function (r) {
    var id = r.spesies_terverifikasi || r.spesies_id;
    var s = spMap[id];
    var key = s ? s.nama : r.spesies_nama;
    if (key === 'Belum teridentifikasi') return;
    per[key] = per[key] || { nama: key, latin: s ? s.nama_latin : '', iucn: s ? s.iucn : '', dilindungi: s ? bool_(s.dilindungi) : false, laporan: 0, individu: 0, status: {} };
    per[key].laporan++; per[key].individu += Number(r.jumlah) || 0;
    per[key].status[r.status] = (per[key].status[r.status] || 0) + 1;
  });
  var spesies = Object.keys(per).map(function (k) {
    var o = per[k];
    o.tindakLanjut = Object.keys(o.status).map(function (s) { return o.status[s] + ' ' + s.toLowerCase(); }).join(', ');
    delete o.status; return o;
  }).sort(function (x, y2) { return y2.laporan - x.laporan; });
  var respArr = di.filter(function (r) { return r.direspons_pada; }).map(function (r) { return (Date.parse(r.direspons_pada) - Date.parse(r.dibuat)) / 36e5; });
  var darurat = di.filter(function (r) { return r.prioritas === 'Darurat'; });
  var dinilai = darurat.filter(function (r) { var s = sla_(r); return s.selesai || s.lewat; });
  var tepat = dinilai.filter(function (r) { return sla_(r).tepat; });
  // survei bulan ini
  var surv = tabel_('Survei').rows.filter(function (s) { var t = Date.parse(s.tanggal); return t >= a && t < b; });
  var sid = {}; surv.forEach(function (s) { sid[s.id] = 1; });
  var counts = {};
  tabel_('SurveiData').rows.forEach(function (d) { if (sid[d.survei_id]) { var k = d.spesies_id && spMap[d.spesies_id] ? spMap[d.spesies_id].nama : d.nama; counts[k] = (counts[k] || 0) + (Number(d.jumlah) || 0); } });
  var idx = indeks_(counts);
  // rescue
  var logs = tabel_('RescueLog').rows.filter(function (l) { var t = Date.parse(l.waktu); return t >= a && t < b; });
  var rescues = tabel_('Rescue').rows;
  audit_(user, 'laporan_bulanan', '', bln);
  return {
    bulan: bln, instansi: setelan_('NAMA_INSTANSI'),
    masuk: di.length, masukPrev: prev.length,
    terverifikasi: di.filter(function (r) { return STATUS_TERVERIFIKASI.indexOf(r.status) > -1; }).length,
    spesiesTercatat: spesies.length, medianTeks: respArr.length ? jamTeks_(median_(respArr)) : '—',
    darurat: darurat.length, slaDaruratPct: dinilai.length ? Math.round(tepat.length / dinilai.length * 100) : null, slaDaruratTarget: targetSLA_('Darurat'),
    jenis: Object.keys(jenis).map(function (k) { return { label: JENIS[k] ? JENIS[k].label : k, n: jenis[k] }; }),
    spesies: spesies.slice(0, 12),
    survei: { jumlah: surv.length, indeks: idx },
    rescue: {
      aktif: rescues.filter(function (r) { return r.status === 'Aktif'; }).length,
      baru: rescues.filter(function (r) { var t = Date.parse(r.dibuat); return t >= a && t < b; }).length,
      dilepas: logs.filter(function (l) { return l.tahap === 'Pelepasliaran' && /Masuk tahap/.test(l.catatan); }).length
    }
  };
}

// ---------- FOTO LAYAR MASUK ----------
function daftarSlide_(semua) {
  var today = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyyy-MM-dd');
  return tabel_('FotoMasuk').rows.filter(function (s) {
    if (semua) return true;
    if (!bool_(s.aktif)) return false;
    if (s.mulai && today < s.mulai) return false;
    if (s.selesai && today > s.selesai) return false;
    return true;
  }).sort(function (a, b) { return Number(a.urutan || 99) - Number(b.urutan || 99); }).map(function (s) {
    return {
      id: s.id, url: s.url, tag: s.tag, judul: s.judul, kredit: s.kredit, fokus: s.fokus || '50% 50%', urutan: Number(s.urutan || 99),
      aktif: bool_(s.aktif), mulai: s.mulai, selesai: s.selesai,
      tayang: bool_(s.aktif) && !(s.mulai && today < s.mulai) && !(s.selesai && today > s.selesai)
    };
  });
}
function simpanSlide_(p, user) {
  var d = p.slide || {};
  var t = tabel_('FotoMasuk');
  var fokusOk = ['50% 20%', '50% 50%', '50% 80%'];
  var data = {
    tag: bersih_(d.tag, 40), judul: bersih_(d.judul, 80), kredit: bersih_(d.kredit, 80),
    fokus: fokusOk.indexOf(d.fokus) > -1 ? d.fokus : '50% 50%', aktif: d.aktif === false ? 'FALSE' : 'TRUE',
    mulai: /^\d{4}-\d{2}-\d{2}$/.test(d.mulai || '') ? d.mulai : '', selesai: /^\d{4}-\d{2}-\d{2}$/.test(d.selesai || '') ? d.selesai : ''
  };
  if (d.foto) {
    if (String(d.foto).length > 4000000) throw new Error('Ukuran foto terlalu besar.');
    var fid = simpanFoto_([d.foto], setelan_('FOLDER_FOTO_PUBLIK_ID'), 'masuk_' + Date.now(), true)[0];
    data.file_id = fid; data.url = urlFotoPublik_(fid);
  }
  if (d.id) {
    var r = t.rows.filter(function (x) { return x.id === d.id; })[0];
    if (!r) throw new Error('Foto tidak ditemukan.');
    if (data.file_id && r.file_id) { try { DriveApp.getFileById(r.file_id).setTrashed(true); } catch (e) { } }
    ubah_(t, r, data);
  } else {
    if (!d.foto) throw new Error('Pilih foto terlebih dulu.');
    data.id = 'FM-' + Utilities.getUuid().slice(0, 8);
    data.urutan = String(t.rows.length + 1); data.dibuat = sekarang_();
    tambah_('FotoMasuk', data);
  }
  audit_(user, 'simpan_foto_masuk', '', data.judul);
  return { slides: daftarSlide_(true) };
}
function geserSlide_(p) {
  var t = tabel_('FotoMasuk');
  var urut = t.rows.slice().sort(function (a, b) { return Number(a.urutan || 99) - Number(b.urutan || 99); });
  var i = urut.map(function (x) { return x.id; }).indexOf(p.id), j = i + (Number(p.arah) < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= urut.length) return { slides: daftarSlide_(true) };
  var tmp = urut[i]; urut[i] = urut[j]; urut[j] = tmp;
  urut.forEach(function (r, k) { if (Number(r.urutan) !== k + 1) ubah_(t, r, { urutan: String(k + 1) }); });
  return { slides: daftarSlide_(true) };
}
function hapusSlide_(p, user) {
  var t = tabel_('FotoMasuk');
  var r = t.rows.filter(function (x) { return x.id === p.id; })[0];
  if (!r) throw new Error('Foto tidak ditemukan.');
  if (r.file_id) { try { DriveApp.getFileById(r.file_id).setTrashed(true); } catch (e) { } }
  t.sh.deleteRow(r._row);
  delete TABEL_['FotoMasuk'];
  audit_(user, 'hapus_foto_masuk', '', r.judul);
  return { slides: daftarSlide_(true) };
}
function urlFotoPublik_(fileId) {
  if (typeof DEMO_URL_FOTO === 'function') return DEMO_URL_FOTO(fileId); // khusus mode demo di browser
  return 'https://lh3.googleusercontent.com/d/' + fileId + '=w1600';
}

// ---------- PENGATURAN & TELEGRAM ----------
function ambilSetelan_() {
  return {
    settings: SETELAN_BOLEH_UBAH.map(function (k) {
      var v = setelan_(k);
      return { kunci: k, nilai: k === 'TELEGRAM_BOT_TOKEN' && v ? '••••••' + v.slice(-4) : v, rahasia: k === 'TELEGRAM_BOT_TOKEN' };
    })
  };
}
function simpanSetelan_(p, user) {
  var data = p.settings || {};
  var t = tabel_('Pengaturan');
  Object.keys(data).forEach(function (k) {
    if (SETELAN_BOLEH_UBAH.indexOf(k) < 0) return;
    var v = String(data[k] == null ? '' : data[k]).trim().slice(0, 300);
    if (k === 'TELEGRAM_BOT_TOKEN' && /^•/.test(v)) return; // tidak diubah
    if (/^SLA_|LOGIN_GANTI|JEDA_PETA/.test(k) && v && !(Number(v) > 0)) throw new Error(k + ' harus angka lebih dari 0.');
    var r = t.rows.filter(function (x) { return x.kunci === k; })[0];
    if (r) ubah_(t, r, { nilai: v }); else tambah_('Pengaturan', { kunci: k, nilai: v, keterangan: '' });
  });
  SETELAN_ = null;
  audit_(user, 'ubah_pengaturan', '', Object.keys(data).join(','));
  return ambilSetelan_();
}
function ujiTelegram_() {
  if (!setelan_('TELEGRAM_BOT_TOKEN') || !setelan_('TELEGRAM_CHAT_ID')) throw new Error('Isi TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID dulu.');
  var r = kirimTelegram_('✅ Uji notifikasi SILANGKA berhasil. Pesan laporan Darurat/Tinggi akan masuk ke sini.');
  if (!r.ok) throw new Error('Telegram menolak: ' + r.pesan);
  return { pesan: 'Pesan uji terkirim ke Telegram.' };
}
function kirimTelegram_(teks) {
  var token = setelan_('TELEGRAM_BOT_TOKEN'), chat = setelan_('TELEGRAM_CHAT_ID');
  if (!token || !chat) return { ok: false, pesan: 'belum diatur' };
  try {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', muteHttpExceptions: true,
      payload: { chat_id: chat, text: teks, parse_mode: 'HTML', disable_web_page_preview: 'true' }
    });
    var j = JSON.parse(res.getContentText() || '{}');
    return { ok: !!j.ok, pesan: j.description || '' };
  } catch (e) { return { ok: false, pesan: String(e.message || e) }; }
}

// ---------- PENGGUNA ----------
function daftarPengguna_() {
  return tabel_('Pengguna').rows.map(function (u) {
    return { id: u.id, nama: u.nama, email: u.email, wa: u.wa, peran: u.peran, instansi: u.instansi, aktif: bool_(u.aktif), login: u.login_terakhir };
  });
}
function simpanPengguna_(p, admin) {
  if (['pelapor', 'admin', 'verifikator', 'superadmin'].indexOf(p.peran) < 0) throw new Error('Peran tidak valid.');
  var t = tabel_('Pengguna');
  var email = String(p.email || '').trim().toLowerCase();
  var u = t.rows.filter(function (r) { return (p.id && r.id === p.id) || r.email === email; })[0];
  var hasil = {};
  if (u) {
    var ub = { nama: bersih_(p.nama, 80) || u.nama, peran: p.peran, instansi: bersih_(p.instansi, 80), aktif: p.aktif === false ? 'FALSE' : 'TRUE', wa: bersih_(p.wa, 20) };
    if (p.password) { var s = Utilities.getUuid(); ub.hash = hash_(String(p.password), s); ub.salt = s; }
    ubah_(t, u, ub);
  } else {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email tidak valid.');
    var pw = p.password || ('Slk-' + Utilities.getUuid().slice(0, 8));
    var salt = Utilities.getUuid();
    tambah_('Pengguna', {
      id: 'U-' + Utilities.getUuid().slice(0, 8), nama: bersih_(p.nama, 80), email: email, wa: bersih_(p.wa, 20),
      hash: hash_(pw, salt), salt: salt, peran: p.peran, instansi: bersih_(p.instansi, 80), aktif: 'TRUE', dibuat: sekarang_(), login_terakhir: ''
    });
    hasil.passwordSementara = pw;
  }
  audit_(admin, 'simpan_pengguna', '', email + ' → ' + p.peran);
  hasil.users = daftarPengguna_();
  return hasil;
}

// ---------- HELPER LAPORAN ----------
function ringkasPublik_(r, denganRiwayat) {
  var o = {
    id: r.id, dibuat: r.dibuat, waktuTemuan: r.waktu_temuan, jenis: r.jenis, prioritas: r.prioritas,
    spesies: r.spesies_terverifikasi ? (spesiesNama_(r.spesies_terverifikasi) || r.spesies_nama) : r.spesies_nama,
    spesiesId: r.spesies_terverifikasi || r.spesies_id, spesiesDikonfirmasi: !!r.spesies_terverifikasi,
    jumlah: r.jumlah, wilayah: r.wilayah, status: r.status
  };
  if (denganRiwayat) {
    o.riwayat = tabel_('Riwayat').rows.filter(function (h) { return h.laporan_id === r.id && bool_(h.publik); })
      .map(function (h) { return { waktu: h.waktu, status: h.status, judul: h.judul, catatan: h.catatan, oleh: h.oleh === 'Pelapor' ? 'Anda' : 'Petugas' }; });
  }
  return o;
}
function catatRiwayat_(laporanId, status, judul, catatan, oleh, publik) {
  tambah_('Riwayat', {
    id: 'H-' + Utilities.getUuid().slice(0, 8), laporan_id: laporanId, waktu: sekarang_(), status: status || '',
    judul: judul, catatan: catatan || '', oleh: oleh, publik: publik ? 'TRUE' : 'FALSE'
  });
}
function idLaporan_() {
  var props = PropertiesService.getScriptProperties();
  var yymm = Utilities.formatDate(new Date(), 'Asia/Makassar', 'yyMM');
  var kunci = 'seq_' + yymm;
  var n = Number(props.getProperty(kunci) || 0) + 1;
  props.setProperty(kunci, String(n));
  return 'SLK-' + yymm + '-' + ('0000' + n).slice(-4);
}
function simpanFoto_(fotos, folderId, nama, publik) {
  if (!fotos.length) return [];
  var folder = DriveApp.getFolderById(folderId);
  return fotos.map(function (b64, i) {
    var data = String(b64).replace(/^data:image\/\w+;base64,/, '');
    var f = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data), 'image/jpeg', nama + '_' + (i + 1) + '.jpg'));
    if (publik) {
      try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
      catch (e) { throw new Error('Foto tersimpan, tetapi Google Drive menolak berbagi publik (kebijakan akun). Gunakan akun Google pribadi.'); }
    }
    return f.getId();
  });
}
function wilayah_(lat, lng) {
  try {
    var res = Maps.newGeocoder().setLanguage('id').reverseGeocode(lat, lng);
    var komp = (res.results && res.results[0] && res.results[0].address_components) || [];
    var kab = komp.filter(function (c) { return c.types.indexOf('administrative_area_level_2') > -1; })[0];
    var prov = komp.filter(function (c) { return c.types.indexOf('administrative_area_level_1') > -1; })[0];
    return [kab && kab.long_name, prov && prov.long_name].filter(String).join(', ') || 'Wilayah tidak diketahui';
  } catch (e) {
    return 'Wilayah tidak diketahui';
  }
}
function notifikasi_(id, jenis, sp, lat, lng) {
  var nama = sp ? sp.nama : 'Belum teridentifikasi', wil = wilayah_(lat, lng);
  kirimTelegram_((jenis.prioritas === 'Darurat' ? '🚨' : '⚠️') + ' <b>Laporan ' + jenis.prioritas + '</b> — ' + id + '\n' +
    jenis.label + '\nSpesies: ' + nama + '\nWilayah: ' + wil + '\nTarget respons: ' + targetSLA_(jenis.prioritas) + ' jam\n' +
    'Buka Panel Petugas untuk koordinat (akses tercatat).');
  var penerima = String(setelan_('EMAIL_NOTIF') || '').trim();
  if (!penerima) return;
  try {
    MailApp.sendEmail({
      to: penerima, subject: '[SILANGKA][' + jenis.prioritas + '] ' + jenis.label + ' — ' + id,
      body: 'Laporan baru berprioritas ' + jenis.prioritas + '.\n\nNomor  : ' + id + '\nKejadian: ' + jenis.label + '\nSpesies: ' + nama +
        '\nWilayah: ' + wil + '\n\nKoordinat presisi hanya dapat dilihat di Panel Petugas SILANGKA (tercatat di log audit).\nMohon email ini tidak diteruskan ke pihak luar.'
    });
  } catch (e) { /* kuota email habis: abaikan */ }
}
function spesiesNama_(id) {
  if (!id) return '';
  var peta = {};
  tabel_('Spesies').rows.forEach(function (s) { peta[s.id] = s.nama; });
  return peta[id] || '';
}

// ---------- HELPER AKUN ----------
function userDariToken_(token) {
  var cache = CacheService.getScriptCache();
  var uid = cache.get('tk_' + token);
  if (!uid) {
    var s = tabel_('Sesi').rows.filter(function (r) { return r.token === token; })[0];
    if (!s || Date.parse(s.kedaluwarsa) < Date.now()) return null;
    uid = s.user_id;
    cache.put('tk_' + token, uid, 21600);
  }
  var u = tabel_('Pengguna').rows.filter(function (r) { return r.id === uid; })[0];
  return u && bool_(u.aktif) ? u : null;
}
function profil_(u) { return { id: u.id, nama: u.nama, email: u.email, wa: u.wa, peran: u.peran, instansi: u.instansi }; }
function wajib_(user) { if (!user) throw new Error('Sesi berakhir. Silakan masuk kembali.'); }
function izin_(user, daftarPeran) {
  wajib_(user);
  if (daftarPeran.indexOf(user.peran) < 0) throw new Error('Akun Anda tidak memiliki akses untuk aksi ini.');
}
function audit_(user, aksi, laporanId, detail) {
  tambah_('Audit', { waktu: sekarang_(), user_id: user ? user.id : '', email: user ? user.email : '', aksi: aksi, laporan_id: laporanId || '', detail: detail || '' });
}
function hash_(teks, salt) {
  var h = String(salt) + '|' + String(teks);
  for (var i = 0; i < 200; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8));
  }
  return h;
}

// ---------- HELPER SHEET (dengan cache per permintaan) ----------
var TABEL_ = {};
function tabel_(nama) {
  if (TABEL_[nama]) return TABEL_[nama];
  var sh = SpreadsheetApp.getActive().getSheetByName(nama);
  if (!sh) throw new Error('Sheet "' + nama + '" belum ada. Jalankan setupAwal.');
  var v = sh.getDataRange().getValues();
  var h = v.shift() || [];
  TABEL_[nama] = {
    sh: sh, h: h, rows: v.map(function (baris, i) {
      var o = { _row: i + 2 };
      h.forEach(function (k, j) { o[k] = baris[j] instanceof Date ? baris[j].toISOString() : String(baris[j] == null ? '' : baris[j]); });
      return o;
    })
  };
  return TABEL_[nama];
}
function tambah_(nama, obj) {
  var sh = SpreadsheetApp.getActive().getSheetByName(nama);
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.appendRow(h.map(function (k) { return obj[k] === undefined || obj[k] === null ? '' : String(obj[k]); }));
  delete TABEL_[nama];
}
function ubah_(t, baris, obj) {
  var nilai = t.h.map(function (k) { return k in obj ? String(obj[k]) : baris[k]; });
  t.sh.getRange(baris._row, 1, 1, t.h.length).setValues([nilai]);
  Object.keys(obj).forEach(function (k) { baris[k] = String(obj[k]); });
}

var SETELAN_ = null;
function setelan_(kunci) {
  if (!SETELAN_) {
    SETELAN_ = {};
    var sh = SpreadsheetApp.getActive().getSheetByName('Pengaturan');
    if (sh && sh.getLastRow() >= 2) {
      sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (v) { SETELAN_[v[0]] = String(v[1]); });
    }
  }
  return SETELAN_[kunci] || '';
}

// ---------- UTILITAS ----------
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sekarang_() { return new Date().toISOString(); }
function bool_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }
function bersih_(v, maks) {
  return String(v || '').replace(/<[^>]*>/g, '').replace(/^[=+\-@]+/, '').trim().slice(0, maks || 200);
}
