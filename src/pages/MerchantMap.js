
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import './MerchantMap.css';
import './Dashboard.css';

// Correction pour l'icône par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- Logique des icônes (basée sur les données réelles "validé") ---
const getIconByStatus = (status) => {
  const statusClassName = {
    'validé': 'marker-icon-valide',
    'en attente': 'marker-icon-en-attente',
    'rejeté': 'marker-icon-rejete',
    'livré': 'marker-icon-livre',
  };
  return L.divIcon({
    className: `custom-marker-icon ${statusClassName[status] || 'marker-icon-default'}`,
    html: '<div></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const MapLegend = () => (
  <div className="map-legend">
    <h4>Légende</h4>
    <div><span className="legend-color-box marker-icon-valide"></span> Validé</div>
    <div><span className="legend-color-box marker-icon-en-attente"></span> En attente</div>
    <div><span className="legend-color-box marker-icon-rejete"></span> Rejeté</div>
    <div><span className="legend-color-box marker-icon-livre"></span> Livré</div>
  </div>
);

const TileLayerSwitcher = ({ tileLayer, setTileLayer }) => {
  const tileLayers = {
    osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', name: 'OpenStreetMap' },
    cartoDark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', name: 'CartoDB Dark' },
  };
  return (
    <div className="control-group">
      <label htmlFor="tile-layer-select">Fond de carte :</label>
      <select id="tile-layer-select" value={tileLayer} onChange={(e) => setTileLayer(e.target.value)}>
        {Object.keys(tileLayers).map(key => (
          <option key={key} value={tileLayers[key].url}>{tileLayers[key].name}</option>
        ))}
      </select>
    </div>
  );
};

const MerchantMap = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- États (les clés correspondent maintenant aux données réelles) ---
  const [statusFilter, setStatusFilter] = useState({ 'validé': true, 'en attente': true, 'rejeté': true, 'livré': true });
  const [agentFilter, setAgentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tileLayer, setTileLayer] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const nouakchottPosition = [18.0735, -15.9686];

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentification requise.');
        
        const response = await axios.get(`${API_BASE_URL}/api/merchants/localisation`, {
          headers: { 'x-auth-token': token },
        });
        
        // --- PLUS DE DONNÉES SIMULÉES ---
        // On utilise directement les données du backend.
        console.log('Données réelles reçues du backend :', response.data);
        setMerchants(response.data);

      } catch (err) {
        setError(err.response?.data?.msg || err.message || 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    };
    fetchMerchants();
  }, []);

  // --- Logique de filtrage par agent (utilise "matricule") ---
  const hasAgentData = useMemo(() => merchants.some(m => m.matricule && m.matricule !== 'N/A'), [merchants]);
  const agentMatricules = useMemo(() => ['all', ...new Set(merchants.filter(m => m.matricule && m.matricule !== 'N/A').map(m => m.matricule))], [merchants]);

  const filteredMerchants = useMemo(() => {
    const filtered = merchants
      .filter(m => statusFilter[m.statut])
      .filter(m => agentFilter === 'all' || m.matricule === agentFilter);
    
    console.log('Marchands après filtrage :', filtered);
    return filtered;

  }, [merchants, statusFilter, agentFilter]);

  const searchedMerchants = useMemo(() => {
    if (!searchTerm) return [];
    return filteredMerchants.filter(m =>
      (m.nom && m.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [filteredMerchants, searchTerm]);

  const handleStatusChange = (e) => {
    const { name, checked } = e.target;
    setStatusFilter(prev => ({ ...prev, [name]: checked }));
  };

  const handleSearchResultClick = (merchant) => {
    if (mapRef.current) mapRef.current.flyTo([merchant.lat, merchant.lng], 17);
    const marker = markerRefs.current[merchant.id];
    if (marker) marker.openPopup();
  };

  const renderMap = () => {
    if (loading) return <div className="map-loading">Chargement des données...</div>;
    if (error) return <div className="map-error">{error}</div>;

    return (
      <MapContainer whenCreated={instance => { mapRef.current = instance; }} center={nouakchottPosition} zoom={13} className="leaflet-container">
        <TileLayer url={tileLayer} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        <MapLegend />
        {filteredMerchants.map(merchant => (
          <Marker
            key={merchant.id}
            position={[merchant.lat, merchant.lng]}
            icon={getIconByStatus(merchant.statut)}
            ref={el => { markerRefs.current[merchant.id] = el; }}
          >
            <Popup>
              <b>{merchant.nom}</b><br />
              Agent (Matricule): {merchant.matricule}<br />
              Statut: {merchant.statut}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Carte des Marchands</h1>
        </header>
        <div className="merchant-map-page-container">
          <div className="map-controls-panel">
            <h3>Contrôles</h3>
            <div className="control-group">
              <label>Rechercher par nom :</label>
              <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              {searchTerm && (
                <ul className="search-results-list">
                  {searchedMerchants.length > 0 ? (
                    searchedMerchants.map(m => (
                      <li key={m.id} onClick={() => handleSearchResultClick(m)}>{m.nom}</li>
                    ))
                  ) : (
                    <li className="no-results">Aucun résultat</li>
                  )}
                </ul>
              )}
            </div>
            <div className="control-group">
              <label>Filtrer par statut :</label>
              {Object.keys(statusFilter).map(statusKey => (
                <div key={statusKey}>
                  <input type="checkbox" id={`status-${statusKey}`} name={statusKey} checked={statusFilter[statusKey]} onChange={handleStatusChange} />
                  <label htmlFor={`status-${statusKey}`}>{statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}</label>
                </div>
              ))}
            </div>
            {hasAgentData && agentMatricules.length > 2 && (
              <div className="control-group">
                <label htmlFor="agent-select">Filtrer par agent (matricule) :</label>
                <select id="agent-select" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
                  {agentMatricules.map(name => (
                    <option key={name} value={name}>{name === 'all' ? 'Tous les agents' : name}</option>
                  ))}
                </select>
              </div>
            )}
            <TileLayerSwitcher tileLayer={tileLayer} setTileLayer={setTileLayer} />
          </div>
          <div className="map-view-container">{renderMap()}</div>
        </div>
      </main>
    </div>
  );
};

export default MerchantMap;
