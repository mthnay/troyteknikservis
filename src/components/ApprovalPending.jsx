import React, { useState } from 'react';
import {
    Clock,
    Check,
    X,
    DollarSign,
    AlertCircle,
    User,
    MessageCircle,
    ArrowRight,
    Eye,
    Send,
    Bell
} from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';
import { getSafeRepairImageUrl } from '../utils/productImages';
import CustomerNotificationModal from './CustomerNotificationModal';
import RepairHistoryModal from './RepairHistoryModal';
import RepairDiagnosisModal from './RepairDiagnosisModal';

const ApprovalPending = ({ setActiveTab }) => {
    const { repairs, updateRepair, showToast, searchQuery, API_URL } = useAppContext();
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [selectedHistoryRepair, setSelectedHistoryRepair] = useState(null);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [diagnosisRepair, setDiagnosisRepair] = useState(null);

    // Müşteri onayı bekleyen cihazlar + Arama filtresi
    const pendingApprovalList = repairs.filter(r => {
        const isPending = r.status === 'Müşteri Onayı Bekliyor';
        const matchesSearch = !searchQuery || 
            (r.device?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.id?.toLowerCase().includes(searchQuery.toLowerCase()));
        return isPending && matchesSearch;
    });

    const handleApproval = (repair, isApproved) => {
        if (isApproved) {
            // Onaylandıysa Tanı ekranını aç
            setDiagnosisRepair({
                ...repair,
                pendingStatus: 'İşlemde',
                historyNote: 'Müşteri onayı alındı. İşlem başlatılıyor.'
            });
        } else {
            // Reddedildiyse yine Tanı ekranını aç (iade işlemleri için)
            setDiagnosisRepair({
                ...repair,
                pendingStatus: 'İade Edildi',
                historyNote: 'Müşteri reddetti. İade işlemleri başlatılıyor.'
            });
        }
    };

    const handleSaveDiagnosis = (diagnosisData) => {
        const { targetView, originalRepair, ...rest } = diagnosisData;
        
        let newStatus = 'İşlemde';
        if (rest.parts?.some(p => p.needsOrder)) newStatus = "Parça Bekleniyor";
        if (targetView === 'apple-center') newStatus = "Apple'a Gönderildi";
        if (targetView === 'ready-pickup') newStatus = "İade Hazır";

        updateRepair(originalRepair.id, {
            ...rest,
            status: newStatus,
            type: targetView,
            appleRepairId: targetView === 'apple-center' ? rest.repairId : (originalRepair.appleRepairId || ''),
            historyNote: originalRepair.historyNote || rest.historyNote || 'Müşteri onayı sonrası kayıt güncellendi.'
        });

        setDiagnosisRepair(null);
        showToast(targetView === 'ready-pickup' ? 'İade işlemi hazırlandı.' : 'Kayıt ilgili merkeze aktarıldı.', 'success');
        
        // Navigate after save
        if (setActiveTab) {
            if (targetView === 'ready-pickup') {
                setActiveTab('ready-pickup');
            } else if (targetView === 'in-store') {
                setActiveTab('in-store');
            } else if (targetView === 'apple-center') {
                setActiveTab('apple-center');
            } else {
                setActiveTab('archive');
            }
        }
    };

    const handleNotify = (repair) => {
        setSelectedRepair(repair);
        setShowNotifyModal(true);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-32 animate-fade-in px-4 md:px-8">
            {/* Header - Ana Sayfa Stili */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-md text-orange-600 border border-orange-100 shadow-sm">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Onay Bekleyenler</h2>
                        <p className="text-gray-500 mt-1 font-medium">Teklif sunulan ve yanıt beklenen cihazlar.</p>
                    </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">BEKLEYEN</p>
                    <p className="text-xl font-bold text-gray-900">{pendingApprovalList.length}</p>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {pendingApprovalList.length > 0 ? (
                    pendingApprovalList.map((repair) => (
                        <div key={repair.id} className="group bg-white rounded-lg hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden border border-gray-100 relative">
                            {/* Card Top - Icon/Image Area */}
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-gray-50 border border-gray-100">
                                        <img 
                                            src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} 
                                            alt={repair.device} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">#{repair.id}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{repair.quoteAmount || '0.00'} ₺</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-base truncate">{repair.device}</h3>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                            <User size={12} className="text-gray-400" /> {repair.customer}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center text-[10px] font-bold py-2 border-y border-gray-50 uppercase tracking-tight">
                                        <span className="text-gray-400 text-[9px]">Son Bildirim</span>
                                        <span className="text-blue-600">{repair.lastNotified || 'Yok'}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium line-clamp-2 italic">
                                        "{repair.diagnosisNotes || 'Teklif yanıtı bekleniyor...'}"
                                    </p>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleApproval(repair, true)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-semibold text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-50 active:scale-95"
                                    >
                                        <Check size={12} strokeWidth={3} /> ONAY
                                    </button>
                                    <button
                                        onClick={() => handleApproval(repair, false)}
                                        className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 py-2 rounded-md font-semibold text-[10px] transition-all border border-red-100 flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                        <X size={12} strokeWidth={3} /> RED
                                    </button>
                                    <button
                                        onClick={() => handleNotify(repair)}
                                        className="col-span-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 py-2 rounded-md font-semibold text-[10px] transition-all border border-blue-100 flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                        <Send size={12} /> BİLDİR
                                    </button>
                                    <button
                                        onClick={() => setSelectedHistoryRepair(repair)}
                                        className="col-span-1 bg-gray-50 hover:bg-gray-900 hover:text-white text-gray-400 py-2 rounded-md font-semibold text-[10px] transition-all border border-gray-100 flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                        <Eye size={12} /> DETAY
                                    </button>
                                </div>
                            </div>
                    ))
                ) : (
                    <div className="col-span-full py-40 bg-white rounded-[60px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-8 shadow-inner">
                        <div className="relative">
                            <div className="w-32 h-32 bg-gray-50 rounded-lg flex items-center justify-center shadow-lg border border-white">
                                <Check size={56} className="text-emerald-500" strokeWidth={3} />
                            </div>
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-md flex items-center justify-center text-white shadow-xl animate-bounce">
                                <Bell size={24} />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-3xl font-semibold text-gray-900 tracking-tighter">Tertemiz Bir Liste</h3>
                            <p className="text-lg text-gray-500 mt-2 font-medium">Şu anda onay bekleyen herhangi bir kayıt bulunmuyor.</p>
                        </div>
                    </div>
                )}
            </div>

            {showNotifyModal && selectedRepair && (
                <CustomerNotificationModal
                    repair={selectedRepair}
                    onClose={() => setShowNotifyModal(false)}
                    onActionComplete={() => {
                        setShowNotifyModal(false);
                        setSelectedRepair(null);
                    }}
                />
            )}

            {selectedHistoryRepair && (
                <RepairHistoryModal
                    repair={selectedHistoryRepair}
                    onClose={() => setSelectedHistoryRepair(null)}
                />
            )}

            {diagnosisRepair && (
                <RepairDiagnosisModal 
                    repair={diagnosisRepair}
                    onClose={() => setDiagnosisRepair(null)}
                    onSave={handleSaveDiagnosis}
                />
            )}
        </div>
    );
};

export default ApprovalPending;
