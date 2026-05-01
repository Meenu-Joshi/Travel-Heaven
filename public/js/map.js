// Ensure mapbox token is configured first
mapboxgl.accessToken = mapToken;

// Initialize map...
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: listing.geometry.coordinates,
    zoom: 9
});

// Add marker...
new mapboxgl.Marker({ color: 'red' })
    .setLngLat(listing.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h4>${listing.location}</h4><p>Exact location provided upon booking</p>`
        )
    )
    .addTo(map);

// Weather widget fetch function
async function fetchWeather(lat, lon) {
    // Inject the key via a global variable defined in your template or backend
    const apiKey = '<%= process.env.WEATHER_API_KEY %>'; 
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const data = await response.json();
        
        if(response.ok) {
            document.getElementById("weather-widget").innerHTML = `
                <div class="card-body">
                    <h5 class="card-title"><i class="fa-solid fa-cloud-sun"></i> Weather at Destination</h5>
                    <p class="card-text"><strong>${data.name}, ${data.sys.country}</strong></p>
                    <p>Temperature: ${data.main.temp}°C</p>
                    <p>Condition: ${data.weather[0].description}</p>
                </div>
            `;
        }
    } catch (err) {
        console.error("Could not load weather data", err);
    }
}