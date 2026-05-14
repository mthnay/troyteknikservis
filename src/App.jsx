import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import ServiceAcceptance from './components/ServiceAcceptance';
import RepairCenter from './components/RepairCenter';
import PendingRepairs from './components/PendingRepairs';
import KBBManagement from './components/KBBManagement';
import Reports from './components/Reports';
import Technicians from './components/Technicians';
import Settings from './components/Settings';
import StoreOperations from './components/StoreOperations';
import ReadyForPickup from './components/ReadyForPickup';
import Archive from './components/Archive';
import ApprovalPending from './components/ApprovalPending';
import Customers from './components/Customers';
import Login from './components/Login';
import CustomerPortal from './components/CustomerPortal';
import TrackingInput from './components/TrackingInput';
import MarketingAutomation from './components/MarketingAutomation';
import StockManagement from './components/StockManagement';
import { useAppContext } from './context/AppContext';
import { hasPermission } from './utils/permissions';

function App() {
  const { currentUser, selectedStoreId, setSelectedStoreId, servicePoints } = useAppContext();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('oss_active_tab') || 'dashboard');

  useEffect(() => {
    sessionStorage.setItem('oss_active_tab', activeTab);
  }, [activeTab]);

  const [showStoreSelect, setShowStoreSelect] = useState(false);
  const storeSelectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (storeSelectRef.current && !storeSelectRef.current.contains(event.target)) {
        setShowStoreSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Kullanıcı giriş yaptığında veya değiştiğinde, seçili mağazayı güncelle
  useEffect(() => {
    if (currentUser?.storeId && selectedStoreId === 0) {
      setSelectedStoreId(currentUser.storeId);
    }
  }, [currentUser]);
  const [serviceInitialData, setServiceInitialData] = useState(null);
  const [trackingMode, setTrackingMode] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const trackIdFromUrl = urlParams.get('track');

  if (!currentUser) {
    if (trackIdFromUrl) {
      return <CustomerPortal trackId={trackIdFromUrl} />;
    }
    
    if (trackingMode) {
      return <TrackingInput onSelectTrack={(id) => {
        window.history.pushState({}, '', `?track=${id}`);
        window.location.reload(); // Reload to trigger trackId logic
      }} />;
    }

    return <Login onTrackingClick={() => setTrackingMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans text-[#1d1d1f]">
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full pt-20 pb-20 px-6 transition-all duration-300 relative">
        <div className="max-w-[1200px] mx-auto">
          {/* Top Header with Notifications removed */}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'service' && <ServiceAcceptance setActiveTab={setActiveTab} initialData={serviceInitialData} clearInitialData={() => setServiceInitialData(null)} />}
          {activeTab === 'pending-repairs' && <PendingRepairs setActiveTab={setActiveTab} />}
          {activeTab === 'approval-pending' && <ApprovalPending setActiveTab={setActiveTab} />}
          {activeTab === 'customers' && <Customers setActiveTab={setActiveTab} setServiceInitialData={setServiceInitialData} />}
          {activeTab === 'marketing' && <MarketingAutomation />}
          {activeTab === 'stock' && <StockManagement />}
          {activeTab === 'in-store' && <RepairCenter type="in-store" setActiveTab={setActiveTab} />}
          {activeTab === 'ready-pickup' && <ReadyForPickup />}
          {activeTab === 'archive' && <Archive />}
          {activeTab === 'apple-center' && <RepairCenter type="apple-center" setActiveTab={setActiveTab} />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'technicians' && <Technicians />}
          {activeTab === 'store-operations' && <StoreOperations />}
          {activeTab === 'settings' && hasPermission(currentUser, 'manage_settings') && <Settings />}
          {activeTab !== 'dashboard' && activeTab !== 'service' && activeTab !== 'in-store' && activeTab !== 'ready-pickup' && activeTab !== 'archive' && activeTab !== 'apple-center' && activeTab !== 'pending-repairs' && activeTab !== 'approval-pending' && activeTab !== 'stock' && activeTab !== 'reports' && activeTab !== 'technicians' && activeTab !== 'store-operations' && activeTab !== 'settings' && activeTab !== 'customers' && activeTab !== 'marketing' && (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
              <h2 className="text-2xl font-bold text-gray-400 mb-2">Sayfa Yapım Aşamasında</h2>
              <p className="text-gray-500">Bu modül henüz aktifleştirilmedi.</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Bar: Salt-okunur mağaza bilgisi (view_all_stores yetkisi olmayan kullanıcılar) */}
      {!hasPermission(currentUser, 'view_all_stores') && currentUser?.storeId && (
        <div className="fixed bottom-0 left-0 w-full h-9 bg-white/90 backdrop-blur-md border-t border-black/5 flex items-center justify-between px-6 z-50 shadow-[0_-4px_24px_-6px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Aktif Mağaza:</span>
              <div className="flex items-center gap-2 px-2 h-6 rounded border bg-blue-50 border-blue-100">
                <MapPin size={10} className="text-blue-500" />
                <span className="text-[11px] font-bold text-blue-700">
                  {servicePoints.find(p => p.id === currentUser.storeId)?.name || 'Mağazanız'}
                </span>
              </div>
            </div>
            <div className="text-[10px] font-medium text-gray-400 tracking-tight">
                OSS Operating Software Solution - 2026 Tüm Hakları Saklıdır
            </div>
        </div>
      )}

      {/* Bottom Store Selector Navbar (view_all_stores izinli kullanıcılar için) */}
      {hasPermission(currentUser, 'view_all_stores') && (
        <div className="fixed bottom-0 left-0 w-full h-9 bg-white/90 backdrop-blur-md border-t border-black/5 flex items-center justify-between px-6 z-50 shadow-[0_-4px_24px_-6px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Aktif Mağaza:</span>
              <div className="relative" ref={storeSelectRef}>
                  <button 
                      onClick={() => setShowStoreSelect(!showStoreSelect)}
                      className={`flex items-center gap-2 px-2 h-6 rounded border transition-all
                          ${showStoreSelect ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'}
                      `}
                  >
                      <MapPin size={10} className={showStoreSelect ? 'text-white' : 'text-blue-500'} />
                      <span className="text-[11px] font-bold">
                          {selectedStoreId === 0 ? 'Tüm Mağazalar' : servicePoints.find(p => p.id === selectedStoreId)?.name || 'Mağaza Seç'}
                      </span>
                      <ChevronDown size={10} className={`transition-transform ${showStoreSelect ? 'rotate-180' : 'opacity-50'}`} />
                  </button>

                  {showStoreSelect && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-xl p-1 w-64 z-[100] animate-in fade-in slide-in-from-bottom-2">
                          <div className="px-3 py-2 border-b border-gray-50 mb-1">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mağaza Değiştir</span>
                          </div>
                          <div className="max-h-64 overflow-y-auto custom-scrollbar">
                              <button
                                  onClick={() => { setSelectedStoreId(0); setShowStoreSelect(false); }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-3 transition-all
                                      ${selectedStoreId === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                  `}
                              >
                                  <div className={`w-2 h-2 rounded-full ${selectedStoreId === 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                  Tüm Mağazalar
                                  {selectedStoreId === 0 && <Check size={12} className="ml-auto text-blue-500" />}
                              </button>
                              {servicePoints.map(point => (
                                  <button
                                      key={point.id}
                                      onClick={() => { setSelectedStoreId(point.id); setShowStoreSelect(false); }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-3 transition-all
                                          ${selectedStoreId === point.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                      `}
                                  >
                                      <div className={`w-2 h-2 rounded-full ${selectedStoreId === point.id ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                      {point.name}
                                      {selectedStoreId === point.id && <Check size={12} className="ml-auto text-blue-500" />}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
            </div>
            <div className="text-[10px] font-medium text-gray-400 tracking-tight">
                OSS Operating Software Solution - 2026 Tüm Hakları Saklıdır
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
