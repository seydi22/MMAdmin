import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import Sidebar from '../components/Sidebar'; // Import Sidebar
import API_BASE_URL from '../config/apiConfig'; // Import API base URL

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';

import './MerchantMap.css';
import './Dashboard.css'; // Import shared layout styles

// Fix for default Leaflet icon
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
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentification requise. Veuillez vous reconnecter.');
        }

        const response = await axios.get(`${API_BASE_URL}/api/merchants/localisation`, {
          headers: { 'x-auth-token': token },
        });
        
        setMerchants(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.msg || err.message || 'Une erreur est survenue.';
        setError(`Erreur: ${errorMessage}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="map-loading">Chargement de la carte...</div>;
    }
  
    if (error) {
      return <div className="map-error">{error}</div>;
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
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Carte des Marchands</h1>
        </header>
        <div className="card" style={{ height: '80vh', padding: 0 }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default MerchantMap;
