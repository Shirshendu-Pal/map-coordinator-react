import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; 

mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpcnNoZW5kdTEyMzIxIiwiYSI6ImNtMHBocXp0YzAxaXEycnM3bGc5amRuZ3AifQ.TEPL_QP37dpbZV-CZmhXOQ';

const HomePage = () => {
  const [startCoordinates, setStartCoordinates] = useState("");
  const [currentCoordinates, setCurrentCoordinates] = useState("");
  const [endCoordinates, setEndCoordinates] = useState("");
  const [error, setError] = useState({
    start: false,
    current: false,
    end: false,
  });

  const validateCoordinates = (value) => {
    if (value.startsWith(",")) {
      return "Coordinates cannot start with a comma.";
    }
    const parts = value.split(",");
    if (parts.length !== 2) {
      return "Coordinates must include a comma separating two numbers.";
    }
    const [x, y] = parts;
    if(x.trim().length === 0 || y.trim().length === 0) return "Both parts of the coordinates must be valid numbers.";
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

  
  useEffect(() => {
    handleUpdateMap();
  }, [startCoordinates, currentCoordinates, endCoordinates, error]);

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
      </div>
      <div style={{ marginTop: "20px" }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      </div>
    </>
  );
};

export default HomePage;
