(() => {
  'use strict';

  const STORAGE_KEY = 'buecherbibliothek.books.v1';
  const VIEW_KEY = 'buecherbibliothek.view';

  /** @typedef {{id:string, titel:string, autor:string, verlag:string, jahr:string,
   *  isbn:string, genre:string, sprache:string, ausgabe:string, zustand:string,
   *  reihe:string, seiten:string, gelesen:string, erstausgabe:string, notizen:string,
   *  coverData:?string, coverUrl:?string}} Book */

  /** @type {Book[]} */
  let books = [];
  let currentDetailId = null;
  let currentEditId = null; // null => neues Buch
  let pickedCoverData = null;
  let pickedCoverUrl = null;

  // ---------- Persistenz ----------

  function loadBooks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      books = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Bücher konnten nicht geladen werden', e);
      books = [];
    }
  }

  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      toast('Speichern fehlgeschlagen (Speicher voll?): ' + e.message);
    }
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ---------- Hilfsfunktionen ----------

  function toast(msg, ms = 2400) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), ms);
  }

  function coverSrc(b) {
    return b.coverData || b.coverUrl || '';
  }

  function getAusgabeColors(ausgabe) {
    const a = (ausgabe || '').toLowerCase();
    if (a.includes('hardcover') || a.includes('gebunden'))
      return { bg: 'var(--med-a-bg)', tx: 'var(--med-a-tx)' };
    if (a.includes('taschenbuch'))
      return { bg: 'var(--med-b-bg)', tx: 'var(--med-b-tx)' };
    if (a.includes('ebook'))
      return { bg: 'var(--row-sel)', tx: '#8a6a10' };
    return { bg: 'var(--row-even)', tx: 'var(--text-muted)' }; // Hörbuch, Sonderausgabe, unbekannt
  }

  function getZustandColors(zustand) {
    const z = (zustand || '').trim();
    if (z === 'Neu (eingeschweißt)' || z === 'Neu') return { bg: 'var(--zus-neu-bg)', tx: 'var(--zus-neu-tx)' };
    if (z === 'Neuwertig') return { bg: 'var(--zus-neuw-bg)', tx: 'var(--zus-neuw-tx)' };
    if (z === 'Sehr Gut') return { bg: 'var(--zus-sgut-bg)', tx: 'var(--zus-sgut-tx)' };
    if (z === 'Gut') return { bg: 'var(--zus-gut-bg)', tx: 'var(--zus-gut-tx)' };
    if (z === 'Akzeptabel') return { bg: 'var(--zus-akz-bg)', tx: 'var(--zus-akz-tx)' };
    return { bg: 'var(--row-even)', tx: 'var(--text-muted)' };
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- Suche / Filter / Sortierung ----------

  function getVisibleBooks() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const filter = document.getElementById('filterSelect').value;
    const sort = document.getElementById('sortSelect').value;

    let list = books.filter(b => {
      if (q) {
        const hay = [b.titel, b.autor, b.verlag, b.jahr, b.isbn, b.genre, b.reihe]
          .join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === 'read' && b.gelesen !== 'Ja') return false;
      if (filter === 'unread' && b.gelesen === 'Ja') return false;
      return true;
    });

    const byTitel = (a, b) => (a.titel || '').localeCompare(b.titel || '', 'de');
    const num = v => { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; };

    switch (sort) {
      case 'verlag':
        list.sort((a, b) => (a.verlag || '').localeCompare(b.verlag || '', 'de') || byTitel(a, b));
        break;
      case 'autor':
        list.sort((a, b) => (a.autor || '').localeCompare(b.autor || '', 'de') || byTitel(a, b));
        break;
      case 'genre':
        list.sort((a, b) => (a.genre || '').localeCompare(b.genre || '', 'de') || byTitel(a, b));
        break;
      case 'seiten-asc':
        list.sort((a, b) => (num(a.seiten) - num(b.seiten)) || byTitel(a, b));
        break;
      case 'seiten-desc':
        list.sort((a, b) => (num(b.seiten) - num(a.seiten)) || byTitel(a, b));
        break;
      case 'jahr':
        list.sort((a, b) => (num(a.jahr) - num(b.jahr)) || byTitel(a, b));
        break;
      default:
        list.sort(byTitel);
    }
    return list;
  }

  // ---------- Rendern ----------

  function render() {
    const visible = getVisibleBooks();
    document.getElementById('bookCount').textContent = books.length + (books.length === 1 ? ' Buch' : ' Bücher');
    document.getElementById('emptyState').classList.toggle('hidden', books.length > 0);

    const isListView = localStorage.getItem(VIEW_KEY) === 'list';
    document.getElementById('shelfView').classList.toggle('hidden', isListView);
    document.getElementById('listView').classList.toggle('hidden', !isListView);
    document.getElementById('viewToggleBtn').textContent = isListView ? 'Regal' : 'Liste';

    if (isListView) renderList(visible); else renderShelf(visible);
  }

  function coverInnerHtml(b) {
    const src = coverSrc(b);
    if (src) {
      return `<img src="${escapeHtml(src)}" alt="" loading="lazy" onerror="this.remove()">`;
    }
    const title = escapeHtml(b.titel || '');
    return `<span class="fallback-title">${title}</span>`;
  }

  function renderShelf(list) {
    const el = document.getElementById('shelfView');
    el.innerHTML = list.map(b => `
      <div class="book-card" data-id="${b.id}">
        <div class="book-cover ${coverSrc(b) ? 'has-image' : ''}">${coverInnerHtml(b)}</div>
        <div class="titel">${escapeHtml(b.titel)}</div>
        <div class="autor">${escapeHtml(b.autor)}</div>
      </div>
    `).join('');
    el.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', () => openDetail(card.dataset.id));
    });
  }

  function renderList(list) {
    const el = document.getElementById('listView');
    el.innerHTML = list.map(b => {
      const sub = [b.autor, b.verlag, b.jahr].filter(Boolean).join(' · ');
      return `
      <div class="list-row" data-id="${b.id}">
        <div class="book-cover ${coverSrc(b) ? 'has-image' : ''}">${coverInnerHtml(b)}</div>
        <div class="list-meta">
          <div class="titel">${escapeHtml(b.titel)}</div>
          <div class="sub">${escapeHtml(sub)}</div>
        </div>
      </div>`;
    }).join('');
    el.querySelectorAll('.list-row').forEach(row => {
      row.addEventListener('click', () => openDetail(row.dataset.id));
    });
  }

  // ---------- Detailansicht ----------

  function openDetail(id) {
    const b = books.find(x => x.id === id);
    if (!b) return;
    currentDetailId = id;

    const cover = document.getElementById('detailCover');
    const src = coverSrc(b);
    if (src) { cover.src = src; cover.style.display = ''; }
    else { cover.removeAttribute('src'); }

    document.getElementById('detailTitel').textContent = b.titel;
    document.getElementById('detailInfo').textContent =
      ['Von ' + (b.autor || '—'), b.jahr, b.verlag].filter(Boolean).join(' | ');
    document.getElementById('detailErst').textContent = 'Erstausgabe: ' + (b.erstausgabe || 'Nein');

    const badgeAusgabe = document.getElementById('badgeAusgabe');
    if (b.ausgabe) {
      const c = getAusgabeColors(b.ausgabe);
      badgeAusgabe.textContent = b.ausgabe;
      badgeAusgabe.style.background = c.bg;
      badgeAusgabe.style.color = c.tx;
      badgeAusgabe.classList.remove('hidden');
    } else badgeAusgabe.classList.add('hidden');

    const badgeZustand = document.getElementById('badgeZustand');
    if (b.zustand) {
      const c = getZustandColors(b.zustand);
      badgeZustand.textContent = b.zustand;
      badgeZustand.style.background = c.bg;
      badgeZustand.style.color = c.tx;
      badgeZustand.classList.remove('hidden');
    } else badgeZustand.classList.add('hidden');

    const seitenBox = document.getElementById('seitenBox');
    if (b.seiten) {
      document.getElementById('seitenNum').textContent = b.seiten + ' Seiten';
      seitenBox.classList.remove('hidden');
    } else seitenBox.classList.add('hidden');

    toggleRow('reiheRow', 'detailReihe', b.reihe);
    toggleRow('isbnRow', 'detailIsbn', b.isbn);
    toggleRow('notizenRow', 'detailNotizen', b.notizen);
    document.getElementById('detailGelesen').textContent = b.gelesen || 'Nein';

    const q = encodeURIComponent(b.titel || '');
    document.getElementById('linkWikipedia').href = 'https://de.wikipedia.org/w/index.php?search=' + q;
    document.getElementById('linkGoodreads').href = 'https://www.goodreads.com/search?q=' + q;

    showSheet('detail');
  }

  function toggleRow(rowId, spanId, value) {
    const row = document.getElementById(rowId);
    if (value) {
      document.getElementById(spanId).textContent = value;
      row.classList.remove('hidden');
    } else row.classList.add('hidden');
  }

  // ---------- Formular (Neu / Bearbeiten) ----------

  function openEdit(id) {
    currentEditId = id;
    const b = id ? books.find(x => x.id === id) : null;
    document.getElementById('editHeading').textContent = b ? 'Buch bearbeiten' : 'Neues Buch';

    const set = (elId, val) => { document.getElementById(elId).value = val || ''; };
    set('f-titel', b?.titel);
    set('f-autor', b?.autor);
    set('f-verlag', b?.verlag);
    set('f-jahr', b?.jahr);
    set('f-seiten', b?.seiten);
    set('f-isbn', b?.isbn);
    set('f-reihe', b?.reihe);
    set('f-notizen', b?.notizen);
    if (b?.sprache) set('f-sprache', b.sprache);
    if (b?.ausgabe) set('f-ausgabe', b.ausgabe);
    if (b?.zustand) set('f-zustand', b.zustand);
    if (b?.genre) set('f-genre', b.genre);

    document.querySelector(`input[name="f-gelesen"][value="${b?.gelesen === 'Ja' ? 'Ja' : 'Nein'}"]`).checked = true;
    document.querySelector(`input[name="f-erst"][value="${b?.erstausgabe === 'Ja' ? 'Ja' : 'Nein'}"]`).checked = true;

    pickedCoverData = b?.coverData || null;
    pickedCoverUrl = b?.coverUrl || null;
    updateCoverPreview();
    document.getElementById('fetchStatus').textContent = '';
    document.getElementById('coverFile').value = '';

    showSheet('edit');
  }

  function updateCoverPreview() {
    const img = document.getElementById('coverPreview');
    const src = pickedCoverData || pickedCoverUrl;
    if (src) { img.src = src; img.style.visibility = 'visible'; }
    else { img.removeAttribute('src'); img.style.visibility = 'hidden'; }
  }

  function readFormBook() {
    const val = elId => document.getElementById(elId).value.trim();
    const radio = name => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || 'Nein';
    return {
      titel: val('f-titel'),
      autor: val('f-autor'),
      verlag: val('f-verlag'),
      jahr: val('f-jahr'),
      seiten: val('f-seiten'),
      isbn: val('f-isbn'),
      reihe: val('f-reihe'),
      notizen: val('f-notizen'),
      sprache: val('f-sprache'),
      ausgabe: val('f-ausgabe'),
      zustand: val('f-zustand'),
      genre: val('f-genre'),
      gelesen: radio('f-gelesen'),
      erstausgabe: radio('f-erst'),
      coverData: pickedCoverData,
      coverUrl: pickedCoverUrl,
    };
  }

  function submitForm(e) {
    e.preventDefault();
    const data = readFormBook();
    if (!data.titel) { toast('Bitte einen Titel eingeben.'); return; }

    if (currentEditId) {
      const idx = books.findIndex(x => x.id === currentEditId);
      if (idx >= 0) books[idx] = { ...books[idx], ...data };
    } else {
      books.push({ id: uid(), ...data });
    }
    saveBooks();
    closeSheet('edit');
    render();
    toast('Gespeichert.');
  }

  function deleteCurrent() {
    if (!currentDetailId) return;
    const b = books.find(x => x.id === currentDetailId);
    if (!b) return;
    if (!confirm(`„${b.titel}“ wirklich löschen?`)) return;
    books = books.filter(x => x.id !== currentDetailId);
    saveBooks();
    closeSheet('detail');
    render();
    toast('Gelöscht.');
  }

  // ---------- Cover: Datei-Upload (verkleinert & eingebettet) ----------

  function handleCoverFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxW = 500;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        pickedCoverData = canvas.toDataURL('image/jpeg', 0.82);
        pickedCoverUrl = null;
        updateCoverPreview();
      };
      img.onerror = () => toast('Bild konnte nicht gelesen werden.');
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ---------- Metadaten & Cover aus dem Netz (Google Books) ----------

  async function fetchFromNetwork() {
    const titel = document.getElementById('f-titel').value.trim();
    const autor = document.getElementById('f-autor').value.trim();
    const status = document.getElementById('fetchStatus');
    if (!titel) { toast('Bitte zuerst einen Titel eingeben.'); return; }

    const btn = document.getElementById('fetchBtn');
    btn.disabled = true;
    status.textContent = 'Lade …';
    try {
      let q = 'intitle:' + titel;
      if (autor) q += '+inauthor:' + autor;
      const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(q) + '&maxResults=1';
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const item = data.items && data.items[0];
      if (!item) { status.textContent = 'Kein Treffer bei Google Books gefunden.'; return; }
      const info = item.volumeInfo || {};

      if (info.publisher) document.getElementById('f-verlag').value = info.publisher;
      if (info.publishedDate) document.getElementById('f-jahr').value = info.publishedDate.slice(0, 4);
      if (info.authors && info.authors.length) document.getElementById('f-autor').value = info.authors.join(' / ');
      if (info.pageCount) document.getElementById('f-seiten').value = info.pageCount;
      const ident = (info.industryIdentifiers || []);
      const isbn13 = ident.find(i => i.type === 'ISBN_13');
      const isbn10 = ident.find(i => i.type === 'ISBN_10');
      if (isbn13 || isbn10) document.getElementById('f-isbn').value = (isbn13 || isbn10).identifier;

      const img = info.imageLinks;
      if (img) {
        const src = (img.thumbnail || img.smallThumbnail || '').replace('http://', 'https://');
        if (src) {
          pickedCoverUrl = src;
          pickedCoverData = null;
          updateCoverPreview();
        }
      }
      status.textContent = 'Daten übernommen.';
    } catch (err) {
      status.textContent = 'Abruf fehlgeschlagen: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- Export / Import ----------

  function exportData() {
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `buecher-export-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error('Ungültiges Format.');
        const existingIds = new Set(books.map(b => b.id));
        let added = 0;
        for (const raw of imported) {
          if (!raw || !raw.titel) continue;
          const b = { ...raw };
          if (!b.id || existingIds.has(b.id)) b.id = uid();
          existingIds.add(b.id);
          books.push(b);
          added++;
        }
        saveBooks();
        render();
        toast(`${added} Buch/Bücher importiert.`);
      } catch (e) {
        toast('Import fehlgeschlagen: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  // ---------- Sheets (Modals) ----------

  function showSheet(name) {
    document.getElementById(name + 'Sheet').classList.remove('hidden');
  }
  function closeSheet(name) {
    document.getElementById(name + 'Sheet').classList.add('hidden');
  }

  // ---------- Init ----------

  function init() {
    loadBooks();
    render();

    document.getElementById('searchInput').addEventListener('input', render);
    document.getElementById('filterSelect').addEventListener('change', render);
    document.getElementById('sortSelect').addEventListener('change', render);

    document.getElementById('viewToggleBtn').addEventListener('click', () => {
      const isListView = localStorage.getItem(VIEW_KEY) === 'list';
      localStorage.setItem(VIEW_KEY, isListView ? 'shelf' : 'list');
      render();
    });

    document.getElementById('addBtn').addEventListener('click', () => openEdit(null));
    document.getElementById('settingsBtn').addEventListener('click', () => showSheet('settings'));

    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => closeSheet(el.dataset.close));
    });

    document.getElementById('detailEditBtn').addEventListener('click', () => {
      const id = currentDetailId;
      closeSheet('detail');
      openEdit(id);
    });
    document.getElementById('detailDeleteBtn').addEventListener('click', deleteCurrent);

    document.getElementById('bookForm').addEventListener('submit', submitForm);
    document.getElementById('coverFile').addEventListener('change', e => handleCoverFile(e.target.files[0]));
    document.getElementById('fetchBtn').addEventListener('click', fetchFromNetwork);

    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importFile').addEventListener('change', e => importData(e.target.files[0]));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
