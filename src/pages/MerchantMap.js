import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';

import './MerchantMap.css';

// Correction pour l'icône par défaut de Leaflet qui peut être cassée avec Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MerchantMap = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const nouakchottPosition = [18.0735, -15.9686];

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        if (!apiUrl) {
          throw new Error("L'URL de l'API n'est pas configurée. Veuillez définir REACT_APP_API_URL.");
        }
        const response = await fetch(`${apiUrl}/api/merchants/localisation`);
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`La requête a échoué: ${response.status} ${response.statusText}. Réponse: ${errorBody}`);
        }
        const data = await response.json();
        setMerchants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  if (loading) {
    return <div className="map-loading">Chargement de la carte...</div>;
  }

  if (error) {
    return <div className="map-error">Erreur : {error}</div>;
  }

  return (
    <MapContainer center={nouakchottPosition} zoom={13} className="leaflet-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MarkerClusterGroup>
        {merchants.map(merchant => (
          <Marker key={merchant.id} position={[merchant.lat, merchant.lng]}>
            <Popup>
              {merchant.nom}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default MerchantMap;