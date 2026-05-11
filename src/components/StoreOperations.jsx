import React, { useMemo, useState } from 'react';
import { ChevronRight, AlertCircle, X, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const StoreOperations = () => {
    const { repairs, allRepairs, servicePoints } = useAppContext();
    const [selectedStoreDetails, setSelectedStoreDetails] = useState(null);

    const storeStatusData = useMemo(() => {
        const sourceRepairs = allRepairs || repairs;
        return servicePoints.map(sp => {
            const storeRepairs = sourceRepairs.filter(r => String(r.storeId) === String(sp.id));
            const activeRepairs = storeRepairs.filter(r => !['Tamamlandı', 'Teslim Edildi', 'İptal', 'İade'].includes(r.status));
            
            const criticalRepairs = activeRepairs.filter(r => {
                if (r.status?.includes('Bekliyor')) return true;
                if (!r.date) return false;
                const [d, m, y] = r.date.split(' ')[0].split('.');
                if (!d || !m || !y) return false;
                const repairDate = new Date(y, m - 1, d);
                const daysPass = Math.floor((new Date() - repairDate) / (1000 * 60 * 60 * 24));
                return daysPass > 14; 
            });

            return {
                ...sp,
                pendingCount: activeRepairs.length,
                criticalCount: criticalRepairs.length,
                activeRepairs,
                criticalRepairs
            };
        }).sort((a,b) => b.pendingCount - a.pendingCount);
    }, [servicePoints, allRepairs, repairs]);

    return (
        <div className="space-y-6">
            {/* Header - Ana Sayfa Stili */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-md text-blue-600 border border-blue-100 shadow-sm">
                        <MapPin size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Mağaza Operasyonları</h2>
                        <p className="text-gray-500 mt-1 font-medium">Tüm şubelerin anlık durumlarını ve iş yüklerini izleyin.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeStatusData.map(sp => (
                    <div 
                        key={sp.id} 
                        onClick={() => setSelectedStoreDetails(sp)}
                        className="gsx-card p-5 hover:border-apple-blue transition-colors cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[15px] text-[#1d1d1f] group-hover:text-apple-blue transition-colors">{sp.name}</h4>
                                        <p className="text-[11px] text-gray-500 mt-0.5">Ship-To: {sp.shipTo || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-apple-blue transition-colors" />
                        </div>

                        <div className="flex gap-6 mt-6 pt-4 border-t border-[#d2d2d7]">
                            <div>
                                <p className="text-[11px] text-gray-500 mb-1">Bekliyor</p>
                                <p className="text-xl font-bold text-gray-900">{sp.pendingCount}</p>
                            </div>
                            <div>
                                <p className={`text-[11px] mb-1 ${sp.criticalCount > 0 ? 'text-[#e30000]' : 'text-gray-500'}`}>Kritik</p>
                                <p className={`text-xl font-bold flex items-center gap-1 ${sp.criticalCount > 0 ? 'text-[#e30000]' : 'text-gray-900'}`}>
                                    {sp.criticalCount}
                                    {sp.criticalCount > 0 && <AlertCircle size={16} />}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Store Details Modal */}
            {selectedStoreDetails && (
                <div className="modal-overlay" onClick={() => setSelectedStoreDetails(null)}>
                    <div className="modal-content w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#d2d2d7]">
                            <div>
                                <h3 className="text-xl font-semibold text-[#1d1d1f]">{selectedStoreDetails.name}</h3>
                                <div className="text-[12px] text-gray-500 mt-1">Ship-To: {selectedStoreDetails.shipTo || 'N/A'}</div>
                            </div>
                            <button onClick={() => setSelectedStoreDetails(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-[#d2d2d7] p-4 rounded-lg">
                                    <p className="text-[12px] text-gray-500 mb-1">Toplam Bekleyen</p>
                                    <h4 className="text-2xl font-semibold text-[#1d1d1f]">{selectedStoreDetails.activeRepairs.length}</h4>
                                </div>
                                <div className={`border ${selectedStoreDetails.criticalRepairs.length > 0 ? 'border-[#e30000]' : 'border-[#d2d2d7]'} p-4 rounded-lg`}>
                                    <p className="text-[12px] text-gray-500 mb-1">Kritik Süre</p>
                                    <h4 className={`text-2xl font-semibold flex items-center gap-2 ${selectedStoreDetails.criticalRepairs.length > 0 ? 'text-[#e30000]' : 'text-[#1d1d1f]'}`}>
                                        {selectedStoreDetails.criticalRepairs.length}
                                        {selectedStoreDetails.criticalRepairs.length > 0 && <AlertCircle size={20} />}
                                    </h4>
                                </div>
                            </div>

                            {selectedStoreDetails.criticalRepairs.length > 0 && (
                                <div>
                                    <h4 className="text-[13px] font-semibold text-[#1d1d1f] mb-3">
                                        Kritik Onarımlar ({selectedStoreDetails.criticalRepairs.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedStoreDetails.criticalRepairs.map(r => (
                                            <div key={r.id} className="flex justify-between items-center border border-[#e30000] p-3 rounded-md bg-red-50/10">
                                                <div>
                                                    <p className="text-[13px] font-medium text-[#1d1d1f]">{r.device} - {r.customer}</p>
                                                    <p className="text-[11px] text-gray-500">ID: {r.id} | Tarih: {r.date}</p>
                                                </div>
                                                <span className="text-[#e30000] text-[11px] font-medium">
                                                    {r.status || 'Bekliyor'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[13px] font-semibold text-[#1d1d1f] mb-3">
                                    Diğer Aktif İşlemler
                                </h4>
                                <div className="space-y-2">
                                    {selectedStoreDetails.activeRepairs.filter(r => !selectedStoreDetails.criticalRepairs.includes(r)).map(r => (
                                        <div key={r.id} className="flex justify-between items-center border border-[#d2d2d7] p-3 rounded-md">
                                            <div>
                                                <p className="text-[13px] font-medium text-[#1d1d1f]">{r.device} - {r.customer}</p>
                                                <p className="text-[11px] text-gray-500">ID: {r.id} | Tarih: {r.date}</p>
                                            </div>
                                            <span className="text-gray-600 text-[11px] font-medium">
                                                {r.status || 'İşlemde'}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedStoreDetails.activeRepairs.length === selectedStoreDetails.criticalRepairs.length && (
                                        <p className="text-[12px] text-gray-500 py-2">Başka aktif işlem bulunmuyor.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreOperations;
