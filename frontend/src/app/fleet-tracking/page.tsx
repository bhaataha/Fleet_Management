'use client';

import { useEffect, useState, useRef } from 'react';
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
  displayLat: number | null;
  displayLng: number | null;
  locationSource: 'gps' | 'site' | null;
}

export default function FleetTrackingPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const geocodeAttempted = useRef(false);

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
      if ((window as any).fleetMap) {
        setMapInitialized(true)
        return
      }
      console.log('Initializing map...');
      const mapElement = document.getElementById('fleet-map');
      console.log('Map element:', mapElement);
      
      if (!mapElement) {
        console.error('Map element not found');
        return;
      }
      
      if (!(window as any).L) {
        console.error('Leaflet not loaded');
        return;
      }

      const L = (window as any).L;
      console.log('Creating map instance...');
      const map = L.map('fleet-map').setView([31.5, 34.75], 8);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      (window as any).fleetMap = map;
      console.log('✅ Map initialized successfully');
      setMapInitialized(true);
      
      // Force map to invalidate size after a short delay
      setTimeout(() => {
        map.invalidateSize();
      }, 500);
    } catch (err) {
      console.error('❌ Failed to initialize map:', err);
    }
  }

  async function loadFleetLocations() {
    try {
      console.log('🔄 Loading fleet locations...');
      setLoading(true);
      
      const now = new Date();
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 2);
      const toDate = new Date(now);
      toDate.setDate(now.getDate() + 2);
      const formatDate = (date: Date) => date.toISOString().slice(0, 10);

      const [driversRes, jobsRes, sitesRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/jobs', {
          params: {
            limit: 1000,
            from_date: formatDate(fromDate),
            to_date: formatDate(toDate)
          }
        }),
        api.get('/sites')
      ]);
      
      const drivers: Driver[] = driversRes.data;
      const jobs: Job[] = jobsRes.data;
      let sites: Site[] = sitesRes.data;

      if (!geocodeAttempted.current) {
        geocodeAttempted.current = true;
        try {
          const geocodeRes = await api.post('/sites/geocode-missing', null, { params: { limit: 10 } })
          if (geocodeRes.data?.updated > 0) {
            const refreshedSites = await api.get('/sites')
            sites = refreshedSites.data || sites
          }
        } catch (error) {
          console.warn('⚠️ Failed to geocode missing sites:', error)
        }
      }
      
      console.log(`📊 Loaded: ${drivers.length} drivers, ${jobs.length} jobs, ${sites.length} sites`);
      
      const driverLocations: DriverLocation[] = [];
      
      for (const driver of drivers) {
        const driverJobs = jobs
          .filter(j => j.driver_id === driver.id)
          .filter(j => ['ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF', 'DELIVERED'].includes(j.status))
          .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

        const activeJob = driverJobs[0];
        
        let lastEvent: JobStatusEvent | null = null;
        let site: Site | null = null;
        let displayLat: number | null = null;
        let displayLng: number | null = null;
        let locationSource: 'gps' | 'site' | null = null;
        
        if (activeJob) {
          try {
            const eventsRes = await api.get(`/jobs/${activeJob.id}/status-events`);
            const events: JobStatusEvent[] = eventsRes.data;
            
            console.log(`📍 Driver ${driver.name} has ${events.length} events`);
            
            lastEvent = events
              .filter(e => e.lat !== null && e.lng !== null)
              .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())[0] || null;
            
            if (lastEvent) {
              console.log(`🎯 Driver ${driver.name} last GPS: ${lastEvent.lat}, ${lastEvent.lng}`);
            } else {
              console.log(`⚠️ Driver ${driver.name} has no GPS data`);
            }
            
            const toSite = sites.find(s => s.id === activeJob.to_site_id) || null;
            const fromSite = sites.find(s => s.id === activeJob.from_site_id) || null;
            site = toSite || fromSite;

            if (lastEvent?.lat !== null && lastEvent?.lng !== null) {
              displayLat = lastEvent.lat;
              displayLng = lastEvent.lng;
              locationSource = 'gps';
            } else if (toSite?.lat && toSite?.lng) {
              displayLat = toSite.lat;
              displayLng = toSite.lng;
              locationSource = 'site';
            } else if (fromSite?.lat && fromSite?.lng) {
              displayLat = fromSite.lat;
              displayLng = fromSite.lng;
              locationSource = 'site';
            }
          } catch (err: any) {
            const isAborted =
              err?.code === 'ECONNABORTED' ||
              err?.name === 'CanceledError' ||
              (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'))
            if (!isAborted) {
              console.error(`Failed to load events for job ${activeJob.id}:`, err)
            }
          }
        }
        
        driverLocations.push({
          driver,
          job: activeJob || null,
          lastEvent,
          site,
          displayLat,
          displayLng,
          locationSource
        });
      }
      
      console.log(`✅ Processed ${driverLocations.length} driver locations`);
      const driversWithGPS = driverLocations.filter(loc => loc.locationSource === 'gps');
      const driversWithSite = driverLocations.filter(loc => loc.locationSource === 'site');
      console.log(`📍 Drivers with GPS: ${driversWithGPS.length}/${driverLocations.length}`);
      console.log(`📍 Drivers with site fallback: ${driversWithSite.length}/${driverLocations.length}`);
      
      setLocations(driverLocations);
      updateMapMarkers(driverLocations, sites);
    } catch (err) {
      console.error('❌ Failed to load fleet locations:', err);
    } finally {
      setLoading(false);
    }
  }


  function updateMapMarkers(locations: DriverLocation[], sites: Site[]) {
    console.log('🗺️ Updating map markers...');
    const map = (window as any).fleetMap;
    const L = (window as any).L;
    
    if (!map) {
      console.warn('⚠️ Map not available');
      return;
    }
    
    if (!L) {
      console.warn('⚠️ Leaflet not available');
      return;
    }

    console.log('🧹 Clearing existing markers...');
    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add driver markers
    let markersAdded = 0;
    locations.forEach(loc => {
      if (loc.displayLat !== null && loc.displayLng !== null) {
        console.log(`📍 Adding marker for ${loc.driver.name} at ${loc.displayLat}, ${loc.displayLng} (${loc.locationSource})`);
        const bgColor = loc.locationSource === 'gps' ? '#2563eb' : '#f59e0b';
        const icon = L.divIcon({
          html: `<div style="background:${bgColor};color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🚛</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        
        const sourceLabel = loc.locationSource === 'gps' ? 'GPS' : 'מיקום אתר';
        L.marker([loc.displayLat, loc.displayLng], { icon })
          .addTo(map)
          .bindPopup(`<b>${loc.driver.name}</b><br>${getStatusLabel(loc.job?.status || 'N/A')}<br>${loc.site?.name || ''}<br>${sourceLabel}`);
        
        markersAdded++;
      }
    });
    
    console.log(`✅ Added ${markersAdded} driver markers`);

    // Add site markers
    let siteMarkersAdded = 0;
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
        
        siteMarkersAdded++;
      }
    });
    
    console.log(`✅ Added ${siteMarkersAdded} site markers`);

    // Ensure map renders correctly after updates
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 100);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4 relative">
              {!mapInitialized && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-white/70 z-10 rounded-lg">
                  טוען מפה...
                </div>
              )}
              <div 
                id="fleet-map" 
                className="w-full h-[600px] rounded-lg" 
                style={{ 
                  height: '600px', 
                  width: '100%', 
                  minHeight: '600px',
                  backgroundColor: '#f3f4f6',
                  border: '2px solid #e5e7eb'
                }}
              ></div>
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
                        
                        {loc.displayLat !== null && loc.displayLng !== null && (
                          <div className="text-xs text-gray-500 mt-2">
                            {loc.locationSource === 'gps' ? 'GPS' : 'אתר'}: {loc.displayLat.toFixed(4)}, {loc.displayLng.toFixed(4)}
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
      </div>
    </DashboardLayout>
  );
}
