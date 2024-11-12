const apiKey = '4e45da9d36ce26faf0eeebfcc88f1624';
const apiBase = 'https://api.themoviedb.org/3';
const imageBase = 'https://image.tmdb.org/t/p/w500';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const movieGrid = document.getElementById('movie-grid');
const suggestions = document.getElementById('suggestions');
const sortSelect = document.getElementById('sort-select');
const movieModal = document.getElementById('movie-modal');
const watchlistContent = document.getElementById('watchlist-content');
const watchlistModal = document.getElementById('watchlist-modal');
const closeWatchlist = document.getElementById('close-watchlist');
const modalContent = document.getElementById('modal-content');
const closeModal = document.getElementById('close-modal');
const watchlistBtn = document.getElementById('watchlist-btn');
let currentMovies = [];
let isSearchMode = false;

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function searchMovies(query) {
    try {
        const response = await fetch(`${apiBase}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching search results:', error);
        return [];
    }
}

function displaySuggestions(movies) {
    if (movies.length === 0) {
        suggestions.classList.add('hidden');
        suggestions.innerHTML = '';
        return;
    }
    suggestions.innerHTML = movies.map(movie => `
        <div class="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-none" data-id="${movie.id}">${movie.title}</div>
    `).join('');
    suggestions.classList.remove('hidden');
}

const handleSearch = debounce(async () => {
    const query = searchInput.value.trim();
    if (query.length < 3) {
        suggestions.classList.add('hidden');
        suggestions.innerHTML = '';
        if (!isSearchMode) {
            fetchPopularMovies();
        }
        return;
    }

    const results = await searchMovies(query);
    displaySuggestions(results);
    displayMovies(results);
    currentMovies = results;
    isSearchMode = true;
}, 300);

searchInput.addEventListener('input', handleSearch);

searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (query.length < 3) {
        alert('Please enter at least 3 characters to search.');
        return;
    }
    suggestions.classList.add('hidden');
    suggestions.innerHTML = '';
    const results = await searchMovies(query);
    displayMovies(results);
    currentMovies = results; 
    isSearchMode = true;
});

suggestions.addEventListener('click', async (e) => {
    if (e.target.tagName === 'DIV') {
        const movieId = e.target.dataset.id;
        searchInput.value = e.target.textContent;
        suggestions.classList.add('hidden');
        suggestions.innerHTML = '';
        const movie = await getMovieDetails(movieId);
        displayMovies([movie]);
        currentMovies = [movie];
        isSearchMode = true;
    }
});

async function fetchPopularMovies(sortBy = 'popularity.desc') {
    try {
        const response = await fetch(`${apiBase}/discover/movie?api_key=${apiKey}&sort_by=${sortBy}`);
        const data = await response.json();
        displayMovies(data.results);
        currentMovies = data.results;
        isSearchMode = false;
    } catch (error) {
        console.error('Error fetching popular movies:', error);
    }
}

function displayMovies(movies) {
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<p class="text-center text-gray-700">No movies found.</p>';
        return;
    }
    movieGrid.innerHTML = movies.map(movie => `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer" data-id="${movie.id}">
            <img src="${movie.poster_path ? imageBase + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${movie.title}" class="w-full h-80 object-cover">
            <div class="p-4">
                <h3 class="font-semibold text-lg text-gray-800 mb-2">${movie.title}</h3>
                <p class="text-gray-600">Released: ${movie.release_date || 'N/A'}</p>
            </div>
        </div>
    `).join('');
}

movieGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.bg-white');
    if (!card) return;
    const movieId = card.dataset.id;
    const movie = await getMovieDetails(movieId);
    displayMovieDetails(movie);
});

async function getMovieDetails(id) {
    try {
        const response = await fetch(`${apiBase}/movie/${id}?api_key=${apiKey}&append_to_response=credits,videos,reviews`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}

function displayMovieDetails(movie) {
    if (!movie) return;
    const { title, overview, vote_average, runtime, credits, videos, reviews } = movie;
    const cast = credits.cast.slice(0, 5).map(member => member.name).join(', ');
    const directors = credits.crew.filter(member => member.job === 'Director').map(member => member.name).join(', ');
    const trailer = videos.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');

    let reviewsHTML = '';
    if (reviews && reviews.results.length > 0) {
        reviewsHTML = reviews.results.slice(0, 3).map(review => `
            <div class="mb-4">
                <p class="font-semibold">${sanitizeHTML(review.author)}</p>
                <p>${sanitizeHTML(review.content)}</p>
            </div>
        `).join('');
    } else {
        reviewsHTML = '<p class="text-gray-600">No reviews available.</p>';
    }

    let trailerHTML = '';
    if (trailer) {
        trailerHTML = `
            <div class="mb-4">
                <h3 class="text-xl font-semibold mb-2">Trailer</h3>
                <iframe class="w-full h-64" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    }

    modalContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">${sanitizeHTML(title)}</h2>
        <div class="flex flex-col md:flex-row">
            <img src="${movie.poster_path ? imageBase + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${sanitizeHTML(title)}" class="w-full md:w-1/3 rounded">
            <div class="md:ml-6 mt-4 md:mt-0">
                <p class="mb-2"><strong>Synopsis:</strong> ${sanitizeHTML(overview) || 'N/A'}</p>
                <p class="mb-2"><strong>Rating:</strong> ${vote_average || 'N/A'}</p>
                <p class="mb-2"><strong>Runtime:</strong> ${runtime ? `${runtime} minutes` : 'N/A'}</p>
                <p class="mb-2"><strong>Cast:</strong> ${sanitizeHTML(cast) || 'N/A'}</p>
                <p class="mb-4"><strong>Director(s):</strong> ${sanitizeHTML(directors) || 'N/A'}</p>
                ${trailerHTML}
                <h3 class="text-xl font-semibold mb-2">User Reviews</h3>
                <div>${reviewsHTML}</div>
                <button id="add-to-watchlist" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">Add to Watchlist</button>
            </div>
        </div>
    `;
    movieModal.classList.remove('hidden');

    document.getElementById('add-to-watchlist').addEventListener('click', () => {
        addToWatchlist({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date
        });
    });
}

closeModal.addEventListener('click', () => {
    movieModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        movieModal.classList.add('hidden');
    }
});

watchlistBtn.addEventListener('click', () => {
    loadWatchlist();
});

closeWatchlist.addEventListener('click', () => {
    watchlistModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === watchlistModal) {
        watchlistModal.classList.add('hidden');
    }
});

sortSelect.addEventListener('change', async () => {
    const sortBy = sortSelect.value;
    if (isSearchMode) {
        sortCurrentMovies(sortBy);
    } else {
        fetchPopularMovies(sortBy);
    }
});

function sortCurrentMovies(sortBy) {
    let sortedMovies = [...currentMovies];
    switch(sortBy) {
        case 'popularity.desc':
            sortedMovies.sort((a, b) => b.popularity - a.popularity);
            break;
        case 'release_date.desc':
            sortedMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
            break;
        case 'vote_average.desc':
            sortedMovies.sort((a, b) => b.vote_average - a.vote_average);
            break;
        default:
            break;
    }
    displayMovies(sortedMovies);
    currentMovies = sortedMovies;
}


function addToWatchlist(movie) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    if (watchlist.find(item => item.id === movie.id)) {
        alert('Movie is already in your watchlist!');
        return;
    }
    watchlist.push(movie);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    alert('Movie added to watchlist!');
}

function loadWatchlist() {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    if (watchlist.length === 0) {
        watchlistContent.innerHTML = '<p class="text-gray-600">Your watchlist is empty.</p>';
        watchlistModal.classList.remove('hidden');
        return;
    }
    watchlistContent.innerHTML = watchlist.map(movie => `
        <div class="flex items-center mb-4">
            <img src="${movie.poster_path ? imageBase + movie.poster_path : 'https://via.placeholder.com/100x150?text=No+Image'}" alt="${sanitizeHTML(movie.title)}" class="w-20 h-30 object-cover rounded">
            <div class="ml-4 flex-1">
                <h3 class="font-semibold text-lg text-gray-800">${sanitizeHTML(movie.title)}</h3>
                <p class="text-gray-600">Released: ${movie.release_date || 'N/A'}</p>
            </div>
            <button data-id="${movie.id}" class="remove-watchlist bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-300">Remove</button>
        </div>
    `).join('');
    watchlistModal.classList.remove('hidden');

    document.querySelectorAll('.remove-watchlist').forEach(button => {
        button.addEventListener('click', () => {
            const movieId = button.dataset.id;
            removeFromWatchlist(movieId);
        });
    });
}

function removeFromWatchlist(id) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    watchlist = watchlist.filter(movie => movie.id != id);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    loadWatchlist();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchPopularMovies();
});

function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'=\/]/g, function(char) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        })[char] || char;
    });
}
