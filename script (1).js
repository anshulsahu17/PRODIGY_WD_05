const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");
const locationButton = document.getElementById("location-btn");
const notice = document.getElementById("notice");
const currentSection = document.getElementById("current-weather");
const detailsSection = document.getElementById("details-section");
const forecastSection = document.getElementById("forecast-section");
const celsiusButton = document.getElementById("celsius-btn");
const fahrenheitButton = document.getElementById("fahrenheit-btn");

let currentWeatherData = null;
let currentForecastData = null;
let currentPlace = null;
let unit = "C";

const weatherCodes = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"], 45: ["Fog", "🌫️"], 48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Dense drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"],
  61: ["Slight rain", "🌦️"], 63: ["Moderate rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Freezing rain", "🌧️"],
  71: ["Slight snow", "🌨️"], 73: ["Moderate snow", "🌨️"], 75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"], 80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"],
  82: ["Violent rain showers", "⛈️"], 85: ["Snow showers", "🌨️"], 86: ["Heavy snow showers", "❄️"],
   95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
};

function weatherInfo(code) {
  return weatherCodes[code] || ["Weather conditions", "🌤️"];
}
function cToF(value) { return (value * 9 / 5) + 32; }
function formatTemp(value, sourceUnit = "C") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "--°";
  const converted = unit === "F" && sourceUnit === "C" ? cToF(Number(value)) : Number(value);
  return `${Math.round(converted)}°`;
}
function setNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  notice.hidden = false;
}
function setLoading(loading) {
  searchForm.classList.toggle("loading", loading);
  searchButton.disabled = loading;
  cityInput.disabled = loading;
}
function setUnit(nextUnit) {
  unit = nextUnit;
  celsiusButton.classList.toggle("active", unit === "C");
  fahrenheitButton.classList.toggle("active", unit === "F");
  celsiusButton.setAttribute("aria-pressed", String(unit === "C"));
  fahrenheitButton.setAttribute("aria-pressed", String(unit === "F"));
  if (currentWeatherData && currentForecastData) renderWeather(currentWeatherData, currentForecastData, currentPlace);
}

async function findCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not search for that city. Please try again.");
  const data = await response.json();
  if (!data.results || data.results.length === 0) throw new Error("City not found. Check the spelling and try again.");
  return data.results[0];
}

async function getWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max",
    timezone: "auto",
    forecast_days: "5"
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error("Weather data is temporarily unavailable. Please try again.");
  return response.json();
}

function formatLocalTime(isoTime, timezone) {
  try {
    return new Intl.DateTimeFormat("en", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(isoTime));
  } catch {
    return isoTime.replace("T", " ");
  }
}
function directionFromDegrees(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}
function uvDescription(value) {
  if (value < 3) return "Low";
  if (value < 6) return "Moderate";
  if (value < 8) return "High";
  if (value < 11) return "Very high";
  return "Extreme";
}
function renderWeather(weather, place, forecastPlace) {}

function renderWeather(data, forecast, place) {
  currentWeatherData = data;
  currentForecastData = forecast;
  currentPlace = place;
  const current = data.current;
  const daily = forecast.daily;
  const [description, icon] = weatherInfo(current.weather_code);

  document.getElementById("city-name").textContent = [place.name, place.admin1, place.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");
  document.getElementById("local-time").textContent = formatLocalTime(current.time, data.timezone);
  document.getElementById("current-icon").textContent = icon;
  document.getElementById("current-temp").textContent = Math.round(unit === "F" ? cToF(current.temperature_2m) : current.temperature_2m);
  document.getElementById("current-unit").textContent = unit === "C" ? "°C" : "°F";
  document.getElementById("condition-text").textContent = description;
  document.getElementById("feels-like").textContent = formatTemp(current.apparent_temperature);
  document.getElementById("today-high").textContent = formatTemp(daily.temperature_2m_max[0]);
  document.getElementById("today-low").textContent = formatTemp(daily.temperature_2m_min[0]);
  document.getElementById("humidity").innerHTML = `${Math.round(current.relative_humidity_2m)}<small>%</small>`;
  document.getElementById("wind").innerHTML = `${Math.round(current.wind_speed_10m)}<small> km/h</small>`;
  document.getElementById("wind-direction").textContent = `Direction ${directionFromDegrees(current.wind_direction_10m)}`;
  document.getElementById("detail-feels").textContent = formatTemp(current.apparent_temperature);
  const uv = daily.uv_index_max[0];
  document.getElementById("uv-index").textContent = Number(uv).toFixed(1);
  document.getElementById("uv-label").textContent = `Peak today · ${uvDescription(uv)}`;
  document.getElementById("updated-at").textContent = `LOCAL TIME · ${current.time.slice(11, 16)}`;

  const forecastList = document.getElementById("forecast-list");
  forecastList.replaceChildren();
  daily.time.forEach((date, index) => {
    const [dayDescription, dayIcon] = weatherInfo(daily.weather_code[index]);
    const day = new Date(`${date}T12:00:00`);
    const dayName = index === 0 ? "Today" : new Intl.DateTimeFormat("en", { weekday: "short", timeZone: data.timezone }).format(day);
    const card = document.createElement("article");
    card.className = "forecast-day";
    card.innerHTML = `<div class="day-name"></div><span class="day-icon" aria-hidden="true"></span><div class="day-condition"></div><div class="forecast-temps"><span class="high"></span><span class="low"></span></div>`;
    card.querySelector(".day-name").textContent = dayName;
    card.querySelector(".day-icon").textContent = dayIcon;
    card.querySelector(".day-condition").textContent = dayDescription;
    card.querySelector(".high").textContent = formatTemp(daily.temperature_2m_max[index]);
    card.querySelector(".low").textContent = formatTemp(daily.temperature_2m_min[index]);
    forecastList.appendChild(card);
  });

  currentSection.hidden = false;
  detailsSection.hidden = false;
  forecastSection.hidden = false;
  setNotice("Weather updated successfully.");
}

async function loadPlace(place) {
  setLoading(true);
  setNotice("Loading weather data…");
  try {
    const weather = await getWeather(place);
    renderWeather(weather, weather, place);
  } catch (error) {
    setNotice(error.message || "Something went wrong. Please try again.", true);
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setNotice("Enter a city name to search.", true);
    return;
  }
  setLoading(true);
  setNotice(`Searching for ${city}…`);
  try {
    const place = await findCity(city);
    const weather = await getWeather(place);
    renderWeather(weather, weather, place);
  } catch (error) {
    setNotice(error.message || "Something went wrong. Please try again.", true);
  } finally {
    setLoading(false);
  }
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setNotice("Geolocation is not supported by this browser. Search for a city instead.", true);
    return;
  }
  locationButton.disabled = true;
  setNotice("Getting your location…");
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    const place = { name: "Your location", latitude, longitude };
    await loadPlace(place);
    locationButton.disabled = false;
  }, () => {
    setNotice("Location access was unavailable. Allow location permission or search for a city.", true);
    locationButton.disabled = false;
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
});

celsiusButton.addEventListener("click", () => setUnit("C"));
fahrenheitButton.addEventListener("click", () => setUnit("F"));
