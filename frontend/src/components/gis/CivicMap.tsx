import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CivicIssue, PriorityLevel } from '../../services/types';
import { Filter, RefreshCw, Flame } from 'lucide-react';

interface CivicMapProps {
  issues: CivicIssue[];
  selectedIssue?: CivicIssue | null;
  onSelectIssue?: (issue: CivicIssue) => void;
  height?: string;
  showFilters?: boolean;
  filterCategory?: string;
  setFilterCategory?: (cat: string) => void;
  filterPriority?: string;
  setFilterPriority?: (prio: string) => void;
  showHeatmap?: boolean;
  setShowHeatmap?: (show: boolean) => void;
}

// Enterprise priority colors
const getPriorityColor = (priority: PriorityLevel) => {
  switch (priority) {
    case 'critical': return '#DC2626'; // Muted Red
    case 'high': return '#EA580C';     // Muted Orange
    case 'medium': return '#D69E2E';   // Muted Amber
    case 'low': return '#16845B';      // Muted Green
    default: return '#64748B';
  }
};

export const CivicMap: React.FC<CivicMapProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
  height = '500px',
  showFilters = false,
  filterCategory: externalFilterCategory,
  setFilterCategory: externalSetFilterCategory,
  filterPriority: externalFilterPriority,
  setFilterPriority: externalSetFilterPriority,
  showHeatmap: externalShowHeatmap,
  setShowHeatmap: externalSetShowHeatmap
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Internal filter state fallback if not controlled externally
  const [internalHeatmap, setInternalHeatmap] = useState(false);
  const [internalCategory, setInternalCategory] = useState('all');
  const [internalPriority, setInternalPriority] = useState('all');

  const showHeatmap = externalShowHeatmap !== undefined ? externalShowHeatmap : internalHeatmap;
  const setShowHeatmap = externalSetShowHeatmap || setInternalHeatmap;
  const filterCategory = externalFilterCategory !== undefined ? externalFilterCategory : internalCategory;
  const setFilterCategory = externalSetFilterCategory || setInternalCategory;
  const filterPriority = externalFilterPriority !== undefined ? externalFilterPriority : internalPriority;
  const setFilterPriority = externalSetFilterPriority || setInternalPriority;

  // Create clean, minimal circular marker
  const createCustomMarker = (issue: CivicIssue, isSelected: boolean) => {
    const color = getPriorityColor(issue.priority.priority_level);
    const size = isSelected ? 22 : 16;
    const borderWidth = isSelected ? 3 : 2;

    const html = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: ${borderWidth}px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        ${isSelected ? `box-shadow: 0 0 0 4px ${color}33, 0 3px 8px rgba(0,0,0,0.3);` : ''}
      ">
        <div style="
          width: ${isSelected ? 8 : 5}px;
          height: ${isSelected ? 8 : 5}px;
          border-radius: 50%;
          background-color: #FFFFFF;
        "></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'civic-gis-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 2]
    });
  };

  // Initialize Leaflet Map with OpenStreetMap standard tiles (No API key required)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Pune municipal urban center coordinates: 18.5204, 73.8567
      const map = L.map(mapContainerRef.current, {
        center: [18.5204, 73.8567],
        zoom: 13,
        scrollWheelZoom: true,
        zoomControl: true
      });

      // Standard OpenStreetMap public tile provider — free, reliable, no API key required
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | CivicLens AI (Pune)',
        maxZoom: 19,
        minZoom: 10
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const heatmapGroup = L.layerGroup();

      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;
      heatmapLayerRef.current = heatmapGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers and Heatmap
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const heatmapGroup = heatmapLayerRef.current;
    if (!map || !markersGroup || !heatmapGroup) return;

    markersGroup.clearLayers();
    heatmapGroup.clearLayers();
    markersMapRef.current.clear();

    const filtered = issues.filter(iss => {
      if (filterCategory !== 'all' && iss.category !== filterCategory) return false;
      if (filterPriority !== 'all' && iss.priority.priority_level !== filterPriority) return false;
      return true;
    });

    if (showHeatmap) {
      // Calculated spatial intensity heatmap layer
      filtered.forEach(iss => {
        const radius = Math.max(100, iss.priority.raw_score * 3);
        const color = getPriorityColor(iss.priority.priority_level);

        const circle = L.circle([iss.location.latitude, iss.location.longitude], {
          radius: radius,
          fillColor: color,
          fillOpacity: 0.25,
          color: color,
          weight: 1,
          opacity: 0.6
        });

        circle.bindPopup(`
          <div style="font-family: Inter, system-ui, sans-serif; font-size: 11px; line-height: 1.4; padding: 2px;">
            <strong style="color: #17365D;">${iss.issue_code}</strong><br/>
            <span style="color: #1F2937; font-weight: 500;">${iss.title}</span><br/>
            <span style="color: ${color}; font-weight: 700;">Density Score: ${iss.priority.raw_score}/100</span>
          </div>
        `);

        heatmapGroup.addLayer(circle);
      });

      if (!map.hasLayer(heatmapGroup)) {
        map.addLayer(heatmapGroup);
      }
      if (map.hasLayer(markersGroup)) {
        map.removeLayer(markersGroup);
      }
    } else {
      // Standard minimal dot markers
      filtered.forEach(iss => {
        const isSelected = selectedIssue?.id === iss.id;
        const color = getPriorityColor(iss.priority.priority_level);

        const marker = L.marker([iss.location.latitude, iss.location.longitude], {
          icon: createCustomMarker(iss, isSelected),
          zIndexOffset: isSelected ? 1000 : 0
        });

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'Inter, system-ui, sans-serif';
        popupContent.style.fontSize = '12px';
        popupContent.style.padding = '2px';
        popupContent.style.maxWidth = '240px';

        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #17365D; background: #EAF1F8; padding: 1px 6px; border-radius: 4px; border: 1px solid #C8DCF0;">
              ${iss.issue_code}
            </span>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color};">
              ${iss.priority.priority_level} (${iss.priority.raw_score})
            </span>
          </div>
          <div style="font-weight: 600; font-size: 12px; color: #1F2937; line-height: 1.35; margin-bottom: 5px;">
            ${iss.title}
          </div>
          <div style="color: #64748B; font-size: 11px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
            <span>📍</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${iss.location.address}, ${iss.location.ward}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #475569; padding-top: 5px; border-top: 1px solid #E2E8F0; margin-bottom: 8px;">
            <span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px;">
              ${iss.category.replace('_', ' ')}
            </span>
            <span style="font-weight: 600; text-transform: capitalize;">
              ${iss.status.replace('_', ' ')}
            </span>
          </div>
        `;

        const actionBtn = document.createElement('button');
        actionBtn.innerText = 'View Issue Intelligence';
        actionBtn.style.width = '100%';
        actionBtn.style.padding = '5px 8px';
        actionBtn.style.backgroundColor = '#17365D';
        actionBtn.style.color = '#FFFFFF';
        actionBtn.style.border = 'none';
        actionBtn.style.borderRadius = '5px';
        actionBtn.style.fontSize = '11px';
        actionBtn.style.fontWeight = '600';
        actionBtn.style.cursor = 'pointer';

        actionBtn.onclick = () => {
          if (onSelectIssue) onSelectIssue(iss);
        };
        popupContent.appendChild(actionBtn);

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectIssue) onSelectIssue(iss);
        });

        markersGroup.addLayer(marker);
        markersMapRef.current.set(iss.id, marker);
      });

      if (!map.hasLayer(markersGroup)) {
        map.addLayer(markersGroup);
      }
      if (map.hasLayer(heatmapGroup)) {
        map.removeLayer(heatmapGroup);
      }
    }
  }, [issues, selectedIssue, showHeatmap, filterCategory, filterPriority]);

  // Center on selected issue and trigger popup
  useEffect(() => {
    if (selectedIssue && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedIssue.location.latitude, selectedIssue.location.longitude],
        15,
        { duration: 0.8 }
      );
      const marker = markersMapRef.current.get(selectedIssue.id);
      if (marker && !showHeatmap) {
        marker.openPopup();
      }
    }
  }, [selectedIssue, showHeatmap]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([18.5204, 73.8567], 13, { duration: 0.8 });
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white w-full h-full flex flex-col">
      {/* Optional In-Map Filter Controls Bar */}
      {showFilters && (
        <div className="p-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#17365D]" /> Filters:
            </span>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 text-xs font-medium outline-none bg-white"
            >
              <option value="all">All Categories</option>
              <option value="roads_infrastructure">Roads</option>
              <option value="drainage_flooding">Drainage</option>
              <option value="solid_waste">Waste</option>
              <option value="streetlighting">Lighting</option>
              <option value="water_supply">Water</option>
              <option value="public_parks">Parks</option>
              <option value="traffic_signals">Traffic</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 text-xs font-medium outline-none bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                showHeatmap
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{showHeatmap ? 'Heatmap Active' : 'Heatmap'}</span>
            </button>

            <button
              onClick={resetView}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
              title="Reset view to city center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full flex-1 z-0" />

      {/* Compact Enterprise Floating Priority Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200 text-[10px] flex items-center gap-2.5">
        <span className="font-semibold text-slate-600 uppercase text-[9px] tracking-wider">Priority:</span>
        <div className="flex items-center gap-1 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Critical
        </div>
        <div className="flex items-center gap-1 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#EA580C]" /> High
        </div>
        <div className="flex items-center gap-1 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#D69E2E]" /> Medium
        </div>
        <div className="flex items-center gap-1 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-[#16845B]" /> Low
        </div>
      </div>
    </div>
  );
};
