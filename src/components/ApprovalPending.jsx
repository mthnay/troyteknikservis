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
import CustomerNotificationModal from './CustomerNotificationModal';
import RepairHistoryModal from './RepairHistoryModal';
import RepairDiagnosisModal from './RepairDiagnosisModal';

const ApprovalPending = ({ setActiveTab }) => {
    const { repairs, updateRepair, showToast } = useAppContext();
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [selectedHistoryRepair, setSelectedHistoryRepair] = useState(null);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [diagnosisRepair, setDiagnosisRepair] = useState(null);

    // Müşteri onayı bekleyen cihazlar
    const pendingApprovalList = repairs.filter(r => r.status === 'Müşteri Onayı Bekliyor');

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
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-orange-500 rounded-2xl text-white shadow-xl shadow-orange-100 animate-pulse-slow">
                            <Clock size={32} />
                        </div>
                        Müşteri Onayı Bekleyenler
                    </h2>
                    <p className="text-gray-500 mt-3 font-medium text-lg">Teklif sunulan ve yanıt beklenen cihazların merkezi yönetimi.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Toplam Bekleyen</p>
                        <p className="text-2xl font-black text-gray-900">{pendingApprovalList.length}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {pendingApprovalList.length > 0 ? (
                    pendingApprovalList.map((repair) => (
                        <div key={repair.id} className="group bg-white rounded-[24px] hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden border border-gray-100 relative">
                            {/* Card Top - Icon/Image Area */}
                            <div className="relative h-40 bg-gray-50 overflow-hidden">
                                <div className="absolute top-4 left-4 z-20">
                                    <span className="bg-white/90 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-xl text-[10px] font-black font-mono shadow-sm border border-white/50">
                                        #{repair.id}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="bg-orange-500 text-white p-2 rounded-xl shadow-lg">
                                        <DollarSign size={14} />
                                    </div>
                                </div>
                                <img 
                                    src={repair.image || (repair.device.toLowerCase().includes('iphone') ? 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop')} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-20">
                                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                                        <p className="text-[10px] font-black text-white">{repair.quoteAmount || '0.00'} ₺</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="font-black text-gray-900 text-base leading-tight mb-1 truncate">{repair.device}</h3>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold">
                                        <User size={12} className="text-gray-400" /> {repair.customer}
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
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-black text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-50 active:scale-95"
                                    >
                                        <Check size={12} strokeWidth={3} /> ONAY
                                    </button>
                                    <button
                                        onClick={() => handleApproval(repair, false)}
                                        className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 py-2 rounded-xl font-black text-[10px] transition-all border border-red-100 flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                        <X size={12} strokeWidth={3} /> RED
                                    </button>
                                    <button
                                        onClick={() => handleNotify(repair)}
                                        className="col-span-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 py-2 rounded-xl font-black text-[10px] transition-all border border-blue-100 flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                        <Send size={12} /> BİLDİR
                                    </button>
                                    <button
                                        onClick={() => setSelectedHistoryRepair(repair)}
                                        className="col-span-1 bg-gray-50 hover:bg-gray-900 hover:text-white text-gray-400 py-2 rounded-xl font-black text-[10px] transition-all border border-gray-100 flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                        <Eye size={12} /> DETAY
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-40 bg-white rounded-[60px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-8 shadow-inner">
                        <div className="relative">
                            <div className="w-32 h-32 bg-gray-50 rounded-[40px] flex items-center justify-center shadow-lg border border-white">
                                <Check size={56} className="text-emerald-500" strokeWidth={3} />
                            </div>
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl animate-bounce">
                                <Bell size={24} />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Tertemiz Bir Liste</h3>
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
