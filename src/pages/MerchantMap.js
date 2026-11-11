
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import Sidebar from '../components/Sidebar';
import { DEFAULT_MAP_BASE, MapBaseLayer, MapBaseSelect } from '../components/MapBase';
import API_BASE_URL from '../config/apiConfig';
import { formatMerchantStatutLabel, STATUT_REJETE_DEFINITIF } from '../utils/merchantStatus';

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

const MAP_STATUSES = [
  'en attente',
  'validé_par_superviseur',
  'cree',
  'rejeté',
  'livré',
  STATUT_REJETE_DEFINITIF,
];

const STATUS_MARKER = {
  'en attente': 'marker-icon-en-attente',
  'validé_par_superviseur': 'marker-icon-superviseur',
  'cree': 'marker-icon-valide',
  'rejeté': 'marker-icon-rejete',
  'livré': 'marker-icon-livre',
  [STATUT_REJETE_DEFINITIF]: 'marker-icon-rejete-definitif',
};

const getIconByStatus = (status) => {
  return L.divIcon({
    className: `custom-marker-icon ${STATUS_MARKER[status] || 'marker-icon-default'}`,
    html: '<div></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const MapLegend = () => (
  <div className="map-legend">
    <h4>Légende</h4>
    {MAP_STATUSES.map((status) => (
      <div key={status}>
        <span className={`legend-color-box ${STATUS_MARKER[status]}`}></span>
        {formatMerchantStatutLabel(status)}
      </div>
    ))}
  </div>
);

const MerchantMap = () => {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- États (les clés correspondent maintenant aux données réelles) ---
  const [statusFilter, setStatusFilter] = useState(() => (
    Object.fromEntries(MAP_STATUSES.map((status) => [status, true]))
  ));
  const [agentFilter, setAgentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapBase, setMapBase] = useState(DEFAULT_MAP_BASE);

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
        
        const points = (response.data || [])
          .filter((merchant) => merchant.lat != null && merchant.lng != null)
          .map((merchant) => ({
            ...merchant,
            statut: merchant.statut === 'validé' ? 'cree' : merchant.statut,
          }));
        setMerchants(points);

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
      .filter((merchant) => statusFilter[merchant.statut] !== false)
      .filter((merchant) => agentFilter === 'all' || merchant.matricule === agentFilter);
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
        <MapBaseLayer baseId={mapBase} />
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
              AAM : {merchant.matricule}<br />
              Statut: {formatMerchantStatutLabel(merchant.statut)}
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
          <h1>Carte marchand</h1>
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
              {MAP_STATUSES.map((statusKey) => (
                <div key={statusKey}>
                  <input type="checkbox" id={`status-${statusKey}`} name={statusKey} checked={statusFilter[statusKey]} onChange={handleStatusChange} />
                  <label htmlFor={`status-${statusKey}`}>{formatMerchantStatutLabel(statusKey)}</label>
                </div>
              ))}
            </div>
            {hasAgentData && agentMatricules.length > 2 && (
              <div className="control-group">
                <label htmlFor="agent-select">Filtrer par AAM :</label>
                <select id="agent-select" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
                  {agentMatricules.map(name => (
                    <option key={name} value={name}>{name === 'all' ? 'Tous les AAM' : name}</option>
                  ))}
                </select>
              </div>
            )}
            <MapBaseSelect id="tile-layer-select" value={mapBase} onChange={setMapBase} />
          </div>
          <div className="map-view-container">{renderMap()}</div>
        </div>
      </main>
    </div>
  );
};

export default MerchantMap;
