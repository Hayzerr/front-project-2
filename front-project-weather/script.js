const apiKey = '3f128a40bf461fcf9c936b8a737200ca';

var searchInput = document.getElementById('search');
var descElem = document.getElementById('description');
var humidityElem = document.getElementById('humidity');
var tempElem = document.getElementById('temperature');
var unitElem = document.getElementById('unit');
var suggestionsList = document.getElementById('suggestions');
var weatherSection = document.getElementById('current-weather');
var forecastSection = document.getElementById('forecast');
var cityElem = document.getElementById('city-name');
var windElem = document.getElementById('wind-speed');
var locationButton = document.getElementById('current-location');
var celsiusButton = document.getElementById('celsius');
var fahrenheitButton = document.getElementById('fahrenheit');
var iconElem = document.getElementById('weather-icon');
var hourlyForecast = document.getElementById('hourly-forecast');
var forecastContainer = document.getElementById('forecast-container');

let unit = 'metric';

const updateDate = () => {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  document.getElementById('date').textContent = new Date().toLocaleDateString(undefined, options);
};

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

const fetchSuggestions = async (query) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const cities = await response.json();
    if (Array.isArray(cities)) displaySuggestions(cities);
  } catch (error) {
    console.error('Error fetching suggestions:', error.message);
  }
};

const displaySuggestions = (cities) => {
  suggestionsList.innerHTML = '';
  if (cities.length === 0) {
    suggestionsList.classList.add('hidden');
    return;
  }
  cities.forEach(city => {
    const item = document.createElement('li');
    item.classList.add('p-2', 'hover:bg-gray-200', 'cursor-pointer');
    item.textContent = `${city.name}, ${city.country}`;
    item.addEventListener('click', () => selectCity(city));
    suggestionsList.appendChild(item);
  });
  suggestionsList.classList.remove('hidden');
};

const selectCity = (city) => {
  searchInput.value = `${city.name}, ${city.country}`;
  suggestionsList.classList.add('hidden');
  fetchWeather(city.lat, city.lon);
};

const fetchWeather = async (lat, lon) => {
  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) throw new Error(`Error: ${weatherResponse.status}`);
    const weatherData = await weatherResponse.json();
    displayCurrentWeather(weatherData);

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error(`Error: ${forecastResponse.status}`);
    const forecastData = await forecastResponse.json();
    displayForecast(forecastData);
  } catch (error) {
    console.error('Error fetching weather:', error.message);
  }
};

const displayCurrentWeather = (data) => {
  cityElem.textContent = `${data.name}, ${data.sys.country}`;
  tempElem.textContent = `${Math.round(data.main.temp)}°`;
  unitElem.textContent = unit === 'metric' ? 'C' : 'F';
  descElem.textContent = data.weather[0].description;
  humidityElem.textContent = `${data.main.humidity}%`;
  windElem.textContent = `${data.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}`;
  iconElem.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  iconElem.alt = data.weather[0].description;
  weatherSection.classList.remove('hidden');
};

const displayForecast = (data) => {
  hourlyForecast.innerHTML = '';
  forecastContainer.innerHTML = '';

  data.list.slice(0, 8).forEach(item => {
    const date = new Date(item.dt * 1000);
    const hour = date.getHours();
    const period = hour;

    const hourlyDiv = document.createElement('div');
    hourlyDiv.classList.add('flex', 'flex-col', 'items-center', 'bg-blue-100', 'rounded-lg', 'p-2', 'w-20');
    hourlyDiv.innerHTML = `
      <p class="text-sm">${period}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}" class="w-8 h-8">
      <p class="text-lg font-semibold">${Math.round(item.main.temp)}°</p>
    `;
    hourlyForecast.appendChild(hourlyDiv);
  });

  const dailyData = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString(undefined, { weekday: 'short' });
    if (!dailyData[day]) {
      dailyData[day] = {
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        icon: item.weather[0].icon,
      };
    } else {
      dailyData[day].temp_min = Math.min(dailyData[day].temp_min, item.main.temp_min);
      dailyData[day].temp_max = Math.max(dailyData[day].temp_max, item.main.temp_max);
    }
  });

  Object.keys(dailyData).slice(0, 5).forEach(day => {
    const forecastDiv = document.createElement('div');
    forecastDiv.classList.add('flex', 'flex-col', 'items-center', 'bg-blue-100', 'rounded-lg', 'p-4');
    forecastDiv.innerHTML = `
      <p class="text-sm font-semibold">${day}</p>
      <img src="https://openweathermap.org/img/wn/${dailyData[day].icon}@2x.png" alt="${day}" class="w-8 h-8">
      <p class="text-sm">Max: ${Math.round(dailyData[day].temp_max)}°</p>
      <p class="text-sm">Min: ${Math.round(dailyData[day].temp_min)}°</p>
    `;
    forecastContainer.appendChild(forecastDiv);
  });

  forecastSection.classList.remove('hidden');
};

searchInput.addEventListener('input', debounce((e) => {
  const query = e.target.value.trim();
  if (query.length > 2) fetchSuggestions(query);
  else suggestionsList.classList.add('hidden');
}, 500));

document.addEventListener('click', (e) => {
  if (!suggestionsList.contains(e.target) && e.target !== searchInput) {
    suggestionsList.classList.add('hidden');
  }
});

locationButton.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      fetchWeather(position.coords.latitude, position.coords.longitude);
    });
  } else {
    alert('Geolocation not supported by your browser.');
  }
});

celsiusButton.addEventListener('click', () => {
  if (unit !== 'metric') {
    unit = 'metric';
    celsiusButton.classList.add('bg-blue-500', 'text-white');
    fahrenheitButton.classList.remove('bg-blue-500', 'text-white');
    setWeatherByCity(cityElem.textContent.split(',')[0]);
  }
});

fahrenheitButton.addEventListener('click', () => {
  if (unit !== 'imperial') {
    unit = 'imperial';
    fahrenheitButton.classList.add('bg-blue-500', 'text-white');
    celsiusButton.classList.remove('bg-blue-500', 'text-white');
    setWeatherByCity(cityElem.textContent.split(',')[0]);
  }
});

const setWeatherByCity = async (city) => {
    try {
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
      const [locationData] = await response.json();
      fetchWeather(locationData.lat, locationData.lon);
    } catch (error) {
      console.error('Error setting weather by city:', error);
    }
  };

updateDate();
setWeatherByCity('Aktobe');
