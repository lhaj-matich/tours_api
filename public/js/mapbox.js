/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoibmlnbWFkb3BlIiwiYSI6ImNrdjN0dDNlNzBoaXMyb3BobWcwZWJpZWkifQ.BMjE33V3wwaWML3kjjvVyw';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/nigmadope/ckv3tuhxm51jr14qkyik7ni9m',
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Create the marker
  const el = document.createElement('div');
  el.className = 'marker';
  // Add the marker to the map
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);
  // Add the popup to the map
  new mapboxgl.Popup({
    offset: 30,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
