import React, { useState, useMemo } from 'react';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import {
  getStatesList,
  getDistrictsForStates,
  getCitiesForDistricts,
} from '../../utils/locations';

export default function MultiSelectLocationPicker({
  selectedStates = [],
  selectedDistricts = [],
  selectedCities = [],
  onChange,
}) {
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // 1. Available States
  const allStates = useMemo(() => getStatesList(), []);
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return allStates;
    const query = stateSearch.toLowerCase().trim();
    return allStates.filter((st) => st.toLowerCase().includes(query));
  }, [allStates, stateSearch]);

  // 2. Available Districts (shows all remaining districts if no state selected)
  const availableDistricts = useMemo(
    () => getDistrictsForStates(selectedStates),
    [selectedStates]
  );
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return availableDistricts;
    const query = districtSearch.toLowerCase().trim();
    return availableDistricts.filter((d) => d.toLowerCase().includes(query));
  }, [availableDistricts, districtSearch]);

  // 3. Available Cities (shows all remaining cities if no district selected)
  const availableCities = useMemo(
    () => getCitiesForDistricts(selectedStates, selectedDistricts),
    [selectedStates, selectedDistricts]
  );
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return availableCities;
    const query = citySearch.toLowerCase().trim();
    return availableCities.filter((c) => c.toLowerCase().includes(query));
  }, [availableCities, citySearch]);

  // Toggle State
  const toggleState = (st) => {
    const isSel = selectedStates.includes(st);
    const nextStates = isSel
      ? selectedStates.filter((s) => s !== st)
      : [...selectedStates, st];

    const validD = getDistrictsForStates(nextStates);
    const nextDistricts = selectedDistricts.filter((d) => validD.includes(d));

    const validC = getCitiesForDistricts(nextStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c));

    onChange({ states: nextStates, districts: nextDistricts, cities: nextCities });
  };

  // Toggle District
  const toggleDistrict = (dist) => {
    const isSel = selectedDistricts.includes(dist);
    const nextDistricts = isSel
      ? selectedDistricts.filter((d) => d !== dist)
      : [...selectedDistricts, dist];

    const validC = getCitiesForDistricts(selectedStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c));

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
  const selectAllStates = () => {
    const nextStates = Array.from(new Set([...selectedStates, ...filteredStates]));
    const validD = getDistrictsForStates(nextStates);
    const nextDistricts = selectedDistricts.filter((d) => validD.includes(d));
    const validC = getCitiesForDistricts(nextStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c));
    onChange({ states: nextStates, districts: nextDistricts, cities: nextCities });
  };

  const clearAllStates = () => {
    onChange({ states: [], districts: [], cities: [] });
  };

  const selectAllDistricts = () => {
    const nextDistricts = Array.from(new Set([...selectedDistricts, ...filteredDistricts]));
    const validC = getCitiesForDistricts(selectedStates, nextDistricts);
    const nextCities = selectedCities.filter((c) => validC.includes(c));
    onChange({ states: selectedStates, districts: nextDistricts, cities: nextCities });
  };

  const clearAllDistricts = () => {
    onChange({ states: selectedStates, districts: [], cities: [] });
  };

  const selectAllCities = () => {
    const nextCities = Array.from(new Set([...selectedCities, ...filteredCities]));
    onChange({ states: selectedStates, districts: selectedDistricts, cities: nextCities });
  };

  const clearAllCities = () => {
    onChange({ states: selectedStates, districts: selectedDistricts, cities: [] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. STATE SELECTION */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            🏛️ Assigned State(s)
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: selectedStates.length > 0 ? '#D1FAE5' : '#E2E8F0', color: selectedStates.length > 0 ? '#065F46' : '#64748B' }}>
              {selectedStates.length} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={selectAllStates}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0369A1', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Select All
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
            placeholder="🔍 Search state name..."
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
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

      {/* 2. DISTRICT SELECTION */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            📍 Assigned District(s)
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: selectedDistricts.length > 0 ? '#DBEAFE' : '#E2E8F0', color: selectedDistricts.length > 0 ? '#1E40AF' : '#64748B' }}>
              {selectedDistricts.length} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={selectAllDistricts}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0369A1', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Select All
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

        {/* Search District Box */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
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

        {/* District Pills Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', paddingRight: 4 }}>
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

      {/* 3. CITY / REGION SELECTION */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            🏘️ Assigned City / Region(s)
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: selectedCities.length > 0 ? '#EDE9FE' : '#E2E8F0', color: selectedCities.length > 0 ? '#4C1D95' : '#64748B' }}>
              {selectedCities.length} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={selectAllCities}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0369A1', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Select All
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

        {/* Search City Box */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
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

        {/* City Pills Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
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
    </div>
  );
}
