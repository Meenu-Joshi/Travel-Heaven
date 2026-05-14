mapboxgl.accessToken = mapToken;

// 1. Initialize the static map
const map = new mapboxgl.Map({
    container: 'map', 
    style: 'mapbox://styles/mapbox/streets-v12', 
    center: listing.geometry.coordinates,
    zoom: 9
});

// 2. Add the default static marker
const marker = new mapboxgl.Marker({ color: "red" })
    .setLngLat(listing.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h4>${listing.title}</h4><p>Exact location provided after booking</p>`)
    )
    .addTo(map);

// 3. Function to turn the static map into a live map
let directionsLoaded = false;

function loadLiveRoute() {
    if (directionsLoaded) return; // Prevent adding it twice

    // Initialize the Directions plugin
    const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving', // Options: 'driving', 'walking', 'cycling'
        controls: { inputs: true, instructions: true }
    });

    // Add the directions control to the map
    map.addControl(directions, 'top-left');
    directions.setDestination(listing.geometry.coordinates);

    // Fetch user's current location to set as the origin
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userCoordinates = [position.coords.longitude, position.coords.latitude];
            directions.setOrigin(userCoordinates);
        }, () => {
            alert("Geolocation not available or permission denied.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
    
    directionsLoaded = true;
}