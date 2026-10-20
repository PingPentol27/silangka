/* ============================================================
 * SILANGKA 2.0 — Aplikasi (PWA)
 * Sistem Informasi Laporan Satwa Langka
 * Tidak perlu diubah. Pengaturan ada di config.js
 * ============================================================ */
(function () {
  'use strict';

  var C = window.SILANGKA_CONFIG || {};
  var DEMO = !C.API_URL;
  var app = document.getElementById('app');
  var nav = document.getElementById('nav');

  // ---------------- UTIL ----------------
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uuid() {
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function kodeAcak() {
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint8Array(6), s = '';
    crypto.getRandomValues(b);
    for (var i = 0; i < 6; i++) s += abc[b[i] % abc.length];
    return s;
  }
  function tgl(iso, jam) {
    var d = new Date(iso);
    if (isNaN(d)) return '-';
    var o = { day: 'numeric', month: 'short', year: 'numeric' };
    if (jam !== false) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleString('id-ID', o);
  }
  function localInput(d) {
    d = d || new Date();
    var p = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('slk_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('slk_' + k, JSON.stringify(v)); } catch (e) { /* penuh */ } },
    del: function (k) { try { localStorage.removeItem('slk_' + k); } catch (e) { } }
  };
  // IndexedDB sederhana (untuk draf & antrean offline yang berisi foto)
  var DB = {
    _p: null,
    open: function () {
      if (this._p) return this._p;
      this._p = new Promise(function (res, rej) {
        if (!window.indexedDB) return rej(new Error('no idb'));
        var r = indexedDB.open('silangka', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
      return this._p;
    },
    get: function (k, d) {
      return this.open().then(function (db) {
        return new Promise(function (res) {
          var q = db.transaction('kv').objectStore('kv').get(k);
          q.onsuccess = function () { res(q.result === undefined ? d : q.result); };
          q.onerror = function () { res(d); };
        });
      }).catch(function () { return LS.get('idb_' + k, d); });
    },
    set: function (k, v) {
      return this.open().then(function (db) {
        return new Promise(function (res, rej) {
          var tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(v, k);
          tx.oncomplete = function () { res(); };
          tx.onerror = function () { rej(tx.error); };
        });
      }).catch(function () { LS.set('idb_' + k, v); });
    }
  };

  var ICON = {
    back: '<path d="M15 6l-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5h.01"/>',
    wifiOff: '<path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2-1.6M12 20h.01"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 16l5-5 4 4 3-3 4 4"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    cross: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    minus: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    hand: '<path d="M7 11V6a2 2 0 0 1 4 0v5M11 10V4a2 2 0 0 1 4 0v6M15 10V6a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.5L3 13a2 2 0 0 1 3.5-2l.5 1"/>',
    paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5-2 3-4 3-4 0-4-3z"/>',
    phone: '<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'
  };
  function ic(n, cls) { return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[n] || '') + '</svg>'; }

  var JENIS = {
    jumpa: { label: 'Perjumpaan satwa', hint: 'Melihat atau mendengar langsung', icon: 'eye', urgent: false, kondisi: 'Sehat' },
    luka: { label: 'Satwa terluka / sakit', hint: 'Prioritas darurat', icon: 'cross', urgent: true, kondisi: 'Terluka' },
    konflik: { label: 'Masuk permukiman / konflik', hint: 'Prioritas darurat', icon: 'home', urgent: true, kondisi: 'Tidak tahu' },
    mati: { label: 'Satwa mati', hint: 'Jangan dipindahkan', icon: 'minus', urgent: false, kondisi: 'Mati' },
    buru: { label: 'Perburuan / perdagangan', hint: 'Identitas otomatis dirahasiakan', icon: 'target', urgent: false, kondisi: 'Tidak tahu' },
    pelihara: { label: 'Dipelihara warga', hint: 'Termasuk penyerahan sukarela', icon: 'hand', urgent: false, kondisi: 'Tidak tahu' }
  };
  var URUT_STATUS = ['Terkirim', 'Diterima', 'Diverifikasi', 'Ditindaklanjuti', 'Selesai'];
  var IUCN = {
    CR: ['Kritis (CR)', 'b-red'], EN: ['Genting (EN)', 'b-orange'], VU: ['Rentan (VU)', 'b-amber'],
    NT: ['Hampir Terancam (NT)', 'b-teal'], LC: ['Risiko Rendah (LC)', 'b-teal'], DD: ['Kurang Data (DD)', 'b-gray']
  };
  var PERAN = { pelapor: 'Pelapor', admin: 'Admin Perusahaan', verifikator: 'Verifikator BKSDA', superadmin: 'Superadmin' };
  var STAF = ['admin', 'verifikator', 'superadmin'];
  var VERIF = ['verifikator', 'superadmin'];
  function badgeStatus(s) {
    var m = { Terkirim: 'b-gray', Diterima: 'b-teal', Diverifikasi: 'b-blue', Ditindaklanjuti: 'b-amber', Selesai: 'b-teal', 'Tidak Valid': 'b-red' };
    return '<span class="badge ' + (m[s] || 'b-gray') + '">' + esc(s === 'Ditindaklanjuti' ? 'Ditangani' : s) + '</span>';
  }
  function badgePrio(p) { return '<span class="badge ' + ({ Darurat: 'b-red', Tinggi: 'b-amber', Normal: 'b-teal' }[p] || 'b-gray') + '">' + esc(p) + '</span>'; }

  // ---------------- STATE ----------------
  var S = {
    token: LS.get('token', ''),
    user: LS.get('user', null),
    config: LS.get('config', { nomorDarurat: C.NOMOR_DARURAT || '', instansi: C.INSTANSI || '' }),
    species: LS.get('species', []),
    mine: LS.get('mine', []),
    outbox: [], drafts: [],
    syncing: false
  };
  var W = null;           // wizard laporan aktif
  var maps = [];          // peta Leaflet aktif
  var installPrompt = null;
  function isStaf() { return S.user && STAF.indexOf(S.user.peran) > -1; }
  function isVerif() { return S.user && VERIF.indexOf(S.user.peran) > -1; }
  function simpanMine() { LS.set('mine', S.mine.slice(0, 200)); }
  function deviceId() { var d = LS.get('device', ''); if (!d) { d = uuid(); LS.set('device', d); } return d; }

  // ---------------- API ----------------
  function api(action, data) {
    var payload = Object.assign({ action: action }, data || {});
    if (S.token) payload.token = S.token;
    if (DEMO) return Demo.handle(payload);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 60000);
    return fetch(C.API_URL, { method: 'POST', body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); }, function (e) {
        var err = new Error(e && e.name === 'AbortError' ? 'Server lambat merespons. Coba lagi.' : 'Tidak ada koneksi ke server.');
        err.offline = !(e && e.name === 'AbortError');
        throw err;
      })
      .then(function (j) {
        if (!j.ok) {
          if (/Sesi berakhir/.test(j.error || '')) keluarLokal();
          throw new Error(j.error || 'Terjadi kesalahan.');
        }
        return j;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function muatAwal() {
    api('config').then(function (r) { S.config = r; LS.set('config', r); if (route().name === 'beranda') render(); }).catch(function () { });
    api('species').then(function (r) { S.species = r.species || []; LS.set('species', S.species); if (['kamus', 'beranda', 'spesies'].indexOf(route().name) > -1) render(); }).catch(function () { });
    if (S.token) api('me').then(function (r) { S.user = r.user; LS.set('user', r.user); }).catch(function () { });
  }

  // ---------------- UI HELPER ----------------
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3800);
  }
  function modal(html) {
    var m = $('#modal'); $('.modal-card', m).innerHTML = html; m.hidden = false;
    var f = $('input,textarea,select,button', m); if (f) setTimeout(function () { f.focus(); }, 50);
  }
  function tutupModal() { $('#modal').hidden = true; $('#modal .modal-card').innerHTML = ''; }
  $('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal') tutupModal(); });
  function topbar(judul, back, kanan) {
    return '<div class="topbar"><a class="icon-btn" href="' + back + '" aria-label="Kembali">' + ic('back') + '</a>' +
      '<span class="title">' + esc(judul) + '</span>' + (kanan || '') + '</div>';
  }
  function spesiesById(id) { return S.species.filter(function (s) { return s.id === id; })[0]; }
  function thumbSp(sp, cls) {
    var st = sp && sp.foto ? ' style="background-image:url(\'' + esc(sp.foto) + '\')"' : '';
    return '<span class="thumb ' + (cls || '') + '"' + st + '>' + (sp && sp.foto ? '' : ic('paw')) + '</span>';
  }
  function hapusPeta() { maps.forEach(function (m) { try { m.remove(); } catch (e) { } }); maps = []; }
  function adaLeaflet() { return typeof window.L !== 'undefined'; }
  function tileLayer() {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' });
  }

  // ---------------- ROUTER ----------------
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var q = h.split('?'), parts = q[0].split('/');
    return { name: parts[0] || '', arg: decodeURIComponent(parts[1] || ''), query: new URLSearchParams(q[1] || '') };
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }

  var VIEWS = {};
  function render() {
    hapusPeta();
    var r = route();
    if (!r.name) { go(LS.get('welcomed', false) ? '#/beranda' : '#/selamat-datang'); return; }
    var v = VIEWS[r.name] || VIEWS.beranda;
    var tanpaNav = ['selamat-datang', 'lapor', 'lacak', 'spesies', 'petugas'].indexOf(r.name) > -1;
    nav.hidden = tanpaNav;
    document.body.classList.toggle('no-nav', tanpaNav);
    document.body.classList.toggle('wide', r.name === 'petugas');
    $$('a', nav).forEach(function (a) { a.classList.toggle('on', a.dataset.tab === r.name); });
    var hasil = v(r);
    if (typeof hasil === 'string') { app.innerHTML = hasil; }
    if (v.after) v.after(r);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  // Delegasi klik: elemen dengan data-act="namaAksi"
  var ACT = {};
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  // ================= LAYAR: SELAMAT DATANG =================
  VIEWS['selamat-datang'] = function () {
    return '<section class="welcome">' +
      '<div class="brand"><img class="logo" src="logo.png" alt="Logo SILANGKA"><img class="mitra" src="arutmin.png" alt="PT Arutmin Indonesia"></div>' +
      '<div class="hero" aria-hidden="true"><svg viewBox="0 0 342 260" preserveAspectRatio="xMidYMid slice">' +
      '<path d="M0 200 C80 170 140 220 220 185 S320 160 342 175 V260 H0z" fill="#16514D"/>' +
      '<path d="M40 0 C70 90 60 150 110 260" stroke="#2C8A82" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      '<path d="M200 30 L300 140" stroke="#2C8A82" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="250" cy="95" r="28" fill="#0F2E2C"/><ellipse cx="250" cy="142" rx="24" ry="34" fill="#0F2E2C"/>' +
      '<rect x="244" y="86" width="12" height="5" rx="2.5" fill="#F6F4EE"/>' +
      '<path d="M252 175 C255 210 240 235 250 260" stroke="#0F2E2C" stroke-width="5" fill="none" stroke-linecap="round"/></svg></div>' +
      '<h1>Melihat satwa dilindungi? Laporkan dalam 1 menit.</h1>' +
      '<div class="pills"><span>Bisa tanpa akun</span><span>Jalan tanpa sinyal</span><span>Lokasi satwa dirahasiakan</span></div>' +
      '<div class="actions">' +
      '<a class="btn btn-amber" href="#/lapor" data-act="welcomeGo" data-to="#/lapor">Lapor Sekarang</a>' +
      '<a class="btn btn-ghost-light" href="#/akun" data-act="welcomeGo" data-to="#/akun">Masuk / Daftar</a>' +
      '<a class="link" href="#/beranda" data-act="welcomeGo" data-to="#/beranda">Jelajahi dulu tanpa akun</a>' +
      '<div class="foot">' + esc(S.config.instansi || C.INSTANSI || '') + '</div></div></section>';
  };
  ACT.welcomeGo = function (el) { LS.set('welcomed', true); go(el.dataset.to); };

  // ================= LAYAR: BERANDA =================
  VIEWS.beranda = function () {
    var nama = S.user ? S.user.nama.split(' ')[0] : 'Sahabat Satwa';
    var jam = new Date().getHours();
    var salam = jam < 11 ? 'Selamat pagi,' : jam < 15 ? 'Selamat siang,' : jam < 18 ? 'Selamat sore,' : 'Selamat malam,';
    var tertunda = S.outbox.length;
    var pill = tertunda
      ? '<button class="sync-pill" data-act="syncNow">' + ic('wifiOff') + tertunda + ' laporan menunggu sinyal</button>'
      : '<span class="sync-pill ok">' + ic('check') + 'Semua terkirim</span>';
    var tel = S.config.nomorDarurat;
    var sos = '<div class="sos">' + ic('alert') + '<div class="grow"><b>Satwa terluka atau masuk permukiman?</b><small>Jangan tangani sendiri. Hubungi petugas.</small></div>' +
      (tel ? '<a class="btn btn-danger btn-sm" href="tel:' + esc(tel.replace(/[^\d+]/g, '')) + '">Telepon</a>'
        : '<a class="btn btn-danger btn-sm" href="#/lapor?jenis=luka">Lapor</a>') + '</div>';
    var staf = isStaf() ? '<a class="list-item mt12" style="margin:12px 20px 0;width:auto" href="#/petugas"><span class="thumb">' + ic('shield') + '</span><span class="grow"><span class="t">Panel Petugas</span><span class="small">' + esc(PERAN[S.user.peran]) + ' · antrean verifikasi</span></span>' + ic('chev') + '</a>' : '';
    var mine = S.mine.slice(0, 2).map(itemLaporan).join('') || '<div class="empty">Belum ada laporan. Laporan Anda akan muncul di sini.</div>';
    var sp = S.species.slice(0, 8).map(function (s) {
      return '<a class="sp-card" href="#/spesies/' + esc(s.id) + '"><span class="img"' + (s.foto ? ' style="background-image:url(\'' + esc(s.foto) + '\')"' : '') + '>' + (s.foto ? '' : ic('paw')) + '</span><span>' + esc(s.nama) + '</span></a>';
    }).join('') || '<div class="empty">Memuat kamus…</div>';
    var total = S.config.totalTerverifikasi;
    var inst = installPrompt ? '<div class="pad mt12"><button class="btn btn-outline" data-act="install">' + ic('download') + 'Pasang SILANGKA di layar utama</button></div>' : '';
    return '<div class="greet"><div class="row"><img class="logo-mini" src="logo.png" alt=""><div><div class="small">' + salam + '</div><div style="font-size:19px;font-weight:700">' + esc(nama) + '</div></div></div>' + pill + '</div>' +
      '<a class="cta" href="#/lapor"><span class="plus"><svg viewBox="0 0 24 24">' + ICON.plus + '</svg></span><span><b>Laporkan Temuan</b><small>Perjumpaan, satwa terluka, perburuan, atau konflik</small></span></a>' +
      sos + staf + inst +
      '<div class="section-head"><h2 class="h2">Laporan Saya</h2><a href="#/laporan">Lihat semua</a></div>' +
      '<div class="pad stack">' + mine + '</div>' +
      '<div class="section-head"><h2 class="h2">Kenali Satwa Dilindungi</h2><a href="#/kamus">Kamus</a></div>' +
      '<div class="hscroll">' + sp + '</div>' +
      (typeof total === 'number' && total > 0 ? '<div class="stat-strip"><div class="card"><b>' + total + '</b><span class="small">laporan terverifikasi BKSDA</span></div></div>' : '') +
      '<div class="pad mt20"><a class="small" href="#/tentang">Tentang SILANGKA &amp; kontak</a></div>';
  };
  function itemLaporan(m) {
    var sp = spesiesById(m.spesiesId);
    var j = JENIS[m.jenis] || {};
    return '<a class="list-item" href="#/lacak/' + esc(m.id) + '">' + thumbSp(sp) +
      '<span class="grow"><span class="t">' + esc(m.spesies || (sp && sp.nama) || 'Belum teridentifikasi') + ' · ' + esc((j.label || '').split(' /')[0]) + '</span>' +
      '<span class="small">' + esc(m.id) + ' · ' + tgl(m.dibuat) + '</span></span>' + badgeStatus(m.status || 'Terkirim') + '</a>';
  }
  ACT.install = function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(function () { installPrompt = null; render(); });
  };
  ACT.syncNow = function () { if (!navigator.onLine) { toast('Masih tanpa sinyal. Laporan aman tersimpan di HP.'); return; } sinkron(true); };

  // ================= LAYAR: KAMUS =================
  var kamusFilter = { q: '', k: '' };
  VIEWS.kamus = function () {
    var kel = [];
    S.species.forEach(function (s) { if (s.kelompok && kel.indexOf(s.kelompok) < 0) kel.push(s.kelompok); });
    return '<div class="screen-head"><h1 class="h1">Kamus Kehati Senakin</h1><p class="sub">Kenali satwa sebelum melapor</p></div>' +
      '<div class="pad mt12"><label class="search">' + ic('search') + '<input id="kq" type="search" placeholder="Cari nama lokal, Indonesia, atau latin" aria-label="Cari spesies" value="' + esc(kamusFilter.q) + '"></label></div>' +
      '<div class="chips"><button class="chip' + (!kamusFilter.k ? ' on' : '') + '" data-act="kel" data-k="">Semua</button>' +
      kel.map(function (k) { return '<button class="chip' + (kamusFilter.k === k ? ' on' : '') + '" data-act="kel" data-k="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      '<div id="klist" class="pad stack mt12"></div>';
  };
  VIEWS.kamus.after = function () {
    isiKamus();
    $('#kq').addEventListener('input', function (e) { kamusFilter.q = e.target.value; isiKamus(); });
  };
  function isiKamus() {
    var q = kamusFilter.q.toLowerCase();
    var list = S.species.filter(function (s) {
      if (kamusFilter.k && s.kelompok !== kamusFilter.k) return false;
      return !q || (s.nama + ' ' + s.latin + ' ' + (s.lokal || '')).toLowerCase().indexOf(q) > -1;
    });
    $('#klist').innerHTML = list.map(function (s) {
      var iu = IUCN[s.iucn];
      return '<a class="list-item" href="#/spesies/' + esc(s.id) + '">' + thumbSp(s, 'lg') +
        '<span class="grow"><span class="t" style="font-size:14px">' + esc(s.nama) + '</span><span class="small latin">' + esc(s.latin) + '</span>' +
        '<span class="row" style="gap:5px;padding-top:2px">' + (iu ? '<span class="tag ' + iu[1] + '">IUCN · ' + esc(s.iucn) + '</span>' : '') +
        (s.dilindungi ? '<span class="tag b-teal">Dilindungi</span>' : '') + '</span></span>' + ic('chev') + '</a>';
    }).join('') || '<div class="empty">' + (S.species.length ? 'Tidak ada yang cocok.' : 'Kamus belum termuat. Periksa koneksi lalu buka lagi.') + '</div>';
  }
  ACT.kel = function (el) { kamusFilter.k = el.dataset.k; render(); };

  // ================= LAYAR: DETAIL SPESIES =================
  var tabSp = 'ciri';
  VIEWS.spesies = function (r) {
    var s = spesiesById(r.arg);
    if (!s) return topbar('Spesies', '#/kamus') + '<div class="empty">Spesies tidak ditemukan.</div>';
    var iu = IUCN[s.iucn] || [s.iucn || '-', 'b-gray'];
    var isi = {
      ciri: '<p>' + esc(s.ciri) + '</p>',
      habitat: '<p>' + esc(s.habitat) + '</p><div class="note-dashed">Lokasi perjumpaan tidak ditampilkan untuk melindungi satwa dari perburuan.</div>',
      temu: '<p>' + esc(s.panduan) + '</p><p><b>Jika terluka:</b> jangan disentuh, segera laporkan sebagai kejadian darurat.</p>'
    };
    return '<div class="sp-hero"' + (s.foto ? ' style="background-image:url(\'' + esc(s.foto) + '\')"' : '') + '>' +
      '<a class="icon-btn back" href="#/kamus" aria-label="Kembali">' + ic('back') + '</a>' + (s.foto ? '' : '<span class="ph">' + ic('paw') + '</span>') + '</div>' +
      '<div class="pad mt16"><h1 class="h1" style="font-size:36px">' + esc(s.nama) + '</h1>' +
      '<p class="sub latin">' + esc(s.latin) + (s.lokal ? ' · ' + esc(s.lokal) : '') + (s.endemik ? ' · ' + esc(s.endemik) : '') + '</p>' +
      '<div class="status-grid"><div class="' + iu[1] + '"><small>IUCN</small><b>' + esc(iu[0]) + '</b></div>' +
      '<div class="b-purple"><small>CITES</small><b>' + (s.cites ? 'Apendiks ' + esc(s.cites) : '—') + '</b></div>' +
      '<div class="b-teal"><small>Nasional</small><b>' + (s.dilindungi ? 'Dilindungi' : 'Tidak') + '</b></div></div></div>' +
      '<div class="tabs" role="tablist">' + [['ciri', 'Ciri'], ['habitat', 'Habitat'], ['temu', 'Jika Bertemu']].map(function (t) {
        return '<button role="tab" class="' + (tabSp === t[0] ? 'on' : '') + '" data-act="tabSp" data-t="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="prose">' + isi[tabSp] + '</div>' +
      '<div class="pad mt20 stack"><a class="btn btn-amber" href="#/lapor?spesies=' + esc(s.id) + '">Laporkan perjumpaan ' + esc(s.nama) + '</a>' +
      '<span class="small" style="text-align:center">Status perlindungan merujuk PermenLHK P.106/2018 · diverifikasi BKSDA</span></div>';
  };
  ACT.tabSp = function (el) { tabSp = el.dataset.t; render(); };

  // ================= LAYAR: LAPOR (WIZARD) =================
  function wizardBaru(q) {
    var w = {
      clientId: uuid(), kode: kodeAcak(), step: 1, jenis: '', anonim: false, fotos: [],
      lat: '', lng: '', akurasi: '', spesiesId: '', spesiesLain: '', jumlah: 1, kondisi: '',
      waktuTemuan: localInput(), deskripsi: '', nama: '', wa: '', setuju: false, dibuat: new Date().toISOString()
    };
    if (q) {
      if (q.get('spesies')) { w.spesiesId = q.get('spesies'); w.jenis = 'jumpa'; w.kondisi = 'Sehat'; }
      if (q.get('jenis') && JENIS[q.get('jenis')]) { w.jenis = q.get('jenis'); w.kondisi = JENIS[w.jenis].kondisi; }
    }
    return w;
  }
  var simpanTimer;
  function autosave() {
    clearTimeout(simpanTimer);
    simpanTimer = setTimeout(function () { if (W) DB.set('draftAktif', W); }, 400);
  }
  VIEWS.lapor = function (r) {
    if (!W) {
      app.innerHTML = '<div class="empty">Menyiapkan formulir…</div>';
      DB.get('draftAktif', null).then(function (d) {
        W = (d && !r.query.get('baru') && !r.query.get('spesies') && !r.query.get('jenis')) ? d : wizardBaru(r.query);
        if (route().name === 'lapor') render();
      });
      return;
    }
    if (W.selesai) return layarSelesai();
    var step = W.step;
    var head = '<div class="topbar"><a class="icon-btn" href="#/beranda" aria-label="Tutup">' + ic('close') + '</a>' +
      '<span class="title">' + (W.jenis ? esc(JENIS[W.jenis].label) : 'Laporan Baru') + '</span><span class="small" style="padding-right:8px">Langkah ' + step + ' dari 4</span></div>' +
      '<div class="progress">' + [1, 2, 3, 4].map(function (i) { return '<span class="' + (i <= step ? 'on' : '') + '"></span>'; }).join('') + '</div>';
    return head + [null, stepJenis, stepBukti, stepDetail, stepRingkas][step]();
  };
  VIEWS.lapor.after = function () {
    if (!W || W.selesai) return;
    if (W.step === 2) pasangPetaLapor();
    $$('[data-w]').forEach(function (el) {
      var ev = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        var k = el.dataset.w;
        W[k] = el.type === 'checkbox' ? el.checked : el.value;
        if (k === 'spesiesId') { var lain = $('#lainWrap'); if (lain) lain.hidden = W.spesiesId !== '_lain'; }
        autosave();
      });
    });
  };

  function stepJenis() {
    var paksa = W.jenis === 'buru';
    return '<div class="screen-head"><h1 class="h1">Apa yang Anda temukan?</h1><p class="sub">Pilih satu. Prioritas penanganan menyesuaikan pilihan ini.</p></div>' +
      '<div class="pad mt16 opt-grid">' + Object.keys(JENIS).map(function (k) {
        var j = JENIS[k];
        return '<button class="opt' + (W.jenis === k ? ' on' : '') + (j.urgent ? ' urgent' : '') + '" data-act="pilihJenis" data-j="' + k + '" aria-pressed="' + (W.jenis === k) + '">' +
          '<span class="mk"><svg viewBox="0 0 24 24">' + ICON[j.icon] + '</svg></span><b>' + esc(j.label) + '</b><small>' + esc(j.hint) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="pad mt12"><label class="check"><span style="flex:1"><b style="font-size:13.5px">Kirim sebagai anonim</b><br><span class="small">' +
      (paksa ? 'Wajib untuk laporan perburuan' : 'Nama dan nomor HP tidak dikirim') + '</span></span>' +
      '<input type="checkbox" data-w="anonim" ' + (W.anonim || paksa ? 'checked' : '') + (paksa ? ' disabled' : '') + ' aria-label="Kirim sebagai anonim"></label></div>' +
      (JENIS[W.jenis] && JENIS[W.jenis].urgent && S.config.nomorDarurat ? '<div class="pad mt12"><a class="btn btn-danger" href="tel:' + esc(S.config.nomorDarurat.replace(/[^\d+]/g, '')) + '">' + ic('phone') + 'Darurat? Telepon petugas sekarang</a></div>' : '') +
      '<div class="pad mt24"><button class="btn btn-primary" data-act="lanjut" ' + (W.jenis ? '' : 'disabled') + '>Lanjut ke Foto &amp; Lokasi</button></div>';
  }
  ACT.pilihJenis = function (el) {
    W.jenis = el.dataset.j; W.kondisi = JENIS[W.jenis].kondisi;
    if (W.jenis === 'buru') W.anonim = true;
    autosave(); render();
  };

  function stepBukti() {
    var foto = W.fotos.map(function (f, i) {
      return '<div class="photo" style="background-image:url(\'' + f + '\')"><button data-act="hapusFoto" data-i="' + i + '" aria-label="Hapus foto">×</button></div>';
    }).join('');
    var tambah = W.fotos.length < 3
      ? '<label class="photo-add">' + ic('camera') + 'Kamera<input type="file" accept="image/*" capture="environment" id="fCam" aria-label="Ambil foto dengan kamera"></label>' +
      (W.fotos.length < 2 ? '<label class="photo-add">' + ic('image') + 'Galeri<input type="file" accept="image/*" multiple id="fGal" aria-label="Pilih foto dari galeri"></label>' : '')
      : '';
    var adaLok = W.lat !== '' && W.lng !== '';
    return (navigator.onLine ? '' : '<div class="pad mt12"><div class="offline-bar">' + ic('wifiOff') + '<span>Tanpa sinyal. Laporan disimpan dan terkirim otomatis saat online.</span></div></div>') +
      '<div class="pad mt16 stack"><span class="label">Foto bukti <span class="small">(maks. 3)</span></span>' +
      '<div class="photos">' + foto + tambah + '</div>' +
      '<span class="small">Data GPS di dalam foto dihapus otomatis sebelum dikirim.</span></div>' +
      '<div class="pad mt16 stack"><span class="label">Lokasi temuan</span>' +
      '<div class="map" id="mapLapor">' + (adaLeaflet() && navigator.onLine ? '' : '<div class="empty" style="padding-top:70px">' + (adaLok ? 'Lokasi tersimpan ✓' : 'Peta butuh sinyal. GPS tetap bisa dipakai.') + '</div>') +
      (adaLok ? '<span class="map-note">' + (W.akurasi ? 'GPS · akurasi ±' + esc(W.akurasi) + ' m' : 'Pin manual') + '</span>' : '') + '</div>' +
      '<div class="btn-grid2"><button class="btn btn-outline-teal btn-sm" data-act="gps" style="width:100%">' + ic('pin') + 'Lokasi saat ini</button>' +
      '<button class="btn btn-outline btn-sm" data-act="manualLok" style="width:100%">Isi koordinat</button></div>' +
      '<span class="small">' + (adaLok ? 'Titik: ' + Number(W.lat).toFixed(5) + ', ' + Number(W.lng).toFixed(5) + (adaLeaflet() && navigator.onLine ? ' · geser pin bila perlu' : '') : 'Lokasi belum diisi.') + '</span>' +
      '<div class="lock-note">' + ic('lock') + '<span>Titik presisi hanya terlihat oleh petugas BKSDA.</span></div></div>' +
      '<div class="pad mt24 btn-row"><button class="btn btn-outline" data-act="simpanDraf">Simpan draf</button>' +
      '<button class="btn btn-primary" data-act="lanjut">Lanjut</button></div>' +
      '<div class="pad mt12"><button class="btn btn-outline btn-sm" style="width:100%" data-act="mundur">Kembali</button></div>';
  }
  function pasangPetaLapor() {
    var el = $('#mapLapor');
    $$('#fCam,#fGal').forEach(function (inp) { inp.addEventListener('change', tambahFoto); });
    if (!el || !adaLeaflet() || !navigator.onLine) return;
    var adaLok = W.lat !== '' && W.lng !== '';
    var pusat = adaLok ? [Number(W.lat), Number(W.lng)] : [-3.05, 116.0];
    var m = L.map(el, { zoomControl: true, attributionControl: true }).setView(pusat, adaLok ? 16 : 8);
    tileLayer().addTo(m);
    maps.push(m);
    var mk = null;
    function pasang(ll) {
      if (mk) mk.setLatLng(ll); else {
        mk = L.marker(ll, { draggable: true }).addTo(m);
        mk.on('dragend', function () { var p = mk.getLatLng(); W.lat = p.lat; W.lng = p.lng; W.akurasi = ''; autosave(); });
      }
    }
    if (adaLok) pasang(pusat);
    m.on('click', function (e) { W.lat = e.latlng.lat; W.lng = e.latlng.lng; W.akurasi = ''; pasang(e.latlng); autosave(); });
    if (!adaLok) setTimeout(function () { ACT.gps(null, null, true); }, 300);
  }
  ACT.gps = function (el, e, diam) {
    if (!navigator.geolocation) { toast('Perangkat tidak mendukung GPS.'); return; }
    if (!diam) toast('Mencari lokasi GPS…');
    navigator.geolocation.getCurrentPosition(function (p) {
      W.lat = p.coords.latitude; W.lng = p.coords.longitude; W.akurasi = Math.round(p.coords.accuracy);
      autosave(); if (route().name === 'lapor' && W.step === 2) render();
    }, function (err) {
      if (!diam) toast(err.code === 1 ? 'Izin lokasi ditolak. Aktifkan di pengaturan browser, atau isi koordinat.' : 'GPS belum dapat sinyal. Coba di tempat terbuka.');
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 });
  };
  ACT.manualLok = function () {
    modal('<h2 class="h2">Isi koordinat manual</h2><p class="sub">Format desimal, contoh: -3.123456 dan 116.123456</p>' +
      '<div class="stack mt12"><div class="field"><label for="mLat">Lintang (latitude)</label><input class="input" id="mLat" inputmode="decimal" value="' + esc(W.lat) + '"></div>' +
      '<div class="field"><label for="mLng">Bujur (longitude)</label><input class="input" id="mLng" inputmode="decimal" value="' + esc(W.lng) + '"></div>' +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="simpanLok">Simpan</button></div></div>');
  };
  ACT.simpanLok = function () {
    var la = parseFloat(String($('#mLat').value).replace(',', '.')), lo = parseFloat(String($('#mLng').value).replace(',', '.'));
    if (!isFinite(la) || !isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) { toast('Koordinat tidak valid.'); return; }
    W.lat = la; W.lng = lo; W.akurasi = ''; autosave(); tutupModal(); render();
  };
  ACT.tutup = tutupModal;
  function tambahFoto(e) {
    var files = Array.prototype.slice.call(e.target.files || []).slice(0, 3 - W.fotos.length);
    if (!files.length) return;
    toast('Memproses foto…');
    Promise.all(files.map(function (f) { return kompres(f, 1600, 0.8); })).then(function (arr) {
      W.fotos = W.fotos.concat(arr).slice(0, 3); autosave(); render();
    }).catch(function (err) { toast(err.message); });
  }
  // Kompres + buang metadata EXIF (termasuk GPS) dengan menggambar ulang di canvas
  function kompres(file, max, q) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = function () { rej(new Error('Foto tidak bisa dibaca. Coba foto lain.')); };
      img.src = url;
    });
  }
  ACT.hapusFoto = function (el) { W.fotos.splice(Number(el.dataset.i), 1); autosave(); render(); };

  function stepDetail() {
    var opsi = '<option value="">— Pilih spesies —</option>' + S.species.map(function (s) {
      return '<option value="' + esc(s.id) + '"' + (W.spesiesId === s.id ? ' selected' : '') + '>' + esc(s.nama) + ' (' + esc(s.latin) + ')</option>';
    }).join('') + '<option value="_lain"' + (W.spesiesId === '_lain' ? ' selected' : '') + '>Belum tahu / spesies lain</option>';
    var kondisi = ['Sehat', 'Terluka', 'Mati', 'Tidak tahu'];
    var butuhKontak = !W.anonim && W.jenis !== 'buru' && !S.user;
    return '<div class="screen-head"><h1 class="h1">Detail temuan</h1><p class="sub">Isi sebisanya. Petugas akan memastikan identifikasi.</p></div>' +
      '<div class="pad mt16 stack">' +
      '<div class="field"><label for="wSp">Spesies</label><select class="input" id="wSp" data-w="spesiesId">' + opsi + '</select></div>' +
      '<div class="field" id="lainWrap"' + (W.spesiesId === '_lain' ? '' : ' hidden') + '><label for="wLain">Nama/ciri satwa (bila tahu)</label><input class="input" id="wLain" data-w="spesiesLain" value="' + esc(W.spesiesLain) + '" placeholder="mis. monyet hidung panjang"></div>' +
      '<div class="field"><span class="label">Jumlah individu</span><div class="stepper"><button data-act="jml" data-d="-1" aria-label="Kurangi">−</button>' +
      '<input class="input" id="wJml" inputmode="numeric" data-w="jumlah" value="' + esc(W.jumlah) + '" aria-label="Jumlah individu"><button data-act="jml" data-d="1" aria-label="Tambah">+</button></div></div>' +
      '<div class="field"><span class="label">Kondisi satwa</span><div class="seg">' + kondisi.map(function (k) {
        return '<button class="' + (W.kondisi === k ? 'on' : '') + '" data-act="kondisi" data-k="' + k + '">' + k + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><label for="wWaktu">Waktu temuan</label><input class="input" id="wWaktu" type="datetime-local" data-w="waktuTemuan" value="' + esc(W.waktuTemuan) + '"></div>' +
      '<div class="field"><label for="wDesk">Keterangan</label><textarea class="input" id="wDesk" data-w="deskripsi" placeholder="Perilaku, ciri, situasi sekitar, arah pergerakan…">' + esc(W.deskripsi) + '</textarea></div>' +
      (butuhKontak ? '<div class="card stack"><span class="small">Opsional — agar petugas bisa menghubungi Anda. Tidak tampil ke publik.</span>' +
        '<div class="field"><label for="wNama">Nama</label><input class="input" id="wNama" data-w="nama" value="' + esc(W.nama) + '" autocomplete="name"></div>' +
        '<div class="field"><label for="wWa">Nomor WhatsApp</label><input class="input" id="wWa" data-w="wa" inputmode="tel" value="' + esc(W.wa) + '" autocomplete="tel"></div></div>' : '') +
      '</div><div class="pad mt24 btn-row"><button class="btn btn-outline" data-act="mundur">Kembali</button><button class="btn btn-primary" data-act="lanjut">Lanjut ke Ringkasan</button></div>';
  }
  ACT.jml = function (el) { W.jumlah = Math.max(1, Math.min(999, (Number(W.jumlah) || 1) + Number(el.dataset.d))); $('#wJml').value = W.jumlah; autosave(); };
  ACT.kondisi = function (el) { W.kondisi = el.dataset.k; $$('.seg button').forEach(function (b) { b.classList.toggle('on', b === el); }); autosave(); };

  function stepRingkas() {
    var sp = spesiesById(W.spesiesId);
    var nmSp = sp ? sp.nama : (W.spesiesLain || 'Belum teridentifikasi');
    return '<div class="screen-head"><h1 class="h1">Periksa &amp; kirim</h1><p class="sub">Pastikan data sudah benar.</p></div>' +
      '<div class="pad mt16"><div class="card summary"><dl>' +
      '<dt>Kejadian</dt><dd>' + esc(JENIS[W.jenis].label) + '</dd>' +
      '<dt>Spesies</dt><dd>' + esc(nmSp) + '</dd>' +
      '<dt>Jumlah</dt><dd>' + esc(W.jumlah) + ' individu · ' + esc(W.kondisi || '-') + '</dd>' +
      '<dt>Waktu</dt><dd>' + tgl(W.waktuTemuan) + '</dd>' +
      '<dt>Lokasi</dt><dd>' + (W.lat !== '' ? Number(W.lat).toFixed(5) + ', ' + Number(W.lng).toFixed(5) : '<span class="err">Belum diisi</span>') + '</dd>' +
      '<dt>Foto</dt><dd>' + W.fotos.length + ' foto</dd>' +
      '<dt>Pelapor</dt><dd>' + (W.anonim || W.jenis === 'buru' ? 'Anonim' : esc(S.user ? S.user.nama : (W.nama || 'Tanpa nama'))) + '</dd>' +
      '</dl></div></div>' +
      '<div class="pad mt12"><label class="check"><input type="checkbox" data-w="setuju" ' + (W.setuju ? 'checked' : '') + '>' +
      '<span class="small" style="color:var(--ink)">Data ini benar sesuai yang saya lihat. Saya setuju data dipakai BKSDA Kalimantan Selatan dan perusahaan untuk konservasi satwa.</span></label></div>' +
      '<div class="pad mt24 stack"><button class="btn btn-amber" data-act="kirim">Kirim Laporan</button>' +
      '<div class="btn-row"><button class="btn btn-outline" data-act="mundur">Kembali</button><button class="btn btn-outline" data-act="simpanDraf">Simpan draf</button></div></div>';
  }

  ACT.lanjut = function () {
    if (W.step === 1 && !W.jenis) { toast('Pilih jenis kejadian dulu.'); return; }
    if (W.step === 2 && (W.lat === '' || W.lng === '')) { toast('Isi lokasi temuan dulu.'); return; }
    if (W.step === 3 && !W.spesiesId) { toast('Pilih spesies, atau "Belum tahu".'); return; }
    W.step = Math.min(4, W.step + 1); autosave(); render();
  };
  ACT.mundur = function () { W.step = Math.max(1, W.step - 1); autosave(); render(); };
  ACT.simpanDraf = function () {
    var d = W; d.disimpan = new Date().toISOString();
    S.drafts = [d].concat(S.drafts.filter(function (x) { return x.clientId !== d.clientId; }));
    DB.set('drafts', S.drafts); DB.set('draftAktif', null); W = null;
    toast('Draf disimpan di HP.'); go('#/laporan');
  };
  ACT.kirim = function (el) {
    if (!W.setuju) { toast('Centang persetujuan dulu.'); return; }
    var paket = {
      clientId: W.clientId, kode: W.kode, jenis: W.jenis, anonim: W.anonim || W.jenis === 'buru',
      lat: Number(W.lat), lng: Number(W.lng), akurasi: W.akurasi, spesiesId: W.spesiesId === '_lain' ? '' : W.spesiesId,
      spesiesLain: W.spesiesLain, jumlah: W.jumlah, kondisi: W.kondisi,
      waktuTemuan: new Date(W.waktuTemuan).toISOString(), deskripsi: W.deskripsi,
      nama: W.nama, wa: W.wa, fotos: W.fotos, perangkat: deviceId()
    };
    var catatan = { clientId: W.clientId, kode: W.kode, jenis: W.jenis, spesiesId: paket.spesiesId, dibuat: new Date().toISOString() };
    el.disabled = true; el.textContent = 'Mengirim…';
    var keAntrean = function () {
      paket.offline = true;
      S.outbox = S.outbox.filter(function (x) { return x.paket.clientId !== paket.clientId; }).concat([{ paket: paket, meta: catatan }]);
      DB.set('outbox', S.outbox); DB.set('draftAktif', null);
      W = { selesai: true, antre: true }; render();
    };
    if (!navigator.onLine) return keAntrean();
    api('submitReport', { report: paket }).then(function (r) {
      catatan.id = r.id; catatan.status = r.status;
      catatan.spesies = spesiesById(paket.spesiesId) ? spesiesById(paket.spesiesId).nama : (paket.spesiesLain || 'Belum teridentifikasi');
      S.mine = [catatan].concat(S.mine.filter(function (m) { return m.id !== r.id; })); simpanMine();
      DB.set('draftAktif', null);
      W = { selesai: true, id: r.id, kode: paket.kode }; render();
    }).catch(function (err) {
      if (err.offline) return keAntrean();
      el.disabled = false; el.textContent = 'Kirim Laporan'; toast(err.message);
    });
  };
  function layarSelesai() {
    var isi = W.antre
      ? '<div class="done-hero"><div style="font-size:13px;color:#CFE3DF">Tersimpan di HP</div><div class="tiket">Menunggu sinyal</div><div class="small" style="color:#CFE3DF">Laporan akan terkirim otomatis saat ada koneksi. Jangan hapus data browser.</div></div>'
      : '<div class="done-hero"><div style="font-size:13px;color:#CFE3DF">Laporan terkirim. Terima kasih!</div><div class="tiket">' + esc(W.id) + '</div>' +
      '<div class="small" style="color:#CFE3DF;margin-bottom:10px">Kode lacak (simpan atau screenshot):</div><span class="kode">' + esc(W.kode) + '</span></div>';
    return '<div class="topbar"><span class="title" style="padding-left:12px">Selesai</span></div>' +
      '<div class="pad mt16">' + isi + '</div>' +
      '<div class="pad mt16 card" style="margin:16px 20px 0"><b style="font-size:13.5px">Selanjutnya</b><p class="small" style="line-height:1.6">Petugas akan memeriksa laporan Anda. Pantau statusnya di menu <b>Laporan</b>. Jangan bagikan lokasi satwa di media sosial.</p></div>' +
      '<div class="pad mt24 stack">' + (W.id ? '<a class="btn btn-primary" href="#/lacak/' + esc(W.id) + '" data-act="selesaiKe" data-to="#/lacak/' + esc(W.id) + '">Lihat status laporan</a>' : '') +
      '<a class="btn btn-outline" href="#/beranda" data-act="selesaiKe" data-to="#/beranda">Kembali ke Beranda</a>' +
      '<a class="btn btn-outline" href="#/lapor?baru=1" data-act="selesaiKe" data-to="#/lapor?baru=1">Buat laporan lain</a></div>';
  }
  ACT.selesaiKe = function (el) { W = null; go(el.dataset.to); };

  // ================= SINKRONISASI OFFLINE =================
  function sinkron(manual) {
    if (DEMO && !manual) { /* demo tetap jalan */ }
    if (S.syncing || !S.outbox.length || !navigator.onLine) return Promise.resolve();
    S.syncing = true;
    var antre = S.outbox.slice(), terkirim = 0;
    var urut = antre.reduce(function (p, item) {
      return p.then(function () {
        return api('submitReport', { report: item.paket }).then(function (r) {
          var m = item.meta; m.id = r.id; m.status = r.status;
          var sp = spesiesById(m.spesiesId); m.spesies = sp ? sp.nama : (item.paket.spesiesLain || 'Belum teridentifikasi');
          S.mine = [m].concat(S.mine.filter(function (x) { return x.id !== r.id; }));
          S.outbox = S.outbox.filter(function (x) { return x.paket.clientId !== item.paket.clientId; });
          terkirim++;
        }).catch(function (err) {
          if (err.offline) throw err;          // hentikan, coba lagi nanti
          item.error = err.message;            // simpan alasan, tidak dihapus
        });
      });
    }, Promise.resolve());
    return urut.catch(function () { }).then(function () {
      S.syncing = false; simpanMine(); DB.set('outbox', S.outbox);
      if (terkirim) { toast(terkirim + ' laporan tertunda berhasil terkirim.'); if (['beranda', 'laporan'].indexOf(route().name) > -1) render(); }
    });
  }
  window.addEventListener('online', function () { toast('Kembali online.'); sinkron(); });
  setInterval(function () { sinkron(); }, 60000);

  // ================= LAYAR: LAPORAN SAYA =================
  VIEWS.laporan = function () {
    var antre = S.outbox.map(function (o) {
      var sp = spesiesById(o.meta.spesiesId);
      return '<div class="list-item">' + thumbSp(sp) + '<span class="grow"><span class="t">' + esc(sp ? sp.nama : 'Belum teridentifikasi') + ' · ' + esc(JENIS[o.meta.jenis].label.split(' /')[0]) + '</span>' +
        '<span class="small">' + (o.error ? '<span class="err">Gagal: ' + esc(o.error) + '</span>' : 'Dibuat ' + tgl(o.meta.dibuat)) + '</span></span><span class="badge b-amber">Antre</span></div>';
    }).join('');
    var draf = S.drafts.map(function (d, i) {
      var sp = spesiesById(d.spesiesId);
      return '<div class="list-item">' + thumbSp(sp) + '<span class="grow"><span class="t">' + esc(d.jenis ? JENIS[d.jenis].label : 'Draf tanpa jenis') + '</span>' +
        '<span class="small">Disimpan ' + tgl(d.disimpan) + '</span></span>' +
        '<button class="btn btn-outline btn-sm" data-act="lanjutDraf" data-i="' + i + '">Lanjut</button>' +
        '<button class="icon-btn" data-act="hapusDraf" data-i="' + i + '" aria-label="Hapus draf">' + ic('close') + '</button></div>';
    }).join('');
    return '<div class="screen-head row between"><div><h1 class="h1">Laporan Saya</h1><p class="sub">Tersimpan di perangkat ini' + (S.user ? ' dan akun Anda' : '') + '</p></div>' +
      (S.outbox.length ? '<button class="icon-btn" data-act="syncNow" aria-label="Kirim ulang">' + ic('refresh') + '</button>' : '') + '</div>' +
      (antre ? '<div class="section-head"><h2 class="h2">Menunggu sinyal</h2></div><div class="pad stack">' + antre + '</div>' : '') +
      (draf ? '<div class="section-head"><h2 class="h2">Draf</h2></div><div class="pad stack">' + draf + '</div>' : '') +
      '<div class="section-head"><h2 class="h2">Terkirim</h2>' + (S.user ? '<a href="#/laporan" data-act="tarikServer">Perbarui</a>' : '') + '</div>' +
      '<div class="pad stack" id="listMine">' + (S.mine.map(itemLaporan).join('') || '<div class="empty">Belum ada laporan terkirim.</div>') + '</div>' +
      '<div class="section-head"><h2 class="h2">Lacak laporan lain</h2></div>' +
      '<div class="pad"><div class="card stack"><span class="small">Punya nomor laporan & kode lacak dari perangkat lain?</span>' +
      '<input class="input" id="tId" placeholder="Nomor laporan, mis. SLK-2610-0001" autocapitalize="characters">' +
      '<input class="input" id="tKode" placeholder="Kode lacak 6 huruf" autocapitalize="characters" maxlength="6">' +
      '<button class="btn btn-primary" data-act="lacakManual">Lacak</button></div></div>';
  };
  VIEWS.laporan.after = function () { if (S.user) ACT.tarikServer(null, null, true); };
  ACT.tarikServer = function (el, e, diam) {
    if (!S.user || !navigator.onLine) return;
    api('myReports').then(function (r) {
      (r.reports || []).forEach(function (x) {
        var ada = S.mine.filter(function (m) { return m.id === x.id; })[0];
        if (ada) { ada.status = x.status; ada.spesies = x.spesies; } else S.mine.push({ id: x.id, jenis: x.jenis, spesies: x.spesies, dibuat: x.dibuat, status: x.status });
      });
      S.mine.sort(function (a, b) { return String(b.dibuat).localeCompare(String(a.dibuat)); });
      simpanMine();
      var l = $('#listMine'); if (l && route().name === 'laporan') l.innerHTML = S.mine.map(itemLaporan).join('') || '<div class="empty">Belum ada laporan terkirim.</div>';
      if (!diam) toast('Daftar diperbarui.');
    }).catch(function (err) { if (!diam) toast(err.message); });
  };
  ACT.lanjutDraf = function (el) {
    var d = S.drafts[Number(el.dataset.i)];
    S.drafts.splice(Number(el.dataset.i), 1); DB.set('drafts', S.drafts);
    W = d; DB.set('draftAktif', W); go('#/lapor');
  };
  ACT.hapusDraf = function (el) {
    if (!confirm('Hapus draf ini?')) return;
    S.drafts.splice(Number(el.dataset.i), 1); DB.set('drafts', S.drafts); render();
  };
  ACT.lacakManual = function () {
    var id = $('#tId').value.trim().toUpperCase(), kode = $('#tKode').value.trim().toUpperCase();
    if (!id || kode.length < 6) { toast('Isi nomor laporan dan kode lacak.'); return; }
    if (!S.mine.some(function (m) { return m.id === id; })) { S.mine.unshift({ id: id, kode: kode, dibuat: new Date().toISOString(), status: 'Terkirim' }); simpanMine(); }
    else S.mine.forEach(function (m) { if (m.id === id) m.kode = kode; });
    go('#/lacak/' + id);
  };

  // ================= LAYAR: LACAK =================
  VIEWS.lacak = function (r) {
    var m = S.mine.filter(function (x) { return x.id === r.arg; })[0];
    if (m && m.cache) setTimeout(function () { tampilLacak(m.cache); }, 0);
    api('track', { id: r.arg, kode: m ? m.kode : '' }).then(function (res) {
      var rep = res.report;
      if (m) { m.status = rep.status; m.spesies = rep.spesies; m.cache = rep; simpanMine(); }
      if (route().name === 'lacak' && route().arg === r.arg) tampilLacak(rep);
    }).catch(function (err) {
      if (!(m && m.cache) && route().name === 'lacak') $('#lacakBody').innerHTML = '<div class="empty">' + esc(err.offline ? 'Tidak ada koneksi. Status akan tampil saat online.' : err.message) + '</div>';
    });
    return topbar('Status Laporan', '#/laporan') + '<div id="lacakBody"><div class="empty">Memuat status…</div></div>';
  };
  function tampilLacak(rep) {
    var tidakValid = rep.status === 'Tidak Valid';
    var idx = URUT_STATUS.indexOf(rep.status);
    var riw = rep.riwayat || [];
    var langkah = (tidakValid ? ['Terkirim', 'Tidak Valid'] : URUT_STATUS).map(function (st, i) {
      var h = riw.filter(function (x) { return x.status === st; }).slice(-1)[0];
      var kelas = tidakValid ? (i === 0 ? '' : 'bad') : (i < idx ? '' : i === idx ? (st === 'Selesai' ? '' : 'now') : 'next');
      var mark = kelas === 'next' ? '' : kelas === 'bad' ? '!' : kelas === 'now' ? '•' : '✓';
      var ket = h ? tgl(h.waktu) + (h.catatan ? ' · ' + h.catatan : '') : ({ Diterima: 'Diperiksa tim lingkungan', Diverifikasi: 'Identifikasi oleh BKSDA', Ditindaklanjuti: 'Penanganan oleh petugas', Selesai: 'Anda akan melihat pembaruan di sini' }[st] || '');
      var terakhir = tidakValid ? i === 1 : i === URUT_STATUS.length - 1;
      return '<div class="tl"><div class="rail"><span class="dot ' + kelas + '">' + mark + '</span>' + (terakhir ? '' : '<span class="bar' + (kelas === '' ? ' on' : '') + '"></span>') + '</div>' +
        '<div class="txt' + (kelas === 'next' ? ' dim' : '') + '"><b>' + esc(st === 'Ditindaklanjuti' ? 'Ditindaklanjuti' : st) + '</b><span class="small">' + esc(ket) + '</span></div></div>';
    }).join('');
    var pesan = riw.filter(function (x) { return /Pesan|Info tambahan/.test(x.judul); }).map(function (x) {
      return '<div class="msg"><div class="who">' + esc(x.oleh === 'Anda' ? 'Anda' : 'Petugas') + ' · ' + tgl(x.waktu) + '</div>' + esc(x.catatan) + '</div>';
    }).join('');
    var m = S.mine.filter(function (x) { return x.id === rep.id; })[0];
    $('#lacakBody').innerHTML =
      '<div class="ticket"><div class="row between"><span class="small" style="letter-spacing:.5px">' + esc(rep.id) + '</span>' + badgeStatus(rep.status) + '</div>' +
      '<span class="big">' + esc(rep.spesies) + ' · ' + esc(rep.jumlah) + ' individu</span>' +
      '<small>' + esc((JENIS[rep.jenis] || {}).label || '') + ' · ' + tgl(rep.waktuTemuan) + (rep.wilayah ? ' · ' + esc(rep.wilayah) : '') + '</small>' +
      (m && m.kode ? '<small>Kode lacak: <b style="letter-spacing:2px;color:#fff">' + esc(m.kode) + '</b></small>' : '') + '</div>' +
      '<div class="timeline">' + langkah + '</div>' +
      (pesan ? '<div class="pad stack">' + pesan + '</div>' : '') +
      (rep.status !== 'Selesai' && !tidakValid ? '<div class="pad mt20"><button class="btn btn-primary" data-act="tambahInfo" data-id="' + esc(rep.id) + '">Tambah info / foto</button></div>' : '');
  }
  ACT.tambahInfo = function (el) {
    modal('<h2 class="h2">Tambah info untuk petugas</h2><div class="stack mt12">' +
      '<textarea class="input" id="iPesan" placeholder="mis. satwa terlihat lagi di lokasi yang sama pagi ini"></textarea>' +
      '<label class="photo-add" style="height:64px">' + ic('camera') + '<span id="iFotoLbl">Lampirkan 1 foto (opsional)</span><input type="file" accept="image/*" id="iFoto"></label>' +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="kirimInfo" data-id="' + esc(el.dataset.id) + '">Kirim</button></div></div>');
    $('#iFoto').addEventListener('change', function () { $('#iFotoLbl').textContent = '1 foto dipilih'; });
  };
  ACT.kirimInfo = function (el) {
    var m = S.mine.filter(function (x) { return x.id === el.dataset.id; })[0];
    var f = $('#iFoto').files[0];
    el.disabled = true; el.textContent = 'Mengirim…';
    (f ? kompres(f, 1600, 0.8) : Promise.resolve(null)).then(function (foto) {
      return api('addInfo', { id: el.dataset.id, kode: m ? m.kode : '', pesan: $('#iPesan').value, fotos: foto ? [foto] : [] });
    }).then(function (r) {
      tutupModal(); toast('Info terkirim.'); if (m) { m.cache = r.report; simpanMine(); } tampilLacak(r.report);
    }).catch(function (err) { el.disabled = false; el.textContent = 'Kirim'; toast(err.message); });
  };

  // ================= LAYAR: PETA PUBLIK =================
  var petaF = { k: '', bulan: 12 };
  VIEWS.peta = function () {
    var kel = [];
    S.species.forEach(function (s) { if (s.kelompok && kel.indexOf(s.kelompok) < 0) kel.push(s.kelompok); });
    return '<div class="screen-head"><h1 class="h1">Peta Sebaran</h1><p class="sub">Kepadatan laporan terverifikasi, bukan titik lokasi</p></div>' +
      '<div class="chips"><button class="chip' + (!petaF.k ? ' on' : '') + '" data-act="petaK" data-k="">Semua</button>' +
      kel.map(function (k) { return '<button class="chip' + (petaF.k === k ? ' on' : '') + '" data-act="petaK" data-k="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') +
      [6, 12, 24].map(function (b) { return '<button class="chip' + (petaF.bulan === b ? ' on' : '') + '" data-act="petaB" data-b="' + b + '">' + b + ' bulan</button>'; }).join('') + '</div>' +
      '<div class="pad mt12"><div class="map tall" id="mapPublik">' + (adaLeaflet() && navigator.onLine ? '' : '<div class="empty" style="padding-top:150px">Peta butuh koneksi internet.</div>') + '<span class="map-note" id="petaInfo">Memuat…</span></div></div>' +
      '<div class="legend"><span>Sedikit</span><span class="sw" style="background:#CDE3DD"></span><span class="sw" style="background:#7FB3AA"></span><span class="sw" style="background:#2F7F76"></span><span class="sw" style="background:#16514D"></span><span>Banyak</span></div>' +
      '<div class="card shield">' + ic('shield') + '<span class="small" style="line-height:1.5;color:#2A4442">Data tampil setelah masa jeda sejak diverifikasi. Spesies rawan perburuan dan laporan perburuan tidak ditampilkan di peta publik.</span></div>';
  };
  VIEWS.peta.after = function () {
    var el = $('#mapPublik');
    if (!adaLeaflet() || !navigator.onLine || !el) { $('#petaInfo').hidden = true; return; }
    var m = L.map(el, { zoomControl: true }).setView([-3.0, 115.8], 8);
    tileLayer().addTo(m); maps.push(m);
    api('publicMap', { kelompok: petaF.k, bulan: petaF.bulan }).then(function (r) {
      var cells = r.cells || [], g = r.grid || 0.05, maks = Math.max.apply(null, cells.map(function (c) { return c.n; }).concat([1]));
      var warna = ['#CDE3DD', '#7FB3AA', '#2F7F76', '#16514D'], grup = [];
      cells.forEach(function (c) {
        var lv = Math.min(3, Math.floor((c.n / maks) * 3.999));
        var rect = L.rectangle([[c.lat, c.lng], [c.lat + g, c.lng + g]], { color: warna[lv], weight: 1, fillColor: warna[lv], fillOpacity: 0.7 })
          .bindPopup(c.n + ' laporan terverifikasi di kotak ini').addTo(m);
        grup.push(rect);
      });
      if (grup.length) m.fitBounds(L.featureGroup(grup).getBounds().pad(0.4));
      var info = $('#petaInfo'); if (info) info.textContent = '1 kotak ≈ ' + Math.round(g * 111) + ' × ' + Math.round(g * 111) + ' km · ' + cells.length + ' kotak';
    }).catch(function (err) { var info = $('#petaInfo'); if (info) info.textContent = err.message; });
  };
  ACT.petaK = function (el) { petaF.k = el.dataset.k; render(); };
  ACT.petaB = function (el) { petaF.bulan = Number(el.dataset.b); render(); };

  // ================= LAYAR: AKUN =================
  var tabAkun = 'masuk';
  VIEWS.akun = function () {
    if (S.user) {
      return '<div class="screen-head"><h1 class="h1">Akun</h1></div>' +
        '<div class="pad mt16"><div class="card row"><span class="thumb lg">' + ic('user') + '</span><div class="stack" style="gap:2px"><b>' + esc(S.user.nama) + '</b><span class="small">' + esc(S.user.email) + '</span>' +
        '<span class="badge b-teal" style="align-self:flex-start;margin-top:4px">' + esc(PERAN[S.user.peran] || S.user.peran) + '</span></div></div></div>' +
        '<div class="pad mt16 stack">' + (isStaf() ? '<a class="btn btn-primary" href="#/petugas">' + ic('shield') + 'Buka Panel Petugas</a>' : '') +
        (installPrompt ? '<button class="btn btn-outline" data-act="install">' + ic('download') + 'Pasang di layar utama</button>' : '') +
        '<button class="btn btn-outline" data-act="gantiPw">Ganti password</button>' +
        '<a class="btn btn-outline" href="#/tentang">Tentang &amp; kontak</a>' +
        '<button class="btn btn-outline" data-act="keluar" style="color:var(--red-ink)">Keluar</button></div>';
    }
    var daftar = tabAkun === 'daftar';
    return '<div class="screen-head"><h1 class="h1">' + (daftar ? 'Buat akun' : 'Masuk') + '</h1><p class="sub">Akun membuat laporan Anda tersimpan di semua perangkat. Melapor tetap bisa tanpa akun.</p></div>' +
      '<div class="tabs" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button class="' + (!daftar ? 'on' : '') + '" data-act="tabAkun" data-t="masuk">Masuk</button><button class="' + (daftar ? 'on' : '') + '" data-act="tabAkun" data-t="daftar">Daftar</button></div>' +
      '<form class="pad mt16 stack" id="fAkun" novalidate>' +
      (daftar ? '<div class="field"><label for="aNama">Nama lengkap</label><input class="input" id="aNama" autocomplete="name" required></div>' : '') +
      '<div class="field"><label for="aEmail">Email</label><input class="input" id="aEmail" type="email" autocomplete="email" required></div>' +
      (daftar ? '<div class="field"><label for="aWa">Nomor WhatsApp (opsional)</label><input class="input" id="aWa" inputmode="tel" autocomplete="tel"></div>' +
        '<div class="field"><label for="aInst">Instansi / perusahaan (opsional)</label><input class="input" id="aInst"></div>' : '') +
      '<div class="field"><label for="aPw">Password' + (daftar ? ' (min. 8 karakter)' : '') + '</label><input class="input" id="aPw" type="password" autocomplete="' + (daftar ? 'new-password' : 'current-password') + '" required></div>' +
      '<p class="err" id="aErr" hidden></p>' +
      '<button class="btn btn-primary" type="submit">' + (daftar ? 'Daftar' : 'Masuk') + '</button>' +
      (DEMO ? '<p class="small">Mode demo: masuk dengan <b>petugas@demo.id</b> (Verifikator) atau <b>admin@demo.id</b> (Superadmin), password bebas.</p>' : '') +
      '<p class="small">Petugas BKSDA & admin perusahaan: akun dibuatkan oleh Superadmin.</p></form>';
  };
  VIEWS.akun.after = function () {
    var f = $('#fAkun'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var daftar = tabAkun === 'daftar', btn = $('button[type=submit]', f), er = $('#aErr');
      var data = { email: $('#aEmail').value, password: $('#aPw').value };
      if (daftar) { data.nama = $('#aNama').value; data.wa = $('#aWa').value; data.instansi = $('#aInst').value; }
      btn.disabled = true; er.hidden = true;
      api(daftar ? 'register' : 'login', data).then(function (r) {
        S.token = r.token; S.user = r.user; LS.set('token', r.token); LS.set('user', r.user);
        toast('Selamat datang, ' + r.user.nama.split(' ')[0] + '!');
        go(STAF.indexOf(r.user.peran) > -1 ? '#/petugas' : '#/beranda');
      }).catch(function (err) { btn.disabled = false; er.textContent = err.message; er.hidden = false; });
    });
  };
  ACT.tabAkun = function (el) { tabAkun = el.dataset.t; render(); };
  ACT.keluar = function () { api('logout').catch(function () { }); keluarLokal(); toast('Anda telah keluar.'); go('#/beranda'); };
  function keluarLokal() { S.token = ''; S.user = null; LS.del('token'); LS.del('user'); }
  ACT.gantiPw = function () {
    modal('<h2 class="h2">Ganti password</h2><div class="stack mt12"><div class="field"><label for="pL">Password lama</label><input class="input" id="pL" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label for="pB">Password baru (min. 8)</label><input class="input" id="pB" type="password" autocomplete="new-password"></div>' +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="simpanPw">Simpan</button></div></div>');
  };
  ACT.simpanPw = function () {
    api('changePassword', { lama: $('#pL').value, baru: $('#pB').value }).then(function () { tutupModal(); toast('Password diganti.'); }).catch(function (e) { toast(e.message); });
  };

  // ================= LAYAR: TENTANG =================
  VIEWS.tentang = function () {
    var c = S.config;
    return topbar('Tentang SILANGKA', '#/beranda') +
      '<div class="pad mt16 stack"><div class="card row"><img src="logo.png" alt="Logo SILANGKA" style="height:56px;width:auto"><div><b style="font-family:var(--display);font-size:24px">SILANGKA</b><div class="small">' + esc(C.KEPANJANGAN || '') + ' · versi ' + esc(c.versi || '2.0') + '</div></div></div>' +
      '<div class="card"><p style="margin:0;font-size:13.5px;line-height:1.6">SILANGKA memudahkan masyarakat dan karyawan melaporkan keberadaan, kondisi, dan ancaman terhadap satwa dilindungi. Laporan diverifikasi oleh BKSDA Kalimantan Selatan dan dimanfaatkan untuk perlindungan satwa.</p>' +
      '<p class="small mt12">' + esc(c.instansi || C.INSTANSI || '') + '</p></div>' +
      '<div class="card stack"><b style="font-size:14px">Kontak</b>' +
      (c.nomorDarurat ? '<a class="btn btn-danger btn-sm" style="width:100%" href="tel:' + esc(c.nomorDarurat.replace(/[^\d+]/g, '')) + '">' + ic('phone') + 'Telepon darurat ' + esc(c.nomorDarurat) + '</a>' : '<span class="small">Nomor darurat belum diatur admin.</span>') +
      (c.waDarurat ? '<a class="btn btn-outline btn-sm" style="width:100%" href="https://wa.me/' + esc(c.waDarurat.replace(/\D/g, '')) + '" target="_blank" rel="noopener">WhatsApp petugas</a>' : '') +
      (c.emailKontak ? '<a class="btn btn-outline btn-sm" style="width:100%" href="mailto:' + esc(c.emailKontak) + '">' + esc(c.emailKontak) + '</a>' : '') + '</div>' +
      '<div class="card"><b style="font-size:14px">Privasi &amp; keamanan data</b><ul class="small" style="line-height:1.7;padding-left:18px;margin:8px 0 0">' +
      '<li>Titik lokasi presisi hanya dapat dibuka petugas, dan setiap akses tercatat.</li>' +
      '<li>Peta publik hanya menampilkan kepadatan per kotak, setelah masa jeda.</li>' +
      '<li>Data GPS dalam foto dihapus sebelum dikirim.</li>' +
      '<li>Laporan anonim tidak menyimpan nama dan nomor HP.</li></ul></div>' +
      '<a class="btn btn-outline" href="#/selamat-datang">Lihat layar pembuka</a></div>';
  };

  // ================= PANEL PETUGAS =================
  var P = { tab: 'antrean', f: { status: 'terbuka', prioritas: '', jenis: '', q: '' }, list: [], sel: null, detail: null, foto: {} };
  VIEWS.petugas = function (r) {
    if (!isStaf()) { toast('Masuk dengan akun petugas.'); setTimeout(function () { go('#/akun'); }, 0); return ''; }
    if (r.arg) P.tab = r.arg;
    var menu = [['antrean', 'Antrean Verifikasi'], ['statistik', 'Statistik']].concat(S.user.peran === 'superadmin' ? [['pengguna', 'Pengguna & Akses']] : []);
    return '<div class="staff"><aside><div class="brand"><img src="logo.png" alt=""><span><b>SILANGKA</b><span class="small" style="color:#9CC3BD">Panel Petugas</span></span></div>' +
      menu.map(function (m) { return '<a href="#/petugas/' + m[0] + '" class="' + (P.tab === m[0] ? 'on' : '') + '">' + m[1] + '</a>'; }).join('') +
      '<button class="side" data-act="ekspor">Ekspor CSV</button><a href="#/beranda">Ke aplikasi publik</a><button class="side" data-act="keluar">Keluar</button>' +
      '<span class="who">' + esc(S.user.nama) + '<br>' + esc(PERAN[S.user.peran]) + '</span></aside><main id="pMain"><div class="empty">Memuat…</div></main></div>';
  };
  VIEWS.petugas.after = function () {
    if (!isStaf()) return;
    ({ antrean: tabAntrean, statistik: tabStatistik, pengguna: tabPengguna }[P.tab] || tabAntrean)();
  };

  function tabAntrean() {
    var main = $('#pMain');
    main.innerHTML = '<div class="row between" style="flex-wrap:wrap"><div><h1 class="h1" style="font-size:40px">Antrean Verifikasi</h1><p class="sub">Urut: status terbuka, prioritas, terbaru</p></div>' +
      '<button class="btn btn-outline btn-sm" data-act="muatAntrean">' + ic('refresh') + 'Muat ulang</button></div>' +
      '<div class="kpis" id="pKpi"></div>' +
      '<div class="filters"><select class="input" id="fStatus" aria-label="Filter status">' + [['terbuka', 'Status terbuka'], ['', 'Semua status']].concat(URUT_STATUS.concat(['Tidak Valid']).map(function (s) { return [s, s]; })).map(function (o) { return '<option value="' + o[0] + '"' + (P.f.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      '<select class="input" id="fPrio" aria-label="Filter prioritas"><option value="">Semua prioritas</option>' + ['Darurat', 'Tinggi', 'Normal'].map(function (p) { return '<option' + (P.f.prioritas === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>' +
      '<select class="input" id="fJenis" aria-label="Filter jenis"><option value="">Semua kejadian</option>' + Object.keys(JENIS).map(function (k) { return '<option value="' + k + '"' + (P.f.jenis === k ? ' selected' : '') + '>' + JENIS[k].label + '</option>'; }).join('') + '</select>' +
      '<input class="input" id="fQ" type="search" placeholder="Cari nomor, spesies, wilayah" value="' + esc(P.f.q) + '" style="flex:1;min-width:180px"></div>' +
      '<div class="split"><div class="tbl-wrap" id="pTbl"><div class="empty">Memuat…</div></div><div class="side-panel" id="pDet"><div class="empty">Pilih laporan untuk melihat detail.</div></div></div>';
    ['fStatus', 'fPrio', 'fJenis'].forEach(function (id) { $('#' + id).addEventListener('change', bacaFilter); });
    var qt; $('#fQ').addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(bacaFilter, 400); });
    api('staffStats').then(function (s) {
      var k = $('#pKpi'); if (!k) return;
      k.innerHTML = '<div class="kpi"><small>Masuk hari ini</small><b>' + s.masukHariIni + '</b></div>' +
        '<div class="kpi"><small>Menunggu verifikasi</small><b>' + s.menunggu + '</b></div>' +
        '<div class="kpi alert"><small>Darurat terbuka</small><b>' + s.daruratTerbuka + '</b></div>' +
        '<div class="kpi"><small>Respons pertama rata-rata</small><b>' + (s.rataResponsJam == null ? '—' : String(s.rataResponsJam).replace('.', ',') + ' jam') + '</b></div>';
    }).catch(function (e) { toast(e.message); });
    muatAntrean();
  }
  function bacaFilter() {
    P.f = { status: $('#fStatus').value, prioritas: $('#fPrio').value, jenis: $('#fJenis').value, q: $('#fQ').value };
    muatAntrean();
  }
  function muatAntrean() {
    api('staffList', P.f).then(function (r) {
      P.list = r.reports || [];
      var t = $('#pTbl'); if (!t) return;
      t.innerHTML = P.list.length ? '<table class="tbl"><thead><tr><th>Prioritas</th><th>No. Laporan</th><th>Kejadian</th><th>Spesies</th><th>Wilayah</th><th>Masuk</th><th>Status</th></tr></thead><tbody>' +
        P.list.map(function (x) {
          return '<tr data-act="pilihLaporan" data-id="' + esc(x.id) + '" class="' + (P.sel === x.id ? 'sel' : '') + '" tabindex="0">' +
            '<td>' + badgePrio(x.prioritas) + '</td><td><b>' + esc(x.id) + '</b></td><td>' + esc((JENIS[x.jenis] || {}).label || x.jenis) + '</td>' +
            '<td>' + esc(x.spesies) + ' · ' + esc(x.jumlah) + '</td><td>' + esc(x.wilayah) + '</td><td>' + tgl(x.dibuat) + '</td><td>' + badgeStatus(x.status) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="empty">Tidak ada laporan untuk filter ini.</div>';
      if (P.sel) bukaDetail(P.sel);
    }).catch(function (e) { var t = $('#pTbl'); if (t) t.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  ACT.muatAntrean = function () { muatAntrean(); };
  ACT.pilihLaporan = function (el) {
    P.sel = el.dataset.id;
    $$('#pTbl tr').forEach(function (tr) { tr.classList.toggle('sel', tr.dataset.id === P.sel); });
    bukaDetail(P.sel);
    if (window.innerWidth < 900) setTimeout(function () { $('#pDet').scrollIntoView({ behavior: 'smooth' }); }, 50);
  };
  function bukaDetail(id) {
    var d = $('#pDet'); if (!d) return;
    d.innerHTML = '<div class="empty">Memuat detail…</div>';
    api('staffDetail', { id: id }).then(function (r) { P.detail = r.report; gambarDetail(); }).catch(function (e) { d.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function gambarDetail() {
    var x = P.detail, d = $('#pDet'); if (!d || !x) return;
    hapusPeta();
    var gmaps = 'https://www.google.com/maps?q=' + x.lat + ',' + x.lng;
    var bisaVerif = isVerif(), selesai = x.status === 'Selesai' || x.status === 'Tidak Valid';
    var tombol = [];
    if (!selesai) {
      if (x.status === 'Terkirim') tombol.push(['terima', 'Terima', 'btn-outline-teal']);
      if (bisaVerif && ['Terkirim', 'Diterima'].indexOf(x.status) > -1) tombol.push(['verifikasi', 'Verifikasi', 'btn-primary']);
      if (bisaVerif) tombol.push(['tindaklanjut', 'Disposisi / Tindak lanjut', 'btn-outline-teal']);
      if (bisaVerif && x.status !== 'Terkirim') tombol.push(['selesai', 'Tandai Selesai', 'btn-outline']);
      if (bisaVerif) tombol.push(['tidakvalid', 'Tidak Valid', 'btn-outline']);
    }
    tombol.push(['pesan', 'Pesan ke pelapor', 'btn-outline']);
    tombol.push(['catatan', 'Catatan internal', 'btn-outline']);
    d.innerHTML = '<div class="row between"><span class="small">' + esc(x.id) + '</span>' + badgePrio(x.prioritas) + '</div>' +
      '<span class="h1" style="font-size:28px">' + esc(x.spesiesTerverifikasi || x.spesies) + '</span>' +
      (x.spesiesTerverifikasi && x.spesiesTerverifikasi !== x.spesies ? '<span class="small">Dilaporkan sebagai: ' + esc(x.spesies) + '</span>' : '') +
      '<span class="small">' + esc((JENIS[x.jenis] || {}).label) + ' · ' + esc(x.jumlah) + ' individu · ' + esc(x.kondisi || '-') + '<br>Temuan ' + tgl(x.waktuTemuan) + ' · ' + esc(x.wilayah) + '</span>' +
      '<div class="row">' + badgeStatus(x.status) + (x.disposisi ? '<span class="small">Disposisi: ' + esc(x.disposisi) + '</span>' : '') + '</div>' +
      (x.fotoIds.length ? '<div class="ph-grid">' + x.fotoIds.map(function (f) { return '<a href="#" data-act="lihatFoto" data-f="' + esc(f) + '" id="ph_' + esc(f) + '" aria-label="Buka foto"></a>'; }).join('') + '</div>' : '<span class="small">Tanpa foto.</span>') +
      '<div class="coord"><span class="small">Koordinat presisi</span><b>' + Number(x.lat).toFixed(6) + ', ' + Number(x.lng).toFixed(6) + (x.akurasi ? ' (±' + esc(x.akurasi) + ' m)' : '') + '</b>' +
      '<span class="small">Akses Anda tercatat di log audit · <a href="' + gmaps + '" target="_blank" rel="noopener">Buka di Google Maps</a></span></div>' +
      '<div class="map" id="mapDet" style="height:180px"></div>' +
      (x.deskripsi ? '<div class="msg"><div class="who">Keterangan pelapor</div>' + esc(x.deskripsi) + '</div>' : '') +
      '<span class="small">Pelapor: ' + (x.anonim ? 'Anonim' : esc(x.pelaporNama || 'Tanpa nama') + (x.pelaporWa ? ' · <a href="https://wa.me/' + esc(String(x.pelaporWa).replace(/\D/g, '').replace(/^0/, '62')) + '" target="_blank" rel="noopener">' + esc(x.pelaporWa) + '</a>' : '')) + '</span>' +
      '<div class="btn-grid2">' + tombol.map(function (t) { return '<button class="btn btn-sm ' + t[2] + '" style="width:100%" data-act="aksiPetugas" data-a="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<b style="font-size:13.5px;margin-top:6px">Riwayat</b>' +
      '<div class="stack" style="gap:8px">' + x.riwayat.slice().reverse().map(function (h) {
        return '<div class="msg"><div class="who">' + esc(h.judul) + ' · ' + tgl(h.waktu) + ' <span class="tag ' + (h.publik ? 'b-teal' : 'b-gray') + '">' + (h.publik ? 'terlihat pelapor' : 'internal') + '</span></div>' +
          '<span class="small">' + esc(h.oleh) + (h.catatan ? ' — ' + esc(h.catatan) : '') + '</span></div>';
      }).join('') + '</div>';
    x.fotoIds.forEach(function (f) {
      var pasang = function (url) { var a = document.getElementById('ph_' + f); if (a) a.style.backgroundImage = 'url(' + url + ')'; };
      if (P.foto[f]) return pasang(P.foto[f]);
      api('staffPhoto', { fileId: f }).then(function (r) { P.foto[f] = 'data:' + r.mime + ';base64,' + r.data; pasang(P.foto[f]); }).catch(function () { });
    });
    if (adaLeaflet() && navigator.onLine) {
      var m = L.map($('#mapDet')).setView([x.lat, x.lng], 14); tileLayer().addTo(m); L.marker([x.lat, x.lng]).addTo(m); maps.push(m);
    }
  }
  ACT.lihatFoto = function (el) {
    var u = P.foto[el.dataset.f]; if (!u) { toast('Foto masih dimuat.'); return; }
    modal('<img src="' + u + '" alt="Foto laporan" style="width:100%;border-radius:14px"><div class="mt12"><button class="btn btn-outline" data-act="tutup">Tutup</button></div>');
  };
  ACT.aksiPetugas = function (el) {
    var a = el.dataset.a, x = P.detail;
    var judul = { terima: 'Terima laporan', verifikasi: 'Verifikasi laporan', tindaklanjut: 'Disposisi / tindak lanjut', selesai: 'Tandai selesai', tidakvalid: 'Nyatakan tidak valid', pesan: 'Pesan ke pelapor', catatan: 'Catatan internal' }[a];
    var opsiSp = S.species.map(function (s) { return '<option value="' + esc(s.id) + '"' + (x.spesiesId === s.id ? ' selected' : '') + '>' + esc(s.nama) + ' (' + esc(s.latin) + ')</option>'; }).join('');
    modal('<h2 class="h2">' + judul + '</h2><p class="sub">' + esc(x.id) + '</p><div class="stack mt12">' +
      (a === 'verifikasi' ? '<div class="field"><label for="aSp">Spesies terkonfirmasi</label><select class="input" id="aSp"><option value="">— Pilih —</option>' + opsiSp + '</select></div>' : '') +
      (a === 'tindaklanjut' ? '<div class="field"><label for="aDisp">Disposisi ke (resort / tim / petugas)</label><input class="input" id="aDisp" value="' + esc(x.disposisi || '') + '" placeholder="mis. Resort KSDA Kotabaru"></div>' : '') +
      '<div class="field"><label for="aCat">' + (a === 'pesan' ? 'Pesan (terlihat pelapor)' : 'Catatan') + '</label><textarea class="input" id="aCat" placeholder="' + (a === 'tidakvalid' ? 'Alasan, mis. foto bukan satwa dilindungi / duplikat' : '') + '"></textarea></div>' +
      (['pesan', 'catatan'].indexOf(a) < 0 ? '<label class="check"><input type="checkbox" id="aPub" checked><span class="small" style="color:var(--ink)">Tampilkan catatan ini ke pelapor</span></label>' : '') +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="kirimAksi" data-a="' + a + '">Simpan</button></div></div>');
  };
  ACT.kirimAksi = function (el) {
    var a = el.dataset.a;
    if (a === 'verifikasi' && !$('#aSp').value) { toast('Pilih spesies terkonfirmasi.'); return; }
    if ((a === 'pesan' || a === 'tidakvalid') && !$('#aCat').value.trim()) { toast('Isi catatan/pesan.'); return; }
    var data = { id: P.detail.id, aksi: a, catatan: $('#aCat').value, publik: $('#aPub') ? $('#aPub').checked : a === 'pesan' };
    if ($('#aSp')) data.spesiesId = $('#aSp').value;
    if ($('#aDisp')) data.disposisi = $('#aDisp').value;
    el.disabled = true;
    api('staffAction', data).then(function (r) {
      tutupModal(); toast('Tersimpan.'); P.detail = r.report; gambarDetail(); muatAntrean();
    }).catch(function (e) { el.disabled = false; toast(e.message); });
  };
  ACT.ekspor = function () {
    toast('Menyiapkan ekspor…');
    api('staffExport').then(function (r) {
      var rows = r.rows || []; if (!rows.length) { toast('Belum ada data.'); return; }
      var kol = Object.keys(rows[0]);
      var csv = '﻿' + [kol.join(';')].concat(rows.map(function (x) { return kol.map(function (k) { return '"' + String(x[k] == null ? '' : x[k]).replace(/"/g, '""') + '"'; }).join(';'); })).join('\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'SILANGKA-laporan-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
      toast('File CSV diunduh (bisa dibuka di Excel/Sheets).');
    }).catch(function (e) { toast(e.message); });
  };

  function tabStatistik() {
    var main = $('#pMain');
    main.innerHTML = '<h1 class="h1" style="font-size:40px">Statistik</h1><div id="pStat"><div class="empty">Memuat…</div></div>';
    api('staffStats').then(function (s) {
      function bar(obj, urut) {
        var ks = Object.keys(obj); if (urut) ks.sort(); else ks.sort(function (a, b) { return obj[b] - obj[a]; });
        var mx = Math.max.apply(null, ks.map(function (k) { return obj[k]; }).concat([1]));
        return ks.slice(urut ? -12 : 0, urut ? undefined : 10).map(function (k) {
          return '<div class="bar-row"><span>' + esc(k) + '</span><span><i style="width:' + Math.max(4, obj[k] / mx * 100) + '%"></i></span><b>' + obj[k] + '</b></div>';
        }).join('') || '<div class="empty">Belum ada data.</div>';
      }
      $('#pStat').innerHTML = '<div class="kpis"><div class="kpi"><small>Total laporan</small><b>' + s.total + '</b></div><div class="kpi"><small>Menunggu</small><b>' + s.menunggu + '</b></div><div class="kpi alert"><small>Darurat terbuka</small><b>' + s.daruratTerbuka + '</b></div></div>' +
        '<div class="split mt16"><div class="card" style="flex:1 1 300px"><b>Per status</b><div class="bars mt12">' + bar(s.perStatus) + '</div></div>' +
        '<div class="card" style="flex:1 1 300px"><b>Spesies terbanyak</b><div class="bars mt12">' + bar(s.perSpesies) + '</div></div>' +
        '<div class="card" style="flex:1 1 300px"><b>Laporan per bulan</b><div class="bars mt12">' + bar(s.perBulan, true) + '</div></div></div>';
    }).catch(function (e) { $('#pStat').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }

  function tabPengguna() {
    var main = $('#pMain');
    main.innerHTML = '<div class="row between" style="flex-wrap:wrap"><h1 class="h1" style="font-size:40px">Pengguna &amp; Akses</h1><button class="btn btn-primary btn-sm" data-act="editUser" data-id="">' + ic('plus') + 'Tambah petugas</button></div>' +
      '<div class="tbl-wrap card" style="padding:0;overflow-x:auto" id="pUsers"><div class="empty">Memuat…</div></div>';
    api('usersList').then(function (r) { gambarUsers(r.users); }).catch(function (e) { $('#pUsers').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  var USERS = [];
  function gambarUsers(list) {
    USERS = list || [];
    $('#pUsers').innerHTML = '<table class="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Instansi</th><th>Status</th><th>Login terakhir</th></tr></thead><tbody>' +
      USERS.map(function (u) {
        return '<tr data-act="editUser" data-id="' + esc(u.id) + '"><td><b>' + esc(u.nama) + '</b></td><td>' + esc(u.email) + '</td><td>' + esc(PERAN[u.peran] || u.peran) + '</td><td>' + esc(u.instansi) + '</td>' +
          '<td>' + (u.aktif ? '<span class="badge b-teal">Aktif</span>' : '<span class="badge b-gray">Nonaktif</span>') + '</td><td>' + (u.login ? tgl(u.login) : '-') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  ACT.editUser = function (el) {
    var u = USERS.filter(function (x) { return x.id === el.dataset.id; })[0] || { peran: 'verifikator', aktif: true };
    modal('<h2 class="h2">' + (u.id ? 'Ubah pengguna' : 'Tambah petugas') + '</h2><div class="stack mt12">' +
      '<div class="field"><label for="uNama">Nama</label><input class="input" id="uNama" value="' + esc(u.nama || '') + '"></div>' +
      '<div class="field"><label for="uEmail">Email</label><input class="input" id="uEmail" type="email" value="' + esc(u.email || '') + '"' + (u.id ? ' readonly' : '') + '></div>' +
      '<div class="field"><label for="uInst">Instansi</label><input class="input" id="uInst" value="' + esc(u.instansi || '') + '" placeholder="mis. BKSDA Kalimantan Selatan"></div>' +
      '<div class="field"><label for="uPeran">Peran</label><select class="input" id="uPeran">' + Object.keys(PERAN).map(function (k) { return '<option value="' + k + '"' + (u.peran === k ? ' selected' : '') + '>' + PERAN[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="uPw">' + (u.id ? 'Reset password (kosongkan jika tidak diubah)' : 'Password awal (kosongkan = dibuat otomatis)') + '</label><input class="input" id="uPw" type="text" autocomplete="off"></div>' +
      (u.id ? '<label class="check"><input type="checkbox" id="uAktif"' + (u.aktif ? ' checked' : '') + '><span class="small" style="color:var(--ink)">Akun aktif</span></label>' : '') +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="simpanUser" data-id="' + esc(u.id || '') + '">Simpan</button></div></div>');
  };
  ACT.simpanUser = function (el) {
    var data = { id: el.dataset.id, nama: $('#uNama').value, email: $('#uEmail').value, instansi: $('#uInst').value, peran: $('#uPeran').value, password: $('#uPw').value, aktif: $('#uAktif') ? $('#uAktif').checked : true };
    api('userSave', data).then(function (r) {
      gambarUsers(r.users);
      if (r.passwordSementara) modal('<h2 class="h2">Akun dibuat</h2><p class="sub">Kirim data ini ke petugas melalui jalur pribadi. Minta segera ganti password.</p><div class="card mt12"><b>' + esc(data.email) + '</b><div class="kode mt8">' + esc(r.passwordSementara) + '</div></div><div class="mt12"><button class="btn btn-primary" data-act="tutup">Selesai</button></div>');
      else { tutupModal(); toast('Tersimpan.'); }
    }).catch(function (e) { toast(e.message); });
  };

  // ================= MODE DEMO (tanpa server) =================
  var Demo = (function () {
    var SEED = [
      ['SP01', 'Bekantan', 'Nasalis larvatus', 'Kera belanda', 'Primata', 'EN', 'I', 'Endemik Borneo', 'Jantan berhidung besar menjuntai; rambut coklat kemerahan, bagian bawah pucat; ekor panjang; hidup berkelompok.', 'Hutan mangrove, rawa gambut, dan hutan tepi sungai. Pemakan daun, buah muda, dan bunga.', 'Jaga jarak dan tetap tenang. Jangan memberi makan atau mengejar. Foto tanpa flash dan catat jumlah individu.'],
      ['SP02', 'Lutung Dahi Putih', 'Presbytis frontata', 'Lutung', 'Primata', 'VU', 'II', 'Endemik Borneo', 'Tubuh abu-abu kehitaman dengan bercak putih di dahi; ekor panjang; bergerak di tajuk pohon.', 'Hutan dataran rendah dan perbukitan, termasuk hutan sekunder.', 'Amati dari jauh. Jangan menebang atau mengganggu pohon tempatnya beraktivitas.'],
      ['SP03', 'Kukang Kalimantan', 'Nycticebus borneanus', 'Kukang / Putri Malu', 'Primata', 'VU', 'I', 'Endemik Borneo', 'Primata kecil aktif malam, mata besar, gerakan lambat, garis gelap di wajah. Gigitannya berbisa.', 'Hutan dan kebun berpohon; sering ditemukan di pohon rendah pada malam hari.', 'JANGAN dipegang (gigitan berbisa). Jangan dipelihara. Laporkan bila ditemukan di permukiman atau dijual.'],
      ['SP04', 'Trenggiling Sunda', 'Manis javanica', 'Tenggiling', 'Mamalia', 'CR', 'I', '', 'Tubuh tertutup sisik keras coklat; menggulung seperti bola saat terancam; aktif malam.', 'Hutan, kebun, dan semak; memakan semut dan rayap.', 'Satwa paling rawan perburuan. Jangan sebarkan lokasi di media sosial. Laporkan segera.'],
      ['SP05', 'Beruang Madu', 'Helarctos malayanus', 'Beruang', 'Mamalia', 'VU', 'I', '', 'Beruang terkecil, rambut hitam pendek, tanda dada kuning/oranye berbentuk U.', 'Hutan dataran rendah; kadang mendekati kebun dan permukiman untuk mencari makan.', 'Berbahaya bila terdesak. Menjauh perlahan, jangan lari atau memberi makan.'],
      ['SP06', 'Kancil', 'Tragulus kanchil', 'Pelanduk', 'Mamalia', 'LC', '', '', 'Mamalia kecil berkuku, punggung coklat, garis putih di leher.', 'Lantai hutan dan semak lebat dekat sumber air.', 'Jangan ditangkap atau dijerat. Laporkan jerat yang ditemukan.'],
      ['SP07', 'Rangkong Badak', 'Buceros rhinoceros', 'Enggang', 'Burung', 'VU', 'II', '', 'Burung besar hitam-putih dengan cula oranye-merah melengkung di atas paruh.', 'Hutan primer dan sekunder tua dengan pohon tinggi berbuah.', 'Jangan mengganggu pohon sarang. Lokasi sarang sangat rahasia.'],
      ['SP08', 'Elang Brontok', 'Nisaetus cirrhatus', 'Elang', 'Burung', 'LC', 'II', '', 'Elang besar dengan dua fase warna (terang dan gelap).', 'Tepi hutan, perkebunan, dan area terbuka berpohon.', 'Jangan menembak atau mengambil anakan dari sarang.'],
      ['SP09', 'Buaya Muara', 'Crocodylus porosus', 'Buaya', 'Reptil', 'LC', 'I/II', '', 'Reptil besar kelabu kehijauan, moncong lebar.', 'Muara sungai, rawa, mangrove, dan sungai besar.', 'Berbahaya. Jauhi tepi air. Laporkan bila mendekati permukiman.'],
      ['SP10', 'Belangkas Bakau', 'Carcinoscorpius rotundicauda', 'Mimi / Belangkas', 'Pesisir', 'DD', '', '', 'Hewan bercangkang tapal kuda, ekor bulat runcing; bukan kepiting.', 'Pantai berlumpur dan hutan mangrove.', 'Jangan diambil untuk dikonsumsi atau dijual.']
    ];
    var HIDE = { SP03: 1, SP04: 1, SP07: 1 };
    var species = SEED.map(function (d) { return { id: d[0], nama: d[1], latin: d[2], lokal: d[3], kelompok: d[4], iucn: d[5], cites: d[6], dilindungi: true, endemik: d[7], ciri: d[8], habitat: d[9], panduan: d[10], foto: '' }; });
    var PRIO = { jumpa: 'Normal', luka: 'Darurat', konflik: 'Darurat', mati: 'Normal', buru: 'Tinggi', pelihara: 'Tinggi' };
    function db() { return LS.get('demo_db', null) || awal(); }
    function simpan(d) { LS.set('demo_db', d); }
    function awal() {
      var now = Date.now(), contoh = [
        ['jumpa', 'SP01', 3, -3.198, 116.012, 'Verifikasi', 40], ['jumpa', 'SP02', 2, -3.231, 116.054, 'Selesai', 60],
        ['luka', 'SP03', 1, -3.172, 115.981, 'Ditindaklanjuti', 2], ['buru', '', 1, -3.402, 115.89, 'Terkirim', 1],
        ['jumpa', 'SP01', 5, -3.21, 116.03, 'Diverifikasi', 45], ['konflik', 'SP05', 1, -3.11, 116.2, 'Terkirim', 0.2]
      ];
      var d = { seq: 0, reports: [], users: [{ id: 'U-demo1', nama: 'Petugas Demo', email: 'petugas@demo.id', peran: 'verifikator', instansi: 'BKSDA Kalimantan Selatan', aktif: true }, { id: 'U-demo2', nama: 'Superadmin Demo', email: 'admin@demo.id', peran: 'superadmin', instansi: 'PT Arutmin Indonesia Tambang Senakin', aktif: true }] };
      contoh.forEach(function (c) {
        var id = nomor(d), t = new Date(now - c[6] * 864e5).toISOString();
        var st = c[5] === 'Verifikasi' ? 'Diverifikasi' : c[5];
        d.reports.push({
          id: id, kode: 'DEMO00', dibuat: t, waktuTemuan: t, jenis: c[0], prioritas: PRIO[c[0]], spesiesId: c[1], spesiesTerverifikasi: st === 'Terkirim' ? '' : c[1],
          spesies: c[1] ? spNama(c[1]) : 'Belum teridentifikasi', jumlah: c[2], kondisi: JENIS[c[0]].kondisi, deskripsi: 'Data contoh mode demo.',
          lat: c[3], lng: c[4], akurasi: 10, wilayah: 'Kotabaru, Kalimantan Selatan', fotos: [], anonim: c[0] === 'buru', pelaporNama: c[0] === 'buru' ? '' : 'Warga Contoh', pelaporWa: '',
          status: st, disposisi: '', direspons: st === 'Terkirim' ? '' : t, diverifikasiPada: ['Diverifikasi', 'Ditindaklanjuti', 'Selesai'].indexOf(st) > -1 ? t : '',
          riwayat: [{ waktu: t, status: 'Terkirim', judul: 'Laporan terkirim', catatan: '', oleh: 'Pelapor', publik: true }].concat(st !== 'Terkirim' ? [{ waktu: t, status: st, judul: st, catatan: 'Contoh catatan petugas.', oleh: 'Petugas Demo (verifikator)', publik: true }] : [])
        });
      });
      simpan(d); return d;
    }
    function nomor(d) { d.seq++; var n = new Date(); return 'SLK-' + String(n.getFullYear()).slice(2) + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('000' + d.seq).slice(-4); }
    function spNama(id) { var s = species.filter(function (x) { return x.id === id; })[0]; return s ? s.nama : ''; }
    function pub(r, riw) {
      var o = { id: r.id, dibuat: r.dibuat, waktuTemuan: r.waktuTemuan, jenis: r.jenis, prioritas: r.prioritas, spesies: r.spesiesTerverifikasi ? spNama(r.spesiesTerverifikasi) : r.spesies, jumlah: r.jumlah, wilayah: r.wilayah, status: r.status };
      if (riw) o.riwayat = r.riwayat.filter(function (h) { return h.publik; }).map(function (h) { return Object.assign({}, h, { oleh: h.oleh === 'Pelapor' ? 'Anda' : 'Petugas' }); });
      return o;
    }
    function user(p) { return p.token ? db().users.filter(function (u) { return 'demo-' + u.id === p.token; })[0] : null; }
    function handle(p) {
      return new Promise(function (res, rej) {
        setTimeout(function () {
          try { var r = proses(p); r.ok = true; res(r); } catch (e) { rej(e); }
        }, 250);
      });
    }
    function proses(p) {
      var d = db(), u = user(p), a = p.action;
      var staf = function () { if (!u || STAF.indexOf(u.peran) < 0) throw new Error('Akun Anda tidak memiliki akses untuk aksi ini.'); };
      if (a === 'config') return { versi: '2.0-demo', instansi: C.INSTANSI, nomorDarurat: C.NOMOR_DARURAT || '', totalTerverifikasi: d.reports.filter(function (r) { return ['Diverifikasi', 'Ditindaklanjuti', 'Selesai'].indexOf(r.status) > -1; }).length };
      if (a === 'species') return { species: species };
      if (a === 'login' || a === 'register') {
        var email = String(p.email || '').toLowerCase();
        var x = d.users.filter(function (z) { return z.email === email; })[0];
        if (!x) { x = { id: 'U-' + uuid().slice(0, 6), nama: p.nama || email.split('@')[0] || 'Pelapor', email: email, peran: 'pelapor', instansi: p.instansi || '', aktif: true }; d.users.push(x); simpan(d); }
        return { token: 'demo-' + x.id, user: x };
      }
      if (a === 'logout') return {};
      if (a === 'me') { if (!u) throw new Error('Sesi berakhir. Silakan masuk kembali.'); return { user: u }; }
      if (a === 'changePassword') return {};
      if (a === 'submitReport') {
        var q = p.report, dup = d.reports.filter(function (r) { return r.clientId === q.clientId; })[0];
        if (dup) return { id: dup.id, status: dup.status };
        var id = nomor(d), now = new Date().toISOString(), an = q.anonim || q.jenis === 'buru';
        d.reports.push({
          id: id, kode: q.kode, clientId: q.clientId, dibuat: now, waktuTemuan: q.waktuTemuan, jenis: q.jenis, prioritas: PRIO[q.jenis], spesiesId: q.spesiesId, spesiesTerverifikasi: '',
          spesies: q.spesiesId ? spNama(q.spesiesId) : (q.spesiesLain || 'Belum teridentifikasi'), jumlah: q.jumlah, kondisi: q.kondisi, deskripsi: q.deskripsi, lat: q.lat, lng: q.lng, akurasi: q.akurasi,
          wilayah: 'Wilayah (demo)', fotos: q.fotos, anonim: an, pelaporId: an ? '' : (u ? u.id : ''), pelaporNama: an ? '' : (u ? u.nama : q.nama), pelaporWa: an ? '' : q.wa, status: 'Terkirim', disposisi: '',
          riwayat: [{ waktu: now, status: 'Terkirim', judul: 'Laporan terkirim', catatan: q.offline ? 'Dibuat saat offline, terkirim otomatis.' : '', oleh: 'Pelapor', publik: true }]
        });
        try { simpan(d); } catch (e) { }
        return { id: id, status: 'Terkirim' };
      }
      var cari = function (id) { var r = d.reports.filter(function (x) { return x.id === id; })[0]; if (!r) throw new Error('Laporan tidak ditemukan.'); return r; };
      if (a === 'track') { var r1 = cari(p.id); if (p.kode !== r1.kode && !(u && (r1.pelaporId === u.id || STAF.indexOf(u.peran) > -1))) throw new Error('Kode lacak salah.'); return { report: pub(r1, true) }; }
      if (a === 'addInfo') { var r2 = cari(p.id); r2.riwayat.push({ waktu: new Date().toISOString(), status: '', judul: 'Info tambahan dari pelapor', catatan: p.pesan + (p.fotos.length ? ' (+1 foto)' : ''), oleh: 'Pelapor', publik: true }); r2.fotos = (r2.fotos || []).concat(p.fotos); simpan(d); return { report: pub(r2, true) }; }
      if (a === 'myReports') { return { reports: d.reports.filter(function (r) { return u && r.pelaporId === u.id; }).map(function (r) { return pub(r); }) }; }
      if (a === 'publicMap') {
        var g = 0.05, sel = {};
        d.reports.forEach(function (r) {
          var sid = r.spesiesTerverifikasi || r.spesiesId;
          if (['Diverifikasi', 'Ditindaklanjuti', 'Selesai'].indexOf(r.status) < 0 || r.jenis === 'buru' || r.jenis === 'pelihara' || !sid || HIDE[sid]) return;
          var s = species.filter(function (x) { return x.id === sid; })[0];
          if (p.kelompok && (!s || s.kelompok !== p.kelompok)) return;
          var k = (Math.floor(r.lat / g) * g).toFixed(4) + ',' + (Math.floor(r.lng / g) * g).toFixed(4); sel[k] = (sel[k] || 0) + 1;
        });
        return { grid: g, jedaHari: 0, cells: Object.keys(sel).map(function (k) { var z = k.split(','); return { lat: Number(z[0]), lng: Number(z[1]), n: sel[k] }; }) };
      }
      staf();
      if (a === 'staffStats') {
        var ps = {}, pp = {}, pb = {};
        d.reports.forEach(function (r) { ps[r.status] = (ps[r.status] || 0) + 1; var n = r.spesiesTerverifikasi ? spNama(r.spesiesTerverifikasi) : r.spesies; pp[n] = (pp[n] || 0) + 1; var b = r.dibuat.slice(0, 7); pb[b] = (pb[b] || 0) + 1; });
        var today = new Date().toDateString();
        return {
          masukHariIni: d.reports.filter(function (r) { return new Date(r.dibuat).toDateString() === today; }).length,
          menunggu: d.reports.filter(function (r) { return r.status === 'Terkirim' || r.status === 'Diterima'; }).length,
          daruratTerbuka: d.reports.filter(function (r) { return r.prioritas === 'Darurat' && ['Selesai', 'Tidak Valid'].indexOf(r.status) < 0; }).length,
          rataResponsJam: null, total: d.reports.length, perStatus: ps, perSpesies: pp, perBulan: pb
        };
      }
      if (a === 'staffList') {
        var bobot = { Darurat: 0, Tinggi: 1, Normal: 2 }, qq = String(p.q || '').toLowerCase();
        return {
          reports: d.reports.filter(function (r) {
            var buka = ['Selesai', 'Tidak Valid'].indexOf(r.status) < 0;
            if (p.status === 'terbuka' && !buka) return false; if (p.status && p.status !== 'terbuka' && r.status !== p.status) return false;
            if (p.prioritas && r.prioritas !== p.prioritas) return false; if (p.jenis && r.jenis !== p.jenis) return false;
            return !qq || (r.id + ' ' + r.spesies + ' ' + r.wilayah).toLowerCase().indexOf(qq) > -1;
          }).sort(function (x, y) { return (bobot[x.prioritas] - bobot[y.prioritas]) || String(y.dibuat).localeCompare(String(x.dibuat)); })
            .map(function (r) { return { id: r.id, dibuat: r.dibuat, jenis: r.jenis, prioritas: r.prioritas, spesies: r.spesiesTerverifikasi ? spNama(r.spesiesTerverifikasi) : r.spesies, jumlah: r.jumlah, wilayah: r.wilayah, status: r.status }; })
        };
      }
      if (a === 'staffDetail') { var r3 = cari(p.id); return { report: det(r3) }; }
      if (a === 'staffPhoto') {
        var hit = null; d.reports.forEach(function (r) { (r.fotos || []).forEach(function (f, i) { if (r.id + '#' + i === p.fileId) hit = f; }); });
        if (!hit) throw new Error('Foto tidak ada.'); var m = hit.match(/^data:(.*?);base64,(.*)$/); return { mime: m[1], data: m[2] };
      }
      if (a === 'staffAction') {
        var r4 = cari(p.id), now2 = new Date().toISOString();
        var map = { terima: 'Diterima', verifikasi: 'Diverifikasi', tindaklanjut: 'Ditindaklanjuti', selesai: 'Selesai', tidakvalid: 'Tidak Valid' };
        if (map[p.aksi]) r4.status = map[p.aksi];
        if (p.aksi === 'verifikasi') r4.diverifikasiPada = now2;
        if (p.spesiesId) r4.spesiesTerverifikasi = p.spesiesId;
        if (p.disposisi) r4.disposisi = p.disposisi;
        var judul = { terima: 'Diterima petugas', verifikasi: 'Diverifikasi BKSDA', tindaklanjut: 'Ditindaklanjuti', selesai: 'Selesai', tidakvalid: 'Dinyatakan tidak valid', catatan: 'Catatan petugas', pesan: 'Pesan dari petugas' }[p.aksi];
        r4.riwayat.push({ waktu: now2, status: map[p.aksi] || '', judul: judul, catatan: p.catatan + (p.spesiesId ? ' (Spesies: ' + spNama(p.spesiesId) + ')' : '') + (p.disposisi ? ' (Disposisi: ' + p.disposisi + ')' : ''), oleh: u.nama + ' (' + u.peran + ')', publik: p.aksi === 'catatan' ? false : p.publik !== false });
        simpan(d); return { report: det(r4) };
      }
      if (a === 'staffExport') return { rows: d.reports.map(function (r) { return { id: r.id, dibuat: r.dibuat, jenis: JENIS[r.jenis].label, prioritas: r.prioritas, spesies: r.spesies, jumlah: r.jumlah, lat: r.lat, lng: r.lng, status: r.status }; }) };
      if (a === 'usersList') return { users: d.users };
      if (a === 'userSave') {
        var ex = d.users.filter(function (z) { return z.id === p.id || z.email === p.email; })[0], out = {};
        if (ex) Object.assign(ex, { nama: p.nama, peran: p.peran, instansi: p.instansi, aktif: p.aktif });
        else { d.users.push({ id: 'U-' + uuid().slice(0, 6), nama: p.nama, email: String(p.email).toLowerCase(), peran: p.peran, instansi: p.instansi, aktif: true }); out.passwordSementara = p.password || 'Slk-demo123'; }
        simpan(d); out.users = d.users; return out;
      }
      throw new Error('Aksi tidak dikenal: ' + a);
    }
    function det(r) {
      return {
        id: r.id, dibuat: r.dibuat, waktuTemuan: r.waktuTemuan, jenis: r.jenis, prioritas: r.prioritas, spesiesId: r.spesiesTerverifikasi || r.spesiesId, spesies: r.spesies,
        spesiesTerverifikasi: r.spesiesTerverifikasi ? spNama(r.spesiesTerverifikasi) : '', jumlah: r.jumlah, kondisi: r.kondisi, deskripsi: r.deskripsi, lat: r.lat, lng: r.lng, akurasi: r.akurasi,
        wilayah: r.wilayah, fotoIds: (r.fotos || []).map(function (f, i) { return r.id + '#' + i; }), anonim: r.anonim, pelaporNama: r.pelaporNama, pelaporWa: r.pelaporWa,
        status: r.status, disposisi: r.disposisi, riwayat: r.riwayat
      };
    }
    return { handle: handle };
  })();

  // ================= MULAI =================
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installPrompt = e; if (['beranda', 'akun'].indexOf(route().name) > -1) render(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
  }
  if (DEMO) document.getElementById('banner-demo').hidden = false;

  Promise.all([DB.get('outbox', []), DB.get('drafts', [])]).then(function (v) {
    S.outbox = v[0] || []; S.drafts = v[1] || [];
    render();
    muatAntrean0();
  });
  function muatAntrean0() { muatAwal(); setTimeout(function () { sinkron(); }, 1500); }
})();
