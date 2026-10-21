/* ============================================================
 * SILANGKA 2.1 — Aplikasi (PWA, responsif HP · tablet · laptop)
 * Sistem Informasi Laporan Satwa Langka
 * Tidak perlu diubah. Pengaturan ada di config.js
 * ============================================================ */
(function () {
  'use strict';

  var C = window.SILANGKA_CONFIG || {};
  var DEMO = !C.API_URL;
  var app = document.getElementById('app');
  var nav = document.getElementById('nav');

  // ================= UTIL =================
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
  function lalu(iso) {
    var m = (Date.now() - new Date(iso)) / 6e4;
    if (isNaN(m)) return '';
    if (m < 60) return Math.max(1, Math.round(m)) + ' mnt lalu';
    if (m < 1440) return Math.round(m / 60) + ' jam lalu';
    return Math.round(m / 1440) + ' hari lalu';
  }
  function localInput(d) {
    d = d || new Date();
    var p = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function angka(n) { return n == null ? '—' : String(n).replace('.', ','); }
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('slk_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('slk_' + k, JSON.stringify(v)); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem('slk_' + k); } catch (e) { } }
  };
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
    back: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', chev: '<path d="M9 6l6 6-6 6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5h.01"/>',
    wifiOff: '<path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2-1.6M12 20h.01"/>',
    check: '<path d="M5 12l5 5 9-10"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 16l5-5 4 4 3-3 4 4"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    cross: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>', home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    minus: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    hand: '<path d="M7 11V6a2 2 0 0 1 4 0v5M11 10V4a2 2 0 0 1 4 0v6M15 10V6a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.5L3 13a2 2 0 0 1 3.5-2l.5 1"/>',
    paw: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5-2 3-4 3-4 0-4-3z"/>',
    phone: '<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    cols: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>', chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>', list: '<path d="M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01"/>',
    hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>', send: '<path d="M4 12l16-8-6 16-2-7z"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'
  };
  function ic(n, cls) { return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[n] || '') + '</svg>'; }

  var JENIS = {
    jumpa: { label: 'Perjumpaan satwa', hint: 'Melihat atau mendengar langsung', icon: 'eye', urgent: false, kondisi: 'Sehat' },
    luka: { label: 'Satwa terluka / sakit', hint: 'Prioritas darurat', icon: 'cross', urgent: true, kondisi: 'Terluka' },
    konflik: { label: 'Masuk permukiman / konflik', hint: 'Prioritas darurat', icon: 'home', urgent: true, kondisi: 'Tidak tahu' },
    mati: { label: 'Satwa mati', hint: 'Jangan dipindahkan', icon: 'minus', urgent: false, kondisi: 'Mati' },
    buru: { label: 'Perburuan / perdagangan', hint: 'Identitas otomatis dirahasiakan', icon: 'target', urgent: false, kondisi: 'Tidak tahu' },
    pelihara: { label: 'Dipelihara warga', hint: 'Termasuk penyerahan sukarela', icon: 'hand', urgent: false, kondisi: 'Tidak tahu' }
  };
  var JENIS_WARNA = { jumpa: '#16514D', luka: '#B42318', konflik: '#F2A900', mati: '#7FB3AA', buru: '#3E2F7A', pelihara: '#A88B66' };
  var URUT_STATUS = ['Terkirim', 'Diterima', 'Diverifikasi', 'Ditindaklanjuti', 'Selesai'];
  var VERIF_SET = ['Diverifikasi', 'Ditindaklanjuti', 'Selesai'];
  var IUCN = {
    CR: ['Kritis (CR)', 'b-red'], EN: ['Genting (EN)', 'b-orange'], VU: ['Rentan (VU)', 'b-amber'],
    NT: ['Hampir Terancam (NT)', 'b-teal'], LC: ['Risiko Rendah (LC)', 'b-teal'], DD: ['Kurang Data (DD)', 'b-gray']
  };
  var PERAN = { pelapor: 'Pelapor', admin: 'Admin Perusahaan', verifikator: 'Verifikator BKSDA', superadmin: 'Superadmin' };
  var STAF = ['admin', 'verifikator', 'superadmin'], VERIF = ['verifikator', 'superadmin'], ADMIN = ['admin', 'superadmin'];
  var LEVEL = ['Pengamat Pemula', 'Penjaga Hutan', 'Sahabat Satwa', 'Pelindung Rimba'];
  var SLIDES_BAWAAN = [
    { url: 'login-1.jpg', tag: 'SATWA DILINDUNGI', judul: 'Lutung Dahi Putih', kredit: 'Foto: Tim Lingkungan Senakin', isi: 'Primata endemik Borneo dengan bercak putih khas di dahi.', fokus: '50% 30%' },
    { url: 'login-2.jpg', tag: 'TAHUKAH KAMU?', judul: 'Setiap laporan diverifikasi BKSDA', kredit: 'Foto: Tim Lingkungan Senakin', isi: 'Laporan Anda membantu petugas melindungi satwa di sekitar wilayah tambang.', fokus: '50% 50%' },
    { url: 'login-3.jpg', tag: 'LOKASI DIRAHASIAKAN', judul: 'Data terbuka, satwa tetap aman', kredit: 'SILANGKA', isi: 'Titik presisi hanya untuk petugas. Peta publik hanya menampilkan kepadatan.', fokus: '50% 40%' }
  ];
  function badgeStatus(s) {
    var m = { Terkirim: 'b-gray', Diterima: 'b-teal', Diverifikasi: 'b-blue', Ditindaklanjuti: 'b-amber', Selesai: 'b-teal', 'Tidak Valid': 'b-red' };
    return '<span class="badge ' + (m[s] || 'b-gray') + '">' + esc(s === 'Ditindaklanjuti' ? 'Ditangani' : s) + '</span>';
  }
  function badgePrio(p) { return '<span class="badge ' + ({ Darurat: 'b-red', Tinggi: 'b-amber', Normal: 'b-teal' }[p] || 'b-gray') + '">' + esc(p) + '</span>'; }
  function badgeSla(r) { return '<span class="badge ' + (r.slaLewat ? 'b-red' : r.slaSelesai ? 'b-teal' : 'b-sla') + '">' + esc(r.sla || '') + '</span>'; }

  // ================= STATE =================
  var S = {
    token: LS.get('token', ''), user: LS.get('user', null),
    config: LS.get('config', { nomorDarurat: C.NOMOR_DARURAT || '', instansi: C.INSTANSI || '' }),
    species: LS.get('species', []), mine: LS.get('mine', []), outbox: [], drafts: [], syncing: false
  };
  var W = null, maps = [], installPrompt = null;
  function isStaf() { return S.user && STAF.indexOf(S.user.peran) > -1; }
  function isVerif() { return S.user && VERIF.indexOf(S.user.peran) > -1; }
  function isAdmin() { return S.user && ADMIN.indexOf(S.user.peran) > -1; }
  function isSuper() { return S.user && S.user.peran === 'superadmin'; }
  function simpanMine() { LS.set('mine', S.mine.slice(0, 200)); }
  function deviceId() { var d = LS.get('device', ''); if (!d) { d = uuid(); LS.set('device', d); } return d; }
  function wide() { return window.innerWidth >= 1100; }

  // ================= API =================
  function api(action, data) {
    var payload = Object.assign({ action: action }, data || {});
    if (S.token) payload.token = S.token;
    if (DEMO) {
      return new Promise(function (res, rej) {
        setTimeout(function () {
          try {
            var r = window.SLK_DEMO.call(payload);
            if (!r.ok) { if (/Sesi berakhir/.test(r.error || '')) keluarLokal(); rej(new Error(r.error)); } else res(r);
          } catch (e) { rej(e); }
        }, 120);
      });
    }
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 60000);
    return fetch(C.API_URL, { method: 'POST', body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); }, function (e) {
        var err = new Error(e && e.name === 'AbortError' ? 'Server lambat merespons. Coba lagi.' : 'Tidak ada koneksi ke server.');
        err.offline = !(e && e.name === 'AbortError');
        throw err;
      })
      .then(function (j) {
        if (!j.ok) { if (/Sesi berakhir/.test(j.error || '')) keluarLokal(); throw new Error(j.error || 'Terjadi kesalahan.'); }
        return j;
      })
      .finally(function () { clearTimeout(timer); });
  }
  function muatAwal() {
    api('config').then(function (r) { S.config = r; LS.set('config', r); if (['beranda', 'masuk', 'selamat-datang', 'akun'].indexOf(route().name) > -1) render(); }).catch(function () { });
    api('species').then(function (r) { S.species = r.species || []; LS.set('species', S.species); if (['kamus', 'beranda', 'spesies'].indexOf(route().name) > -1) render(); }).catch(function () { });
    if (S.token) api('me').then(function (r) { S.user = r.user; LS.set('user', r.user); }).catch(function () { });
  }

  // ================= UI HELPER =================
  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3800);
  }
  function modal(html, lebar) {
    var m = $('#modal'), card = $('.modal-card', m);
    card.className = 'modal-card' + (lebar ? ' wide' : '');
    card.innerHTML = '<button class="icon-btn close" data-act="tutup" aria-label="Tutup">' + ic('close') + '</button>' + html;
    m.hidden = false;
    var f = $('input:not([type=checkbox]),textarea,select', card); if (f && !lebar) setTimeout(function () { f.focus(); }, 50);
    return card;
  }
  function el(sel) { return $(sel) || {}; } // aman bila pengguna sudah pindah layar
  function tutupModal() { $('#modal').hidden = true; $('#modal .modal-card').innerHTML = ''; }
  $('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal') tutupModal(); });
  function topbar(judul, back, kanan) {
    return '<div class="topbar"><a class="icon-btn" href="' + back + '" aria-label="Kembali">' + ic('back') + '</a>' +
      '<span class="title">' + esc(judul) + '</span>' + (kanan || '') + '</div>';
  }
  function spesiesById(id) { return S.species.filter(function (s) { return s.id === id; })[0]; }
  function bg(url) { return url ? ' style="background-image:url(\'' + esc(url) + '\')"' : ''; }
  function thumbSp(sp, cls) { return '<span class="thumb ' + (cls || '') + '"' + bg(sp && sp.foto) + '>' + (sp && sp.foto ? '' : ic('paw')) + '</span>'; }
  function hapusPeta() { maps.forEach(function (m) { try { m.remove(); } catch (e) { } }); maps = []; }
  function adaLeaflet() { return typeof window.L !== 'undefined'; }
  function tileLayer() { return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }); }
  function iucnTag(kode) { var iu = IUCN[kode]; return iu ? '<span class="tag ' + iu[1] + '">IUCN · ' + esc(kode) + '</span>' : ''; }

  // ================= ROUTER =================
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var q = h.split('?'), parts = q[0].split('/');
    return { name: parts[0] || '', arg: decodeURIComponent(parts[1] || ''), query: new URLSearchParams(q[1] || '') };
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  var VIEWS = {}, ACT = {};
  function render() {
    hapusPeta(); stopSlides();
    if (!$('#modal').hidden) tutupModal();
    var r = route();
    if (!r.name) { go(LS.get('welcomed', false) ? '#/beranda' : '#/selamat-datang'); return; }
    if (r.name === 'akun' && !S.user) { go('#/masuk'); return; }
    var v = VIEWS[r.name] || VIEWS.beranda;
    var tanpaNav = ['selamat-datang', 'masuk', 'lapor', 'lacak', 'petugas'].indexOf(r.name) > -1;
    nav.hidden = tanpaNav;
    document.body.classList.toggle('no-nav', tanpaNav);
    document.body.classList.toggle('pub', !tanpaNav);
    document.body.classList.toggle('staff-mode', r.name === 'petugas');
    $$('a', nav).forEach(function (a) { a.classList.toggle('on', a.dataset.tab === r.name || (r.name === 'spesies' && a.dataset.tab === 'kamus') || (r.name === 'tentang' && a.dataset.tab === 'akun')); });
    var hasil = v(r);
    if (typeof hasil === 'string') app.innerHTML = hasil;
    if (v.after) v.after(r);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  ACT.tutup = tutupModal;

  // ================= FOTO BERGANTIAN =================
  var SL = { i: 0, timer: null };
  function slides() { var s = (S.config.slides || []).filter(function (x) { return x.url; }); return s.length ? s : SLIDES_BAWAAN; }
  function htmlFoto(withCap) {
    var sl = slides();
    if (SL.i >= sl.length) SL.i = 0;
    var c = sl[SL.i];
    return '<div class="auth-photo" id="authPhoto">' +
      sl.map(function (s, k) { return '<img src="' + esc(s.url) + '" alt="' + esc(s.judul || 'Foto satwa') + '" style="object-position:' + esc(s.fokus || '50% 50%') + '" class="' + (k === SL.i ? 'on' : '') + '">'; }).join('') +
      '<div class="auth-top"><img class="logo" src="logo.png" alt="Logo SILANGKA"><img class="mitra" src="arutmin.png" alt="PT Arutmin Indonesia"></div>' +
      (withCap === false ? '' : '<div class="auth-cap"><div class="stack" style="gap:8px;align-items:flex-start"><div class="box" id="capBox">' + capHtml(c) + '</div>' +
        '<div class="dots" id="dots">' + sl.map(function (s, k) { return '<button class="' + (k === SL.i ? 'on' : '') + '" data-act="slideKe" data-i="' + k + '" aria-label="Foto ' + (k + 1) + '"></button>'; }).join('') + '</div></div>' +
        '<div class="auth-nav"><button data-act="slideGeser" data-d="-1" aria-label="Foto sebelumnya">' + ic('back') + '</button><button data-act="slideGeser" data-d="1" aria-label="Foto berikutnya">' + ic('next') + '</button></div></div>') +
      '</div>';
  }
  function capHtml(c) {
    return '<small>' + esc(c.tag || '') + '</small><b>' + esc(c.judul || '') + '</b>' + (c.isi ? '<p>' + esc(c.isi) + '</p>' : '') + (c.kredit ? '<span>' + esc(c.kredit) + '</span>' : '');
  }
  function tampilSlide(i) {
    var sl = slides(); SL.i = (i + sl.length) % sl.length;
    $$('#authPhoto img:not(.logo):not(.mitra)').forEach(function (im, k) { im.classList.toggle('on', k === SL.i); });
    $$('#dots button').forEach(function (b, k) { b.classList.toggle('on', k === SL.i); });
    var cb = $('#capBox'); if (cb) cb.innerHTML = capHtml(sl[SL.i]);
  }
  function startSlides() {
    stopSlides();
    if (slides().length < 2) return;
    SL.timer = setInterval(function () { tampilSlide(SL.i + 1); }, Math.max(2, Number(S.config.loginDetik) || 6) * 1000);
  }
  function stopSlides() { if (SL.timer) clearInterval(SL.timer); SL.timer = null; }
  ACT.slideKe = function (el) { tampilSlide(Number(el.dataset.i)); startSlides(); };
  ACT.slideGeser = function (el) { tampilSlide(SL.i + Number(el.dataset.d)); startSlides(); };

  // ================= SELAMAT DATANG =================
  VIEWS['selamat-datang'] = function () {
    return '<section class="auth">' + htmlFoto() +
      '<div class="auth-sheet dark"><div class="inner">' +
      '<h1>Melihat satwa dilindungi? Laporkan dalam 1 menit.</h1>' +
      '<div class="pills"><span>Bisa tanpa akun</span><span>Jalan tanpa sinyal</span><span>Lokasi satwa dirahasiakan</span></div>' +
      '<div class="stack mt12"><a class="btn btn-amber" href="#/lapor" data-act="welcomeGo" data-to="#/lapor">Lapor Sekarang</a>' +
      '<a class="btn btn-ghost-light" href="#/masuk" data-act="welcomeGo" data-to="#/masuk">Masuk / Daftar</a>' +
      '<a class="link-light" style="color:var(--mint);font-size:13px;text-align:center;padding:8px" href="#/beranda" data-act="welcomeGo" data-to="#/beranda">Jelajahi dulu tanpa akun</a></div>' +
      '<div class="foot-note">' + esc(S.config.instansi || C.INSTANSI || '') + '</div></div></div></section>';
  };
  VIEWS['selamat-datang'].after = startSlides;
  ACT.welcomeGo = function (el) { LS.set('welcomed', true); go(el.dataset.to); };

  // ================= MASUK / DAFTAR =================
  var tabAkun = 'masuk', lihatPw = false;
  VIEWS.masuk = function () {
    if (S.user) { setTimeout(function () { go(isStaf() ? '#/petugas' : '#/beranda'); }, 0); return ''; }
    var daftar = tabAkun === 'daftar';
    return '<section class="auth">' + htmlFoto() +
      '<div class="auth-sheet"><div class="inner">' +
      '<div class="row between"><a class="icon-btn box" href="#/beranda" aria-label="Kembali">' + ic('back') + '</a></div>' +
      '<div><h1 class="h1 xl">' + (daftar ? 'Buat akun' : 'Selamat datang') + '</h1><p class="sub">' + (daftar ? 'Laporan Anda tersimpan di semua perangkat.' : 'Masuk untuk memantau laporan, atau ke Panel Petugas bila Anda verifikator/admin.') + '</p></div>' +
      '<div class="tabs" style="margin:0;grid-template-columns:repeat(2,minmax(0,1fr))" role="tablist"><button role="tab" class="' + (!daftar ? 'on' : '') + '" data-act="tabAkun" data-t="masuk">Masuk</button><button role="tab" class="' + (daftar ? 'on' : '') + '" data-act="tabAkun" data-t="daftar">Daftar</button></div>' +
      '<form id="fAkun" class="stack" novalidate>' +
      (daftar ? '<label class="input-ico">' + ic('user') + '<input id="aNama" placeholder="Nama lengkap" autocomplete="name" aria-label="Nama lengkap"></label>' : '') +
      '<label class="input-ico"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><input id="aEmail" type="email" placeholder="Email" autocomplete="email" aria-label="Email"></label>' +
      (daftar ? '<label class="input-ico">' + ic('phone') + '<input id="aWa" inputmode="tel" placeholder="Nomor WhatsApp (opsional)" autocomplete="tel" aria-label="Nomor WhatsApp"></label>' : '') +
      '<label class="input-ico">' + ic('lock') + '<input id="aPw" type="' + (lihatPw ? 'text' : 'password') + '" placeholder="Password' + (daftar ? ' (min. 8 karakter)' : '') + '" autocomplete="' + (daftar ? 'new-password' : 'current-password') + '" aria-label="Password"><button type="button" data-act="lihatPw">' + (lihatPw ? 'Sembunyi' : 'Lihat') + '</button></label>' +
      '<p class="err" id="aErr" hidden></p>' +
      '<button class="btn btn-primary" type="submit">' + (daftar ? 'Daftar' : 'Masuk') + '</button></form>' +
      '<div class="or">atau</div>' +
      '<a class="btn btn-amber" href="#/lapor">Lapor tanpa akun</a>' +
      '<p class="small" style="text-align:center">' + (DEMO ? 'Demo: <b>admin@demo.id</b> / <b>demo1234</b> (Superadmin) · <b>petugas@demo.id</b> / <b>demo1234</b> (Verifikator)' : 'Akun petugas BKSDA & admin dibuatkan oleh Superadmin. Lupa password? Hubungi admin.') + '</p>' +
      '</div></div></section>';
  };
  VIEWS.masuk.after = function () {
    startSlides();
    var f = $('#fAkun'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var daftar = tabAkun === 'daftar', btn = $('button[type=submit]', f), er = $('#aErr');
      var data = { email: $('#aEmail').value, password: $('#aPw').value };
      if (daftar) { data.nama = $('#aNama').value; data.wa = $('#aWa').value; }
      btn.disabled = true; er.hidden = true;
      api(daftar ? 'register' : 'login', data).then(function (r) {
        S.token = r.token; S.user = r.user; LS.set('token', r.token); LS.set('user', r.user); LS.set('welcomed', true);
        toast('Selamat datang, ' + r.user.nama.split(' ')[0] + '!');
        go(STAF.indexOf(r.user.peran) > -1 ? '#/petugas' : '#/beranda');
      }).catch(function (err) { btn.disabled = false; er.textContent = err.message; er.hidden = false; });
    });
  };
  ACT.tabAkun = function (el) { tabAkun = el.dataset.t; render(); };
  ACT.lihatPw = function () { lihatPw = !lihatPw; var i = $('#aPw'); if (i) { i.type = lihatPw ? 'text' : 'password'; } var b = $('[data-act=lihatPw]'); if (b) b.textContent = lihatPw ? 'Sembunyi' : 'Lihat'; };

  // ================= BERANDA =================
  function satwaPekanIni() {
    if (!S.species.length) return null;
    var pool = S.species.filter(function (s) { return s.foto; });
    if (!pool.length) pool = S.species;
    var minggu = Math.floor(Date.now() / (7 * 864e5));
    return pool[minggu % pool.length];
  }
  function kontribusi() {
    var ver = S.mine.filter(function (m) { return VERIF_SET.indexOf(m.status) > -1; });
    var sp = {}; ver.forEach(function (m) { if (m.spesies && m.spesies !== 'Belum teridentifikasi') sp[m.spesies] = 1; });
    var lv = Math.min(LEVEL.length - 1, Math.floor(ver.length / 2));
    return { total: S.mine.length, ver: ver.length, sp: Object.keys(sp).length, lv: lv, nama: LEVEL[lv], sisa: lv >= LEVEL.length - 1 ? 0 : 2 - (ver.length % 2), pct: lv >= LEVEL.length - 1 ? 100 : (ver.length % 2) * 50 };
  }
  VIEWS.beranda = function () {
    var nama = S.user ? S.user.nama.split(' ')[0] : 'Sahabat Satwa';
    var jam = new Date().getHours();
    var salam = jam < 11 ? 'Selamat pagi,' : jam < 15 ? 'Selamat siang,' : jam < 18 ? 'Selamat sore,' : 'Selamat malam,';
    var tertunda = S.outbox.length;
    var pill = tertunda ? '<button class="badge b-amber" style="border:none;padding:8px 11px;cursor:pointer" data-act="syncNow">' + tertunda + ' menunggu sinyal</button>' : '';
    var f = satwaPekanIni();
    var iu = f && IUCN[f.iucn];
    var feature = f ? '<a class="feature" href="#/spesies/' + esc(f.id) + '">' + (f.foto ? '<img src="' + esc(f.foto) + '" alt="' + esc(f.nama) + '">' : '<span class="ph">' + ic('paw') + '</span>') +
      '<span class="box"><small>SATWA PEKAN INI</small><b>' + esc(f.nama) + '</b><span class="row" style="gap:6px">' + (iu ? '<span class="tag ' + iu[1] + '">IUCN · ' + esc(f.iucn) + '</span>' : '') + '<span class="small" style="color:#DCE8E2;font-style:italic">' + esc(f.latin) + '</span></span></span></a>' : '';
    var tel = S.config.nomorDarurat;
    var aksi = '<div class="action-pair"><a class="act-main" href="#/lapor"><span class="plus">' + ic('plus') + '</span><span><b>Laporkan Temuan</b><br><small>Bisa tanpa akun &amp; tanpa sinyal</small></span></a>' +
      (tel ? '<a class="act-sos" href="tel:' + esc(tel.replace(/[^\d+]/g, '')) + '">' + ic('phone') + '<span>Darurat?<br>Telepon petugas</span></a>'
        : '<a class="act-sos" href="#/lapor?jenis=luka">' + ic('alert') + '<span>Satwa terluka?<br>Lapor darurat</span></a>') + '</div>';
    var quick = '<div class="quick">' +
      '<a href="' + (f ? '#/spesies/' + esc(f.id) : '#/kamus') + '"><span class="q">' + ic('book') + '</span>Jika bertemu</a>' +
      '<a href="#/laporan"><span class="q">' + ic('hash') + '</span>Lacak kode</a>' +
      '<a href="#/peta"><span class="q">' + ic('map') + '</span>Peta sebaran</a>' +
      '<button data-act="bagikan"><span class="q">' + ic('share') + '</span>Bagikan</button></div>';
    var k = kontribusi();
    var contrib = '<div class="card contrib stack"><div class="row between"><span class="h2">Kontribusi Anda</span><span class="badge b-amber">' + esc(k.nama) + '</span></div>' +
      '<div class="nums"><span><b>' + k.total + '</b><span class="small">laporan</span></span><span><b>' + k.ver + '</b><span class="small">terverifikasi</span></span><span><b>' + k.sp + '</b><span class="small">spesies</span></span></div>' +
      '<div class="progress-bar"><i style="width:' + k.pct + '%"></i></div><span class="small">' + (k.sisa ? k.sisa + ' laporan terverifikasi lagi untuk naik level. Hanya laporan yang diverifikasi BKSDA yang dihitung.' : 'Level tertinggi. Terima kasih!') + '</span></div>';
    var mine = S.mine.slice(0, 3).map(itemLaporan).join('') || '<div class="empty">Belum ada laporan. Laporan Anda akan muncul di sini.</div>';
    var sp = S.species.slice(0, 10).map(function (s) {
      return '<a class="sp-card" href="#/spesies/' + esc(s.id) + '"><span class="img"' + bg(s.foto) + '>' + (s.foto ? '' : ic('paw')) + '</span><span>' + esc(s.nama) + '</span></a>';
    }).join('') || '<div class="empty">Memuat kamus…</div>';
    var staf = isStaf() ? '<a class="list-item" href="#/petugas"><span class="thumb">' + ic('shield') + '</span><span class="grow"><span class="t">Panel Petugas</span><span class="small">' + esc(PERAN[S.user.peran]) + ' · dashboard &amp; kasus</span></span>' + ic('chev') + '</a>' : '';
    var inst = installPrompt ? '<button class="btn btn-outline" data-act="install">' + ic('download') + 'Pasang SILANGKA di layar utama</button>' : '';
    var c = S.config;
    var angkaPub = typeof c.totalTerverifikasi === 'number' ? '<div class="card row" style="justify-content:space-around;text-align:center">' +
      '<span><b class="num" style="font-size:28px;display:block">' + c.totalTerverifikasi + '</b><span class="small">laporan terverifikasi</span></span>' +
      '<span><b class="num" style="font-size:28px;display:block">' + (c.totalSpesies || S.species.length) + '</b><span class="small">spesies di kamus</span></span>' +
      '<span><b class="num" style="font-size:28px;display:block">' + (c.totalDilepas || 0) + '</b><span class="small">satwa dilepasliarkan</span></span></div>' : '';
    return '<div class="wrap"><div class="home">' +
      '<div class="greet"><img class="logo-mini" src="logo.png" alt=""><div class="grow"><div class="small">' + salam + '</div><div style="font-size:18px;font-weight:700">' + esc(nama) + '</div></div>' + pill +
      (S.user ? '' : '<a class="btn btn-outline btn-sm" href="#/masuk">Masuk</a>') + '</div>' +
      '<div class="home-main">' + feature + aksi + quick + '</div>' +
      '<div class="home-side"><div class="stack" style="padding:14px 20px 0">' + staf + inst + '</div>' + contrib +
      '<div class="section-head"><h2 class="h2">Laporan Saya</h2><a href="#/laporan">Semua</a></div><div class="pad stack">' + mine + '</div></div>' +
      '<div class="wide"><div class="section-head"><h2 class="h2">Kenali Satwa Dilindungi</h2><a href="#/kamus">Buka kamus</a></div><div class="hscroll">' + sp + '</div>' +
      '<div class="pad mt16">' + angkaPub + '</div>' +
      '<div class="section-head"><h2 class="h2">Cara melapor</h2></div>' +
      '<div class="steps3">' + [['1', 'Pilih kejadian', 'Perjumpaan, satwa terluka, konflik, atau perburuan. Kasus darurat langsung diprioritaskan.'], ['2', 'Foto & lokasi', 'Tidak ada sinyal? Laporan tersimpan di HP dan terkirim otomatis nanti.'], ['3', 'Pantau tindak lanjut', 'Dapatkan nomor tiket & kode lacak, lihat saat petugas memverifikasi.']]
        .map(function (s) { return '<div class="card"><span class="n">' + s[0] + '</span><b>' + s[1] + '</b><span class="small" style="line-height:1.5">' + s[2] + '</span></div>'; }).join('') + '</div>' +
      '<div class="pad mt20 row wrapx" style="gap:16px"><a class="link" href="#/tentang">Tentang SILANGKA &amp; kontak</a>' + (S.user ? '' : '<a class="link" href="#/masuk">Masuk petugas</a>') + '</div></div>' +
      '</div></div>';
  };
  function itemLaporan(m) {
    var sp = spesiesById(m.spesiesId);
    var j = JENIS[m.jenis] || {};
    var idx = URUT_STATUS.indexOf(m.status || 'Terkirim');
    return '<a class="list-item" href="#/lacak/' + esc(m.id) + '">' + thumbSp(sp) +
      '<span class="grow"><span class="row between"><span class="t">' + esc(m.spesies || (sp && sp.nama) || 'Belum teridentifikasi') + '</span>' + badgeStatus(m.status || 'Terkirim') + '</span>' +
      '<span class="minibar">' + URUT_STATUS.map(function (s, k) { return '<span class="' + (k < idx || (k === idx && s === 'Selesai') ? 'on' : k === idx ? 'now' : '') + '"></span>'; }).join('') + '</span>' +
      '<span class="small">' + esc(m.id) + ' · ' + esc((j.label || '').split(' /')[0]) + ' · ' + tgl(m.dibuat, false) + '</span></span></a>';
  }
  ACT.install = function () { if (!installPrompt) return; installPrompt.prompt(); installPrompt.userChoice.finally(function () { installPrompt = null; render(); }); };
  ACT.syncNow = function () { if (!navigator.onLine) { toast('Masih tanpa sinyal. Laporan aman tersimpan di HP.'); return; } sinkron(true); };
  ACT.bagikan = function () {
    var data = { title: 'SILANGKA', text: 'Lihat satwa dilindungi? Laporkan lewat SILANGKA.', url: location.origin + location.pathname };
    if (navigator.share) navigator.share(data).catch(function () { });
    else if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(function () { toast('Tautan aplikasi disalin.'); });
  };

  // ================= KAMUS =================
  var kamusFilter = { q: '', k: '' };
  VIEWS.kamus = function () {
    var kel = [];
    S.species.forEach(function (s) { if (s.kelompok && kel.indexOf(s.kelompok) < 0) kel.push(s.kelompok); });
    return '<div class="wrap"><div class="screen-head row wrapx between" style="gap:12px"><div><h1 class="h1 xl">Kamus Kehati Senakin</h1><p class="sub">Kenali satwa sebelum melapor · ' + S.species.length + ' spesies</p></div>' +
      '<label class="search" style="flex:1 1 280px;max-width:420px">' + ic('search', 'sm') + '<input id="kq" type="search" placeholder="Cari nama lokal, Indonesia, atau latin" aria-label="Cari spesies" value="' + esc(kamusFilter.q) + '"></label></div>' +
      '<div class="chips"><button class="chip' + (!kamusFilter.k ? ' on' : '') + '" data-act="kel" data-k="">Semua</button>' +
      kel.map(function (k) { return '<button class="chip' + (kamusFilter.k === k ? ' on' : '') + '" data-act="kel" data-k="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') + '</div>' +
      '<div id="klist" class="sp-grid"></div></div>';
  };
  VIEWS.kamus.after = function () { isiKamus(); $('#kq').addEventListener('input', function (e) { kamusFilter.q = e.target.value; isiKamus(); }); };
  function isiKamus() {
    var q = kamusFilter.q.toLowerCase();
    var list = S.species.filter(function (s) {
      if (kamusFilter.k && s.kelompok !== kamusFilter.k) return false;
      return !q || (s.nama + ' ' + s.latin + ' ' + (s.lokal || '')).toLowerCase().indexOf(q) > -1;
    });
    $('#klist').innerHTML = list.map(function (s) {
      return '<a class="sp-tile" href="#/spesies/' + esc(s.id) + '"><span class="img"' + bg(s.foto) + '>' + (s.foto ? '' : ic('paw')) + '</span>' +
        '<span class="info"><b>' + esc(s.nama) + '</b><span class="small latin">' + esc(s.latin) + '</span><span class="row" style="gap:5px;flex-wrap:wrap">' + iucnTag(s.iucn) +
        (s.dilindungi ? '<span class="tag b-teal">Dilindungi</span>' : '') + '</span></span></a>';
    }).join('') || '<div class="empty" style="grid-column:1/-1">' + (S.species.length ? 'Tidak ada yang cocok.' : 'Kamus belum termuat. Periksa koneksi lalu buka lagi.') + '</div>';
  }
  ACT.kel = function (el) { kamusFilter.k = el.dataset.k; render(); };

  // ================= DETAIL SPESIES =================
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
    return '<div class="wrap"><div class="sp-detail"><div class="sp-hero"' + bg(s.foto) + '><a class="icon-btn back" href="#/kamus" aria-label="Kembali">' + ic('back') + '</a>' + (s.foto ? '' : '<span class="ph">' + ic('paw') + '</span>') + '</div>' +
      '<div><div class="pad mt16"><h1 class="h1" style="font-size:40px">' + esc(s.nama) + '</h1>' +
      '<p class="sub latin">' + esc(s.latin) + (s.lokal ? ' · ' + esc(s.lokal) : '') + (s.endemik ? ' · ' + esc(s.endemik) : '') + '</p>' +
      '<div class="status-grid"><div class="' + iu[1] + '"><small>IUCN</small><b>' + esc(iu[0]) + '</b></div><div class="b-purple"><small>CITES</small><b>' + (s.cites ? 'Apendiks ' + esc(s.cites) : '—') + '</b></div>' +
      '<div class="b-teal"><small>Nasional</small><b>' + (s.dilindungi ? 'Dilindungi' : 'Tidak') + '</b></div></div></div>' +
      '<div class="tabs" role="tablist">' + [['ciri', 'Ciri'], ['habitat', 'Habitat'], ['temu', 'Jika Bertemu']].map(function (t) {
        return '<button role="tab" class="' + (tabSp === t[0] ? 'on' : '') + '" data-act="tabSp" data-t="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div><div class="prose">' + isi[tabSp] + '</div>' +
      '<div class="pad mt20 stack"><a class="btn btn-amber" href="#/lapor?spesies=' + esc(s.id) + '">Laporkan perjumpaan ' + esc(s.nama) + '</a>' +
      '<span class="small" style="text-align:center">Status perlindungan merujuk PermenLHK P.106/2018 · diverifikasi BKSDA</span></div></div></div></div>';
  };
  ACT.tabSp = function (el) { tabSp = el.dataset.t; render(); };

  // ================= LAPOR (WIZARD) =================
  function wizardBaru(q) {
    var w = { clientId: uuid(), kode: kodeAcak(), step: 1, jenis: '', anonim: false, fotos: [], lat: '', lng: '', akurasi: '', spesiesId: '', spesiesLain: '', jumlah: 1, kondisi: '', waktuTemuan: localInput(), deskripsi: '', nama: '', wa: '', setuju: false, dibuat: new Date().toISOString() };
    if (q) {
      if (q.get('spesies')) { w.spesiesId = q.get('spesies'); w.jenis = 'jumpa'; w.kondisi = 'Sehat'; }
      if (q.get('jenis') && JENIS[q.get('jenis')]) { w.jenis = q.get('jenis'); w.kondisi = JENIS[w.jenis].kondisi; }
    }
    return w;
  }
  var simpanTimer;
  function autosave() { clearTimeout(simpanTimer); simpanTimer = setTimeout(function () { if (W) DB.set('draftAktif', W); }, 400); }
  VIEWS.lapor = function (r) {
    if (!W) {
      app.innerHTML = '<div class="empty">Menyiapkan formulir…</div>';
      DB.get('draftAktif', null).then(function (d) {
        W = (d && !r.query.get('baru') && !r.query.get('spesies') && !r.query.get('jenis')) ? d : wizardBaru(r.query);
        if (route().name === 'lapor') render();
      });
      return;
    }
    if (W.selesai) return '<div class="narrow">' + layarSelesai() + '</div>';
    var step = W.step;
    return '<div class="narrow"><div class="topbar"><a class="icon-btn" href="#/beranda" aria-label="Tutup">' + ic('close') + '</a>' +
      '<span class="title">' + (W.jenis ? esc(JENIS[W.jenis].label) : 'Laporan Baru') + '</span><span class="small" style="padding-right:8px">Langkah ' + step + ' dari 4</span></div>' +
      '<div class="progress">' + [1, 2, 3, 4].map(function (i) { return '<span class="' + (i <= step ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
      [null, stepJenis, stepBukti, stepDetail, stepRingkas][step]() + '</div>';
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
      '<div class="pad mt12"><label class="check"><span style="flex:1"><b style="font-size:13.5px">Kirim sebagai anonim</b><br><span class="small">' + (paksa ? 'Wajib untuk laporan perburuan' : 'Nama dan nomor HP tidak dikirim') + '</span></span>' +
      '<input type="checkbox" data-w="anonim" ' + (W.anonim || paksa ? 'checked' : '') + (paksa ? ' disabled' : '') + ' aria-label="Kirim sebagai anonim"></label></div>' +
      (JENIS[W.jenis] && JENIS[W.jenis].urgent && S.config.nomorDarurat ? '<div class="pad mt12"><a class="btn btn-danger" href="tel:' + esc(S.config.nomorDarurat.replace(/[^\d+]/g, '')) + '">' + ic('phone') + 'Darurat? Telepon petugas sekarang</a></div>' : '') +
      '<div class="pad mt24"><button class="btn btn-primary" data-act="lanjut" ' + (W.jenis ? '' : 'disabled') + '>Lanjut ke Foto &amp; Lokasi</button></div>';
  }
  ACT.pilihJenis = function (el) { W.jenis = el.dataset.j; W.kondisi = JENIS[W.jenis].kondisi; if (W.jenis === 'buru') W.anonim = true; autosave(); render(); };
  function stepBukti() {
    var foto = W.fotos.map(function (f, i) { return '<div class="photo" style="background-image:url(\'' + f + '\')"><button data-act="hapusFoto" data-i="' + i + '" aria-label="Hapus foto">×</button></div>'; }).join('');
    var tambah = W.fotos.length < 3 ? '<label class="photo-add">' + ic('camera') + 'Kamera<input type="file" accept="image/*" capture="environment" id="fCam" aria-label="Ambil foto dengan kamera"></label>' +
      (W.fotos.length < 2 ? '<label class="photo-add">' + ic('image') + 'Galeri<input type="file" accept="image/*" multiple id="fGal" aria-label="Pilih foto dari galeri"></label>' : '') : '';
    var adaLok = W.lat !== '' && W.lng !== '';
    return (navigator.onLine ? '' : '<div class="pad mt12"><div class="offline-bar">' + ic('wifiOff') + '<span>Tanpa sinyal. Laporan disimpan dan terkirim otomatis saat online.</span></div></div>') +
      '<div class="pad mt16 stack"><span class="label">Foto bukti <span class="small">(maks. 3)</span></span><div class="photos">' + foto + tambah + '</div>' +
      '<span class="small">Data GPS di dalam foto dihapus otomatis sebelum dikirim.</span></div>' +
      '<div class="pad mt16 stack"><span class="label">Lokasi temuan</span>' +
      '<div class="map" id="mapLapor">' + (adaLeaflet() && navigator.onLine ? '' : '<div class="empty" style="padding-top:70px">' + (adaLok ? 'Lokasi tersimpan ✓' : 'Peta butuh sinyal. GPS tetap bisa dipakai.') + '</div>') +
      (adaLok ? '<span class="map-note">' + (W.akurasi ? 'GPS · akurasi ±' + esc(W.akurasi) + ' m' : 'Pin manual') + '</span>' : '') + '</div>' +
      '<div class="btn-grid2"><button class="btn btn-outline-teal btn-sm" data-act="gps" style="width:100%">' + ic('pin', 'sm') + 'Lokasi saat ini</button><button class="btn btn-outline btn-sm" data-act="manualLok" style="width:100%">Isi koordinat</button></div>' +
      '<span class="small">' + (adaLok ? 'Titik: ' + Number(W.lat).toFixed(5) + ', ' + Number(W.lng).toFixed(5) + (adaLeaflet() && navigator.onLine ? ' · geser pin bila perlu' : '') : 'Lokasi belum diisi.') + '</span>' +
      '<div class="lock-note">' + ic('lock', 'sm') + '<span>Titik presisi hanya terlihat oleh petugas BKSDA.</span></div></div>' +
      '<div class="pad mt24 btn-row"><button class="btn btn-outline" data-act="mundur">Kembali</button><button class="btn btn-primary" data-act="lanjut">Lanjut</button></div>' +
      '<div class="pad mt12"><button class="btn btn-outline btn-sm" style="width:100%" data-act="simpanDraf">Simpan draf</button></div>';
  }
  function pasangPetaLapor() {
    $$('#fCam,#fGal').forEach(function (inp) { inp.addEventListener('change', tambahFoto); });
    var el = $('#mapLapor');
    if (!el || !adaLeaflet() || !navigator.onLine) return;
    var adaLok = W.lat !== '' && W.lng !== '';
    var pusat = adaLok ? [Number(W.lat), Number(W.lng)] : [-3.05, 116.0];
    var m = L.map(el).setView(pusat, adaLok ? 16 : 8);
    tileLayer().addTo(m); maps.push(m);
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
  function tambahFoto(e) {
    var files = Array.prototype.slice.call(e.target.files || []).slice(0, 3 - W.fotos.length);
    if (!files.length) return;
    toast('Memproses foto…');
    Promise.all(files.map(function (f) { return kompres(f, 1600, 0.8); })).then(function (arr) { W.fotos = W.fotos.concat(arr).slice(0, 3); autosave(); render(); }).catch(function (err) { toast(err.message); });
  }
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
    var opsi = '<option value="">— Pilih spesies —</option>' + S.species.map(function (s) { return '<option value="' + esc(s.id) + '"' + (W.spesiesId === s.id ? ' selected' : '') + '>' + esc(s.nama) + ' (' + esc(s.latin) + ')</option>'; }).join('') +
      '<option value="_lain"' + (W.spesiesId === '_lain' ? ' selected' : '') + '>Belum tahu / spesies lain</option>';
    var butuhKontak = !W.anonim && W.jenis !== 'buru' && !S.user;
    return '<div class="screen-head"><h1 class="h1">Detail temuan</h1><p class="sub">Isi sebisanya. Petugas akan memastikan identifikasi.</p></div>' +
      '<div class="pad mt16 stack"><div class="field"><label for="wSp">Spesies</label><select class="input" id="wSp" data-w="spesiesId">' + opsi + '</select></div>' +
      '<div class="field" id="lainWrap"' + (W.spesiesId === '_lain' ? '' : ' hidden') + '><label for="wLain">Nama/ciri satwa (bila tahu)</label><input class="input" id="wLain" data-w="spesiesLain" value="' + esc(W.spesiesLain) + '" placeholder="mis. monyet hidung panjang"></div>' +
      '<div class="field"><span class="label">Jumlah individu</span><div class="stepper"><button data-act="jml" data-d="-1" aria-label="Kurangi">−</button><input class="input" id="wJml" inputmode="numeric" data-w="jumlah" value="' + esc(W.jumlah) + '" aria-label="Jumlah individu"><button data-act="jml" data-d="1" aria-label="Tambah">+</button></div></div>' +
      '<div class="field"><span class="label">Kondisi satwa</span><div class="seg">' + ['Sehat', 'Terluka', 'Mati', 'Tidak tahu'].map(function (k) { return '<button class="' + (W.kondisi === k ? 'on' : '') + '" data-act="kondisi" data-k="' + k + '">' + k + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label for="wWaktu">Waktu temuan</label><input class="input" id="wWaktu" type="datetime-local" data-w="waktuTemuan" value="' + esc(W.waktuTemuan) + '"></div>' +
      '<div class="field"><label for="wDesk">Keterangan</label><textarea class="input" id="wDesk" data-w="deskripsi" placeholder="Perilaku, ciri, situasi sekitar, arah pergerakan…">' + esc(W.deskripsi) + '</textarea></div>' +
      (butuhKontak ? '<div class="card stack"><span class="small">Opsional — agar petugas bisa menghubungi Anda. Tidak tampil ke publik.</span><div class="field"><label for="wNama">Nama</label><input class="input" id="wNama" data-w="nama" value="' + esc(W.nama) + '" autocomplete="name"></div>' +
        '<div class="field"><label for="wWa">Nomor WhatsApp</label><input class="input" id="wWa" data-w="wa" inputmode="tel" value="' + esc(W.wa) + '" autocomplete="tel"></div></div>' : '') +
      '</div><div class="pad mt24 btn-row"><button class="btn btn-outline" data-act="mundur">Kembali</button><button class="btn btn-primary" data-act="lanjut">Lanjut ke Ringkasan</button></div>';
  }
  ACT.jml = function (el) { W.jumlah = Math.max(1, Math.min(999, (Number(W.jumlah) || 1) + Number(el.dataset.d))); $('#wJml').value = W.jumlah; autosave(); };
  ACT.kondisi = function (el) { W.kondisi = el.dataset.k; $$('.seg button').forEach(function (b) { b.classList.toggle('on', b === el); }); autosave(); };
  function stepRingkas() {
    var sp = spesiesById(W.spesiesId);
    return '<div class="screen-head"><h1 class="h1">Periksa &amp; kirim</h1><p class="sub">Pastikan data sudah benar.</p></div>' +
      '<div class="pad mt16"><div class="card summary"><dl><dt>Kejadian</dt><dd>' + esc(JENIS[W.jenis].label) + '</dd><dt>Spesies</dt><dd>' + esc(sp ? sp.nama : (W.spesiesLain || 'Belum teridentifikasi')) + '</dd>' +
      '<dt>Jumlah</dt><dd>' + esc(W.jumlah) + ' individu · ' + esc(W.kondisi || '-') + '</dd><dt>Waktu</dt><dd>' + tgl(W.waktuTemuan) + '</dd>' +
      '<dt>Lokasi</dt><dd>' + (W.lat !== '' ? Number(W.lat).toFixed(5) + ', ' + Number(W.lng).toFixed(5) : '<span class="err">Belum diisi</span>') + '</dd><dt>Foto</dt><dd>' + W.fotos.length + ' foto</dd>' +
      '<dt>Pelapor</dt><dd>' + (W.anonim || W.jenis === 'buru' ? 'Anonim' : esc(S.user ? S.user.nama : (W.nama || 'Tanpa nama'))) + '</dd></dl></div></div>' +
      '<div class="pad mt12"><label class="check"><input type="checkbox" data-w="setuju" ' + (W.setuju ? 'checked' : '') + '><span class="small" style="color:var(--ink)">Data ini benar sesuai yang saya lihat. Saya setuju data dipakai BKSDA Kalimantan Selatan dan perusahaan untuk konservasi satwa.</span></label></div>' +
      '<div class="pad mt24 stack"><button class="btn btn-amber" data-act="kirim">Kirim Laporan</button><div class="btn-row"><button class="btn btn-outline" data-act="mundur">Kembali</button><button class="btn btn-outline" data-act="simpanDraf">Simpan draf</button></div></div>';
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
      clientId: W.clientId, kode: W.kode, jenis: W.jenis, anonim: W.anonim || W.jenis === 'buru', lat: Number(W.lat), lng: Number(W.lng), akurasi: W.akurasi,
      spesiesId: W.spesiesId === '_lain' ? '' : W.spesiesId, spesiesLain: W.spesiesLain, jumlah: W.jumlah, kondisi: W.kondisi,
      waktuTemuan: new Date(W.waktuTemuan).toISOString(), deskripsi: W.deskripsi, nama: W.nama, wa: W.wa, fotos: W.fotos, perangkat: deviceId()
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
      DB.set('draftAktif', null); W = { selesai: true, id: r.id, kode: paket.kode }; render();
    }).catch(function (err) {
      if (err.offline) return keAntrean();
      el.disabled = false; el.textContent = 'Kirim Laporan'; toast(err.message);
    });
  };
  function layarSelesai() {
    var isi = W.antre ? '<div class="done-hero"><div style="font-size:13px;color:var(--mint)">Tersimpan di HP</div><div class="tiket">Menunggu sinyal</div><div class="small" style="color:var(--mint)">Laporan akan terkirim otomatis saat ada koneksi. Jangan hapus data browser.</div></div>'
      : '<div class="done-hero"><div style="font-size:13px;color:var(--mint)">Laporan terkirim. Terima kasih!</div><div class="tiket">' + esc(W.id) + '</div><div class="small" style="color:var(--mint);margin-bottom:10px">Kode lacak (simpan atau screenshot):</div><span class="kode">' + esc(W.kode) + '</span></div>';
    return '<div class="topbar"><span class="title" style="padding-left:12px">Selesai</span></div><div class="pad mt16">' + isi + '</div>' +
      '<div class="card" style="margin:16px 20px 0"><b style="font-size:13.5px">Selanjutnya</b><p class="small" style="line-height:1.6">Petugas akan memeriksa laporan Anda. Pantau statusnya di menu <b>Laporan</b>. Jangan bagikan lokasi satwa di media sosial.</p></div>' +
      '<div class="pad mt24 stack">' + (W.id ? '<a class="btn btn-primary" href="#/lacak/' + esc(W.id) + '" data-act="selesaiKe" data-to="#/lacak/' + esc(W.id) + '">Lihat status laporan</a>' : '') +
      '<a class="btn btn-outline" href="#/beranda" data-act="selesaiKe" data-to="#/beranda">Kembali ke Beranda</a><a class="btn btn-outline" href="#/lapor?baru=1" data-act="selesaiKe" data-to="#/lapor?baru=1">Buat laporan lain</a></div>';
  }
  ACT.selesaiKe = function (el) { W = null; go(el.dataset.to); };

  // ================= SINKRONISASI OFFLINE =================
  function sinkron() {
    if (S.syncing || !S.outbox.length || !navigator.onLine) return Promise.resolve();
    S.syncing = true;
    var terkirim = 0;
    var urut = S.outbox.slice().reduce(function (p, item) {
      return p.then(function () {
        return api('submitReport', { report: item.paket }).then(function (r) {
          var m = item.meta; m.id = r.id; m.status = r.status;
          var sp = spesiesById(m.spesiesId); m.spesies = sp ? sp.nama : (item.paket.spesiesLain || 'Belum teridentifikasi');
          S.mine = [m].concat(S.mine.filter(function (x) { return x.id !== r.id; }));
          S.outbox = S.outbox.filter(function (x) { return x.paket.clientId !== item.paket.clientId; });
          terkirim++;
        }).catch(function (err) { if (err.offline) throw err; item.error = err.message; });
      });
    }, Promise.resolve());
    return urut.catch(function () { }).then(function () {
      S.syncing = false; simpanMine(); DB.set('outbox', S.outbox);
      if (terkirim) { toast(terkirim + ' laporan tertunda berhasil terkirim.'); if (['beranda', 'laporan'].indexOf(route().name) > -1) render(); }
    });
  }
  window.addEventListener('online', function () { toast('Kembali online.'); sinkron(); });
  setInterval(function () { sinkron(); }, 60000);

  // ================= LAPORAN SAYA =================
  VIEWS.laporan = function () {
    var antre = S.outbox.map(function (o) {
      var sp = spesiesById(o.meta.spesiesId);
      return '<div class="list-item">' + thumbSp(sp) + '<span class="grow"><span class="t">' + esc(sp ? sp.nama : 'Belum teridentifikasi') + ' · ' + esc(JENIS[o.meta.jenis].label.split(' /')[0]) + '</span>' +
        '<span class="small">' + (o.error ? '<span class="err">Gagal: ' + esc(o.error) + '</span>' : 'Dibuat ' + tgl(o.meta.dibuat)) + '</span></span><span class="badge b-amber">Antre</span></div>';
    }).join('');
    var draf = S.drafts.map(function (d, i) {
      return '<div class="list-item">' + thumbSp(spesiesById(d.spesiesId)) + '<span class="grow"><span class="t">' + esc(d.jenis ? JENIS[d.jenis].label : 'Draf tanpa jenis') + '</span><span class="small">Disimpan ' + tgl(d.disimpan) + '</span></span>' +
        '<button class="btn btn-outline btn-sm" data-act="lanjutDraf" data-i="' + i + '">Lanjut</button><button class="icon-btn" data-act="hapusDraf" data-i="' + i + '" aria-label="Hapus draf">' + ic('close') + '</button></div>';
    }).join('');
    return '<div class="wrap narrow"><div class="screen-head row between"><div><h1 class="h1 xl">Laporan Saya</h1><p class="sub">Tersimpan di perangkat ini' + (S.user ? ' dan akun Anda' : '') + '</p></div>' +
      (S.outbox.length ? '<button class="icon-btn box" data-act="syncNow" aria-label="Kirim ulang">' + ic('refresh') + '</button>' : '') + '</div>' +
      (antre ? '<div class="section-head"><h2 class="h2">Menunggu sinyal</h2></div><div class="pad stack">' + antre + '</div>' : '') +
      (draf ? '<div class="section-head"><h2 class="h2">Draf</h2></div><div class="pad stack">' + draf + '</div>' : '') +
      '<div class="section-head"><h2 class="h2">Terkirim</h2>' + (S.user ? '<a href="#/laporan" data-act="tarikServer">Perbarui</a>' : '') + '</div>' +
      '<div class="pad stack" id="listMine">' + (S.mine.map(itemLaporan).join('') || '<div class="empty">Belum ada laporan terkirim.</div>') + '</div>' +
      '<div class="section-head"><h2 class="h2">Lacak laporan lain</h2></div>' +
      '<div class="pad"><div class="card stack"><span class="small">Punya nomor laporan &amp; kode lacak dari perangkat lain?</span>' +
      '<input class="input" id="tId" placeholder="Nomor laporan, mis. SLK-2610-0001" autocapitalize="characters" aria-label="Nomor laporan">' +
      '<input class="input" id="tKode" placeholder="Kode lacak 6 huruf" autocapitalize="characters" maxlength="6" aria-label="Kode lacak">' +
      '<button class="btn btn-primary" data-act="lacakManual">Lacak</button></div></div></div>';
  };
  VIEWS.laporan.after = function () { if (S.user) ACT.tarikServer(null, null, true); };
  ACT.tarikServer = function (el, e, diam) {
    if (!S.user || !navigator.onLine) return;
    api('myReports').then(function (r) {
      (r.reports || []).forEach(function (x) {
        var ada = S.mine.filter(function (m) { return m.id === x.id; })[0];
        if (ada) { ada.status = x.status; ada.spesies = x.spesies; } else S.mine.push({ id: x.id, jenis: x.jenis, spesies: x.spesies, spesiesId: x.spesiesId, dibuat: x.dibuat, status: x.status });
      });
      S.mine.sort(function (a, b) { return String(b.dibuat).localeCompare(String(a.dibuat)); });
      simpanMine();
      var l = $('#listMine'); if (l && route().name === 'laporan') l.innerHTML = S.mine.map(itemLaporan).join('') || '<div class="empty">Belum ada laporan terkirim.</div>';
      if (!diam) toast('Daftar diperbarui.');
    }).catch(function (err) { if (!diam) toast(err.message); });
  };
  ACT.lanjutDraf = function (el) { var d = S.drafts[Number(el.dataset.i)]; S.drafts.splice(Number(el.dataset.i), 1); DB.set('drafts', S.drafts); W = d; DB.set('draftAktif', W); go('#/lapor'); };
  ACT.hapusDraf = function (el) { if (!confirm('Hapus draf ini?')) return; S.drafts.splice(Number(el.dataset.i), 1); DB.set('drafts', S.drafts); render(); };
  ACT.lacakManual = function () {
    var id = $('#tId').value.trim().toUpperCase(), kode = $('#tKode').value.trim().toUpperCase();
    if (!id || kode.length < 6) { toast('Isi nomor laporan dan kode lacak.'); return; }
    if (!S.mine.some(function (m) { return m.id === id; })) { S.mine.unshift({ id: id, kode: kode, dibuat: new Date().toISOString(), status: 'Terkirim' }); simpanMine(); }
    else S.mine.forEach(function (m) { if (m.id === id) m.kode = kode; });
    go('#/lacak/' + id);
  };

  // ================= LACAK =================
  VIEWS.lacak = function (r) {
    var m = S.mine.filter(function (x) { return x.id === r.arg; })[0];
    if (m && m.cache) setTimeout(function () { tampilLacak(m.cache); }, 0);
    api('track', { id: r.arg, kode: m ? m.kode : '' }).then(function (res) {
      var rep = res.report;
      if (m) { m.status = rep.status; m.spesies = rep.spesies; m.spesiesId = rep.spesiesId; m.cache = rep; simpanMine(); }
      if (route().name === 'lacak' && route().arg === r.arg) tampilLacak(rep);
    }).catch(function (err) {
      if (!(m && m.cache) && route().name === 'lacak') el('#lacakBody').innerHTML = '<div class="empty">' + esc(err.offline ? 'Tidak ada koneksi. Status akan tampil saat online.' : err.message) + '</div>';
    });
    return '<div class="narrow">' + topbar('Status Laporan', '#/laporan') + '<div id="lacakBody"><div class="empty">Memuat status…</div></div></div>';
  };
  function tampilLacak(rep) {
    var tidakValid = rep.status === 'Tidak Valid', idx = URUT_STATUS.indexOf(rep.status), riw = rep.riwayat || [];
    var langkah = (tidakValid ? ['Terkirim', 'Tidak Valid'] : URUT_STATUS).map(function (st, i) {
      var h = riw.filter(function (x) { return x.status === st; }).slice(-1)[0];
      var kelas = tidakValid ? (i === 0 ? '' : 'bad') : (i < idx ? '' : i === idx ? (st === 'Selesai' ? '' : 'now') : 'next');
      var mark = kelas === 'next' ? '' : kelas === 'bad' ? '!' : kelas === 'now' ? '•' : '✓';
      var ket = h ? tgl(h.waktu) + (h.catatan ? ' · ' + h.catatan : '') : ({ Diterima: 'Diperiksa tim lingkungan', Diverifikasi: 'Identifikasi oleh BKSDA', Ditindaklanjuti: 'Penanganan oleh petugas', Selesai: 'Anda akan melihat pembaruan di sini' }[st] || '');
      var terakhir = tidakValid ? i === 1 : i === URUT_STATUS.length - 1;
      return '<div class="tl"><div class="rail"><span class="dot ' + kelas + '">' + mark + '</span>' + (terakhir ? '' : '<span class="bar' + (kelas === '' ? ' on' : '') + '"></span>') + '</div>' +
        '<div class="txt' + (kelas === 'next' ? ' dim' : '') + '"><b>' + esc(st === 'Ditindaklanjuti' ? 'Ditangani' : st) + '</b><span class="small">' + esc(ket) + '</span></div></div>';
    }).join('');
    var pesan = riw.filter(function (x) { return /Pesan|Info tambahan/.test(x.judul); }).map(function (x) { return '<div class="msg"><div class="who">' + esc(x.oleh === 'Anda' ? 'Anda' : 'Petugas') + ' · ' + tgl(x.waktu) + '</div>' + esc(x.catatan) + '</div>'; }).join('');
    var m = S.mine.filter(function (x) { return x.id === rep.id; })[0];
    el('#lacakBody').innerHTML = '<div class="ticket"><div class="row between"><span class="small" style="letter-spacing:.5px">' + esc(rep.id) + '</span>' + badgeStatus(rep.status) + '</div>' +
      '<span class="big">' + esc(rep.spesies) + ' · ' + esc(rep.jumlah) + ' individu</span><small>' + esc((JENIS[rep.jenis] || {}).label || '') + ' · ' + tgl(rep.waktuTemuan) + (rep.wilayah ? ' · ' + esc(rep.wilayah) : '') + '</small>' +
      (m && m.kode ? '<small>Kode lacak: <b style="letter-spacing:2px;color:#fff">' + esc(m.kode) + '</b></small>' : '') + '</div>' +
      '<div class="timeline">' + langkah + '</div>' + (pesan ? '<div class="pad stack">' + pesan + '</div>' : '') +
      (rep.status !== 'Selesai' && !tidakValid ? '<div class="pad mt20"><button class="btn btn-primary" data-act="tambahInfo" data-id="' + esc(rep.id) + '">Tambah info / foto</button></div>' : '');
  }
  ACT.tambahInfo = function (el) {
    modal('<h2 class="h2">Tambah info untuk petugas</h2><div class="stack mt12"><textarea class="input" id="iPesan" placeholder="mis. satwa terlihat lagi di lokasi yang sama pagi ini" aria-label="Pesan"></textarea>' +
      '<label class="photo-add" style="min-height:64px">' + ic('camera') + '<span id="iFotoLbl">Lampirkan 1 foto (opsional)</span><input type="file" accept="image/*" id="iFoto"></label>' +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="kirimInfo" data-id="' + esc(el.dataset.id) + '">Kirim</button></div></div>');
    $('#iFoto').addEventListener('change', function () { $('#iFotoLbl').textContent = '1 foto dipilih'; });
  };
  ACT.kirimInfo = function (el) {
    var m = S.mine.filter(function (x) { return x.id === el.dataset.id; })[0], f = $('#iFoto').files[0];
    el.disabled = true; el.textContent = 'Mengirim…';
    (f ? kompres(f, 1600, 0.8) : Promise.resolve(null)).then(function (foto) {
      return api('addInfo', { id: el.dataset.id, kode: m ? m.kode : '', pesan: $('#iPesan').value, fotos: foto ? [foto] : [] });
    }).then(function (r) { tutupModal(); toast('Info terkirim.'); if (m) { m.cache = r.report; simpanMine(); } tampilLacak(r.report); })
      .catch(function (err) { el.disabled = false; el.textContent = 'Kirim'; toast(err.message); });
  };

  // ================= PETA PUBLIK =================
  var petaF = { k: '', bulan: 12 };
  VIEWS.peta = function () {
    var kel = [];
    S.species.forEach(function (s) { if (s.kelompok && kel.indexOf(s.kelompok) < 0) kel.push(s.kelompok); });
    return '<div class="wrap"><div class="screen-head"><h1 class="h1 xl">Peta Sebaran</h1><p class="sub">Kepadatan laporan terverifikasi, bukan titik lokasi</p></div>' +
      '<div class="chips"><button class="chip' + (!petaF.k ? ' on' : '') + '" data-act="petaK" data-k="">Semua</button>' +
      kel.map(function (k) { return '<button class="chip' + (petaF.k === k ? ' on' : '') + '" data-act="petaK" data-k="' + esc(k) + '">' + esc(k) + '</button>'; }).join('') +
      [6, 12, 24].map(function (b) { return '<button class="chip' + (petaF.bulan === b ? ' on' : '') + '" data-act="petaB" data-b="' + b + '">' + b + ' bulan</button>'; }).join('') + '</div>' +
      '<div class="pad mt12"><div class="map tall" id="mapPublik">' + (adaLeaflet() && navigator.onLine ? '' : '<div class="empty" style="padding-top:150px">Peta butuh koneksi internet.</div>') + '<span class="map-note" id="petaInfo">Memuat…</span></div></div>' +
      '<div class="legend"><span>Sedikit</span><span class="sw" style="background:#CDE3DD"></span><span class="sw" style="background:#7FB3AA"></span><span class="sw" style="background:#2F7F76"></span><span class="sw" style="background:#16514D"></span><span>Banyak</span></div>' +
      '<div class="pad mt12"><div class="card row" style="align-items:flex-start">' + ic('shield') + '<span class="small" style="line-height:1.5;color:#2A4442">Data tampil setelah masa jeda sejak diverifikasi. Spesies rawan perburuan dan laporan perburuan tidak ditampilkan di peta publik.</span></div></div></div>';
  };
  VIEWS.peta.after = function () {
    var el = $('#mapPublik');
    if (!adaLeaflet() || !navigator.onLine || !el) { var pi = $('#petaInfo'); if (pi) pi.hidden = true; return; }
    var m = L.map(el).setView([-3.0, 115.8], 8); tileLayer().addTo(m); maps.push(m);
    api('publicMap', { kelompok: petaF.k, bulan: petaF.bulan }).then(function (r) {
      var cells = r.cells || [], g = r.grid || 0.05, maks = Math.max.apply(null, cells.map(function (c) { return c.n; }).concat([1]));
      var warna = ['#CDE3DD', '#7FB3AA', '#2F7F76', '#16514D'], grup = [];
      cells.forEach(function (c) {
        var lv = Math.min(3, Math.floor((c.n / maks) * 3.999));
        grup.push(L.rectangle([[c.lat, c.lng], [c.lat + g, c.lng + g]], { color: warna[lv], weight: 1, fillColor: warna[lv], fillOpacity: 0.7 }).bindPopup(c.n + ' laporan terverifikasi di kotak ini').addTo(m));
      });
      if (grup.length) m.fitBounds(L.featureGroup(grup).getBounds().pad(0.4));
      var info = $('#petaInfo'); if (info) info.textContent = '1 kotak ≈ ' + Math.round(g * 111) + ' × ' + Math.round(g * 111) + ' km · ' + cells.length + ' kotak';
    }).catch(function (err) { var info = $('#petaInfo'); if (info) info.textContent = err.message; });
  };
  ACT.petaK = function (el) { petaF.k = el.dataset.k; render(); };
  ACT.petaB = function (el) { petaF.bulan = Number(el.dataset.b); render(); };

  // ================= AKUN & TENTANG =================
  VIEWS.akun = function () {
    return '<div class="wrap narrow"><div class="screen-head"><h1 class="h1 xl">Akun</h1></div>' +
      '<div class="pad mt16"><div class="card row"><span class="thumb lg">' + ic('user') + '</span><div class="stack" style="gap:2px"><b>' + esc(S.user.nama) + '</b><span class="small">' + esc(S.user.email) + '</span>' +
      '<span class="badge b-teal" style="align-self:flex-start;margin-top:4px">' + esc(PERAN[S.user.peran] || S.user.peran) + '</span></div></div></div>' +
      '<div class="pad mt16 stack">' + (isStaf() ? '<a class="btn btn-primary" href="#/petugas">' + ic('shield') + 'Buka Panel Petugas</a>' : '') +
      (installPrompt ? '<button class="btn btn-outline" data-act="install">' + ic('download') + 'Pasang di layar utama</button>' : '') +
      '<button class="btn btn-outline" data-act="gantiPw">Ganti password</button><a class="btn btn-outline" href="#/tentang">Tentang &amp; kontak</a>' +
      '<button class="btn btn-danger-outline btn" data-act="keluar">' + ic('logout') + 'Keluar</button></div></div>';
  };
  ACT.keluar = function () { api('logout').catch(function () { }); keluarLokal(); toast('Anda telah keluar.'); go('#/beranda'); };
  function keluarLokal() { S.token = ''; S.user = null; LS.del('token'); LS.del('user'); }
  ACT.gantiPw = function () {
    modal('<h2 class="h2">Ganti password</h2><div class="stack mt12"><div class="field"><label for="pL">Password lama</label><input class="input" id="pL" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label for="pB">Password baru (min. 8)</label><input class="input" id="pB" type="password" autocomplete="new-password"></div>' +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="simpanPw">Simpan</button></div></div>');
  };
  ACT.simpanPw = function () { api('changePassword', { lama: $('#pL').value, baru: $('#pB').value }).then(function () { tutupModal(); toast('Password diganti.'); }).catch(function (e) { toast(e.message); }); };
  VIEWS.tentang = function () {
    var c = S.config;
    return '<div class="wrap narrow">' + topbar('Tentang SILANGKA', '#/beranda') +
      '<div class="pad mt16 stack"><div class="card row"><img src="logo.png" alt="Logo SILANGKA" style="height:56px;width:auto"><div><b style="font-family:var(--display);font-size:26px">SILANGKA</b><div class="small">' + esc(C.KEPANJANGAN || '') + ' · versi ' + esc(c.versi || '2.1') + '</div></div></div>' +
      '<div class="card"><p style="margin:0;font-size:13.5px;line-height:1.6">SILANGKA memudahkan masyarakat dan karyawan melaporkan keberadaan, kondisi, dan ancaman terhadap satwa dilindungi. Laporan diverifikasi oleh BKSDA Kalimantan Selatan dan dimanfaatkan untuk perlindungan satwa.</p><p class="small mt12">' + esc(c.instansi || C.INSTANSI || '') + '</p></div>' +
      '<div class="card stack"><b style="font-size:14px">Kontak</b>' +
      (c.nomorDarurat ? '<a class="btn btn-danger btn-sm" style="width:100%" href="tel:' + esc(c.nomorDarurat.replace(/[^\d+]/g, '')) + '">' + ic('phone') + 'Telepon darurat ' + esc(c.nomorDarurat) + '</a>' : '<span class="small">Nomor darurat belum diatur admin.</span>') +
      (c.waDarurat ? '<a class="btn btn-outline btn-sm" style="width:100%" href="https://wa.me/' + esc(c.waDarurat.replace(/\D/g, '')) + '" target="_blank" rel="noopener">WhatsApp petugas</a>' : '') +
      (c.emailKontak ? '<a class="btn btn-outline btn-sm" style="width:100%" href="mailto:' + esc(c.emailKontak) + '">' + esc(c.emailKontak) + '</a>' : '') + '</div>' +
      '<div class="card"><b style="font-size:14px">Privasi &amp; keamanan data</b><ul class="small" style="line-height:1.7;padding-left:18px;margin:8px 0 0"><li>Titik lokasi presisi hanya dapat dibuka petugas, dan setiap akses tercatat.</li><li>Peta publik hanya menampilkan kepadatan per kotak, setelah masa jeda.</li><li>Data GPS dalam foto dihapus sebelum dikirim.</li><li>Laporan anonim tidak menyimpan nama dan nomor HP.</li></ul></div>' +
      '<a class="btn btn-outline" href="#/selamat-datang">Lihat layar pembuka</a></div></div>';
  };

  // =====================================================================
  // ================= PANEL PETUGAS =====================================
  // =====================================================================
  var MENU = [
    { grp: 'OPERASIONAL', items: [['ringkasan', 'Ringkasan', 'grid', 1], ['kasus', 'Papan Kasus', 'cols', 1], ['peta', 'Peta Operasional', 'map', 1]] },
    { grp: 'KONSERVASI', items: [['survei', 'Survei Kehati', 'chart', 1], ['rescue', 'Rescue & Rilis', 'heart', 0]] },
    { grp: 'PELAPORAN', items: [['bulanan', 'Laporan Bulanan', 'doc', 0]] },
    { grp: 'ADMIN', items: [['foto', 'Foto Layar Masuk', 'image', 0, ADMIN], ['pengguna', 'Pengguna & Akses', 'users', 0, ['superadmin']], ['pengaturan', 'Pengaturan', 'gear', 0, ['superadmin']]] }
  ];
  var P = { tab: 'ringkasan', badge: {}, hari: 30, f: 'Semua', q: '', view: 'papan', sel: null, list: [], detail: null, foto: {}, staff: null, lokasi: '', rescueSel: null, bulan: '' };
  function menuBoleh(it) { return !it[4] || it[4].indexOf(S.user.peran) > -1; }
  VIEWS.petugas = function (r) {
    if (!isStaf()) { setTimeout(function () { toast('Masuk dengan akun petugas.'); go('#/masuk'); }, 0); return ''; }
    P.tab = r.arg || 'ringkasan';
    var semua = [];
    MENU.forEach(function (g) { g.items.forEach(function (it) { if (menuBoleh(it)) semua.push(it); }); });
    return '<div class="staff"><nav class="sb no-print" aria-label="Menu petugas"><div class="brand"><img src="logo.png" alt="SILANGKA"><span><b>SILANGKA</b><span class="small" style="color:var(--mint2)">Panel Petugas · v2.1</span></span></div>' +
      MENU.map(function (g) {
        var its = g.items.filter(menuBoleh);
        if (!its.length) return '';
        return '<span class="grp">' + g.grp + '</span>' + its.map(function (it) {
          var b = P.badge[it[0]];
          return '<a href="#/petugas/' + it[0] + '" class="' + (P.tab === it[0] ? 'on ' : '') + (it[3] ? '' : 'sec') + '">' + ic(it[2]) + '<span class="lbl">' + it[1].replace(' Operasional', '').replace('Papan ', '') + '</span>' + (b ? '<span class="cnt' + (b.red ? ' red' : '') + '">' + b.n + '</span>' : '') + '</a>';
        }).join('');
      }).join('') +
      '<button class="more" data-act="menuLain">' + ic('more') + '<span class="lbl">Lainnya</span></button>' +
      '<span class="grp sec">AKUN</span><a class="sec" href="#/beranda">' + ic('home') + '<span class="lbl">Aplikasi publik</span></a><button class="sec" data-act="keluar">' + ic('logout') + '<span class="lbl">Keluar</span></button>' +
      '<div class="me"><span class="avatar">' + esc(inisial(S.user.nama)) + '</span><span><b style="color:var(--ground);display:block">' + esc(S.user.nama) + '</b>' + esc(PERAN[S.user.peran]) + '</span></div></nav>' +
      '<main class="st-main" id="pMain"><div class="empty">Memuat…</div></main></div>';
  };
  VIEWS.petugas.after = function () {
    if (!isStaf()) return;
    var fn = { ringkasan: tabRingkasan, kasus: tabKasus, peta: tabPeta, survei: tabSurvei, rescue: tabRescue, bulanan: tabBulanan, foto: tabFoto, pengguna: tabPengguna, pengaturan: tabPengaturan }[P.tab] || tabRingkasan;
    fn();
  };
  function inisial(n) { return String(n || '?').split(' ').filter(String).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
  ACT.menuLain = function () {
    var items = [];
    MENU.forEach(function (g) { g.items.forEach(function (it) { if (menuBoleh(it) && !it[3]) items.push(it); }); });
    modal('<h2 class="h2">Menu lainnya</h2><div class="stack mt12">' + items.map(function (it) { return '<a class="list-item" href="#/petugas/' + it[0] + '" data-act="tutupKe" data-to="#/petugas/' + it[0] + '"><span class="thumb">' + ic(it[2]) + '</span><span class="grow"><span class="t">' + it[1] + '</span></span>' + ic('chev') + '</a>'; }).join('') +
      '<a class="list-item" href="#/beranda" data-act="tutupKe" data-to="#/beranda"><span class="thumb">' + ic('home') + '</span><span class="grow"><span class="t">Aplikasi publik</span></span></a>' +
      '<button class="list-item" data-act="keluarModal"><span class="thumb">' + ic('logout') + '</span><span class="grow"><span class="t">Keluar</span><span class="small">' + esc(S.user.nama) + '</span></span></button></div>');
  };
  ACT.tutupKe = function (el) { tutupModal(); go(el.dataset.to); };
  ACT.keluarModal = function () { tutupModal(); ACT.keluar(); };
  function judulTab(eyebrow, judul, kanan) {
    return '<div class="row wrapx between" style="align-items:flex-end;gap:12px"><div class="stack" style="gap:4px"><span class="eyebrow">' + eyebrow + '</span><h1 class="h1 xl">' + judul + '</h1></div>' + (kanan || '') + '</div>';
  }
  function setBadge(k, n, red) { P.badge[k] = n ? { n: n, red: red } : null; }

  // ---------- RINGKASAN ----------
  function tabRingkasan() {
    var main = $('#pMain');
    main.innerHTML = '<div class="st-top"><label class="search">' + ic('search', 'sm') + '<input id="gq" type="search" placeholder="Cari nomor laporan, spesies, wilayah…" aria-label="Cari laporan"></label>' +
      '<div class="seg-tabs" role="group" aria-label="Periode">' + [[7, '7 hari'], [30, '30 hari'], [365, 'Tahun ini']].map(function (p) { return '<button class="' + (P.hari === p[0] ? 'on' : '') + '" data-act="periode" data-h="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<a class="btn btn-primary btn-sm" href="#/petugas/bulanan">' + ic('doc', 'sm') + 'Laporan Bulanan</a></div>' +
      judulTab('Panel petugas', 'Ringkasan Konservasi') + '<div id="dash"><div class="empty">Memuat data…</div></div>';
    $('#gq').addEventListener('keydown', function (e) { if (e.key === 'Enter') { P.q = e.target.value; P.f = 'Semua'; go('#/petugas/kasus'); } });
    api('dashboard', { hari: P.hari }).then(gambarDash).catch(function (e) { el('#dash').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  ACT.periode = function (el) { P.hari = Number(el.dataset.h); tabRingkasan(); };
  function delta(a, b, lebihKecilBaik) {
    if (b == null || a == null) return '';
    if (!b) return a ? '<span class="d up">baru</span>' : '';
    var pct = Math.round((a - b) / b * 100);
    var naik = pct > 0, baik = lebihKecilBaik ? !naik : naik;
    return '<span class="d ' + (pct === 0 ? '' : baik ? 'up' : 'down') + '">' + (pct === 0 ? '— sama' : (naik ? '▲ ' : '▼ ') + Math.abs(pct) + '% vs periode lalu') + '</span>';
  }
  function spark(arr, warna) { var mx = Math.max.apply(null, arr.concat([1])); return '<span class="spark">' + arr.map(function (v) { return '<i style="height:' + Math.max(3, Math.round(v / mx * 34)) + 'px;background:' + (warna || '#7FB3AA') + '"></i>'; }).join('') + '</span>'; }
  function gambarDash(d) {
    var k = d.kpi;
    setBadge('kasus', k.menunggu, false); setBadge('ringkasan', k.lewatSLA, true);
    var alert = d.lewat.length ? '<div class="alert-bar">' + ic('alert') + '<span class="grow"><b>' + k.lewatSLA + ' laporan lewat batas waktu respons</b> — ' + d.lewat.map(function (r) { return esc(r.spesies) + ' (' + esc(String(r.wilayah).split(',')[0]) + ')'; }).join(', ') + '.</span>' +
      '<a class="btn btn-danger btn-sm" href="#/petugas/kasus" data-act="filterKe" data-f="Lewat SLA">Tangani sekarang</a></div>' : '';
    var kpi = '<div class="kpis">' +
      '<div class="kpi"><small>Laporan masuk</small><span class="v"><b>' + k.masuk + '</b>' + spark(d.spark.masuk) + '</span>' + delta(k.masuk, k.masukPrev) + '</div>' +
      '<div class="kpi"><small>Menunggu verifikasi</small><span class="v"><b>' + k.menunggu + '</b></span><span class="d">' + k.belumDitugaskan + ' belum ditugaskan</span></div>' +
      '<div class="kpi alert"><small>Darurat terbuka</small><span class="v"><b>' + k.daruratTerbuka + '</b>' + spark(d.spark.darurat, '#E7A39B') + '</span><span class="d">' + k.lewatSLA + ' lewat SLA (semua prioritas)</span></div>' +
      '<div class="kpi"><small>Respons pertama (median)</small><span class="v"><b>' + esc(k.medianTeks) + '</b></span>' + delta(k.medianJam, k.medianPrevJam, true) + '</div>' +
      '<div class="kpi"><small>Spesies tercatat</small><span class="v"><b>' + k.spesies + '</b>' + spark(d.spark.spesies) + '</span>' + delta(k.spesies, k.spesiesPrev) + '</div></div>';
    var feed = d.feed.map(function (r) {
      return '<a href="#" data-act="bukaLaporan" data-id="' + esc(r.id) + '" class="' + (r.prioritas === 'Darurat' ? 'urg' : '') + '"><span class="sq">' + ic(JENIS[r.jenis] ? JENIS[r.jenis].icon : 'paw') + '</span>' +
        '<span class="grow stack" style="gap:2px"><b style="font-size:13px">' + esc(r.spesies) + '</b><span class="small">' + esc((JENIS[r.jenis] || {}).label || '') + ' · ' + esc(r.wilayah) + ' · ' + lalu(r.dibuat) + '</span></span>' + badgePrio(r.prioritas) + '</a>';
    }).join('') || '<div class="empty">Tidak ada laporan terbuka.</div>';
    var mx = Math.max.apply(null, d.mingguan.map(function (w) { return w.d + w.t + w.n; }).concat([1]));
    var tinggi = function (v) { return Math.round(v / mx * 160) + 'px'; };
    var tren = '<div class="bars-v">' + d.mingguan.map(function (w) {
      return '<div class="col" title="' + esc(w.label) + ': ' + (w.d + w.t + w.n) + ' laporan"><i style="height:' + tinggi(w.d) + ';background:#B42318;border-radius:4px 4px 0 0"></i><i style="height:' + tinggi(w.t) + ';background:#F2A900"></i><i style="height:' + tinggi(w.n) + ';background:#16514D"></i></div>';
    }).join('') + '</div><div class="bars-lbl">' + d.mingguan.map(function (w) { return '<span>' + esc(w.label) + '</span>'; }).join('') + '</div>';
    var total = Object.keys(d.jenis).reduce(function (a, j) { return a + d.jenis[j]; }, 0), acc = 0;
    var stops = Object.keys(JENIS).map(function (j) { var n = d.jenis[j] || 0, a = acc; acc += total ? n / total * 100 : 0; return JENIS_WARNA[j] + ' ' + a + '% ' + acc + '%'; }).join(',');
    var donut = '<div class="row wrapx" style="gap:18px"><div class="donut" style="background:' + (total ? 'conic-gradient(' + stops + ')' : '#EEEBE3') + '"><span><b class="num" style="font-size:30px">' + total + '</b><span class="small">laporan</span></span></div><div class="leg-list">' +
      Object.keys(JENIS).map(function (j) { var n = d.jenis[j] || 0; return '<span><i style="background:' + JENIS_WARNA[j] + '"></i><span class="grow">' + esc(JENIS[j].label.split(' /')[0]) + '</span><b>' + (total ? Math.round(n / total * 100) : 0) + '%</b></span>'; }).join('') + '</div></div>';
    var sla = d.sla.map(function (s) {
      var w = { Darurat: '#B42318', Tinggi: '#B07A00', Normal: '#16514D' }[s.prioritas];
      return '<div class="stack" style="gap:6px"><div class="row between" style="font-size:12px"><span><b>' + s.prioritas + '</b> · target ' + angka(s.target) + ' jam</span><b style="color:' + w + '">' + (s.pct == null ? 'belum ada data' : s.pct + '%') + '</b></div><div class="hbar"><i style="width:' + (s.pct || 0) + '%;background:' + w + '"></i></div></div>';
    }).join('');
    var mxs = Math.max.apply(null, d.topSpesies.map(function (s) { return s.n; }).concat([1]));
    var top = d.topSpesies.map(function (s, i) {
      return '<div style="display:grid;grid-template-columns:22px 1fr 80px 50px;gap:10px;align-items:center;font-size:12.5px"><b style="color:var(--muted3)">' + (i + 1) + '</b><span class="stack" style="gap:0"><b>' + esc(s.nama) + '</b><span class="small latin">' + esc(s.latin) + '</span></span>' +
        '<span class="hbar" style="height:8px"><i style="width:' + Math.round(s.n / mxs * 100) + '%;background:var(--teal)"></i></span><b style="text-align:right">' + s.n + ' <span style="font-size:10.5px;color:' + (s.tren === 'naik' ? 'var(--green)' : s.tren === 'turun' ? 'var(--red-ink)' : 'var(--muted3)') + '">' + (s.tren === 'naik' ? '▲' : s.tren === 'turun' ? '▼' : '—') + '</span></b></div>';
    }).join('') || '<div class="empty">Belum ada data.</div>';
    var tim = d.tim.map(function (t) {
      return '<div class="row"><span class="avatar" style="background:var(--teal-soft);color:var(--teal)">' + esc(inisial(t.nama)) + '</span><span class="grow stack" style="gap:0"><b style="font-size:13px">' + esc(t.nama) + '</b><span class="small">' + esc(PERAN[t.peran] || t.peran) + '</span></span>' +
        '<span class="stack" style="gap:0;align-items:flex-end"><b style="font-size:13px">' + t.kasus + ' kasus</b><span class="small">median ' + esc(t.median) + '</span></span></div>';
    }).join('') || '<div class="empty">Belum ada penugasan pada periode ini.</div>';
    var AUD = { lihat_koordinat: 'membuka koordinat', lihat_peta_operasional: 'membuka peta operasional', aksi_verifikasi: 'memverifikasi', aksi_terima: 'menerima', aksi_tindaklanjut: 'menangani', aksi_selesai: 'menyelesaikan', aksi_tugaskan: 'menugaskan', aksi_pesan: 'mengirim pesan untuk', aksi_catatan: 'mencatat', aksi_tidakvalid: 'menolak', ekspor_data: 'mengekspor data', simpan_survei: 'menyimpan survei', buat_rescue: 'membuat kasus rescue', laporan_bulanan: 'membuat laporan bulanan', simpan_pengguna: 'mengubah pengguna', ubah_pengaturan: 'mengubah pengaturan' };
    var audit = d.audit.map(function (a) {
      return '<div class="row" style="align-items:flex-start;font-size:12px;line-height:1.45"><span style="width:8px;height:8px;border-radius:50%;margin-top:5px;background:' + (/koordinat|peta/.test(a.aksi) ? 'var(--amber)' : 'var(--teal)') + ';flex-shrink:0"></span><span class="grow"><b>' + esc(a.nama) + '</b> ' + esc(AUD[a.aksi] || a.aksi.replace(/_/g, ' ')) + ' ' + esc(a.laporan || '') + '<br><span class="small">' + lalu(a.waktu) + '</span></span></div>';
    }).join('') || '<div class="empty">Belum ada aktivitas.</div>';
    el('#dash').innerHTML = '<div class="stack" style="gap:18px">' + alert + kpi +
      '<div class="panels"><section class="panel p-wide"><div class="row between wrapx"><h2 class="h2">Peta Operasional</h2><a class="link" href="#/petugas/peta">Buka penuh</a></div><span class="small">Titik presisi · hanya petugas · akses tercatat di log audit</span><div class="map" id="mapMini" style="height:320px"></div></section>' +
      '<section class="panel p-sm"><div class="row between"><h2 class="h2">Laporan Terbuka</h2><span class="badge b-red">' + d.feed.length + '</span></div><div class="feed stack" style="gap:2px">' + feed + '</div><a class="link" style="text-align:center;padding:6px" href="#/petugas/kasus">Lihat papan kasus →</a></section></div>' +
      '<div class="panels"><section class="panel p-mid"><div class="row between wrapx"><h2 class="h2">Tren Laporan per Minggu</h2><div class="legend" style="padding:0"><span class="sw" style="background:#16514D;width:10px;height:10px"></span>Normal<span class="sw" style="background:#F2A900;width:10px;height:10px"></span>Tinggi<span class="sw" style="background:#B42318;width:10px;height:10px"></span>Darurat</div></div>' + tren + '</section>' +
      '<section class="panel p-sm"><h2 class="h2">Jenis Kejadian</h2>' + donut + '</section>' +
      '<section class="panel p-sm"><h2 class="h2">Kepatuhan SLA Respons</h2>' + sla + '<span class="small" style="line-height:1.5">SLA = batas waktu respons pertama sejak laporan masuk. Target diatur di menu Pengaturan.</span></section></div>' +
      '<div class="panels"><section class="panel p-mid"><h2 class="h2">Spesies Paling Sering Dilaporkan</h2>' + top + '</section><section class="panel p-sm"><h2 class="h2">Kinerja Tim</h2>' + tim + '</section><section class="panel p-sm"><h2 class="h2">Aktivitas &amp; Log Audit</h2>' + audit + '</section></div></div>';
    petaTitik($('#mapMini'), false);
    var sb = $('.sb a[href="#/petugas/kasus"]'); if (sb && k.menunggu && !$('.cnt', sb)) sb.insertAdjacentHTML('beforeend', '<span class="cnt">' + k.menunggu + '</span>');
  }
  ACT.filterKe = function (el) { P.f = el.dataset.f; go('#/petugas/kasus'); };
  ACT.bukaLaporan = function (el) { bukaDetailModal(el.dataset.id); };

  // ---------- PETA OPERASIONAL ----------
  var WARNA_PRIO = { Darurat: '#B42318', Tinggi: '#F2A900', Normal: '#16514D' };
  function petaTitik(el, besar) {
    if (!el) return;
    if (!adaLeaflet() || !navigator.onLine) { el.innerHTML = '<div class="empty" style="padding-top:120px">Peta butuh koneksi internet.</div>'; return; }
    var m = L.map(el).setView([-3.2, 116.0], 9); tileLayer().addTo(m); maps.push(m);
    api('staffMap').then(function (r) {
      var grp = [];
      r.points.forEach(function (p) {
        var buka = ['Selesai', 'Tidak Valid'].indexOf(p.status) < 0;
        var c = L.circleMarker([p.lat, p.lng], { radius: buka ? 9 : 6, color: '#fff', weight: 2, fillColor: buka ? WARNA_PRIO[p.prioritas] : '#9AA5A3', fillOpacity: buka ? 0.95 : 0.7 }).addTo(m);
        c.bindPopup('<b>' + esc(p.spesies) + '</b><br>' + esc(p.id) + ' · ' + esc(p.prioritas) + '<br>' + esc((JENIS[p.jenis] || {}).label || '') + '<br>' + esc(p.status) + ' · ' + esc(p.sla) +
          '<br><a href="#" data-act="bukaLaporan" data-id="' + esc(p.id) + '">Buka detail →</a>');
        grp.push(c);
      });
      if (grp.length) m.fitBounds(L.featureGroup(grp).getBounds().pad(0.2));
    }).catch(function (e) { toast(e.message); });
    return m;
  }
  function tabPeta() {
    $('#pMain').innerHTML = judulTab('Operasional', 'Peta Operasional', '<span class="small">Laporan terbuka + 90 hari terakhir · akses tercatat</span>') +
      '<div class="legend" style="padding:0"><span class="dotc" style="background:#B42318"></span>Darurat<span class="dotc" style="background:#F2A900"></span>Tinggi<span class="dotc" style="background:#16514D"></span>Normal<span class="dotc" style="background:#9AA5A3"></span>Sudah selesai</div>' +
      '<div class="map" id="mapOps" style="height:calc(100vh - 220px);min-height:420px"></div>';
    petaTitik($('#mapOps'), true);
  }

  // ---------- PAPAN KASUS ----------
  var FILTER = ['Semua', 'Darurat', 'Tinggi', 'Lewat SLA', 'Tugas saya', 'Belum ditugaskan'];
  function tabKasus() {
    var main = $('#pMain');
    main.innerHTML = judulTab('Operasional', 'Papan Kasus', '<div class="row wrapx"><div class="seg-tabs" role="group" aria-label="Tampilan"><button class="' + (P.view === 'papan' ? 'on' : '') + '" data-act="viewK" data-v="papan">Papan</button><button class="' + (P.view === 'tabel' ? 'on' : '') + '" data-act="viewK" data-v="tabel">Tabel</button></div>' +
      '<button class="btn btn-outline btn-sm" data-act="ekspor">' + ic('download', 'sm') + 'Ekspor CSV</button></div>') +
      '<div class="row wrapx" style="gap:8px"><label class="search" style="flex:1 1 240px;max-width:360px;height:44px">' + ic('search', 'sm') + '<input id="kq2" type="search" placeholder="Cari…" value="' + esc(P.q) + '" aria-label="Cari kasus"></label>' +
      '<div class="chips flat">' + FILTER.map(function (f) { return '<button class="chip' + (P.f === f ? ' on' : '') + '" data-act="filterK" data-f="' + f + '">' + f + '</button>'; }).join('') + '</div></div>' +
      '<div class="split"><div class="main-col" id="kBody"><div class="empty">Memuat…</div></div>' + (wide() ? '<aside class="side-col" id="kSide"><div class="det-panel"><div class="empty">Pilih kartu untuk melihat detail.</div></div></aside>' : '') + '</div>';
    var t; $('#kq2').addEventListener('input', function (e) { clearTimeout(t); t = setTimeout(function () { P.q = e.target.value; muatKasus(); }, 350); });
    muatKasus();
  }
  ACT.viewK = function (el) { P.view = el.dataset.v; tabKasus(); };
  ACT.filterK = function (el) { P.f = el.dataset.f; $$('[data-act=filterK]').forEach(function (b) { b.classList.toggle('on', b === el); }); muatKasus(); };
  function muatKasus() {
    var q = { status: 'papan', q: P.q };
    if (P.f === 'Darurat' || P.f === 'Tinggi') q.prioritas = P.f;
    if (P.f === 'Lewat SLA') q.lewat = true;
    if (P.f === 'Tugas saya') q.saya = true;
    if (P.f === 'Belum ditugaskan') q.belumDitugaskan = true;
    api('staffList', q).then(function (r) {
      P.list = r.reports || [];
      var body = $('#kBody'); if (!body) return;
      if (P.view === 'tabel') {
        body.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Prioritas</th><th>No. Laporan</th><th>Kejadian</th><th>Spesies</th><th>Wilayah</th><th>PJ</th><th>SLA</th><th>Status</th></tr></thead><tbody>' +
          P.list.map(function (x) {
            return '<tr class="click' + (P.sel === x.id ? ' sel' : '') + '" data-act="pilihKasus" data-id="' + esc(x.id) + '" tabindex="0"><td>' + badgePrio(x.prioritas) + '</td><td class="nw"><b>' + esc(x.id) + '</b></td><td>' + esc((JENIS[x.jenis] || {}).label || x.jenis) + '</td>' +
              '<td>' + esc(x.spesies) + ' · ' + esc(x.jumlah) + '</td><td>' + esc(x.wilayah) + '</td><td>' + esc(x.pjNama || '—') + '</td><td class="nw">' + badgeSla(x) + '</td><td>' + badgeStatus(x.status) + '</td></tr>';
          }).join('') + '</tbody></table>' + (P.list.length ? '' : '<div class="empty">Tidak ada laporan untuk filter ini.</div>') + '</div>';
      } else {
        var kol = URUT_STATUS.concat(P.f === 'Semua' ? [] : []);
        var dot = { Terkirim: '#9AA5A3', Diterima: '#7FB3AA', Diverifikasi: '#2F6FB0', Ditindaklanjuti: '#F2A900', Selesai: '#16514D' };
        body.innerHTML = '<div class="board-wrap"><div class="board">' + kol.map(function (st) {
          var c = P.list.filter(function (x) { return x.status === st; });
          return '<div class="col-k"><div class="hd"><span class="row" style="gap:8px"><span style="width:9px;height:9px;border-radius:50%;background:' + dot[st] + '"></span>' + (st === 'Ditindaklanjuti' ? 'Ditangani' : st) + '</span><span class="c">' + c.length + '</span></div>' +
            c.map(kartuKasus).join('') + (c.length ? '' : '<div class="small" style="text-align:center;padding:16px 4px">Kosong</div>') + '</div>';
        }).join('') + '</div></div>' + (P.list.some(function (x) { return x.status === 'Tidak Valid'; }) ? '<p class="small">Laporan tidak valid disembunyikan dari papan. Gunakan tampilan Tabel untuk melihatnya.</p>' : '');
      }
      if (P.sel && wide()) bukaDetail(P.sel, $('#kSide .det-panel'));
    }).catch(function (e) { var b = $('#kBody'); if (b) b.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function kartuKasus(x) {
    return '<button class="kcard' + (P.sel === x.id ? ' sel' : '') + '" data-act="pilihKasus" data-id="' + esc(x.id) + '"><span class="row between">' + badgePrio(x.prioritas) + '<span class="small">' + esc(x.id) + '</span></span>' +
      '<span class="t">' + esc(x.spesies) + (Number(x.jumlah) > 1 ? ' · ' + esc(x.jumlah) : '') + '</span><span class="small">' + esc((JENIS[x.jenis] || {}).label || '') + ' · ' + esc(x.wilayah) + '</span>' +
      '<span class="row between">' + badgeSla(x) + '<span class="row" style="gap:6px">' + (x.foto ? '<span class="small">' + x.foto + ' foto</span>' : '') +
      '<span class="avatar" style="width:26px;height:26px;font-size:10px;' + (x.pjNama ? '' : 'background:#EEEBE3;color:var(--muted3)') + '" title="' + esc(x.pjNama || 'Belum ditugaskan') + '">' + esc(x.pjNama ? inisial(x.pjNama) : '—') + '</span></span></span></button>';
  }
  ACT.pilihKasus = function (el) {
    P.sel = el.dataset.id;
    $$('[data-act=pilihKasus]').forEach(function (b) { b.classList.toggle('sel', b.dataset.id === P.sel); });
    if (wide() && $('#kSide')) bukaDetail(P.sel, $('#kSide .det-panel')); else bukaDetailModal(P.sel);
  };
  function bukaDetailModal(id) {
    var card = modal('<div class="det-panel" id="detModal" style="border:none;padding:0;background:transparent"><div class="empty">Memuat detail…</div></div>', true);
    bukaDetail(id, $('#detModal', card));
  }
  function bukaDetail(id, box) {
    if (!box) return;
    box.innerHTML = '<div class="empty">Memuat detail…</div>';
    api('staffDetail', { id: id }).then(function (r) { P.detail = r.report; gambarDetail(box); }).catch(function (e) { box.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function langkahBerikut(x) {
    if (x.status === 'Terkirim') return ['terima', 'Terima laporan'];
    if (x.status === 'Diterima' && isVerif()) return ['verifikasi', 'Verifikasi'];
    if (x.status === 'Diverifikasi' && isVerif()) return ['tindaklanjut', 'Tangani / disposisi'];
    if (x.status === 'Ditindaklanjuti' && isVerif()) return ['selesai', 'Tandai selesai'];
    return null;
  }
  function gambarDetail(box) {
    var x = P.detail; if (!box || !x) return;
    var selesai = x.status === 'Selesai' || x.status === 'Tidak Valid';
    var nx = selesai ? null : langkahBerikut(x);
    var tombol = [];
    if (nx) tombol.push('<button class="btn btn-primary btn-sm" style="width:100%" data-act="aksiPetugas" data-a="' + nx[0] + '">' + nx[1] + '</button>');
    tombol.push('<button class="btn btn-outline-teal btn-sm" style="width:100%" data-act="tugaskan">' + (x.pjNama ? 'Ganti PJ' : 'Tugaskan') + '</button>');
    if (!selesai && isVerif() && x.status !== 'Terkirim' && x.status !== 'Diterima') tombol.push('<button class="btn btn-outline btn-sm" style="width:100%" data-act="aksiPetugas" data-a="selesai">Selesai</button>');
    if (!selesai && isVerif() && x.status === 'Terkirim') tombol.push('<button class="btn btn-outline btn-sm" style="width:100%" data-act="aksiPetugas" data-a="verifikasi">Langsung verifikasi</button>');
    tombol.push('<button class="btn btn-outline btn-sm" style="width:100%" data-act="aksiPetugas" data-a="pesan">Pesan pelapor</button>');
    tombol.push('<button class="btn btn-outline btn-sm" style="width:100%" data-act="aksiPetugas" data-a="catatan">Catatan internal</button>');
    tombol.push(x.rescue ? '<a class="btn btn-outline btn-sm" style="width:100%" href="#/petugas/rescue" data-act="keRescue" data-id="' + esc(x.rescue.id) + '">Rescue ' + esc(x.rescue.kode) + '</a>' : '<button class="btn btn-outline btn-sm" style="width:100%" data-act="rescueDariLaporan">Buat kasus rescue</button>');
    if (!selesai && isVerif()) tombol.push('<button class="btn btn-danger-outline btn-sm" style="width:100%" data-act="aksiPetugas" data-a="tidakvalid">Tidak valid</button>');
    var gmaps = 'https://www.google.com/maps?q=' + x.lat + ',' + x.lng;
    box.innerHTML = '<div class="row between"><span class="small">' + esc(x.id) + '</span>' + badgePrio(x.prioritas) + '</div>' +
      '<span class="h1" style="font-size:30px">' + esc(x.spesiesTerverifikasi || x.spesies) + '</span>' +
      (x.spesiesTerverifikasi && x.spesiesTerverifikasi !== x.spesies ? '<span class="small">Dilaporkan sebagai: ' + esc(x.spesies) + '</span>' : '') +
      '<span class="small">' + esc((JENIS[x.jenis] || {}).label) + ' · ' + esc(x.jumlah) + ' individu · ' + esc(x.kondisi || '-') + '<br>Temuan ' + tgl(x.waktuTemuan) + ' · ' + esc(x.wilayah) + '</span>' +
      '<div class="row wrapx">' + badgeStatus(x.status) + '<span class="badge ' + (x.slaLewat ? 'b-red' : 'b-sla') + '">' + ic('clock', 'sm') + ' ' + esc(x.sla) + ' (target ' + angka(x.slaTarget) + ' jam)</span>' + (x.disposisi ? '<span class="small">Disposisi: ' + esc(x.disposisi) + '</span>' : '') + '</div>' +
      '<div class="row" style="background:var(--ground);border-radius:12px;padding:8px 10px"><span class="avatar" style="width:30px;height:30px;font-size:11px;' + (x.pjNama ? '' : 'background:#EEEBE3;color:var(--muted3)') + '">' + esc(x.pjNama ? inisial(x.pjNama) : '—') + '</span><span class="grow small">Penanggung jawab<br><b style="color:var(--ink);font-size:13px">' + esc(x.pjNama || 'Belum ditugaskan') + '</b></span></div>' +
      (x.fotoIds.length ? '<div class="ph-grid">' + x.fotoIds.map(function (f) { return '<a href="#" data-act="lihatFoto" data-f="' + esc(f) + '" id="ph_' + esc(f) + '" aria-label="Buka foto"></a>'; }).join('') + '</div>' : '<span class="small">Tanpa foto.</span>') +
      '<div class="coord"><span class="small">Koordinat presisi</span><b>' + Number(x.lat).toFixed(6) + ', ' + Number(x.lng).toFixed(6) + (x.akurasi && x.akurasi !== '0' ? ' (±' + esc(x.akurasi) + ' m)' : '') + '</b>' +
      '<span class="small">Akses Anda tercatat di log audit · <a href="' + gmaps + '" target="_blank" rel="noopener">Google Maps / navigasi</a></span></div>' +
      '<div class="map" id="mapDet" style="height:170px"></div>' +
      (x.deskripsi ? '<div class="msg soft"><div class="who">Keterangan pelapor</div>' + esc(x.deskripsi) + '</div>' : '') +
      '<span class="small">Pelapor: ' + (x.anonim ? 'Anonim' : esc(x.pelaporNama || 'Tanpa nama') + (x.pelaporWa ? ' · <a href="https://wa.me/' + esc(String(x.pelaporWa).replace(/\D/g, '').replace(/^0/, '62')) + '" target="_blank" rel="noopener">' + esc(x.pelaporWa) + '</a>' : '')) + '</span>' +
      '<div class="btn-grid2">' + tombol.join('') + '</div>' +
      '<b style="font-size:13.5px;margin-top:4px">Riwayat</b><div class="stack" style="gap:8px">' + x.riwayat.slice().reverse().map(function (h) {
        return '<div class="msg soft"><div class="who">' + esc(h.judul) + ' · ' + tgl(h.waktu) + ' <span class="tag ' + (h.publik ? 'b-teal' : 'b-gray') + '">' + (h.publik ? 'terlihat pelapor' : 'internal') + '</span></div><span class="small">' + esc(h.oleh) + (h.catatan ? ' — ' + esc(h.catatan) : '') + '</span></div>';
      }).join('') + '</div>';
    x.fotoIds.forEach(function (f) {
      var pasang = function (url) { var a = document.getElementById('ph_' + f); if (a) a.style.backgroundImage = 'url(' + url + ')'; };
      if (P.foto[f]) return pasang(P.foto[f]);
      api('staffPhoto', { fileId: f }).then(function (r) { P.foto[f] = 'data:' + r.mime + ';base64,' + r.data; pasang(P.foto[f]); }).catch(function () { });
    });
    var md = $('#mapDet', box);
    if (md && adaLeaflet() && navigator.onLine) { var m = L.map(md).setView([x.lat, x.lng], 14); tileLayer().addTo(m); L.circleMarker([x.lat, x.lng], { radius: 9, color: '#fff', weight: 3, fillColor: WARNA_PRIO[x.prioritas], fillOpacity: 1 }).addTo(m); maps.push(m); }
  }
  function segarkanDetail() {
    var box = $('#detModal') || $('#kSide .det-panel');
    gambarDetail(box);
    if (P.tab === 'kasus') muatKasus();
  }
  ACT.lihatFoto = function (el) {
    var u = P.foto[el.dataset.f]; if (!u) { toast('Foto masih dimuat.'); return; }
    var lama = $('#modal .modal-card').innerHTML, wasOpen = !$('#modal').hidden;
    modal('<img src="' + u + '" alt="Foto laporan" style="width:100%;border-radius:14px;margin-top:8px"><div class="mt12"><button class="btn btn-outline" data-act="' + (wasOpen ? 'balikDetail' : 'tutup') + '">Tutup</button></div>', true);
    ACT.balikDetail = function () { bukaDetailModal(P.detail.id); };
  };
  function muatStaf() { return P.staff ? Promise.resolve(P.staff) : api('staffUsers').then(function (r) { P.staff = r.staff; return P.staff; }); }
  ACT.tugaskan = function () {
    var kembali = !!$('#detModal');
    muatStaf().then(function (st) {
      modal('<h2 class="h2">Tugaskan penanggung jawab</h2><p class="sub">' + esc(P.detail.id) + ' · notifikasi Telegram dikirim bila diaktifkan</p><div class="stack mt12">' +
        st.map(function (u) { return '<button class="list-item" data-act="pilihPJ" data-id="' + esc(u.id) + '" data-kembali="' + (kembali ? 1 : 0) + '"><span class="avatar">' + esc(inisial(u.nama)) + '</span><span class="grow"><span class="t">' + esc(u.nama) + '</span><span class="small">' + esc(PERAN[u.peran]) + (u.instansi ? ' · ' + esc(u.instansi) : '') + '</span></span>' + (P.detail.pjId === u.id ? ic('check') : '') + '</button>'; }).join('') + '</div>');
    }).catch(function (e) { toast(e.message); });
  };
  ACT.pilihPJ = function (el) {
    api('staffAction', { id: P.detail.id, aksi: 'tugaskan', pjId: el.dataset.id }).then(function (r) {
      P.detail = r.report; toast('Ditugaskan ke ' + r.report.pjNama + '.');
      if (el.dataset.kembali === '1' || !wide() || P.tab !== 'kasus') { bukaDetailModal(r.report.id); } else { tutupModal(); segarkanDetail(); }
    }).catch(function (e) { toast(e.message); });
  };
  ACT.aksiPetugas = function (el) {
    var a = el.dataset.a, x = P.detail, kembali = !!$('#detModal');
    var judul = { terima: 'Terima laporan', verifikasi: 'Verifikasi laporan', tindaklanjut: 'Tangani / disposisi', selesai: 'Tandai selesai', tidakvalid: 'Nyatakan tidak valid', pesan: 'Pesan ke pelapor', catatan: 'Catatan internal' }[a];
    var opsiSp = S.species.map(function (s) { return '<option value="' + esc(s.id) + '"' + (x.spesiesId === s.id ? ' selected' : '') + '>' + esc(s.nama) + ' (' + esc(s.latin) + ')</option>'; }).join('');
    modal('<h2 class="h2">' + judul + '</h2><p class="sub">' + esc(x.id) + '</p><div class="stack mt12">' +
      (a === 'verifikasi' ? '<div class="field"><label for="aSp">Spesies terkonfirmasi</label><select class="input" id="aSp"><option value="">— Pilih —</option>' + opsiSp + '</select></div>' : '') +
      (a === 'tindaklanjut' ? '<div class="field"><label for="aDisp">Disposisi ke (resort / tim / petugas)</label><input class="input" id="aDisp" value="' + esc(x.disposisi || '') + '" placeholder="mis. Resort KSDA Kotabaru"></div>' : '') +
      '<div class="field"><label for="aCat">' + (a === 'pesan' ? 'Pesan (terlihat pelapor)' : 'Catatan') + '</label><textarea class="input" id="aCat" placeholder="' + (a === 'tidakvalid' ? 'Alasan, mis. foto bukan satwa dilindungi / duplikat' : '') + '"></textarea></div>' +
      (['pesan', 'catatan'].indexOf(a) < 0 ? '<label class="check"><input type="checkbox" id="aPub" checked><span class="small" style="color:var(--ink)">Tampilkan catatan ini ke pelapor</span></label>' : '') +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="' + (kembali ? 'balikDetail2' : 'tutup') + '">Batal</button><button class="btn btn-primary" data-act="kirimAksi" data-a="' + a + '" data-kembali="' + (kembali ? 1 : 0) + '">Simpan</button></div></div>');
    ACT.balikDetail2 = function () { bukaDetailModal(x.id); };
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
      P.detail = r.report; toast('Tersimpan.');
      if (el.dataset.kembali === '1') bukaDetailModal(r.report.id); else { tutupModal(); segarkanDetail(); }
      if (P.tab === 'kasus' && el.dataset.kembali === '1') muatKasus();
    }).catch(function (e) { el.disabled = false; toast(e.message); });
  };
  ACT.ekspor = function () {
    toast('Menyiapkan ekspor…');
    api('staffExport').then(function (r) {
      var rows = r.rows || []; if (!rows.length) { toast('Belum ada data.'); return; }
      var kol = Object.keys(rows[0]);
      var csv = '﻿' + [kol.join(';')].concat(rows.map(function (x) { return kol.map(function (k) { return '"' + String(x[k] == null ? '' : x[k]).replace(/"/g, '""') + '"'; }).join(';'); })).join('\n');
      unduh(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'SILANGKA-laporan-' + new Date().toISOString().slice(0, 10) + '.csv');
      toast('File CSV diunduh (bisa dibuka di Excel/Sheets).');
    }).catch(function (e) { toast(e.message); });
  };
  function unduh(blob, nama) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click(); a.remove(); }

  // ---------- SURVEI ----------
  function tabSurvei() {
    $('#pMain').innerHTML = judulTab('Konservasi · bahan aspek kehati PROPER', 'Inventarisasi Survei Kehati', '<button class="btn btn-primary btn-sm" data-act="surveiBaru">' + ic('plus', 'sm') + 'Input survei baru</button>') + '<div id="svBody"><div class="empty">Memuat…</div></div>';
    muatSurvei();
  }
  function muatSurvei() {
    api('surveyData', { lokasi: P.lokasi }).then(gambarSurvei).catch(function (e) { el('#svBody').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function gambarSurvei(d) {
    P.lokasiList = d.lokasiList;
    var ix = d.indeks, s = d.series;
    var chart = '';
    if (s.length) {
      var W0 = 640, H0 = 220, mxH = Math.max(3.5, Math.max.apply(null, s.map(function (x) { return x.H; })) + 0.3), mnH = Math.max(0, Math.min.apply(null, s.map(function (x) { return x.H; })) - 0.5);
      var X = function (i) { return 50 + (s.length === 1 ? 270 : i * (570 / (s.length - 1))); }, Y = function (v) { return 190 - (v - mnH) / (mxH - mnH) * 170; };
      var grid = [0, 1, 2, 3].map(function (g) { var v = mnH + (mxH - mnH) * g / 3; return '<line x1="45" x2="630" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#EEEBE3"/><text x="4" y="' + (Y(v) + 4) + '" font-size="11" fill="#6F807E">' + v.toFixed(1).replace('.', ',') + '</text>'; }).join('');
      var batas = [1, 3].filter(function (v) { return v > mnH && v < mxH; }).map(function (v) { return '<line x1="45" x2="630" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#B42318" stroke-dasharray="5 5" stroke-width="1.2"/><text x="632" y="' + (Y(v) + 4) + '" font-size="10" fill="#8A1C12" text-anchor="end" dy="-6">H′=' + v + '</text>'; }).join('');
      chart = '<svg class="line-chart" viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="Tren indeks keanekaragaman per semester">' + grid + batas +
        '<polyline fill="none" stroke="#16514D" stroke-width="3" stroke-linejoin="round" points="' + s.map(function (p, i) { return X(i) + ',' + Y(p.H); }).join(' ') + '"/>' +
        s.map(function (p, i) { return '<circle cx="' + X(i) + '" cy="' + Y(p.H) + '" r="5" fill="#fff" stroke="#16514D" stroke-width="2.5"/><text x="' + X(i) + '" y="' + (Y(p.H) - 10) + '" font-size="10.5" text-anchor="middle" fill="#0F2E2C" font-weight="700">' + String(p.H).replace('.', ',') + '</text><text x="' + X(i) + '" y="214" font-size="10.5" text-anchor="middle" fill="#6F807E">' + esc(p.label) + '</text>'; }).join('') + '</svg>';
    }
    var ST = { EN: 'b-orange', VU: 'b-amber', LC: 'b-teal', CR: 'b-red', DD: 'b-gray', NT: 'b-teal' };
    el('#svBody').innerHTML = '<div class="stack" style="gap:16px"><div class="chips flat"><button class="chip' + (!P.lokasi ? ' on' : '') + '" data-act="lokasi" data-l="">Semua lokasi</button>' +
      d.lokasiList.map(function (l) { return '<button class="chip' + (P.lokasi === l ? ' on' : '') + '" data-act="lokasi" data-l="' + esc(l) + '">' + esc(l) + '</button>'; }).join('') + '</div>' +
      '<div class="kpis"><div class="kpi" style="background:var(--teal);border-color:var(--teal);color:var(--ground)"><small style="color:var(--mint)">Indeks Keanekaragaman (H′)</small><b style="font-size:48px">' + angka(ix.H) + '</b><span class="badge" style="background:rgba(246,244,238,.15);align-self:flex-start">' + esc(ix.kategori) + '</span><span class="small" style="color:var(--mint)">Shannon-Wiener · &lt;1 rendah, 1–3 sedang, &gt;3 tinggi</span></div>' +
      '<div class="kpi"><small>Kekayaan jenis (S)</small><b>' + ix.S + '</b><span class="d">' + d.dilindungi + ' spesies dilindungi</span></div>' +
      '<div class="kpi"><small>Kemerataan (E)</small><b>' + angka(ix.E) + '</b><span class="d">Pielou · mendekati 1 = merata</span></div>' +
      '<div class="kpi"><small>Individu tercatat</small><b>' + ix.N + '</b><span class="d">' + d.jumlahSurvei + ' survei</span></div></div>' +
      '<div class="panels"><section class="panel p-wide"><h2 class="h2">Tren H′ per Semester — ' + esc(P.lokasi || 'Semua lokasi') + '</h2>' + (chart || '<div class="empty">Belum ada data survei.</div>') + '</section>' +
      '<section class="panel p-sm"><h2 class="h2">Survei terbaru</h2>' + (d.terbaru.map(function (v) { return '<div class="row"><span class="thumb" style="width:40px;height:40px">' + ic('chart', 'sm') + '</span><span class="grow stack" style="gap:0"><b style="font-size:13px">' + esc(v.lokasi) + '</b><span class="small">' + tgl(v.tanggal, false) + ' · ' + esc(v.metode) + ' · ' + v.total + ' individu</span></span></div>'; }).join('') || '<div class="empty">Belum ada.</div>') + '</section></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Spesies</th><th>Status</th><th>Individu</th><th>Pi</th><th>Metode</th><th>Tren semester</th></tr></thead><tbody>' +
      d.rows.map(function (r) { return '<tr><td><b>' + esc(r.nama) + '</b>' + (r.latin ? '<br><span class="small latin">' + esc(r.latin) + '</span>' : '') + '</td><td>' + (r.iucn ? '<span class="tag ' + (ST[r.iucn] || 'b-gray') + '">IUCN ' + esc(r.iucn) + '</span>' : '—') + (r.dilindungi ? ' <span class="tag b-teal">Dilindungi</span>' : '') + '</td><td><b>' + r.n + '</b></td><td>' + angka(r.pi) + '</td><td class="small">' + esc(r.metode) + '</td><td style="font-weight:700;color:' + (r.tren === 'naik' ? 'var(--green)' : r.tren === 'turun' ? 'var(--red-ink)' : 'var(--muted3)') + '">' + ({ naik: '▲ naik', turun: '▼ turun', tetap: '— tetap', baru: 'baru' }[r.tren]) + '</td></tr>'; }).join('') +
      '</tbody></table>' + (d.rows.length ? '' : '<div class="empty">Belum ada data.</div>') + '</div>' +
      '<p class="small">Rumus: H′ = −Σ pᵢ ln pᵢ ; E = H′ / ln S. Kategori mengikuti batas umum Shannon-Wiener — cocokkan dengan acuan tim penilai PROPER.</p></div>';
  }
  ACT.lokasi = function (el) { P.lokasi = el.dataset.l; muatSurvei(); };
  var svItems = [];
  ACT.surveiBaru = function () {
    svItems = [{ spesiesId: '', nama: '', jumlah: '' }];
    var lok = (P.lokasiList || []).map(function (l) { return '<option>' + esc(l) + '</option>'; }).join('');
    modal('<h2 class="h2">Input survei baru</h2><p class="sub">Indeks dihitung otomatis setelah disimpan.</p><div class="stack mt12">' +
      '<div class="form-grid"><div class="field"><label for="sTgl">Tanggal</label><input class="input" type="date" id="sTgl" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<div class="field"><label for="sMet">Metode</label><select class="input" id="sMet"><option>Transek garis</option><option>Titik hitung</option><option>Kamera trap</option><option>Jelajah bebas</option></select></div></div>' +
      '<div class="field"><label for="sLok">Lokasi / stasiun</label><input class="input" id="sLok" list="lokList" placeholder="mis. Reklamasi Pit Manggis — Transek T2" value="' + esc(P.lokasi || '') + '"><datalist id="lokList">' + lok + '</datalist></div>' +
      '<div class="field"><label for="sTim">Tim survei</label><input class="input" id="sTim" placeholder="Nama anggota, pisahkan koma"></div>' +
      '<span class="label">Temuan</span><div id="svRows" class="stack" style="gap:8px"></div><button class="btn btn-outline btn-sm" data-act="svTambah" style="width:100%">' + ic('plus', 'sm') + 'Tambah spesies</button>' +
      '<div class="field"><label for="sHab">Kondisi habitat</label><textarea class="input" id="sHab" placeholder="Tutupan tajuk, sumber pakan, gangguan…"></textarea></div>' +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="svSimpan">Simpan survei</button></div></div>', true);
    gambarSvRows();
  };
  function gambarSvRows() {
    var opsi = function (v) { return '<option value="">— spesies kamus —</option>' + S.species.map(function (s) { return '<option value="' + esc(s.id) + '"' + (v === s.id ? ' selected' : '') + '>' + esc(s.nama) + '</option>'; }).join('') + '<option value="_lain"' + (v === '_lain' ? ' selected' : '') + '>Spesies lain (ketik)</option>'; };
    $('#svRows').innerHTML = svItems.map(function (it, i) {
      return '<div style="display:grid;grid-template-columns:minmax(0,1fr) 90px 44px;gap:6px"><div class="stack" style="gap:6px"><select class="input" data-sv="spesiesId" data-i="' + i + '" aria-label="Spesies">' + opsi(it.spesiesId) + '</select>' +
        (it.spesiesId === '_lain' ? '<input class="input" data-sv="nama" data-i="' + i + '" placeholder="Nama spesies" value="' + esc(it.nama) + '" aria-label="Nama spesies lain">' : '') + '</div>' +
        '<input class="input" type="number" min="1" inputmode="numeric" data-sv="jumlah" data-i="' + i + '" placeholder="Jml" value="' + esc(it.jumlah) + '" aria-label="Jumlah">' +
        '<button class="icon-btn box" data-act="svHapus" data-i="' + i + '" aria-label="Hapus baris">' + ic('close', 'sm') + '</button></div>';
    }).join('');
    $$('[data-sv]').forEach(function (el) {
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
        svItems[Number(el.dataset.i)][el.dataset.sv] = el.value;
        if (el.dataset.sv === 'spesiesId') gambarSvRows();
      });
    });
  }
  ACT.svTambah = function () { svItems.push({ spesiesId: '', nama: '', jumlah: '' }); gambarSvRows(); };
  ACT.svHapus = function (el) { svItems.splice(Number(el.dataset.i), 1); if (!svItems.length) svItems.push({ spesiesId: '', nama: '', jumlah: '' }); gambarSvRows(); };
  ACT.svSimpan = function (el) {
    var items = svItems.map(function (i) { return { spesiesId: i.spesiesId === '_lain' ? '' : i.spesiesId, nama: i.spesiesId === '_lain' ? i.nama : '', jumlah: Number(i.jumlah) }; });
    el.disabled = true;
    api('surveySave', { survei: { tanggal: $('#sTgl').value, lokasi: $('#sLok').value, metode: $('#sMet').value, tim: $('#sTim').value, habitat: $('#sHab').value, items: items } })
      .then(function (d) { tutupModal(); toast('Survei tersimpan.'); P.lokasi = d.lokasi; gambarSurvei(d); })
      .catch(function (e) { el.disabled = false; toast(e.message); });
  };

  // ---------- RESCUE ----------
  var TAHAP = ['Evakuasi', 'Pemeriksaan', 'Rehabilitasi', 'Habituasi', 'Pelepasliaran', 'Monitoring'];
  function tabRescue() {
    $('#pMain').innerHTML = judulTab('Konservasi · kerja sama BKSDA', 'Rescue &amp; Pelepasliaran', '<button class="btn btn-primary btn-sm" data-act="rescueBaru">' + ic('plus', 'sm') + 'Kasus rescue baru</button>') +
      '<div class="split"><div class="side-col" style="max-width:none;flex:1 1 320px" id="rsList"><div class="empty">Memuat…</div></div><div class="main-col" id="rsDet"><div class="det-panel"><div class="empty">Pilih satwa untuk melihat perkembangan.</div></div></div></div>';
    api('rescueList').then(function (r) {
      var list = r.rescues;
      setBadge('rescue', list.filter(function (x) { return x.status === 'Aktif'; }).length);
      el('#rsList').innerHTML = '<div class="stack">' + (list.map(function (a) {
        return '<button class="list-item" data-act="pilihRescue" data-id="' + esc(a.id) + '" style="' + (P.rescueSel === a.id ? 'border:2px solid var(--teal)' : '') + '"><span class="thumb lg">' + ic('heart') + '</span><span class="grow"><span class="row between"><span class="t">' + esc(a.nama) + '</span><span class="small">' + esc(a.kode) + '</span></span>' +
          '<span class="small">' + esc(a.asal) + '</span><span class="minibar" style="grid-template-columns:repeat(6,minmax(0,1fr))">' + TAHAP.map(function (t, k) { return '<span class="' + (k < a.tahap ? 'on' : k === a.tahap ? 'now' : '') + '"></span>'; }).join('') + '</span>' +
          '<span class="small" style="font-weight:700;color:' + (a.status === 'Aktif' ? 'var(--teal)' : a.status === 'Mati' ? 'var(--red-ink)' : 'var(--muted2)') + '">' + (a.status === 'Aktif' ? 'Tahap: ' + esc(a.tahapNama) : esc(a.status)) + '</span></span></button>';
      }).join('') || '<div class="empty">Belum ada kasus rescue. Buat dari detail laporan atau tombol di atas.</div>') + '</div>';
      if (P.rescueSel) bukaRescue(P.rescueSel); else if (list[0] && wide()) bukaRescue(list[0].id);
    }).catch(function (e) { el('#rsList').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  ACT.pilihRescue = function (el) {
    P.rescueSel = el.dataset.id;
    $$('[data-act=pilihRescue]').forEach(function (b) { b.style.border = b.dataset.id === P.rescueSel ? '2px solid var(--teal)' : ''; });
    bukaRescue(P.rescueSel);
    if (!wide()) setTimeout(function () { $('#rsDet').scrollIntoView({ behavior: 'smooth' }); }, 100);
  };
  ACT.keRescue = function (el) { tutupModal(); P.rescueSel = el.dataset.id; go('#/petugas/rescue'); };
  function bukaRescue(id) {
    P.rescueSel = id;
    var box = $('#rsDet'); if (!box) return;
    api('rescueDetail', { id: id }).then(function (r) { gambarRescue(r.rescue); }).catch(function (e) { box.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function gambarRescue(a) {
    P.rescue = a;
    var aktif = a.status === 'Aktif', berikut = TAHAP[a.tahap + 1];
    el('#rsDet').innerHTML = '<div class="det-panel"><div class="row wrapx between"><span class="small">' + esc(a.kode) + (a.laporanId ? ' · dari laporan ' + esc(a.laporanId) : '') + '</span><span class="badge ' + (aktif ? 'b-teal' : a.status === 'Mati' ? 'b-red' : 'b-gray') + '">' + esc(a.status) + '</span></div>' +
      '<span class="h1" style="font-size:36px">' + esc(a.nama) + '</span><span class="small">' + esc(a.asal) + (a.detail ? ' · ' + esc(a.detail) : '') + '</span>' +
      '<div class="row wrapx"><span class="badge b-teal">Tahap: ' + esc(TAHAP[a.tahap]) + '</span><span class="badge b-sla">PJ: ' + esc(a.pj || '—') + '</span></div>' +
      '<div class="steps6">' + TAHAP.map(function (t, k) { return '<div><i class="' + (k < a.tahap ? 'on' : k === a.tahap ? 'now' : '') + '"></i><span class="' + (k > a.tahap ? 'dim' : '') + '">' + t + '</span></div>'; }).join('') + '</div>' +
      (aktif ? '<div class="btn-grid2">' + (berikut ? '<button class="btn btn-primary btn-sm" style="width:100%" data-act="rsLangkah" data-a="maju">Lanjut ke ' + berikut + '</button>' : '<button class="btn btn-primary btn-sm" style="width:100%" data-act="rsLangkah" data-a="selesai">Tutup kasus (selesai)</button>') +
        '<button class="btn btn-outline-teal btn-sm" style="width:100%" data-act="rsLangkah" data-a="catat">Tambah catatan</button><button class="btn btn-outline btn-sm" style="width:100%" data-act="rsUbah">Ubah data</button><button class="btn btn-danger-outline btn-sm" style="width:100%" data-act="rsLangkah" data-a="mati">Satwa mati</button></div>' : '') +
      (a.lokasiRilis ? '<div class="coord"><span class="small">Lokasi pelepasliaran (internal)</span><b>' + esc(a.lokasiRilis) + '</b><span class="small">Tidak pernah tampil di peta publik.</span></div>' : '') +
      (a.dokumen ? '<div class="msg soft"><div class="who">Dokumen / berita acara</div>' + esc(a.dokumen).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>') + '</div>' : '') +
      '<b style="font-size:13.5px">Catatan perkembangan</b><div class="stack" style="gap:8px">' + a.log.map(function (l) { return '<div class="msg soft"><div class="who">' + tgl(l.waktu) + ' · ' + esc(l.tahap) + ' · ' + esc(l.oleh) + '</div>' + esc(l.catatan) + '</div>'; }).join('') + '</div></div>';
  }
  ACT.rsLangkah = function (el) {
    var a = el.dataset.a, r = P.rescue, ke = TAHAP[r.tahap + 1];
    var judul = { maju: 'Lanjut ke tahap ' + ke, selesai: 'Tutup kasus', mati: 'Catat satwa mati', catat: 'Tambah catatan' }[a];
    modal('<h2 class="h2">' + esc(judul) + '</h2><p class="sub">' + esc(r.kode) + ' · ' + esc(r.nama) + '</p><div class="stack mt12">' +
      (a === 'maju' && ke === 'Pelepasliaran' ? '<div class="field"><label for="rsLok">Lokasi pelepasliaran (internal, tidak dipublikasi)</label><input class="input" id="rsLok" placeholder="Koordinat / nama kawasan"></div>' : '') +
      '<div class="field"><label for="rsCat">Catatan ' + (a === 'catat' ? '(berat, pakan, perilaku, tindakan medis)' : '') + '</label><textarea class="input" id="rsCat"></textarea></div>' +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn ' + (a === 'mati' ? 'btn-danger' : 'btn-primary') + '" data-act="rsKirim" data-a="' + a + '">Simpan</button></div></div>');
  };
  ACT.rsKirim = function (el) {
    el.disabled = true;
    api('rescueStep', { id: P.rescue.id, aksi: el.dataset.a, catatan: $('#rsCat').value, lokasiRilis: $('#rsLok') ? $('#rsLok').value : '' })
      .then(function (r) { tutupModal(); toast('Tersimpan.'); tabRescue(); P.rescueSel = r.rescue.id; })
      .catch(function (e) { el.disabled = false; toast(e.message); });
  };
  function formRescue(a, laporanId) {
    var baru = !a;
    a = a || {};
    var opsi = S.species.map(function (s) { return '<option value="' + esc(s.id) + '"' + (a.spesiesId === s.id ? ' selected' : '') + '>' + esc(s.nama) + '</option>'; }).join('');
    modal('<h2 class="h2">' + (baru ? 'Kasus rescue baru' : 'Ubah data rescue') + '</h2>' + (laporanId ? '<p class="sub">Dari laporan ' + esc(laporanId) + '</p>' : '') + '<div class="stack mt12">' +
      (baru && !laporanId ? '<div class="field"><label for="rfSp">Spesies</label><select class="input" id="rfSp"><option value="">— Pilih —</option>' + opsi + '</select></div>' : '') +
      '<div class="field"><label for="rfAsal">Asal / kejadian</label><input class="input" id="rfAsal" value="' + esc(a.asal || '') + '" placeholder="mis. Terluka di kaki · Area Senakin"></div>' +
      '<div class="field"><label for="rfDet">Detail satwa</label><input class="input" id="rfDet" value="' + esc(a.detail || '') + '" placeholder="Jenis kelamin, umur, berat, kondisi"></div>' +
      '<div class="field"><label for="rfPj">Penanggung jawab</label><input class="input" id="rfPj" value="' + esc(a.pj || '') + '" placeholder="Tim/petugas"></div>' +
      '<div class="field"><label for="rfDok">Tautan dokumen (BA, hasil medis — mis. link Google Drive)</label><textarea class="input" id="rfDok" style="min-height:70px">' + esc(a.dokumen || '') + '</textarea></div>' +
      (baru ? '<div class="field"><label for="rfCat">Catatan awal</label><textarea class="input" id="rfCat" style="min-height:70px"></textarea></div>' : '') +
      '<div class="btn-grid2"><button class="btn btn-outline" data-act="tutup">Batal</button><button class="btn btn-primary" data-act="rfSimpan" data-id="' + esc(a.id || '') + '" data-lap="' + esc(laporanId || '') + '">Simpan</button></div></div>');
  }
  ACT.rescueBaru = function () { formRescue(null, ''); };
  ACT.rescueDariLaporan = function () { formRescue(null, P.detail.id); };
  ACT.rsUbah = function () { formRescue(P.rescue, ''); };
  ACT.rfSimpan = function (el) {
    var d = { id: el.dataset.id, laporanId: el.dataset.lap, spesiesId: $('#rfSp') ? $('#rfSp').value : '', asal: $('#rfAsal').value, detail: $('#rfDet').value, pj: $('#rfPj').value, dokumen: $('#rfDok').value, catatan: $('#rfCat') ? $('#rfCat').value : '', lokasiRilis: P.rescue && el.dataset.id ? P.rescue.lokasiRilis : '' };
    el.disabled = true;
    api('rescueSave', { rescue: d }).then(function (r) { tutupModal(); toast('Tersimpan.'); P.rescueSel = r.rescue.id; go('#/petugas/rescue'); if (P.tab === 'rescue') tabRescue(); })
      .catch(function (e) { el.disabled = false; toast(e.message); });
  };

  // ---------- LAPORAN BULANAN ----------
  function tabBulanan() {
    if (!P.bulan) P.bulan = new Date().toISOString().slice(0, 7);
    $('#pMain').innerHTML = '<div class="no-print">' + judulTab('Pelaporan', 'Laporan Bulanan', '<div class="row wrapx"><input class="input" type="month" id="bln" value="' + esc(P.bulan) + '" style="width:auto;min-height:44px" aria-label="Pilih bulan">' +
      '<button class="btn btn-primary btn-sm" data-act="cetak">' + ic('print', 'sm') + 'Cetak / Simpan PDF</button></div>') +
      '<p class="small mt8">Teks bertanda garis putus-putus bisa diedit langsung sebelum dicetak. Di tablet: Cetak → pilih printer <b>Simpan sebagai PDF</b>.</p></div>' +
      '<div id="rep" class="mt12"><div class="empty">Menyusun laporan…</div></div>';
    $('#bln').addEventListener('change', function (e) { P.bulan = e.target.value; tabBulanan(); });
    api('monthly', { bulan: P.bulan }).then(gambarBulanan).catch(function (e) { el('#rep').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  ACT.cetak = function () { window.print(); };
  function gambarBulanan(d) {
    var nb = new Date(d.bulan + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    var ub = d.masukPrev ? Math.round((d.masuk - d.masukPrev) / d.masukPrev * 100) : null;
    var dom = d.jenis.slice().sort(function (a, b) { return b.n - a.n; })[0];
    var ringkas = 'Selama ' + nb + ' masuk ' + d.masuk + ' laporan' + (ub == null ? '' : ', ' + (ub >= 0 ? 'naik ' : 'turun ') + Math.abs(ub) + '% dari bulan sebelumnya') + '. ' +
      (d.masuk && dom ? 'Kejadian terbanyak: ' + dom.label.toLowerCase() + ' (' + dom.n + ' laporan). ' : '') +
      (d.darurat ? 'Terdapat ' + d.darurat + ' kejadian darurat' + (d.slaDaruratPct == null ? '' : '; ' + d.slaDaruratPct + '% ditanggapi dalam target ' + angka(d.slaDaruratTarget) + ' jam') + '. ' : '') +
      (d.rescue.baru ? d.rescue.baru + ' kasus rescue baru, ' + d.rescue.dilepas + ' pelepasliaran. ' : '') + '[Tambahkan analisis dan rekomendasi tim.]';
    var mx = Math.max.apply(null, d.jenis.map(function (j) { return j.n; }).concat([1]));
    el('#rep').innerHTML = '<article class="report"><div class="kop"><img src="logo.png" alt="Logo SILANGKA"><div class="grow"><div class="num" style="font-size:26px;letter-spacing:.5px">LAPORAN BULANAN SILANGKA</div><div class="small">' + esc(d.instansi || '') + '</div></div><img src="arutmin.png" alt="Logo PT Arutmin Indonesia"></div>' +
      '<div class="row between wrapx small"><span>Periode: <b style="color:var(--ink)">' + esc(nb) + '</b></span><span contenteditable="true">No. dokumen: [NOMOR/SLK/' + d.bulan.slice(5) + '/' + d.bulan.slice(0, 4) + ']</span></div>' +
      '<div class="k4"><div><b>' + d.masuk + '</b><span class="small">Laporan masuk</span></div><div><b>' + d.terverifikasi + '</b><span class="small">Terverifikasi BKSDA</span></div><div><b>' + d.spesiesTercatat + '</b><span class="small">Spesies tercatat</span></div><div><b>' + esc(d.medianTeks) + '</b><span class="small">Median respons</span></div></div>' +
      '<h3>1. Ringkasan</h3><p contenteditable="true" style="margin:0;line-height:1.6">' + esc(ringkas) + '</p>' +
      '<h3>2. Laporan per Jenis Kejadian</h3><div class="stack" style="gap:6px">' + d.jenis.map(function (j) { return '<div class="jn" style="display:grid;grid-template-columns:200px 1fr 40px;gap:10px;align-items:center;font-size:13px"><span>' + esc(j.label) + '</span><span class="hbar" style="height:12px;border-radius:3px"><i style="width:' + Math.round(j.n / mx * 100) + '%;background:var(--teal);border-radius:3px"></i></span><b style="text-align:right">' + j.n + '</b></div>'; }).join('') + '</div>' +
      '<h3>3. Spesies yang Dilaporkan</h3>' + (d.spesies.length ? '<div class="tw"><table><thead><tr><th>Spesies</th><th>IUCN</th><th>Laporan</th><th>Individu</th><th>Tindak lanjut</th></tr></thead><tbody>' +
        d.spesies.map(function (s) { return '<tr><td><b>' + esc(s.nama) + '</b> <i style="color:var(--muted2)">' + esc(s.latin) + '</i>' + (s.dilindungi ? ' <span class="tag b-teal">Dilindungi</span>' : '') + '</td><td>' + esc(s.iucn || '—') + '</td><td>' + s.laporan + '</td><td>' + s.individu + '</td><td class="small">' + esc(s.tindakLanjut) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="small">Belum ada laporan spesies pada bulan ini.</p>') +
      '<div class="row wrapx" style="gap:20px;align-items:flex-start"><div class="grow" style="min-width:240px"><h3>4. Survei &amp; Indeks Kehati</h3><p style="margin:4px 0 0;line-height:1.55">' + (d.survei.jumlah ? d.survei.jumlah + ' survei · H′ <b>' + angka(d.survei.indeks.H) + '</b> (' + esc(d.survei.indeks.kategori.toLowerCase()) + ') · kekayaan jenis ' + d.survei.indeks.S + ' · ' + d.survei.indeks.N + ' individu.' : 'Tidak ada survei pada bulan ini.') + '</p></div>' +
      '<div class="grow" style="min-width:240px"><h3>5. Rescue &amp; Pelepasliaran</h3><p style="margin:4px 0 0;line-height:1.55">' + d.rescue.aktif + ' individu dalam penanganan · ' + d.rescue.baru + ' kasus baru · ' + d.rescue.dilepas + ' pelepasliaran.</p></div></div>' +
      '<div class="ttd"><div>Disusun oleh,<br>PT Arutmin Indonesia Tambang Senakin<span class="l" contenteditable="true">[Nama &amp; Jabatan]</span></div><div>Diverifikasi oleh,<br>BKSDA Kalimantan Selatan<span class="l" contenteditable="true">[Nama &amp; Jabatan]</span></div></div>' +
      '<p class="small" style="text-align:center">Dibuat otomatis oleh SILANGKA pada ' + tgl(new Date().toISOString()) + ' · koordinat presisi tidak dicantumkan demi perlindungan satwa</p></article>';
  }

  // ---------- FOTO LAYAR MASUK ----------
  var FOKUS = [['50% 20%', 'Atas'], ['50% 50%', 'Tengah'], ['50% 80%', 'Bawah']];
  function tabFoto() {
    $('#pMain').innerHTML = judulTab('Admin · tampilan', 'Foto Layar Masuk', '<button class="btn btn-primary btn-sm" data-act="slideEdit" data-id="">' + ic('plus', 'sm') + 'Unggah foto</button>') +
      '<p class="small">Foto tampil bergantian di layar pembuka dan layar masuk. Bila belum ada foto, aplikasi memakai 3 foto bawaan. Jeda pergantian diatur di menu Pengaturan (superadmin).</p>' +
      '<div id="slList" class="stack"><div class="empty">Memuat…</div></div>' +
      '<div class="card" style="background:var(--teal-soft);border:none"><span class="small" style="color:var(--teal);line-height:1.6">Saran: foto mendatar min. 1600 px, milik sendiri/perusahaan, cantumkan kredit, dan pastikan tidak ada penanda lokasi (papan nama, jalan, bangunan). Foto disimpan di folder Drive publik terpisah dari foto laporan.</span></div>';
    api('slidesAdmin').then(function (r) { gambarSlides(r.slides); }).catch(function (e) { el('#slList').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  var SLD = [];
  function gambarSlides(list) {
    SLD = list;
    S.config.slides = list.filter(function (s) { return s.tayang; }); LS.set('config', S.config);
    el('#slList').innerHTML = list.map(function (s, i) {
      return '<div class="slide-row"><div class="stack" style="gap:4px"><button class="icon-btn box" style="width:36px;height:36px" data-act="slideMove" data-id="' + esc(s.id) + '" data-d="-1" aria-label="Naikkan"' + (i ? '' : ' disabled') + '>' + ic('up', 'sm') + '</button><button class="icon-btn box" style="width:36px;height:36px" data-act="slideMove" data-id="' + esc(s.id) + '" data-d="1" aria-label="Turunkan"' + (i < list.length - 1 ? '' : ' disabled') + '>' + ic('down', 'sm') + '</button></div>' +
        (s.url ? '<img src="' + esc(s.url) + '" alt="" style="object-position:' + esc(s.fokus) + '">' : '<span class="noimg"></span>') +
        '<span class="grow stack" style="gap:3px"><span class="eyebrow">' + esc(s.tag || '—') + '</span><b style="font-size:14px">' + esc(s.judul || '(tanpa judul)') + '</b><span class="small">' + esc(s.kredit || '') + (s.mulai || s.selesai ? ' · tayang ' + esc(s.mulai || '…') + ' s.d. ' + esc(s.selesai || '…') : '') + '</span></span>' +
        '<span class="badge ' + (s.tayang ? 'b-teal' : s.aktif ? 'b-amber' : 'b-gray') + '">' + (s.tayang ? 'Tayang' : s.aktif ? 'Terjadwal' : 'Nonaktif') + '</span>' +
        '<button class="icon-btn box" data-act="slideEdit" data-id="' + esc(s.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button></div>';
    }).join('') || '<div class="empty">Belum ada foto unggahan — layar masuk memakai 3 foto bawaan.</div>';
  }
  ACT.slideMove = function (el) { api('slideMove', { id: el.dataset.id, arah: el.dataset.d }).then(function (r) { gambarSlides(r.slides); }).catch(function (e) { toast(e.message); }); };
  var slFoto = null;
  ACT.slideEdit = function (el) {
    var s = SLD.filter(function (x) { return x.id === el.dataset.id; })[0] || { fokus: '50% 50%', aktif: true };
    slFoto = null;
    modal('<h2 class="h2">' + (s.id ? 'Ubah foto layar masuk' : 'Unggah foto layar masuk') + '</h2><div class="stack mt12">' +
      '<div style="height:200px;border-radius:16px;overflow:hidden;background:var(--ink);position:relative"><img id="slPrev" src="' + esc(s.url || '') + '" alt="Pratinjau" style="width:100%;height:100%;object-fit:cover;object-position:' + esc(s.fokus) + ';' + (s.url ? '' : 'display:none') + '">' +
      '<label class="photo-add" style="position:absolute;right:10px;bottom:10px;min-height:44px;padding:0 12px;flex-direction:row">' + ic('image', 'sm') + (s.id ? 'Ganti foto' : 'Pilih foto') + '<input type="file" accept="image/*" id="slFile"></label></div>' +
      '<div class="form-grid"><div class="field"><label for="slTag">Label kecil</label><input class="input" id="slTag" value="' + esc(s.tag || '') + '" placeholder="mis. SATWA DILINDUNGI"></div><div class="field"><label for="slJudul">Judul</label><input class="input" id="slJudul" value="' + esc(s.judul || '') + '" placeholder="mis. Lutung Dahi Putih"></div></div>' +
      '<div class="field"><label for="slKredit">Kredit foto</label><input class="input" id="slKredit" value="' + esc(s.kredit || '') + '" placeholder="Foto: …"></div>' +
      '<div class="field"><span class="label">Titik fokus (agar kepala satwa tidak terpotong di HP)</span><div class="seg c3">' + FOKUS.map(function (f) { return '<button class="' + (s.fokus === f[0] ? 'on' : '') + '" data-act="slFokus" data-v="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="form-grid"><div class="field"><label for="slMulai">Tayang mulai (opsional)</label><input class="input" type="date" id="slMulai" value="' + esc(s.mulai || '') + '"></div><div class="field"><label for="slSelesai">Tayang sampai (opsional)</label><input class="input" type="date" id="slSelesai" value="' + esc(s.selesai || '') + '"></div></div>' +
      '<label class="check"><input type="checkbox" id="slAktif"' + (s.aktif ? ' checked' : '') + '><span class="small" style="color:var(--ink)">Aktif</span></label>' +
      '<div class="btn-grid2">' + (s.id ? '<button class="btn btn-danger-outline" data-act="slideHapus" data-id="' + esc(s.id) + '">Hapus</button>' : '<button class="btn btn-outline" data-act="tutup">Batal</button>') +
      '<button class="btn btn-primary" data-act="slideSimpan" data-id="' + esc(s.id || '') + '">Simpan</button></div></div>', true);
    $('#modal').dataset.fokus = s.fokus;
    $('#slFile').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      kompres(f, 1800, 0.82).then(function (d) { slFoto = d; var im = $('#slPrev'); im.src = d; im.style.display = 'block'; }).catch(function (er) { toast(er.message); });
    });
  };
  ACT.slFokus = function (el) { $('#modal').dataset.fokus = el.dataset.v; $$('[data-act=slFokus]').forEach(function (b) { b.classList.toggle('on', b === el); }); $('#slPrev').style.objectPosition = el.dataset.v; };
  ACT.slideSimpan = function (el) {
    el.disabled = true; el.textContent = 'Menyimpan…';
    api('slideSave', { slide: { id: el.dataset.id, foto: slFoto, tag: $('#slTag').value, judul: $('#slJudul').value, kredit: $('#slKredit').value, fokus: $('#modal').dataset.fokus, mulai: $('#slMulai').value, selesai: $('#slSelesai').value, aktif: $('#slAktif').checked } })
      .then(function (r) { tutupModal(); toast('Foto tersimpan.'); gambarSlides(r.slides); })
      .catch(function (e) { el.disabled = false; el.textContent = 'Simpan'; toast(e.message); });
  };
  ACT.slideHapus = function (el) {
    if (!confirm('Hapus foto ini dari layar masuk?')) return;
    api('slideDelete', { id: el.dataset.id }).then(function (r) { tutupModal(); toast('Foto dihapus.'); gambarSlides(r.slides); }).catch(function (e) { toast(e.message); });
  };

  // ---------- PENGGUNA ----------
  var USERS = [];
  function tabPengguna() {
    $('#pMain').innerHTML = judulTab('Admin', 'Pengguna &amp; Akses', '<button class="btn btn-primary btn-sm" data-act="editUser" data-id="">' + ic('plus', 'sm') + 'Tambah petugas</button>') + '<div class="tbl-wrap" id="pUsers"><div class="empty">Memuat…</div></div>';
    api('usersList').then(function (r) { gambarUsers(r.users); }).catch(function (e) { el('#pUsers').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function gambarUsers(list) {
    USERS = list || []; P.staff = null;
    el('#pUsers').innerHTML = '<table class="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Instansi</th><th>Status</th><th>Login terakhir</th></tr></thead><tbody>' +
      USERS.map(function (u) { return '<tr class="click" data-act="editUser" data-id="' + esc(u.id) + '" tabindex="0"><td><b>' + esc(u.nama) + '</b></td><td>' + esc(u.email) + '</td><td>' + esc(PERAN[u.peran] || u.peran) + '</td><td>' + esc(u.instansi) + '</td><td>' + (u.aktif ? '<span class="badge b-teal">Aktif</span>' : '<span class="badge b-gray">Nonaktif</span>') + '</td><td class="nw">' + (u.login ? tgl(u.login) : '-') + '</td></tr>'; }).join('') + '</tbody></table>';
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

  // ---------- PENGATURAN ----------
  var SET_LABEL = {
    NAMA_INSTANSI: ['Nama instansi', 'Tampil di aplikasi & laporan'], NOMOR_DARURAT: ['Nomor darurat', 'Call center resmi BKSDA'], WA_DARURAT: ['WhatsApp petugas', 'Format 628xx'],
    EMAIL_KONTAK: ['Email kontak publik', ''], EMAIL_NOTIF: ['Email notifikasi', 'Penerima laporan Darurat/Tinggi, pisahkan koma'],
    SLA_DARURAT_JAM: ['SLA Darurat (jam)', 'Batas respons pertama'], SLA_TINGGI_JAM: ['SLA Tinggi (jam)', ''], SLA_NORMAL_JAM: ['SLA Normal (jam)', ''],
    LOGIN_GANTI_DETIK: ['Jeda foto layar masuk (detik)', ''], JEDA_PETA_HARI: ['Jeda peta publik (hari)', 'Laporan tampil di peta publik setelah sekian hari'],
    TELEGRAM_BOT_TOKEN: ['Token bot Telegram', 'Dari @BotFather — rahasia'], TELEGRAM_CHAT_ID: ['Chat ID Telegram', 'ID grup/akun petugas']
  };
  function tabPengaturan() {
    $('#pMain').innerHTML = judulTab('Admin', 'Pengaturan') + '<div id="setBody"><div class="empty">Memuat…</div></div>';
    api('settingsGet').then(function (r) {
      el('#setBody').innerHTML = '<div class="panels"><section class="panel p-mid"><div class="stack">' + r.settings.map(function (s) {
        var l = SET_LABEL[s.kunci] || [s.kunci, ''];
        return '<div class="set-row"><label for="set_' + s.kunci + '"><b style="font-size:13px">' + esc(l[0]) + '</b><br><span class="small">' + esc(l[1]) + '</span></label><input class="input" id="set_' + s.kunci + '" data-set="' + s.kunci + '" value="' + esc(s.nilai) + '"' + (s.rahasia ? ' autocomplete="off"' : '') + (/JAM|DETIK|HARI/.test(s.kunci) ? ' inputmode="decimal"' : '') + '></div>';
      }).join('') + '<button class="btn btn-primary" data-act="setSimpan">Simpan pengaturan</button></div></section>' +
        '<section class="panel p-sm"><h2 class="h2">Notifikasi Telegram</h2><ol class="small" style="line-height:1.7;padding-left:18px;margin:0"><li>Di Telegram, cari <b>@BotFather</b> → kirim <b>/newbot</b> → ikuti petunjuk → salin token.</li><li>Buat grup petugas, tambahkan bot ke grup, kirim satu pesan di grup.</li><li>Buka <b>api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</b> di browser → salin angka <b>chat.id</b> (grup biasanya diawali tanda minus).</li><li>Isi kedua kolom di samping → Simpan → tekan Uji.</li></ol>' +
        '<button class="btn btn-outline-teal" data-act="tgUji">' + ic('send', 'sm') + 'Kirim pesan uji</button><span class="small">Notifikasi dikirim untuk laporan Darurat/Tinggi, penugasan, dan pengingat SLA tiap jam (bila pemicu dipasang).</span>' +
        (DEMO ? '<hr style="border:none;border-top:1px solid var(--line);width:100%"><b style="font-size:13px">Mode demo</b><button class="btn btn-danger-outline btn-sm" style="width:100%" data-act="demoReset">Reset data demo</button>' : '') + '</section></div>';
    }).catch(function (e) { el('#setBody').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  ACT.setSimpan = function (el) {
    var data = {};
    $$('[data-set]').forEach(function (i) { data[i.dataset.set] = i.value; });
    el.disabled = true;
    api('settingsSave', { settings: data }).then(function () { el.disabled = false; toast('Pengaturan tersimpan.'); muatAwal(); }).catch(function (e) { el.disabled = false; toast(e.message); });
  };
  ACT.tgUji = function () { api('telegramTest').then(function (r) { toast(r.pesan); }).catch(function (e) { toast(e.message); }); };
  ACT.demoReset = function () { if (confirm('Hapus semua data demo dan isi ulang data contoh?')) window.SLK_DEMO.reset(); };

  // ================= MULAI =================
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installPrompt = e; if (['beranda', 'akun'].indexOf(route().name) > -1) render(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
  var lastWide = wide();
  window.addEventListener('resize', function () { var w = wide(); if (w !== lastWide) { lastWide = w; if (route().name === 'petugas' && ['kasus', 'rescue'].indexOf(P.tab) > -1) render(); } });

  function muatSkrip(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Gagal memuat ' + src)); }; document.body.appendChild(s); }); }
  function mulai() {
    Promise.all([DB.get('outbox', []), DB.get('drafts', [])]).then(function (v) {
      S.outbox = v[0] || []; S.drafts = v[1] || [];
      render(); muatAwal();
      setTimeout(function () { sinkron(); }, 1500);
    });
  }
  if (DEMO) {
    var bn = document.getElementById('banner-demo'); bn.hidden = false;
    document.getElementById('demo-reset').addEventListener('click', function () { if (confirm('Hapus semua data demo dan isi ulang data contoh?')) window.SLK_DEMO.reset(); });
    app.innerHTML = '<div class="empty" style="padding-top:120px">Menyiapkan mode demo…</div>';
    muatSkrip('demo/gas-shim.js').then(function () { return muatSkrip('demo/Code.js'); }).then(function () { window.SLK_DEMO.init(); mulai(); })
      .catch(function (e) { app.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  } else {
    mulai();
  }
})();
