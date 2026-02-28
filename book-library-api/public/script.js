document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const authModalBackdrop = document.getElementById('auth-modal-backdrop');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const navbar = document.getElementById('navbar');
  const mainContent = document.getElementById('main-content');
  const usernameDisplay = document.getElementById('username-display');
  const addBookBtn = document.getElementById('add-book-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const genreFilter = document.getElementById('genre-filter');
  const ratingFilter = document.getElementById('rating-filter');
  const filterBtn = document.getElementById('filter-btn');
  const bookGrid = document.getElementById('book-grid');
  const pagination = document.getElementById('pagination');
  const addBookModalBackdrop = document.getElementById('add-book-modal-backdrop');
  const addBookForm = document.getElementById('add-book-form');
  const cancelAddBookBtn = document.getElementById('cancel-add-book-btn');
  const tabLinks = document.querySelectorAll('.tab-link');

  const API_URL = '';

  // --- Authentication ---
  const getToken = () => localStorage.getItem('token');
  const setToken = (token) => localStorage.setItem('token', token);
  const removeToken = () => localStorage.removeItem('token');

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const updateUI = () => {
    const token = getToken();
    if (token) {
      const decodedToken = parseJwt(token);
      if (decodedToken) {
        authModalBackdrop.style.display = 'none';
        navbar.style.display = 'block';
        mainContent.style.display = 'block';
        usernameDisplay.textContent = `Welcome, ${decodedToken.user.username}`;

        if (decodedToken.user.role === 'admin') {
          addBookBtn.style.display = 'inline-block';
        } else {
          addBookBtn.style.display = 'none';
        }
      } else {
        removeToken();
        showAuthModal();
      }
    } else {
      showAuthModal();
    }
  };

  const showAuthModal = () => {
    authModalBackdrop.style.display = 'flex';
    navbar.style.display = 'none';
    mainContent.style.display = 'none';
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        updateUI();
        fetchBooks();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error logging in:', err);
    }
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        updateUI();
        fetchBooks();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error signing up:', err);
    }
  });

  logoutBtn.addEventListener('click', () => {
    removeToken();
    updateUI();
  });

  // --- Book Management ---
  const fetchBooks = async (page = 1, genre = '', rating = '', search = '') => {
    let url = `${API_URL}/books?page=${page}&limit=10`;
    if (genre) url += `&genre=${genre}`;
    if (rating) url += `&rating=${rating}`;
    if (search) url += `&search=${search}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      renderBooks(data.books);
      renderPagination(data.totalPages, data.currentPage, genre, rating, search);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  const renderBooks = (books) => {
    bookGrid.innerHTML = '';
    if (books && books.length > 0) {
      books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
          <h3>${book.title}</h3>
          <p class="author">by ${book.author}</p>
          <span class="genre">${book.genre}</span>
          <div class="rating">
            ${'★'.repeat(Math.floor(book.rating || 0))}${'☆'.repeat(5 - Math.floor(book.rating || 0))}
          </div>
        `;
        bookGrid.appendChild(bookCard);
      });
    } else {
      bookGrid.innerHTML = '<p>No books found.</p>';
    }
  };

  const renderPagination = (totalPages, currentPage, genre, rating, search) => {
    pagination.innerHTML = '';
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        if (i === parseInt(currentPage)) {
          button.disabled = true;
        }
        button.addEventListener('click', () => fetchBooks(i, genre, rating, search));
        pagination.appendChild(button);
      }
    }
  };

  addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const genre = document.getElementById('genre').value;
    const rating = document.getElementById('rating').value;
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ title, author, genre, rating }),
      });

      if (res.ok) {
        addBookModalBackdrop.style.display = 'none';
        addBookForm.reset();
        fetchBooks();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error adding book:', err);
    }
  });

  // --- Event Listeners ---
  filterBtn.addEventListener('click', () => {
    const genre = genreFilter.value;
    const rating = ratingFilter.value;
    fetchBooks(1, genre, rating, searchInput.value);
  });

  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value;
    fetchBooks(1, genreFilter.value, ratingFilter.value, searchTerm);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });

  addBookBtn.addEventListener('click', () => {
    addBookModalBackdrop.style.display = 'flex';
  });

  cancelAddBookBtn.addEventListener('click', () => {
    addBookModalBackdrop.style.display = 'none';
  });

  tabLinks.forEach(tab => {
    tab.addEventListener('click', () => {
      tabLinks.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // --- Initial Load ---
  updateUI();
  if (getToken()) {
    fetchBooks();
  }
});
