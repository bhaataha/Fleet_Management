'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/stores/auth';
import api from '@/lib/api';

interface Driver {
  id: number;
  name: string;
  phone: string;
  user_id: number;
}

interface Job {
  id: number;
  driver_id: number;
  status: string;
  from_site_id: number;
  to_site_id: number;
  scheduled_date: string;
}

interface JobStatusEvent {
  id: number;
  job_id: number;
  status: string;
  event_time: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
}

interface Site {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
}

interface DriverLocation {
  driver: Driver;
  job: Job | null;
  lastEvent: JobStatusEvent | null;
  site: Site | null;
}

export default function FleetTrackingPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS and JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        initializeMap();
        setMapInitialized(true);
      }, 100);
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (mapInitialized) {
      loadFleetLocations();
    }
  }, [mapInitialized]);

  useEffect(() => {
    if (!mapInitialized) return;
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadFleetLocations();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, mapInitialized]);

  function initializeMap() {
    try {
      const mapElement = document.getElementById('fleet-map');
      if (!mapElement || !(window as any).L) return;

      const L = (window as any).L;
      const map = L.map('fleet-map').setView([31.5, 34.75], 8);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      (window as any).fleetMap = map;
      console.log('Map initialized');
    } catch (err) {
      console.error('Failed to initialize map:', err);
    }
  }

  async function loadFleetLocations() {
    try {
      setLoading(true);
      
      const [driversRes, jobsRes, sitesRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/jobs'),
        api.get('/sites')
      ]);
      
      const drivers: Driver[] = driversRes.data;
      const jobs: Job[] = jobsRes.data;
      const sites: Site[] = sitesRes.data;
      
      const driverLocations: DriverLocation[] = [];
      
      for (const driver of drivers) {
        const activeJob = jobs.find(j => 
          j.driver_id === driver.id && 
          ['ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF'].includes(j.status)
        );
        
        let lastEvent: JobStatusEvent | null = null;
        let site: Site | null = null;
        
        if (activeJob) {
          try {
            const eventsRes = await api.get(`/jobs/${activeJob.id}/status-events`);
            const events: JobStatusEvent[] = eventsRes.data;
            
            lastEvent = events
              .filter(e => e.lat !== null && e.lng !== null)
              .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())[0] || null;
          } catch (err) {
            console.error(`Failed to load events for job ${activeJob.id}`);
          }
          
          if (activeJob.status === 'ENROUTE_PICKUP' || activeJob.status === 'ASSIGNED') {
            site = sites.find(s => s.id === activeJob.from_site_id) || null;
          } else {
            site = sites.find(s => s.id === activeJob.to_site_id) || null;
          }
        }
        
        driverLocations.push({
          driver,
          job: activeJob || null,
          lastEvent,
          site
        });
      }
      
      setLocations(driverLocations);
      updateMapMarkers(driverLocations, sites);
    } catch (error) {
      console.error('Failed to load fleet locations:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateMapMarkers(locations: DriverLocation[], sites: Site[]) {
    const map = (window as any).fleetMap;
    const L = (window as any).L;
    if (!map || !L) return;

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add driver markers
    locations.forEach(loc => {
      if (loc.lastEvent?.lat && loc.lastEvent?.lng) {
        const icon = L.divIcon({
          html: `<div style="background:${loc.job ? '#2563eb' : '#6b7280'};color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚛</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        
        L.marker([loc.lastEvent.lat, loc.lastEvent.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${loc.driver.name}</b><br>${getStatusLabel(loc.job?.status || 'N/A')}<br>${loc.site?.name || ''}`);
      }
    });

    // Add site markers
    sites.forEach(site => {
      if (site.lat && site.lng) {
        const icon = L.divIcon({
          html: '<div style="background:#10b981;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);">📍</div>',
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        
        L.marker([site.lat, site.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${site.name}</b>`);
      }
    });
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ASSIGNED': 'משובץ',
      'ENROUTE_PICKUP': 'בדרך לטעינה',
      'LOADED': 'נטען',
      'ENROUTE_DROPOFF': 'בדרך לפריקה',
      'DELIVERED': 'נמסר',
    };
    return labels[status] || status;
  }

  function getTimeSince(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'כרגע';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    return `לפני ${Math.floor(diffHours / 24)} ימים`;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🗺️ מעקב צי בזמן אמת</h1>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">רענון אוטומטי (30 שניות)</span>
            </label>
            <button
              onClick={() => loadFleetLocations()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '...מעדכן' : '🔄 רענן'}
            </button>
          </div>
        </div>

        {!mapInitialized ? (
          <div className="text-center py-12">טוען מפה...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div id="fleet-map" className="w-full h-[600px] rounded-lg"></div>
              </div>
            </div>

            {/* Drivers List */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg mb-4">נהגים פעילים ({locations.filter(l => l.job).length}/{locations.length})</h2>
              
              {loading && locations.length === 0 ? (
                <div className="text-center py-8">טוען...</div>
              ) : (
                locations.map((loc) => (
                  <div
                    key={loc.driver.id}
                    className={`bg-white rounded-lg shadow p-4 ${
                      loc.job ? 'border-r-4 border-blue-500' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{loc.driver.name}</div>
                      {loc.lastEvent && (
                        <div className="text-xs text-gray-500">
                          {getTimeSince(loc.lastEvent.event_time)}
                        </div>
                      )}
                    </div>
                    
                    {loc.job ? (
                      <>
                        <div className="text-sm text-gray-700 mb-1">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {getStatusLabel(loc.job.status)}
                          </span>
                        </div>
                        
                        {loc.site && (
                          <div className="text-sm text-gray-600">
                            📍 {loc.site.name}
                          </div>
                        )}
                        
                        {loc.lastEvent?.lat && loc.lastEvent?.lng && (
                          <div className="text-xs text-gray-500 mt-2">
                            GPS: {loc.lastEvent.lat.toFixed(4)}, {loc.lastEvent.lng.toFixed(4)}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">לא בנסיעה</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
