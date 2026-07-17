'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapInteractive = dynamic(() => import('../components/MapInteractive'), { 
  ssr: false,
  loading: () => (
    <div className="loading-container" style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner"></div>
      <p className="loading-text">Memuat Peta...</p>
    </div>
  )
});

export default function Home() {
  // State untuk Data Dropdown (List)
  const [provinces, setProvinces] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allVillages, setAllVillages] = useState([]);

  // State untuk Nilai Terpilih (Selected)
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  
  const [selectedRegionInfo, setSelectedRegionInfo] = useState(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoadingGeom, setIsLoadingGeom] = useState(false);

  // 1. Load daftar provinsi saat pertama kali buka
  useEffect(() => {
    fetch('/api/regions?level=adm1')
      .then(res => res.json())
      .then(data => setProvinces(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(err => console.error(err));
  }, []);

  // Helper untuk meload koordinat peta (geometry)
  const loadGeometry = (level, code, regionData) => {
    setIsLoadingGeom(true);
    setSelectedRegionInfo({ ...regionData, level });
    
    fetch(`/api/geometry/${code}`)
      .then(res => res.json())
      .then(data => {
        setGeojsonData(data);
        setIsLoadingGeom(false);
      })
      .catch(err => {
        console.error("Gagal load geometry:", err);
        setIsLoadingGeom(false);
      });
  };

  const handleProvChange = (e) => {
    const code = e.target.value;
    setSelectedProv(code);
    
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedVillage('');

    if (code) {
      const prov = provinces.find(p => p.code === code);
      loadGeometry('adm1', code, prov);

      setIsLoadingRegions(true);
      fetch(`/api/regions?level=adm2&parent=${code}`)
        .then(res => res.json())
        .then(data => {
          setAllCities(data.sort((a, b) => a.name.localeCompare(b.name)));
          setIsLoadingRegions(false);
        });
    } else {
      setSelectedRegionInfo(null);
      setGeojsonData(null);
    }
  };

  const handleCityChange = (e) => {
    const code = e.target.value;
    setSelectedCity(code);
    
    setSelectedDistrict('');
    setSelectedVillage('');
    
    if (code) {
      const city = allCities.find(c => c.code === code);
      loadGeometry('adm2', code, city);
      
      fetch(`/api/regions?level=adm3&parent=${code}`)
        .then(res => res.json())
        .then(data => setAllDistricts(data));
    } else {
      const prov = provinces.find(p => p.code === selectedProv);
      loadGeometry('adm1', selectedProv, prov);
    }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setSelectedDistrict(code);
    
    setSelectedVillage('');
    
    if (code) {
      const district = allDistricts.find(d => d.code === code);
      loadGeometry('adm3', code, district);
      
      fetch(`/api/regions?level=adm4&parent=${code}`)
        .then(res => res.json())
        .then(data => setAllVillages(data));
    } else {
      const city = allCities.find(c => c.code === selectedCity);
      loadGeometry('adm2', selectedCity, city);
    }
  };

  const handleVillageChange = (e) => {
    const code = e.target.value;
    setSelectedVillage(code);
    
    if (code) {
      const village = allVillages.find(v => v.code === code);
      loadGeometry('adm4', code, village);
    } else {
      const district = allDistricts.find(d => d.code === selectedDistrict);
      loadGeometry('adm3', selectedDistrict, district);
    }
  };

  const handleReset = () => {
    setSelectedProv('');
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedVillage('');
    setSelectedRegionInfo(null);
    setGeojsonData(null);
  };

  const filteredCities = allCities.sort((a, b) => a.name.localeCompare(b.name));
  const filteredDistricts = allDistricts.sort((a, b) => a.name.localeCompare(b.name));
  const filteredVillages = allVillages.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="app-container">
      {/* Sidebar Kiri */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>GIS Wilayah Indonesia</h1>
          <p>Praktik Belajar 1</p>
        </div>

        <div className="sidebar-content">
          
          <div className="dropdown-group">
            <label className="dropdown-label">
              Provinsi
            </label>
            <select className={`dropdown-select${!selectedProv ? ' placeholder' : ''}`} value={selectedProv} onChange={handleProvChange}>
              <option value="">Pilih Provinsi</option>
              {provinces.map(prov => (
                <option key={prov.code} value={prov.code}>{prov.name}</option>
              ))}
            </select>
          </div>

          {selectedProv && (
            <div className="dropdown-group">
              <label className="dropdown-label">
                Kabupaten/Kota
              </label>
              <select className={`dropdown-select${!selectedCity ? ' placeholder' : ''}`} value={selectedCity} onChange={handleCityChange} disabled={isLoadingRegions}>
                <option value="">
                  {isLoadingRegions ? 'Memuat...' : 'Semua Kab/Kota'}
                </option>
                {filteredCities.map(city => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedCity && (
            <div className="dropdown-group">
              <label className="dropdown-label">
                Kecamatan
              </label>
              <select className={`dropdown-select${!selectedDistrict ? ' placeholder' : ''}`} value={selectedDistrict} onChange={handleDistrictChange}>
                <option value="">Semua Kecamatan</option>
                {filteredDistricts.map(district => (
                  <option key={district.code} value={district.code}>{district.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedDistrict && (
            <div className="dropdown-group">
              <label className="dropdown-label">
                Desa/Kelurahan
              </label>
              <select className={`dropdown-select${!selectedVillage ? ' placeholder' : ''}`} value={selectedVillage} onChange={handleVillageChange}>
                <option value="">Semua Desa/Kelurahan</option>
                {filteredVillages.map(village => (
                  <option key={village.code} value={village.code}>{village.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedProv && (
            <button 
              onClick={handleReset} 
              style={{ marginTop: '10px', width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Reset Pilihan
            </button>
          )}

          {selectedRegionInfo && (
            <div className="info-card">
              <h3 className="info-card-title">
                {isLoadingGeom ? 'Memuat Peta...' : 'Informasi Wilayah'}
              </h3>
              <div className="info-row">
                <span className="info-row-label">Nama</span>
                <span className="info-row-value">{selectedRegionInfo.name}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Kode</span>
                <span className="info-row-value">{selectedRegionInfo.code}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Tingkat</span>
                <span className="info-row-value highlight">
                  {selectedRegionInfo.level.replace('adm1', 'Provinsi').replace('adm2', 'Kota/Kab').replace('adm3', 'Kecamatan').replace('adm4', 'Desa/Kel')}
                </span>
              </div>
              <div className="info-row">
                <span className="info-row-label">Luas Area</span>
                <span className="info-row-value">{(selectedRegionInfo.shape_area || 0).toLocaleString('id-ID', {maximumFractionDigits: 2})} km²</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="sidebar-footer" suppressHydrationWarning>
          Muhammad Faris Maulana Suryadani
        </div>
      </aside>

      {/* Kontainer Peta di sebelah Kanan */}
      <MapInteractive 
        selectedRegion={selectedRegionInfo} 
        geojsonData={geojsonData} 
      />
    </main>
  );
}
