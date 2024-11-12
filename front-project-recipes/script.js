const API_KEY = '74b38985b4704b5ba2438c3dc8d2ffd8';

const recipeSearch = document.getElementById('recipe-search');

const modalContent = document.getElementById('modal-content');
const closeModal = document.getElementById('close-modal');
const favoritesBtn = document.getElementById('favorites-btn');

const recipesContainer = document.getElementById('recipes-container');
const modal = document.getElementById('modal');

const searchBtn = document.getElementById('search-btn');
const suggestionsList = document.getElementById('suggestions-list');

let debounceTimer;

recipeSearch.addEventListener('input', onRecipeSearchInput);
searchBtn.addEventListener('click', () => searchRecipes(recipeSearch.value.trim()));
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', (event) => {
    if (event.target === modal) modal.classList.add('hidden');
});
favoritesBtn.addEventListener('click', displayFavoriteRecipes);

function onRecipeSearchInput(e) {
    const query = e.target.value.trim();
    if (debounceTimer) clearTimeout(debounceTimer);
    if (query.length === 0) {
        suggestionsList.innerHTML = '';
        suggestionsList.classList.add('hidden');
        return;
    }
    debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
}

async function fetchSuggestions(query) {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/autocomplete?number=5&query=${encodeURIComponent(query)}&apiKey=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const suggestions = await response.json();
        displaySuggestions(suggestions);
    } catch (error) {
        suggestionsList.innerHTML = '<p class="p-2 text-red-500">Error fetching suggestions.</p>';
        suggestionsList.classList.remove('hidden');
    }
}

function displaySuggestions(suggestions) {
    if (suggestions.length === 0) {
        suggestionsList.innerHTML = '';
        suggestionsList.classList.add('hidden');
        return;
    }
    suggestionsList.innerHTML = '';
    suggestions.forEach(item => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'p-3 hover:bg-gray-100 cursor-pointer border-b last:border-none';
        suggestionItem.textContent = item.title;
        suggestionItem.addEventListener('click', () => {
            recipeSearch.value = item.title;
            suggestionsList.innerHTML = '';
            suggestionsList.classList.add('hidden');
            searchRecipes(item.title);
        });
        suggestionsList.appendChild(suggestionItem);
    });
    suggestionsList.classList.remove('hidden');
}

async function searchRecipes(query) {
    try {
        if (!query) return;
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=12&apiKey=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to search recipes');
        const data = await response.json();
        displayRecipes(data.results);
    } catch (error) {
        recipesContainer.innerHTML = '<p class="text-red-500">Error fetching recipes.</p>';
    }
}

function displayRecipes(recipes) {
    recipesContainer.innerHTML = '';
    if (recipes.length === 0) {
        recipesContainer.innerHTML = '<p class="text-center text-gray-700">No recipes found.</p>';
        return;
    }
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden';

        const imageUrl = recipe.image || `https://spoonacular.com/recipeImages/${recipe.id}-312x231.jpg`;

        recipeCard.innerHTML = `
            <img src="${imageUrl}" alt="${sanitizeHTML(recipe.title)}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-semibold text-lg text-gray-800 mb-2">${sanitizeHTML(recipe.title)}</h3>
                <p class="text-gray-600 mb-4">Ready in ${sanitizeHTML(recipe.readyInMinutes)} minutes</p>
                <div class="flex justify-between items-center">
                    <button data-id="${recipe.id}" class="view-details-btn bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition duration-300">Details</button>
                    <button data-id="${recipe.id}" class="favorite-btn text-indigo-500 hover:text-indigo-700"><i class="fas fa-heart"></i></button>
                </div>
            </div>
        `;
        recipesContainer.appendChild(recipeCard);
    });

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', () => {
            const recipeId = button.dataset.id;
            fetchRecipeDetails(recipeId);
        });
    });

    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', () => {
            const recipeId = button.dataset.id;
            addRecipeToFavorites(recipeId);
        });
    });
}

async function fetchRecipeDetails(id) {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch recipe details');
        const recipe = await response.json();
        displayRecipeDetails(recipe);
    } catch (error) {
        modalContent.innerHTML = '<p class="text-red-500">Error loading recipe details.</p>';
        modal.classList.remove('hidden');
    }
}

function displayRecipeDetails(recipe) {
    const ingredientsList = recipe.extendedIngredients.map(ing => `<li>${sanitizeHTML(ing.original)}</li>`).join('');
    const instructions = recipe.instructions || 'No instructions available.';
    const nutritionInfo = recipe.nutrition?.nutrients
        ? recipe.nutrition.nutrients.slice(0, 4).map(nutrient => `<li>${sanitizeHTML(nutrient.title)}: ${sanitizeHTML(nutrient.amount)}${sanitizeHTML(nutrient.unit)}</li>`).join('')
        : 'No nutrition information available.';

    modalContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">${sanitizeHTML(recipe.title)}</h2>
        <img src="${sanitizeHTML(recipe.image)}" alt="${sanitizeHTML(recipe.title)}" class="w-full h-64 object-cover mb-4 rounded-lg">
        <h3 class="text-xl font-semibold mb-2 text-gray-800">Ingredients</h3>
        <ul class="list-disc list-inside mb-4">${ingredientsList}</ul>
        <h3 class="text-xl font-semibold mb-2 text-gray-800">Instructions</h3>
        <div class="mb-4">${instructions}</div>
        <h3 class="text-xl font-semibold mb-2 text-gray-800">Nutrition</h3>
        <ul class="list-disc list-inside">${nutritionInfo}</ul>
    `;
    modal.classList.remove('hidden');
}

function addRecipeToFavorites(recipeId) {
    let favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
    if (!favorites.includes(recipeId)) {
        favorites.push(recipeId);
        localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
        alert('Recipe added to favorites!');
    } else {
        alert('Recipe is already in favorites.');
    }
}

function displayFavoriteRecipes() {
    let favorites = JSON.parse(localStorage.getItem('favoriteRecipes')) || [];
    if (favorites.length === 0) {
        alert('No favorite recipes found.');
        return;
    }
    fetchFavoriteRecipes(favorites);
}

async function fetchFavoriteRecipes(favoriteIds) {
    try {
        const requests = favoriteIds.map(id => fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`).then(res => res.json()));
        const recipes = await Promise.all(requests);
        displayRecipes(recipes);
    } catch (error) {
        recipesContainer.innerHTML = '<p class="text-red-500">Error loading favorite recipes.</p>';
    }
}

function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'`=\/]/g, function(char) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        })[char];
    });
}
