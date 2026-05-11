import React, { useState, useEffect } from 'react';
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
import { useAppContext } from './context/AppContext';
import { hasPermission } from './utils/permissions';

function App() {
  const { currentUser, selectedStoreId, setSelectedStoreId, servicePoints } = useAppContext();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('oss_active_tab') || 'dashboard');

  useEffect(() => {
    sessionStorage.setItem('oss_active_tab', activeTab);
  }, [activeTab]);
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
          {activeTab === 'stock' && <KBBManagement />}
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

      {/* Bottom Store Selector Navbar */}
      {hasPermission(currentUser, 'view_all_stores') && (
        <div className="fixed bottom-0 left-0 w-full h-9 bg-white/80 backdrop-blur-md border-t border-black/5 flex items-center justify-between px-6 z-50 shadow-[0_-4px_24px_-6px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Aktif Mağaza:</span>
              <div className="relative flex items-center bg-gray-50/80 rounded px-2 h-6 border border-transparent hover:border-gray-200 focus-within:border-apple-blue focus-within:ring-1 focus-within:ring-apple-blue transition-colors">
                  <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                      className="bg-transparent text-[11px] text-gray-700 font-semibold outline-none appearance-none cursor-pointer pr-4 w-full min-w-[180px]"
                  >
                      <option value={0}>Tüm Mağazalar</option>
                      {servicePoints.map(point => (
                          <option key={point.id} value={point.id}>{point.name}</option>
                      ))}
                  </select>
                  <svg className="absolute right-1.5 pointer-events-none text-gray-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
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
