'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMap, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapInteractive({ selectedRegion, geojsonData }) {
  const defaultCenter = [-0.7893, 113.9213]; 
  const defaultZoom = 5;

  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);

  const centroidIcon = L.divIcon({
    className: 'centroid-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  useEffect(() => {
    if (selectedRegion && selectedRegion.y && selectedRegion.x) {
      setCenter([selectedRegion.y, selectedRegion.x]);
      let targetZoom = 6;
      if (selectedRegion.level === 'adm2') targetZoom = 9;
      if (selectedRegion.level === 'adm3') targetZoom = 11;
      if (selectedRegion.level === 'adm4') targetZoom = 13;
      setZoom(targetZoom);
    }
  }, [selectedRegion]);

  return (
    <div className="map-container">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController center={center} zoom={zoom} />

        {geojsonData && geojsonData.geometry && (
          <Polygon 
            key={selectedRegion.code}
            positions={
               geojsonData.geometry.type === 'Polygon' 
                ? geojsonData.geometry.coordinates[0].map(coord => [coord[1], coord[0]])
                : geojsonData.geometry.coordinates.map(poly => poly[0].map(coord => [coord[1], coord[0]]))
            } 
            pathOptions={{ 
              color: '#0d6efd', 
              fillColor: '#0d6efd', 
              fillOpacity: 0.15,
              weight: 2
            }} 
          />
        )}

        {selectedRegion && selectedRegion.x && selectedRegion.y && (
          <Marker 
            position={[selectedRegion.y, selectedRegion.x]} 
            icon={centroidIcon}
          >
            <Tooltip 
              permanent 
              direction="top" 
              className="custom-map-label"
              offset={[0, -10]}
            >
              {/* <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedRegion.name}</div> */}
              <div style={{ fontSize: '30px', color: '#ffffff', marginTop: '3px', fontWeight: '700', textShadow: '1px 1px 4px rgba(0,0,0,0.9), -1px -1px 4px rgba(0,0,0,0.9)' }}>
                Luas: {(selectedRegion.shape_area || 0).toLocaleString('id-ID', {maximumFractionDigits: 2})} km²
              </div>
            </Tooltip>
          </Marker>
        )}

      </MapContainer>

    </div>
  );
}
