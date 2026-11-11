import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import Sidebar from '../components/Sidebar';
import { DEFAULT_MAP_BASE, MapBaseLayer, MapBaseSelect } from '../components/MapBase';
import API_BASE_URL from '../config/apiConfig';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import './MerchantMap.css';
import './Dashboard.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TRACE_COLORS = ['#005BAC', '#F16522', '#1B7F4E', '#7A3E9D', '#B45309', '#0F766E'];
const NOUAKCHOTT = [18.0735, -15.9686];

const teamIcon = L.divIcon({
  className: 'custom-marker-icon marker-icon-equipe',
  html: '<div></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function heure(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const TeamLegend = () => (
  <div className="map-legend">
    <h4>Légende</h4>
    <div>
      <span className="legend-color-box marker-icon-equipe"></span>
      Équipe en tournée
    </div>
    <div>
      <span className="legend-color-box marker-icon-parcours"></span>
      Parcours du jour
    </div>
  </div>
);

const TeamMap = () => {
  const [jour, setJour] = useState(todayKey);
  const [showTeams, setShowTeams] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [equipes, setEquipes] = useState([]);
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapBase, setMapBase] = useState(DEFAULT_MAP_BASE);
  const mapRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    const fetchPositions = async (first) => {
      if (first) {
        setLoading(true);
        setError(null);
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentification requise.');
        const response = await axios.get(`${API_BASE_URL}/api/positions`, {
          headers: { 'x-auth-token': token },
          params: { jour },
        });
        if (ignore) return;
        setEquipes(response.data.equipes || []);
        setTraces(response.data.traces || []);
        setError(null);
      } catch (err) {
        if (ignore || !first) return;
        setEquipes([]);
        setTraces([]);
        setError(err.response?.data?.msg || err.message || 'Une erreur est survenue.');
      } finally {
        if (!ignore && first) setLoading(false);
      }
    };
    fetchPositions(true);
    const timer = setInterval(() => fetchPositions(false), 15000);
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [jour]);

  const cadrer = (map) => {
    if (!map) return;
    const coords = [];
    if (showPaths) {
      traces.forEach((trace) => trace.points.forEach((point) => coords.push([point.latitude, point.longitude])));
    }
    if (showTeams) {
      equipes.forEach((equipe) => coords.push([equipe.latitude, equipe.longitude]));
    }
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 14);
      return;
    }
    map.fitBounds(coords, { padding: [40, 40] });
  };

  const allerVers = (latitude, longitude) => {
    if (mapRef.current) mapRef.current.flyTo([latitude, longitude], 15);
  };

  const renderMap = () => {
    if (loading) return <div className="map-loading">Chargement des données...</div>;
    if (error) return <div className="map-error">{error}</div>;

    return (
      <MapContainer
        whenCreated={(instance) => {
          mapRef.current = instance;
          cadrer(instance);
        }}
        center={NOUAKCHOTT}
        zoom={13}
        className="leaflet-container"
      >
        <MapBaseLayer baseId={mapBase} />
        <TeamLegend />
        {showPaths && traces.map((trace, index) => {
          const color = TRACE_COLORS[index % TRACE_COLORS.length];
          return (
            <React.Fragment key={trace.eamId || index}>
              {trace.points.length > 1 && (
                <Polyline
                  positions={trace.points.map((point) => [point.latitude, point.longitude])}
                  pathOptions={{ color, weight: 4 }}
                />
              )}
              {trace.points.map((point, pointIndex) => (
                <CircleMarker
                  key={`${trace.eamId}-${pointIndex}`}
                  center={[point.latitude, point.longitude]}
                  radius={6}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
                >
                  <Popup>
                    <b>{trace.equipe}</b><br />
                    {point.actionLabel}<br />
                    {heure(point.at)}
                  </Popup>
                </CircleMarker>
              ))}
            </React.Fragment>
          );
        })}
        {showTeams && equipes.map((equipe) => (
          <Marker
            key={`equipe-${equipe.eamId}`}
            position={[equipe.latitude, equipe.longitude]}
            icon={teamIcon}
          >
            <Popup>
              <b>{equipe.equipe}</b><br />
              {equipe.matricule}<br />
              {equipe.actionLabel}<br />
              {heure(equipe.at)}
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
          <h1>Carte équipe</h1>
        </header>
        <div className="merchant-map-page-container">
          <div className="map-controls-panel">
            <h3>Contrôles</h3>
            <div className="control-group">
              <label htmlFor="map-day">Jour :</label>
              <input id="map-day" type="date" value={jour} onChange={(event) => setJour(event.target.value)} />
              <div>
                <input type="checkbox" id="show-teams" checked={showTeams} onChange={(event) => setShowTeams(event.target.checked)} />
                <label htmlFor="show-teams">Équipes en tournée</label>
              </div>
              <div>
                <input type="checkbox" id="show-paths" checked={showPaths} onChange={(event) => setShowPaths(event.target.checked)} />
                <label htmlFor="show-paths">Parcours du jour</label>
              </div>
            </div>
            <div className="control-group">
              <label>Équipes en tournée</label>
              {equipes.length === 0 ? (
                <p className="map-empty-hint">Aucune équipe en tournée avec une position connue.</p>
              ) : (
                <ul className="search-results-list">
                  {equipes.map((equipe) => (
                    <li key={equipe.eamId} onClick={() => allerVers(equipe.latitude, equipe.longitude)}>
                      {equipe.equipe} · {heure(equipe.at)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <MapBaseSelect id="team-tile-layer" value={mapBase} onChange={setMapBase} />
          </div>
          <div className="map-view-container">{renderMap()}</div>
        </div>
      </main>
    </div>
  );
};

export default TeamMap;
