import React, { useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; 

mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpcnNoZW5kdTEyMzIxIiwiYSI6ImNtMHBocXp0YzAxaXEycnM3bGc5amRuZ3AifQ.TEPL_QP37dpbZV-CZmhXOQ';

const HomePage = () => {
  const [startCoordinates, setStartCoordinates] = useState("");
  const [currentCoordinates, setCurrentCoordinates] = useState("");
  const [endCoordinates, setEndCoordinates] = useState("");
  const [showMap, setshowMap] = useState(true);
  const [error, setError] = useState({
    start: false,
    current: false,
    end: false,
  });
  const [etd, setEtd] = useState("");

  const validateCoordinates = (value) => {
    if (value.startsWith(",")) {
      return "Coordinates cannot start with a comma.";
    }
    const parts = value.split(",");
    if (parts.length !== 2) {
      return "Coordinates must include a comma separating two numbers.";
    }
    const [x, y] = parts;
    if(x.trim().length === 0 || y.trim().length === 0)  return "Both parts of the coordinates must be valid numbers.";
    if (isNaN(x) || isNaN(y)) {
      return "Both parts of the coordinates must be valid numbers.";
    }
    return ""; 
  };

  const handleStartCoordinates = (e) => {
    const value = e.target.value;
    setStartCoordinates(value);
    const errorMsg = validateCoordinates(value);
    setError((prev) => ({ ...prev, start: errorMsg }));
  };

  const handleCurrentCoordinates = (e) => {
    const value = e.target.value;
    setCurrentCoordinates(value);
    const errorMsg = validateCoordinates(value);
    setError((prev) => ({ ...prev, current: errorMsg }));
  };

  const handleEndCoordinates = (e) => {
    const value = e.target.value;
    setEndCoordinates(value);
    const errorMsg = validateCoordinates(value);
    setError((prev) => ({ ...prev, end: errorMsg }));
  };

  const mapContainer = useRef(null);
  const map = useRef(null);

  const calculateDistance = (coords1, coords2) => {
    const R = 6371; 
    const lat1 = coords1[1] * (Math.PI / 180);
    const lat2 = coords2[1] * (Math.PI / 180);
    const dLat = (coords2[1] - coords1[1]) * (Math.PI / 180);
    const dLon = (coords2[0] - coords1[0]) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; 
  };

  const calculateETD = (startCoords, endCoords, speed = 60) => {
    const distance = calculateDistance(startCoords, endCoords);
    const time = distance / speed; 
    return (time * 60).toFixed(0); 
  };

  const calculateDeliveryDate = (minutes) => {
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + minutes * 60000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return deliveryDate.toLocaleDateString('en-US', options);
  };

  const handleUpdateMap = () => {
    
    if (
      !startCoordinates ||
      !currentCoordinates ||
      !endCoordinates ||
      Object.values(error).some((err) => err)
    ) {
      return;
    }

    
    const parseCoordinates = (coords) => {
      return coords.split(",").map(Number);
    };

    const startCoords = parseCoordinates(startCoordinates);
    const currentCoords = parseCoordinates(currentCoordinates);
    const endCoords = parseCoordinates(endCoordinates);

    
    if (map.current) {
      map.current.remove(); 
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: startCoords, 
      zoom: 10 
    });

    
    const nav = new mapboxgl.NavigationControl();
    map.current.addControl(nav, 'top-right');

    
    new mapboxgl.Marker({ color: 'green' })
      .setLngLat(startCoords)
      .setPopup(new mapboxgl.Popup().setHTML('<h4>Start: Mumbai</h4>'))
      .addTo(map.current);

    new mapboxgl.Marker({ color: 'blue' })
      .setLngLat(currentCoords)
      .setPopup(new mapboxgl.Popup().setHTML('<h4>Current Location</h4>'))
      .addTo(map.current);

    new mapboxgl.Marker({ color: 'red' })
      .setLngLat(endCoords)
      .setPopup(new mapboxgl.Popup().setHTML('<h4>End: New York</h4>'))
      .addTo(map.current);

    
    const startToCurrentETD = calculateETD(startCoords, currentCoords);
    const currentToEndETD = calculateETD(currentCoords, endCoords);

    const totalETD = (parseInt(startToCurrentETD) + parseInt(currentToEndETD)).toFixed(0);
    const deliveryDate = calculateDeliveryDate(totalETD);

    
    setEtd(`Estimated Time for Delivery: ${deliveryDate}`);

    
    new mapboxgl.Popup()
      .setLngLat(currentCoords)
      .setHTML(`<h4>${etd}</h4>`)
      .addTo(map.current);

    
    map.current.on('load', () => {
      map.current.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': [startCoords, currentCoords, endCoords]
          }
        }
      });

      map.current.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#888',
          'line-width': 4,
          'line-dasharray': [2, 4] 
        }
      });
    });
  };

  return (
    <>
      <h1>Give Three coordinates to see the direction</h1>
      <div>
        <input
          type="text"
          placeholder="Start Coordinates (e.g., 12.34,56.78)"
          onChange={handleStartCoordinates}
          value={startCoordinates}
        />
        {error.start && <p style={{ color: "red" }}>{error.start}</p>}

        <input
          type="text"
          placeholder="Current Coordinates (e.g., 12.34,56.78)"
          onChange={handleCurrentCoordinates}
          value={currentCoordinates}
        />
        {error.current && <p style={{ color: "red" }}>{error.current}</p>}

        <input
          type="text"
          placeholder="End Coordinates (e.g., 12.34,56.78)"
          onChange={handleEndCoordinates}
          value={endCoordinates}
        />
        {error.end && <p style={{ color: "red" }}>{error.end}</p>}
        <button type="submit" disabled={error.start || error.current || error.end} onClick={handleUpdateMap}>
          Submit
        </button>
      </div>
      <div style={{ marginTop: "20px" }}>
        <div ref={mapContainer} style={{ width: '100%', height: '80vh' }} />
        {etd && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            zIndex: 1
          }}>
            {etd}
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;
