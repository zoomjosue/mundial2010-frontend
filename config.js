window.APP_CONFIG = {
  API_BASE_URL: window.location.hostname.includes("onrender.com")
    ? "https://mundial2010-backend.onrender.com"
    : "http://localhost:8080"
};