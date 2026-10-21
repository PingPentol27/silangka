/* ============================================================
 * SILANGKA — Mode Demo
 * Meniru layanan Google Apps Script di browser, lalu menjalankan
 * backend ASLI (demo/Code.js = salinan apps-script/Code.gs).
 * Data hanya tersimpan di perangkat ini. Tidak perlu diubah.
 * ============================================================ */
(function (G) {
  'use strict';
  var LSK = 'slk_demo_v21_';
  function lsGet(k, d) { try { var v = localStorage.getItem(LSK + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(LSK + k, JSON.stringify(v)); } catch (e) { /* penuh: tetap di memori */ } }

  // ---------- SHA-256 sinkron ----------
  function sha256(bytes) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, m = bytes.slice(); m.push(0x80);
    while ((m.length % 64) !== 56) m.push(0);
    var bits = l * 8;
    for (var s = 7; s >= 0; s--) m.push(s >= 4 ? 0 : (bits >>> (s * 8)) & 255);
    var w = new Array(64);
    for (var i = 0; i < m.length; i += 64) {
      for (var t = 0; t < 16; t++) w[t] = (m[i + 4 * t] << 24) | (m[i + 4 * t + 1] << 16) | (m[i + 4 * t + 2] << 8) | m[i + 4 * t + 3];
      for (t = 16; t < 64; t++) {
        var x = w[t - 15], y = w[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = [];
    H.forEach(function (v) { out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); });
    return out;
  }
  function utf8(str) { var s = unescape(encodeURIComponent(str)), a = []; for (var i = 0; i < s.length; i++) a.push(s.charCodeAt(i)); return a; }
  function b64(bytes) {
    var s = '', CH = 8192;
    for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.slice(i, i + CH).map(function (x) { return x & 255; }));
    return btoa(s);
  }

  // ---------- Spreadsheet ----------
  var store = lsGet('sheets', null) || {};
  var saveTimer = null;
  function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { lsSet('sheets', store); }, 300); }
  function Sheet(name) { this.name = name; if (!store[name]) store[name] = []; }
  Sheet.prototype = {
    get d() { return store[this.name]; },
    getLastRow: function () { return this.d.length; },
    getLastColumn: function () { return this.d[0] ? this.d[0].length : 0; },
    getMaxRows: function () { return Math.max(1000, this.d.length); },
    setFrozenRows: function () { },
    appendRow: function (r) { this.d.push(r.map(String)); persist(); },
    deleteRow: function (n) { this.d.splice(n - 1, 1); persist(); },
    getDataRange: function () { var s = this; return { getValues: function () { return s.d.map(function (r) { return r.slice(); }); } }; },
    getRange: function (r, c, nr, nc) {
      var s = this; nr = nr || 1; nc = nc || 1;
      var o = {
        setValues: function (v) {
          v.forEach(function (row, i) {
            while (s.d.length < r + i) s.d.push([]);
            row.forEach(function (x, j) { s.d[r - 1 + i][c - 1 + j] = String(x); });
          });
          persist(); return o;
        },
        getValues: function () {
          var out = [];
          for (var i = 0; i < nr; i++) { out.push([]); for (var j = 0; j < nc; j++) { var v = (s.d[r - 1 + i] || [])[c - 1 + j]; out[i].push(v == null ? '' : v); } }
          return out;
        },
        setFontWeight: function () { return o; }, setBackground: function () { return o; }, setFontColor: function () { return o; }, setNumberFormat: function () { return o; }
      };
      return o;
    }
  };
  var ss = {
    getSheetByName: function (n) { return store[n] ? new Sheet(n) : null; },
    insertSheet: function (n) { store[n] = []; persist(); return new Sheet(n); },
    getSheets: function () { return Object.keys(store).map(function (n) { return new Sheet(n); }); },
    deleteSheet: function (s) { delete store[s.name]; persist(); }
  };

  // ---------- Drive ----------
  var drive = lsGet('drive', {});
  function saveDrive() { lsSet('drive', drive); }
  function fileObj(id) {
    var f = drive[id];
    if (!f) throw new Error('File tidak ditemukan');
    return {
      getId: function () { return id; },
      getMimeType: function () { return f.mime; },
      getBlob: function () { return { getBytes: function () { var s = atob(f.b64), a = []; for (var i = 0; i < s.length; i++) a.push(s.charCodeAt(i)); return a; } }; },
      getParents: function () { var done = false; return { hasNext: function () { return !done; }, next: function () { done = true; return { getId: function () { return f.folder; } }; } }; },
      setSharing: function () { }, setTrashed: function () { delete drive[id]; saveDrive(); }
    };
  }

  G.SpreadsheetApp = { getActive: function () { return ss; } };
  G.DriveApp = {
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, Permission: { VIEW: 'VIEW' },
    createFolder: function (n) { var id = 'FD' + Math.random().toString(36).slice(2, 9); return { getId: function () { return id; } }; },
    getFolderById: function (fid) {
      return {
        getId: function () { return fid; },
        createFile: function (blob) {
          var id = 'F' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          drive[id] = { folder: fid, mime: blob.mime || 'image/jpeg', b64: b64(blob.bytes) };
          saveDrive();
          return fileObj(id);
        }
      };
    },
    getFileById: fileObj
  };
  G.DEMO_URL_FOTO = function (id) { var f = drive[id]; return f ? 'data:' + f.mime + ';base64,' + f.b64 : ''; };
  G.Utilities = {
    DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' },
    getUuid: function () {
      var b = new Uint8Array(16); crypto.getRandomValues(b);
      var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    },
    computeDigest: function (alg, str) { return sha256(utf8(String(str))); },
    base64Encode: function (x) { return typeof x === 'string' ? b64(utf8(x)) : b64(x); },
    base64Decode: function (s) { var t = atob(s), a = []; for (var i = 0; i < t.length; i++) a.push(t.charCodeAt(i)); return a; },
    newBlob: function (bytes, mime, name) { return { bytes: bytes, mime: mime, name: name }; },
    formatDate: function (d, tz, fmt) {
      var p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return fmt.replace('yyyy', p.year).replace('yy', p.year.slice(2)).replace('MM', p.month).replace('dd', p.day);
    }
  };
  var cache = {};
  G.CacheService = { getScriptCache: function () { return { get: function (k) { return cache[k] || null; }, put: function (k, v) { cache[k] = String(v); }, remove: function (k) { delete cache[k]; } }; } };
  G.LockService = { getScriptLock: function () { return { waitLock: function () { }, releaseLock: function () { } }; } };
  var props = lsGet('props', {});
  G.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return props[k] || null; }, setProperty: function (k, v) { props[k] = String(v); lsSet('props', props); } }; } };
  G.Session = { getActiveUser: function () { return { getEmail: function () { return 'admin@demo.id'; } }; } };
  G.Logger = { log: function (m) { if (G.console) console.log('[demo]', m); } };
  G.Maps = {
    newGeocoder: function () {
      return {
        setLanguage: function () { return this; },
        reverseGeocode: function (lat, lng) {
          var kab = lng > 116.1 ? 'Kotabaru' : lat < -3.3 ? 'Tanah Bumbu' : 'Kotabaru';
          return { results: [{ address_components: [{ long_name: kab, types: ['administrative_area_level_2'] }, { long_name: 'Kalimantan Selatan', types: ['administrative_area_level_1'] }] }] };
        }
      };
    }
  };
  G.MailApp = { sendEmail: function () { } };
  G.UrlFetchApp = {
    fetch: function () { return { getContentText: function () { return '{"ok":true}'; } }; },
    getRequest: function () { return {}; }
  };
  G.ContentService = { MimeType: { JSON: 'JSON' }, createTextOutput: function (t) { return { setMimeType: function () { return t; } }; } };
  G.ScriptApp = { getProjectTriggers: function () { return []; } };

  // ---------- Data contoh ----------
  function post(p) { return JSON.parse(G.doPost({ postData: { contents: JSON.stringify(p) } })); }
  function seed() {
    G.setupAwal();
    var sh = ss.getSheetByName('Pengguna'), h = sh.d[0];
    var row = sh.d[1];
    row[h.indexOf('email')] = 'admin@demo.id';
    row[h.indexOf('nama')] = 'Superadmin Demo';
    row[h.indexOf('hash')] = G.hash_('demo1234', row[h.indexOf('salt')]);
    G.TABEL_ = {};
    var tok = post({ action: 'login', email: 'admin@demo.id', password: 'demo1234' }).token;
    var staf = [['Petugas BKSDA (demo)', 'petugas@demo.id', 'verifikator', 'BKSDA Kalimantan Selatan'],
      ['Resort Kotabaru (demo)', 'resort@demo.id', 'verifikator', 'Resort KSDA Kotabaru'],
      ['Admin Lingkungan (demo)', 'tim@demo.id', 'admin', 'PT Arutmin Indonesia Tambang Senakin']];
    staf.forEach(function (s) { post({ action: 'userSave', token: tok, nama: s[0], email: s[1], peran: s[2], instansi: s[3], password: 'demo1234' }); });
    var users = post({ action: 'staffUsers', token: tok }).staff;
    var seedN = 7; function rnd() { seedN = (seedN * 9301 + 49297) % 233280; return seedN / 233280; }
    var plan = [
      ['jumpa', 'SP01', 3], ['jumpa', 'SP02', 4], ['luka', 'SP03', 1], ['buru', '', 1], ['jumpa', 'SP01', 5], ['konflik', 'SP05', 1],
      ['jumpa', 'SP07', 2], ['mati', 'SP04', 1], ['pelihara', 'SP03', 1], ['jumpa', 'SP08', 1], ['jumpa', 'SP02', 3], ['konflik', 'SP09', 1],
      ['jumpa', 'SP06', 2], ['jumpa', 'SP01', 7], ['luka', 'SP08', 1], ['jumpa', 'SP07', 1], ['jumpa', 'SP02', 2], ['jumpa', 'SP01', 4],
      ['jumpa', 'SP10', 6], ['mati', 'SP06', 1], ['jumpa', 'SP05', 1], ['jumpa', 'SP01', 3], ['konflik', 'SP05', 1], ['luka', 'SP03', 1]
    ];
    var ids = [];
    plan.forEach(function (x, i) {
      var r = post({ action: 'submitReport', report: { clientId: 'seed' + i, kode: 'DEMO' + ('0' + i).slice(-2), jenis: x[0], spesiesId: x[1], jumlah: x[2], anonim: x[0] === 'buru', lat: -3.1 - rnd() * 0.35, lng: 115.9 + rnd() * 0.4, kondisi: x[0] === 'luka' ? 'Terluka' : 'Sehat', deskripsi: 'Data contoh mode demo.', perangkat: 'seed' + (i % 3), nama: 'Warga Contoh' } });
      ids.push(r.id);
    });
    // proses sebagian laporan
    var tokV = post({ action: 'login', email: 'petugas@demo.id', password: 'demo1234' }).token;
    ids.forEach(function (id, i) {
      if (i >= 20) return;
      var sp = plan[i][1] || 'SP04';
      post({ action: 'staffAction', token: tokV, id: id, aksi: 'tugaskan', pjId: users[i % users.length].id });
      if (i % 5 === 3) return;
      post({ action: 'staffAction', token: tokV, id: id, aksi: 'verifikasi', spesiesId: sp, catatan: 'Identifikasi dikonfirmasi.' });
      if (i % 3 === 0) post({ action: 'staffAction', token: tokV, id: id, aksi: 'tindaklanjut', disposisi: 'Resort KSDA Kotabaru', catatan: 'Monitoring lapangan.' });
      if (i % 4 === 1) post({ action: 'staffAction', token: tokV, id: id, aksi: 'selesai', catatan: 'Selesai dipantau.' });
    });
    // sebar tanggal ke belakang agar grafik terisi
    var L = ss.getSheetByName('Laporan'), lh = L.d[0];
    var c = { d: lh.indexOf('dibuat'), w: lh.indexOf('waktu_temuan'), r: lh.indexOf('direspons_pada'), v: lh.indexOf('diverifikasi_pada'), u: lh.indexOf('diperbarui') };
    var hariLalu = [80, 74, 66, 60, 55, 50, 44, 40, 36, 31, 27, 24, 20, 17, 14, 11, 9, 7, 5, 4, 3, 1.2, 0.08, 0.04];
    for (var k = 1; k < L.d.length; k++) {
      var dl = Date.now() - hariLalu[k - 1] * 864e5;
      var resp = (k % 4 === 0 ? 3.1 : k % 3 === 0 ? 0.8 : 1.6) * 36e5;
      L.d[k][c.d] = new Date(dl).toISOString(); L.d[k][c.w] = new Date(dl - 36e5).toISOString();
      if (L.d[k][c.r]) L.d[k][c.r] = new Date(dl + resp).toISOString();
      if (L.d[k][c.v]) L.d[k][c.v] = new Date(dl + resp + 36e5).toISOString();
      L.d[k][c.u] = new Date(dl + resp * 2).toISOString();
    }
    // survei 4 tahun ke belakang
    var lokasi = ['Reklamasi Pit Manggis', 'Danau Pascatambang Manggis', 'Hutan Penyangga'];
    var sps = ['SP01', 'SP02', 'SP06', 'SP07', 'SP08', 'SP05'];
    for (var s = 0; s < 8; s++) {
      lokasi.forEach(function (lok, li) {
        var tgl = new Date(Date.now() - (7 - s) * 182 * 864e5 - li * 9 * 864e5).toISOString().slice(0, 10);
        var items = sps.slice(0, 2 + Math.min(4, Math.floor(s / 2) + li)).map(function (id, q) { return { spesiesId: id, jumlah: Math.round(2 + rnd() * 10 + s - q) }; });
        items.push({ nama: 'Cucak Kutilang', jumlah: Math.round(5 + rnd() * 8) });
        post({ action: 'surveySave', token: tokV, survei: { tanggal: tgl, lokasi: lok, metode: ['Transek garis', 'Titik hitung', 'Kamera trap'][s % 3], tim: 'Tim Lingkungan (demo)', items: items } });
      });
    }
    // rescue
    var r1 = post({ action: 'rescueSave', token: tokV, rescue: { laporanId: ids[2], detail: 'Betina dewasa, luka di kaki kiri.', pj: 'Tim Rescue (demo)', catatan: 'Dievakuasi dengan kandang angkut.' } }).rescue;
    post({ action: 'rescueStep', token: tokV, id: r1.id, aksi: 'maju', catatan: 'Pemeriksaan dokter hewan.' });
    post({ action: 'rescueStep', token: tokV, id: r1.id, aksi: 'maju', catatan: 'Mulai rehabilitasi.' });
    var r2 = post({ action: 'rescueSave', token: tokV, rescue: { spesiesId: 'SP09', asal: 'Masuk permukiman · Kotabaru', detail: 'Panjang ±2,4 m.', pj: 'Resort Kotabaru' } }).rescue;
    for (var z = 0; z < 4; z++) post({ action: 'rescueStep', token: tokV, id: r2.id, aksi: 'maju', catatan: 'Tahap berjalan baik.' });
    post({ action: 'rescueSave', token: tokV, rescue: { spesiesId: 'SP08', asal: 'Sayap cedera · Kotabaru', detail: 'Remaja, latihan terbang.', pj: 'Tim Rescue (demo)' } });
    persist(); lsSet('drive', drive); lsSet('props', props);
    lsSet('seeded', 1);
  }

  G.SLK_DEMO = {
    init: function () {
      if (!lsGet('seeded', 0) || !store.Laporan) { store = {}; seed(); }
    },
    call: function (payload) {
      G.TABEL_ = {};
      var res = JSON.parse(G.doPost({ postData: { contents: JSON.stringify(payload) } }));
      return res;
    },
    reset: function () {
      ['sheets', 'drive', 'props', 'seeded'].forEach(function (k) { try { localStorage.removeItem(LSK + k); } catch (e) { } });
      location.reload();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
