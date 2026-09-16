import { useState } from "react";
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

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchWeather = async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // 1. Cari koordinat kota
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=id&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error("Gagal mencari kota");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("Kota tidak ditemukan");
      }

      const location = geoData.results[0];

      // 2. Ambil data cuaca
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>🌤️ Weather App</h1>
          <p>Cek kondisi cuaca berdasarkan kota</p>
        </header>

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

          <button onClick={searchWeather}>
            {loading ? "Loading..." : "Cari"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {weather && (
          <>
            <section className="current-weather">
              <div className="location">
                <h2>
                  {weather.location.name}, {weather.location.country}
                </h2>

                <p>
                  {weatherDescription[
                    weather.data.current.weather_code
                  ] || "Tidak diketahui"}
                </p>
              </div>

              <div className="temperature">
                <span>
                  {Math.round(weather.data.current.temperature_2m)}
                </span>
                <small>°C</small>
              </div>

              <div className="weather-info">
                <div>
                  <span>💧</span>
                  <p>Kelembapan</p>
                  <strong>
                    {weather.data.current.relative_humidity_2m}%
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
                      weather.data.current.apparent_temperature
                    )}
                    °C
                  </strong>
                </div>
              </div>
            </section>

            <section className="forecast">
              <h2>Forecast 7 Hari</h2>

              <div className="forecast-grid">
                {weather.data.daily.time.map((date, index) => (
                  <div className="forecast-card" key={date}>
                    <p>
                      {new Date(date).toLocaleDateString("id-ID", {
                        weekday: "short",
                      })}
                    </p>

                    <div className="forecast-icon">
                      {weather.data.daily.weather_code[index] === 0
                        ? "☀️"
                        : weather.data.daily.weather_code[index] >= 61
                        ? "🌧️"
                        : "⛅"}
                    </div>

                    <strong>
                      {weatherDescription[
                        weather.data.daily.weather_code[index]
                      ] || "Cuaca"}
                    </strong>

                    <div className="forecast-temp">
                      <span>
                        {Math.round(
                          weather.data.daily.temperature_2m_max[index]
                        )}
                        °
                      </span>

                      <span>
                        {Math.round(
                          weather.data.daily.temperature_2m_min[index]
                        )}
                        °
                      </span>
                    </div>

                    <small>
                      💧{" "}
                      {weather.data.daily.precipitation_sum[index]} mm
                    </small>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {!weather && !loading && !error && (
          <div className="empty">
            <div>🌍</div>
            <h2>Cari kondisi cuaca</h2>
            <p>Masukkan nama kota untuk melihat informasi cuaca.</p>
          </div>
        )}

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