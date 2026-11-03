import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import MerchantsExport from '../components/MerchantsExport'; // Import MerchantsExport
import SuiviExport from '../components/SuiviExport'; // Import SuiviExport
import NearbyExport from '../components/NearbyExport'; // Import NearbyExport
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Dashboard.css';
import './Reports.css';

const Reports = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [org, setOrg] = useState({ pams: [], eams: [], users: [] });
  const [selectedPam, setSelectedPam] = useState('');
  const [selectedSam, setSelectedSam] = useState('');
  const [selectedEam, setSelectedEam] = useState('');
  const [exportError, setExportError] = useState('');

  const idOf = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return String(value._id || value);
  };

  const personLabel = (user) => {
    if (!user) return '';
    const name = [user.prenom, user.nom].filter(Boolean).join(' ').trim();
    return name ? `${name} (${user.matricule})` : user.matricule;
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const orgRes = await axios.get(`${API_BASE_URL}/api/organization`, config);
        setOrg({
          pams: orgRes.data?.pams || [],
          eams: orgRes.data?.eams || [],
          users: orgRes.data?.users || [],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const visibleSams = org.users.filter((user) => {
    if (user.role !== 'sam') return false;
    if (!selectedPam) return true;
    return idOf(user.pamId) === selectedPam;
  });
  const visibleEams = org.eams.filter((eam) => {
    if (selectedSam) return idOf(eam.samId) === selectedSam;
    if (selectedPam) return idOf(eam.pamId) === selectedPam;
    return true;
  });

  const handleExport = async () => {
    setExportError('');
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found");
      // You might want to redirect to login or show a message
      return;
    }

    const params = new URLSearchParams();
    const day = (value, end) => {
      if (!value) return '';
      const date = new Date(value);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const number = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${number}${end ? 'T23:59:59' : 'T00:00:00'}`;
    };
    if (startDate) params.append('startDate', day(startDate, false));
    if (endDate) params.append('endDate', day(endDate, true));
    if (selectedPam) params.append('pamId', selectedPam);
    if (selectedSam) params.append('teamId', selectedSam);
    if (selectedEam) params.append('eamId', selectedEam);

    try {
      const res = await axios.get(`${API_BASE_URL}/api/export/performance`, {
        params,
        headers: {
          'x-auth-token': token,
        },
        responseType: 'blob', // Important for file downloads
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const generateFileName = (type) => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHmm
        const uniqueID = Math.random().toString(36).substring(2, 8); // 6-character random string
        return `export_${type}_${date}_${time}_${uniqueID}.xlsx`;
      };

      const filename = generateFileName('performance');
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting performance data:', error);
      setExportError('L’export des performances a échoué.');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="main-header">
          <h1>Rapports</h1>
        </header>

        {/* Merchant Export Card */}
        <div className="card">
            <div className="card-body">
                <MerchantsExport />
            </div>
        </div>

        {/* Suivi Export Card */}
        <div className="card mt-4">
            <div className="card-body">
                <SuiviExport />
            </div>
        </div>

        {/* Nearby Export Card */}
        <div className="card mt-4">
            <div className="card-body">
                <NearbyExport />
            </div>
        </div>

        {/* Performance Export Card */}
        <div className="card mt-4">
          <div className="card-header">
            <h3>Performances du terrain</h3>
          </div>
          <div className="card-body">
            <p className="export-description">
              Enrôlements des équipes, regroupés par équipe et par SAM. Le filtre suit PAM, SAM, puis équipe.
            </p>
            <div className="filters-container">
              <div className="form-group">
                <label>Date de début</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div className="form-group">
                <label>PAM</label>
                <select
                  value={selectedPam}
                  onChange={(event) => {
                    setSelectedPam(event.target.value);
                    setSelectedSam('');
                    setSelectedEam('');
                  }}
                  className="form-control"
                >
                  <option value="">Tous les PAM</option>
                  {org.pams.map((pam) => (
                    <option key={pam._id} value={pam._id}>{pam.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>SAM</label>
                <select
                  value={selectedSam}
                  onChange={(event) => {
                    setSelectedSam(event.target.value);
                    setSelectedEam('');
                  }}
                  className="form-control"
                >
                  <option value="">Tous les SAM</option>
                  {visibleSams.map((sam) => (
                    <option key={sam._id} value={sam._id}>{personLabel(sam)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Équipe</label>
                <select
                  value={selectedEam}
                  onChange={(event) => setSelectedEam(event.target.value)}
                  className="form-control"
                >
                  <option value="">Toutes les équipes</option>
                  {visibleEams.map((eam) => (
                    <option key={eam._id} value={eam._id}>{eam.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            {exportError && <div className="alert alert-danger">{exportError}</div>}
            <button onClick={handleExport} className="btn btn-primary">
              Exporter en Excel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;