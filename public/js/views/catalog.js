import { api } from '../api.js';

export async function renderCatalog(container) {
  container.innerHTML = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Book Catalog</h1>
          <p>Manage the books available at the café</p>
        </div>
        <button class="btn-add" id="addBookBtn">+ Add Book</button>
      </header>
      <div id="catalogList"></div>
    </div>
  `;

  container.querySelector('#addBookBtn').addEventListener('click', () => openModal(null));

  let booksCache = [];

  async function load() {
    const list = container.querySelector('#catalogList');
    try {
      const { books } = await api.getCatalog();
      booksCache = books;

      if (books.length === 0) {
        list.innerHTML = `
          <div class="empty">
            <div class="empty-icon">📖</div>
            <p>No books in the catalog yet.</p>
            <button class="btn-add" id="addFirstBtn">Add your first book</button>
          </div>
        `;
        list.querySelector('#addFirstBtn').addEventListener('click', () => openModal(null));
        return;
      }

      list.innerHTML = `
        <div class="book-list">
          ${books.map(bookRow).join('')}
        </div>
      `;

      list.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const isbn = btn.dataset.edit;
          const book = booksCache.find((b) => b.isbn === isbn);
          if (book) openModal(book);
        });
      });

      list.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const isbn = btn.dataset.delete;
          const book = booksCache.find((b) => b.isbn === isbn);
          if (!book) return;
          if (!confirm(`Remove "${book.title}" from the catalog?`)) return;
          try {
            await api.deleteBook(isbn);
            await load();
          } catch (e) {
            alert('Failed to delete: ' + e.message);
          }
        });
      });
    } catch (e) {
      console.error(e);
      list.innerHTML = `<div class="empty"><p>Failed to load catalog: ${SB.escapeHtml(e.message)}</p></div>`;
    }
  }

  function bookRow(book) {
    const cover = book.coverImage
      ? `<img src="${SB.escapeHtml(book.coverImage)}" alt="" onerror="this.replaceWith(document.createTextNode('📖'))" />`
      : '📖';

    const cats = book.categories?.length
      ? `<span>· ${SB.escapeHtml(book.categories.join(', '))}</span>`
      : '';

    return `
      <div class="book-row">
        <div class="book-cover">${cover}</div>
        <div class="book-info">
          <div class="book-info-title">${SB.escapeHtml(book.title)}</div>
          <div class="book-info-author">${SB.escapeHtml(book.author)}</div>
          <div class="book-info-meta">
            <span>ISBN: ${SB.escapeHtml(book.isbn)}</span>
            ${cats}
          </div>
        </div>
        <div class="book-actions">
          <button class="icon-btn" data-edit="${SB.escapeHtml(book.isbn)}" title="Edit">✏️</button>
          <button class="icon-btn" data-delete="${SB.escapeHtml(book.isbn)}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  function openModal(book) {
    const isEditing = !!book;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <header class="modal-header">
          <h2>${isEditing ? 'Edit Book' : 'Add Book'}</h2>
          <button class="close-btn" id="closeModal">✕</button>
        </header>
        <div class="modal-body">
          <label>ISBN <span class="req">*</span>
            <input id="fIsbn" value="${SB.escapeHtml(book?.isbn || '')}" ${isEditing ? 'disabled' : ''} placeholder="e.g. 9780349437019" />
          </label>
          <label>Title <span class="req">*</span>
            <input id="fTitle" value="${SB.escapeHtml(book?.title || '')}" placeholder="Book title" />
          </label>
          <label>Author <span class="req">*</span>
            <input id="fAuthor" value="${SB.escapeHtml(book?.author || '')}" placeholder="Author name" />
          </label>
          <label>Description
            <textarea id="fDesc" rows="4" placeholder="Short summary">${SB.escapeHtml(book?.description || '')}</textarea>
          </label>
          <label>Categories (comma-separated)
            <input id="fCats" value="${SB.escapeHtml((book?.categories || []).join(', '))}" placeholder="Fantasy, Romance, YA" />
          </label>
          <label>Cover Image URL
            <input id="fCover" value="${SB.escapeHtml(book?.coverImage || '')}" placeholder="https://…" />
          </label>
        </div>
        <footer class="modal-footer">
          <button class="btn-cancel" id="cancelBtn">Cancel</button>
          <button class="btn-save" id="saveBtn">${isEditing ? 'Save Changes' : 'Add to Catalog'}</button>
        </footer>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();

    backdrop.querySelector('#closeModal').addEventListener('click', close);
    backdrop.querySelector('#cancelBtn').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    backdrop.querySelector('#saveBtn').addEventListener('click', async () => {
      const isbn = backdrop.querySelector('#fIsbn').value.trim();
      const title = backdrop.querySelector('#fTitle').value.trim();
      const author = backdrop.querySelector('#fAuthor').value.trim();
      const description = backdrop.querySelector('#fDesc').value.trim();
      const catsRaw = backdrop.querySelector('#fCats').value.trim();
      const coverImage = backdrop.querySelector('#fCover').value.trim();

      if (!isbn || !title || !author) {
        alert('ISBN, Title and Author are required.');
        return;
      }

      const payload = {
        isbn,
        title,
        author,
        description: description || 'No description available',
        coverImage,
        categories: catsRaw
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        sentimentScore: book?.sentimentScore ?? 0.5,
        sentimentLabel: book?.sentimentLabel ?? 'Neutral',
        sentimentSource: book?.sentimentSource ?? '',
        pageCount: book?.pageCount ?? 0,
        averageRating: book?.averageRating ?? 0,
        reviewExcerpt: book?.reviewExcerpt ?? '',
        reviewSource: book?.reviewSource ?? '',
        reviewUrl: book?.reviewUrl ?? '',
      };

      const saveBtn = backdrop.querySelector('#saveBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      try {
        await api.saveBook(payload);
        close();
        await load();
      } catch (e) {
        alert('Failed to save: ' + e.message);
        saveBtn.disabled = false;
        saveBtn.textContent = isEditing ? 'Save Changes' : 'Add to Catalog';
      }
    });
  }

  await load();
}