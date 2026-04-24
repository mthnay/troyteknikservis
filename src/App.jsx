import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ServiceAcceptance from './components/ServiceAcceptance';
import RepairCenter from './components/RepairCenter';
import PendingRepairs from './components/PendingRepairs';
import KBBManagement from './components/KBBManagement';
import Reports from './components/Reports';
import Technicians from './components/Technicians';
import Settings from './components/Settings';
import ReadyForPickup from './components/ReadyForPickup';
import Archive from './components/Archive';
import ApprovalPending from './components/ApprovalPending';
import Customers from './components/Customers';
import Login from './components/Login';
import CustomerPortal from './components/CustomerPortal';
import TrackingInput from './components/TrackingInput';
import MarketingAutomation from './components/MarketingAutomation';
import NotificationCenter from './components/NotificationCenter';
import { useAppContext } from './context/AppContext';
import { hasPermission } from './utils/permissions';

function App() {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');
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
    <div className="min-h-screen bg-[#f5f5f7] flex font-sans text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 ml-64 p-8 transition-all duration-300 relative">
        <div className="max-w-7xl mx-auto">
          {/* Top Header with Notifications */}
          <div className="flex justify-end mb-6 sticky top-0 z-40 py-2">
            <NotificationCenter />
          </div>
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
          {activeTab === 'settings' && hasPermission(currentUser, 'manage_settings') && <Settings />}
          {activeTab !== 'dashboard' && activeTab !== 'service' && activeTab !== 'in-store' && activeTab !== 'ready-pickup' && activeTab !== 'archive' && activeTab !== 'apple-center' && activeTab !== 'pending-repairs' && activeTab !== 'approval-pending' && activeTab !== 'stock' && activeTab !== 'reports' && activeTab !== 'technicians' && activeTab !== 'settings' && activeTab !== 'customers' && activeTab !== 'marketing' && (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
              <h2 className="text-2xl font-bold text-gray-300 mb-2">Sayfa Yapım Aşamasında</h2>
              <p className="text-gray-400">Bu modül henüz aktif edilmedi.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
