import React, { useState, useMemo } from 'react';
import { HiOutlineSearch, HiOutlineX, HiOutlinePlus, HiOutlineSparkles, HiOutlineCheck } from 'react-icons/hi';
import {
  getStatesList,
  getDistrictsForStates,
  getCitiesForDistricts,
  STATE_ZONES,
} from '../../utils/locations';

export default function MultiSelectLocationPicker({
  selectedStates = [],
  selectedDistricts = [],
  selectedCities = [],
  onChange,
}) {
  const [activeZone, setActiveZone] = useState('All Zones');
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Custom added items
  const [customDistrictInput, setCustomDistrictInput] = useState('');
  const [customCityInput, setCustomCityInput] = useState('');
  const [userCustomDistricts, setUserCustomDistricts] = useState([]);
  const [userCustomCities, setUserCustomCities] = useState([]);

  // 1. Available States (Filtered by Zone & Search Query)
  const allStates = useMemo(() => getStatesList(), []);
  
  const zoneStates = useMemo(() => {
    if (activeZone === 'All Zones') return allStates;
    return STATE_ZONES[activeZone] || allStates;
  }, [allStates, activeZone]);

  const filteredStates = useMemo(() => {
    let list = zoneStates;
    if (stateSearch.trim()) {
      const query = stateSearch.toLowerCase().trim();
      list = list.filter((st) => st.toLowerCase().includes(query));
    }
    return list;
  }, [zoneStates, stateSearch]);

  // 2. Available Districts
  const baseDistricts = useMemo(
    () => getDistrictsForStates(selectedStates),
    [selectedStates]
  );

  const availableDistricts = useMemo(
    () => Array.from(new Set([...baseDistricts, ...userCustomDistricts])),
    [baseDistricts, userCustomDistricts]
  );

  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return availableDistricts;
    const query = districtSearch.toLowerCase().trim();
    return availableDistricts.filter((d) => d.toLowerCase().includes(query));
  }, [availableDistricts, districtSearch]);

  // 3. Available Cities
  const baseCities = useMemo(
    () => getCitiesForDistricts(selectedStates, selectedDistricts),
    [selectedStates, selectedDistricts]
  );

  const availableCities = useMemo(
    () => Array.from(new Set([...baseCities, ...userCustomCities])),
    [baseCities, userCustomCities]
  );

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return availableCities;
    const query = citySearch.toLowerCase().trim();
    return availableCities.filter((c) => c.toLowerCase().includes(query));
  }, [availableCities, citySearch]);

  // All India Selected Check
  const isAllIndiaSelected = useMemo(
    () => allStates.length > 0 && selectedStates.length >= allStates.length,
    [allStates, selectedStates]
  );

  // Toggle All India Selection
  const toggleAllIndia = () => {
    if (isAllIndiaSelected) {
      onChange({ states: [], districts: [], cities: [] });
    } else {
      const nextStates = [...allStates];
      const validD = getDistrictsForStates(nextStates);
      const validC = getCitiesForDistricts(nextStates, validD);
      onChange({ states: nextStates, districts: validD, cities: validC });
    }
  };

  // Toggle State
  const toggleState = (st) => {
    const isSel = selectedStates.includes(st);
    const nextStates = isSel
      ? selectedStates.filter((s) => s !== st)
      : [...selectedStates, st];

    const validD = getDistrictsForStates(nextStates);
    const nextDistricts = selectedDistricts.filter((d) => validD.includes(d) || userCustomDistricts.includes(d));

    const validC = getCitiesForDistricts(nextStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c) || userCustomCities.includes(c));

    onChange({ states: nextStates, districts: nextDistricts, cities: nextCities });
  };

  // Toggle District
  const toggleDistrict = (dist) => {
    const isSel = selectedDistricts.includes(dist);
    const nextDistricts = isSel
      ? selectedDistricts.filter((d) => d !== dist)
      : [...selectedDistricts, dist];

    const validC = getCitiesForDistricts(selectedStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c) || userCustomCities.includes(c));

    onChange({ states: selectedStates, districts: nextDistricts, cities: nextCities });
  };

  // Toggle City
  const toggleCity = (city) => {
    const isSel = selectedCities.includes(city);
    const nextCities = isSel
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];

    onChange({ states: selectedStates, districts: selectedDistricts, cities: nextCities });
  };

  // Select All / Clear All Helpers
  const selectAllFilteredStates = () => {
    const nextStates = Array.from(new Set([...selectedStates, ...filteredStates]));
    const validD = getDistrictsForStates(nextStates);
    const nextDistricts = selectedDistricts.filter((d) => validD.includes(d) || userCustomDistricts.includes(d));
    const validC = getCitiesForDistricts(nextStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c) || userCustomCities.includes(c));
    onChange({ states: nextStates, districts: nextDistricts, cities: nextCities });
  };

  const clearAllStates = () => {
    onChange({ states: [], districts: [], cities: [] });
  };

  const selectAllFilteredDistricts = () => {
    const nextDistricts = Array.from(new Set([...selectedDistricts, ...filteredDistricts]));
    const validC = getCitiesForDistricts(selectedStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c) || userCustomCities.includes(c));
    onChange({ states: selectedStates, districts: nextDistricts, cities: nextCities });
  };

  const clearAllDistricts = () => {
    onChange({ states: selectedStates, districts: [], cities: [] });
  };

  const selectAllFilteredCities = () => {
    const nextCities = Array.from(new Set([...selectedCities, ...filteredCities]));
    onChange({ states: selectedStates, districts: selectedDistricts, cities: nextCities });
  };

  const clearAllCities = () => {
    onChange({ states: selectedStates, districts: selectedDistricts, cities: [] });
  };

  // Custom District Adder
  const handleAddCustomDistrict = () => {
    const trimmed = customDistrictInput.trim();
    if (!trimmed) return;
    if (!userCustomDistricts.includes(trimmed)) {
      setUserCustomDistricts((prev) => [...prev, trimmed]);
    }
    if (!selectedDistricts.includes(trimmed)) {
      onChange({
        states: selectedStates,
        districts: [...selectedDistricts, trimmed],
        cities: selectedCities,
      });
    }
    setCustomDistrictInput('');
  };

  // Custom City Adder
  const handleAddCustomCity = () => {
    const trimmed = customCityInput.trim();
    if (!trimmed) return;
    if (!userCustomCities.includes(trimmed)) {
      setUserCustomCities((prev) => [...prev, trimmed]);
    }
    if (!selectedCities.includes(trimmed)) {
      onChange({
        states: selectedStates,
        districts: selectedDistricts,
        cities: [...selectedCities, trimmed],
      });
    }
    setCustomCityInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ALL-INDIA QUICK PRESET BAR & ZONE FILTER TABS */}
      <div style={{ background: '#F1F5F9', padding: '10px 12px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiOutlineSparkles style={{ color: '#4F46E5', fontSize: 16 }} /> Location Coverage Controls
          </div>

          <button
            type="button"
            onClick={toggleAllIndia}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: isAllIndiaSelected ? '1.5px solid #059669' : '1.5px solid #4F46E5',
              background: isAllIndiaSelected ? '#D1FAE5' : '#4F46E5',
              color: isAllIndiaSelected ? '#065F46' : 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(79,70,229,0.15)',
              transition: 'all 0.15s',
            }}
          >
            🇮🇳 {isAllIndiaSelected ? '✓ All India Coverage Active' : 'Select All India Coverage'}
          </button>
        </div>

        {/* Regional Zone Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Regional Zone:</span>
          {['All Zones', 'South', 'North', 'West', 'East', 'Central & NE'].map((zone) => {
            const active = activeZone === zone;
            return (
              <button
                key={zone}
                type="button"
                onClick={() => setActiveZone(zone)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: active ? '1.5px solid #3B82F6' : '1px solid #CBD5E1',
                  background: active ? '#DBEAFE' : 'white',
                  color: active ? '#1E40AF' : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {zone}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. STATE SELECTION SECTION */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            🏛️ State(s) & UTs ({filteredStates.length} shown)
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: selectedStates.length > 0 ? '#D1FAE5' : '#E2E8F0', color: selectedStates.length > 0 ? '#065F46' : '#64748B' }}>
              {selectedStates.length} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={selectAllFilteredStates}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0369A1', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Select Shown ({filteredStates.length})
            </button>
            {selectedStates.length > 0 && (
              <button
                type="button"
                onClick={clearAllStates}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#FEE2E2', color: '#991B1B', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search State Box */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 14 }} />
          <input
            type="text"
            placeholder="🔍 Search state or UT (e.g. Kerala, Delhi, Maharashtra)..."
            value={stateSearch}
            onChange={(e) => setStateSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 28px 6px 30px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 12,
              outline: 'none',
              background: 'white',
            }}
          />
          {stateSearch && (
            <HiOutlineX
              onClick={() => setStateSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer', fontSize: 14 }}
            />
          )}
        </div>

        {/* State Pills Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
          {filteredStates.map((st) => {
            const isSel = selectedStates.includes(st);
            return (
              <button
                key={st}
                type="button"
                onClick={() => toggleState(st)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 18,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSel ? '1.5px solid #059669' : '1.5px solid #CBD5E1',
                  background: isSel ? '#D1FAE5' : 'white',
                  color: isSel ? '#065F46' : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {isSel ? '✓ ' : ''}{st}
              </button>
            );
          })}
          {filteredStates.length === 0 && (
            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '4px 0' }}>
              No state found matching "{stateSearch}"
            </div>
          )}
        </div>

        {selectedStates.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#059669', fontWeight: 600 }}>
            ✅ Selected States: {selectedStates.join(', ')}
          </div>
        )}
      </div>

      {/* 2. DISTRICT SELECTION SECTION */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            📍 District(s) ({filteredDistricts.length} shown)
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: selectedDistricts.length > 0 ? '#DBEAFE' : '#E2E8F0', color: selectedDistricts.length > 0 ? '#1E40AF' : '#64748B' }}>
              {selectedDistricts.length} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={selectAllFilteredDistricts}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0369A1', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Select Shown ({filteredDistricts.length})
            </button>
            {selectedDistricts.length > 0 && (
              <button
                type="button"
                onClick={clearAllDistricts}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#FEE2E2', color: '#991B1B', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search District & Add Custom District Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 14 }} />
            <input
              type="text"
              placeholder="🔍 Search district name..."
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                outline: 'none',
                background: 'white',
              }}
            />
            {districtSearch && (
              <HiOutlineX
                onClick={() => setDistrictSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer', fontSize: 14 }}
              />
            )}
          </div>

          {/* Quick Custom District Adder */}
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="text"
              placeholder="+ Add custom district"
              value={customDistrictInput}
              onChange={(e) => setCustomDistrictInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomDistrict())}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                outline: 'none',
                width: 140,
                background: 'white',
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomDistrict}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#2563EB',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <HiOutlinePlus /> Add
            </button>
          </div>
        </div>

        {/* District Pills Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
          {filteredDistricts.map((dist) => {
            const isSel = selectedDistricts.includes(dist);
            return (
              <button
                key={dist}
                type="button"
                onClick={() => toggleDistrict(dist)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 18,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSel ? '1.5px solid #2563EB' : '1.5px solid #CBD5E1',
                  background: isSel ? '#DBEAFE' : 'white',
                  color: isSel ? '#1E40AF' : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {isSel ? '✓ ' : ''}{dist}
              </button>
            );
          })}
          {filteredDistricts.length === 0 && (
            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '4px 0' }}>
              No district found matching "{districtSearch}"
            </div>
          )}
        </div>

        {selectedDistricts.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#2563EB', fontWeight: 600 }}>
            ✅ Selected Districts: {selectedDistricts.join(', ')}
          </div>
        )}
      </div>

      {/* 3. CITY / REGION SELECTION SECTION */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            🏘️ City / Town / Region(s) ({filteredCities.length} shown)
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: selectedCities.length > 0 ? '#EDE9FE' : '#E2E8F0', color: selectedCities.length > 0 ? '#4C1D95' : '#64748B' }}>
              {selectedCities.length} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={selectAllFilteredCities}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0369A1', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Select Shown ({filteredCities.length})
            </button>
            {selectedCities.length > 0 && (
              <button
                type="button"
                onClick={clearAllCities}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#FEE2E2', color: '#991B1B', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search City & Add Custom City Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 14 }} />
            <input
              type="text"
              placeholder="🔍 Search city / town name..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 28px 6px 30px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                outline: 'none',
                background: 'white',
              }}
            />
            {citySearch && (
              <HiOutlineX
                onClick={() => setCitySearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer', fontSize: 14 }}
              />
            )}
          </div>

          {/* Quick Custom City Adder */}
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="text"
              placeholder="+ Add custom city"
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomCity())}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                outline: 'none',
                width: 140,
                background: 'white',
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomCity}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: '#6C63FF',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <HiOutlinePlus /> Add
            </button>
          </div>
        </div>

        {/* City Pills Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto', paddingRight: 4 }}>
          {filteredCities.map((city) => {
            const isSel = selectedCities.includes(city);
            return (
              <button
                key={city}
                type="button"
                onClick={() => toggleCity(city)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 18,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSel ? '1.5px solid #6C63FF' : '1.5px solid #CBD5E1',
                  background: isSel ? '#EDE9FE' : 'white',
                  color: isSel ? '#4C1D95' : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {isSel ? '✓ ' : ''}{city}
              </button>
            );
          })}
          {filteredCities.length === 0 && (
            <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '4px 0' }}>
              No city found matching "{citySearch}"
            </div>
          )}
        </div>

        {selectedCities.length > 0 && (
          <div style={{ marginTop: 6, padding: '6px 10px', background: '#F5F3FF', borderRadius: 8, fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
            ✅ {selectedCities.length} region{selectedCities.length > 1 ? 's' : ''} selected: {selectedCities.join(' • ')}
          </div>
        )}
      </div>

      {/* SUMMARY STATUS FOOTER BAR */}
      <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '8px 12px', border: '1px solid #C7D2FE', fontSize: 12, color: '#3730A3', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span>📍 Coverage Summary:</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <span>🏛️ {selectedStates.length} State(s)</span>
          <span>📍 {selectedDistricts.length} District(s)</span>
          <span>🏘️ {selectedCities.length} City/Town(s)</span>
        </div>
      </div>
    </div>
  );
}
