import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A simple helper function to get coordinates from a city name for free using Nominatim
export async function getCoordinates(cityName) {
  if (!cityName) return null;
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch coordinates:", error);
    return null;
  }
}

// MapBounds setter component to auto-zoom to the route
function MapBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

export default function DispatchMap({ source, destination }) {
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Default center (USA center approximately)
  const defaultCenter = [39.8283, -98.5795];

  useEffect(() => {
    let isMounted = true;
    
    const fetchRoute = async () => {
      if (!source || !destination) {
        setSourceCoords(null);
        setDestCoords(null);
        setRouteCoords([]);
        return;
      }

      setLoading(true);
      
      // 1. Geocode both cities
      // We process them sequentially to respect Nominatim's 1-request-per-second limit
      const origin = await getCoordinates(source);
      // add a small delay to be safe with nominatim limits
      await new Promise(r => setTimeout(r, 1100));
      const dest = await getCoordinates(destination);

      if (!isMounted) return;

      if (origin && dest) {
        setSourceCoords(origin);
        setDestCoords(dest);
        
        // 2. Fetch Route from OSRM
        try {
          // OSRM expects: longitude,latitude
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
          const routeRes = await fetch(osrmUrl);
          const routeData = await routeRes.json();
          
          if (routeData.code === 'Ok' && routeData.routes.length > 0) {
            // GeoJSON returns [lng, lat], Leaflet Polyline needs [lat, lng]
            const coords = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            setRouteCoords(coords);
          }
        } catch (error) {
          console.error("OSRM Route Failed", error);
        }
      }
      
      setLoading(false);
    };

    // Debounce the fetching slightly so it doesn't spam as user types
    const timer = setTimeout(() => {
      fetchRoute();
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [source, destination]);

  let bounds = null;
  if (sourceCoords && destCoords) {
    bounds = L.latLngBounds(
      [sourceCoords.lat, sourceCoords.lng], 
      [destCoords.lat, destCoords.lng]
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-[#121820] min-h-[400px]">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#121820]/60 backdrop-blur-sm">
          <div className="text-blue-400 text-sm font-medium animate-pulse">Calculating Route...</div>
        </div>
      )}
      
      <MapContainer 
        center={sourceCoords ? [sourceCoords.lat, sourceCoords.lng] : defaultCenter} 
        zoom={4} 
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {sourceCoords && (
          <Marker position={[sourceCoords.lat, sourceCoords.lng]}>
            <Popup className="bg-slate-900 border border-slate-700 rounded-md">
              <span className="font-bold">Origin:</span> {sourceCoords.name || source}
            </Popup>
          </Marker>
        )}
        
        {destCoords && (
          <Marker position={[destCoords.lat, destCoords.lng]}>
            <Popup>
              <span className="font-bold">Destination:</span> {destCoords.name || destination}
            </Popup>
          </Marker>
        )}

        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            color="#3b82f6" 
            weight={4} 
            opacity={0.8}
            dashArray="10, 10"
          />
        )}

        {bounds && <MapBounds bounds={bounds} />}
      </MapContainer>
      
      {!sourceCoords && !loading && (
        <div className="absolute inset-0 pointer-events-none z-[999] flex items-center justify-center">
          <span className="px-4 py-2 bg-slate-900/80 rounded-md border border-slate-700 text-slate-400 text-sm">
            Live Telemetry Map Simulation
          </span>
        </div>
      )}
    </div>
  );
}
