import React from 'react';
import { TileLayer } from 'react-leaflet';

export const MAP_BASES = [
  {
    id: 'google',
    name: 'Google Plan',
    url: 'https://mt{s}.google.com/vt/lyrs=m&hl=fr&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google',
    maxZoom: 20,
  },
  {
    id: 'googleSat',
    name: 'Google Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=y&hl=fr&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google',
    maxZoom: 20,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  {
    id: 'cartoDark',
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
];

export const DEFAULT_MAP_BASE = 'google';

export function mapBaseById(id) {
  return MAP_BASES.find((layer) => layer.id === id) || MAP_BASES[0];
}

export const MapBaseSelect = ({ id, value, onChange }) => (
  <div className="control-group">
    <label htmlFor={id}>Fond de carte :</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      {MAP_BASES.map((layer) => (
        <option key={layer.id} value={layer.id}>{layer.name}</option>
      ))}
    </select>
  </div>
);

export const MapBaseLayer = ({ baseId }) => {
  const layer = mapBaseById(baseId);
  return (
    <TileLayer
      key={layer.id}
      url={layer.url}
      attribution={layer.attribution}
      subdomains={layer.subdomains}
      maxZoom={layer.maxZoom}
    />
  );
};
