import { useEffect, useState } from "react";
import "./App.css";

const weatherDescription = {
  0: "Cerah",
  1: "Sebagian cerah",
  2: "Berawan sebagian",
  3: "Berawan",
  45: "Berkabut",
  48: "Kabut tebal",
  51: "Gerimis ringan",
  53: "Gerimis",
  55: "Gerimis lebat",
  61: "Hujan ringan",
  63: "Hujan",
  65: "Hujan lebat",
  71: "Salju ringan",
  73: "Salju",
  75: "Salju lebat",
  80: "Hujan ringan",
  81: "Hujan",
  82: "Hujan lebat",
  95: "Badai petir",
  96: "Badai petir + hujan es",
  99: "Badai petir + hujan es lebat",
};

// Menentukan ikon berdasarkan kode cuaca
const getWeatherIcon = (code) => {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌦️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 75) return "❄️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 95 && code <= 99) return "⛈️";

  return "🌤️";
};

function App() {
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // MENCARI SUGGESTION KOTA
  // ==========================================
  useEffect(() => {
    if (city.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
          )}&count=5&language=id&format=json`
        );

        if (!response.ok) {
          throw new Error("Gagal mencari kota");
        }

        const data = await response.json();

        setSuggestions(data.results || []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [city]);

  // ==========================================
  // MENGAMBIL DATA CUACA
  // ==========================================
  const getWeather = async (location) => {
    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Gagal mengambil data cuaca");
      }

      const weatherData = await weatherResponse.json();

      setWeather({
        location,
        data: weatherData,
      });
    } catch (err) {
      setWeather(null);
      setError(err.message || "Terjadi kesalahan saat mengambil data cuaca");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MENCARI CUACA BERDASARKAN NAMA KOTA
  // ==========================================
  const searchWeather = async () => {
    if (!city.trim()) {
      setError("Masukkan nama kota terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=id&format=json`
      );

      if (!response.ok) {
        throw new Error("Gagal mencari kota");
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error("Kota tidak ditemukan");
      }

      // Ambil data cuaca dari lokasi yang ditemukan
      await getWeather(data.results[0]);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Terjadi kesalahan");
    }
  };

  return (
    <div className="app">
      <div className="container">

        {/* HEADER */}
        <header>
          <h1>🌤️ Weather App</h1>
          <p>Cek kondisi cuaca berdasarkan kota</p>
        </header>

        {/* SEARCH */}
        <div className="search-wrapper">
          <div className="search-box">
            <input
              type="text"
              placeholder="Masukkan nama kota..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchWeather();
                }
              }}
            />

            <button
              onClick={searchWeather}
              disabled={loading}
            >
              {loading ? "Loading..." : "Cari"}
            </button>
          </div>

          {/* SUGGESTION */}
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((item) => (
                <div
                  className="suggestion-item"
                  key={`${item.id}-${item.latitude}`}
                  onClick={() => {
                    setCity(item.name);
                    getWeather(item);
                  }}
                >
                  <div className="suggestion-icon">
                    📍
                  </div>

                  <div>
                    <strong>{item.name}</strong>

                    <span>
                      {item.admin1
                        ? `${item.admin1}, `
                        : ""}
                      {item.country}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* DATA CUACA */}
        {weather && (
          <>
            {/* CUACA SAAT INI */}
            <section className="current-weather">

              <div className="location">
                <h2>
                  {weather.location.name},{" "}
                  {weather.location.country}
                </h2>

                <p>
                  {weatherDescription[
                    weather.data.current.weather_code
                  ] || "Tidak diketahui"}
                </p>
              </div>

              <div className="temperature">
                <span>
                  {Math.round(
                    weather.data.current.temperature_2m
                  )}
                </span>

                <small>°C</small>
              </div>

              <div className="weather-info">

                <div>
                  <span>💧</span>
                  <p>Kelembapan</p>
                  <strong>
                    {
                      weather.data.current
                        .relative_humidity_2m
                    }
                    %
                  </strong>
                </div>

                <div>
                  <span>🌧️</span>
                  <p>Curah Hujan</p>
                  <strong>
                    {weather.data.current.precipitation} mm
                  </strong>
                </div>

                <div>
                  <span>💨</span>
                  <p>Angin</p>
                  <strong>
                    {weather.data.current.wind_speed_10m} km/h
                  </strong>
                </div>

                <div>
                  <span>🌡️</span>
                  <p>Terasa</p>
                  <strong>
                    {Math.round(
                      weather.data.current
                        .apparent_temperature
                    )}
                    °C
                  </strong>
                </div>

              </div>
            </section>

            {/* FORECAST */}
            <section className="forecast">
              <h2>Forecast 7 Hari</h2>

              <div className="forecast-grid">
                {weather.data.daily.time.map(
                  (date, index) => {
                    const weatherCode =
                      weather.data.daily.weather_code[index];

                    return (
                      <div
                        className="forecast-card"
                        key={date}
                      >
                        <p>
                          {new Date(
                            date
                          ).toLocaleDateString("id-ID", {
                            weekday: "short",
                          })}
                        </p>

                        <div className="forecast-icon">
                          {getWeatherIcon(weatherCode)}
                        </div>

                        <strong>
                          {weatherDescription[
                            weatherCode
                          ] || "Cuaca"}
                        </strong>

                        <div className="forecast-temp">
                          <span>
                            {Math.round(
                              weather.data.daily
                                .temperature_2m_max[index]
                            )}
                            °
                          </span>

                          <span>
                            {Math.round(
                              weather.data.daily
                                .temperature_2m_min[index]
                            )}
                            °
                          </span>
                        </div>

                        <small>
                          💧{" "}
                          {
                            weather.data.daily
                              .precipitation_sum[index]
                          }{" "}
                          mm
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </>
        )}

        {/* EMPTY STATE */}
        {!weather && !loading && !error && (
          <div className="empty">
            <div>🌍</div>

            <h2>Cari kondisi cuaca</h2>

            <p>
              Masukkan nama kota untuk melihat informasi
              cuaca.
            </p>
          </div>
        )}

        {/* FOOTER */}
        <footer>
          Data cuaca dari{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo
          </a>
        </footer>

      </div>
    </div>
  );
}

export default App;
