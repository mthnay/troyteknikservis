import React, { useState } from 'react';
import { Clock, User, ChevronRight, AlertCircle, Calendar, ArrowRight, Eye, Search, Filter, LayoutGrid, List as ListIcon, MoreHorizontal, Truck, Check, Fingerprint } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import RepairDiagnosisModal from './RepairDiagnosisModal';
import RepairHistoryModal from './RepairHistoryModal';
import { useAppContext } from '../context/AppContext';
import { appConfirm } from '../utils/alert';
import { getProductImage, getSafeRepairImageUrl } from '../utils/productImages';

const PendingRepairs = ({ setActiveTab }) => {
    const { repairs, updateRepair, currentUser, searchQuery, setSearchQuery, API_URL } = useAppContext();
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [selectedHistoryRepair, setSelectedHistoryRepair] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'

    // Status Columns for Board View
    const BOARD_COLUMNS = [
        { id: 'Beklemede', label: 'Beklemede', color: 'bg-gray-100 text-gray-600' },
        { id: 'İnceleniyor', label: 'İnceleniyor', color: 'bg-blue-100 text-blue-600' },
        { id: 'Parça Bekleniyor', label: 'Parça Bekleniyor', color: 'bg-orange-100 text-orange-600' },
        { id: 'Onarımda', label: 'Onarımda', color: 'bg-purple-100 text-purple-600' },
        { id: 'Hazır', label: 'Cihaz Hazır', color: 'bg-green-100 text-green-600' }
    ];

    // SLA Hesapalama Yardımcısı
    const isSlaBreached = (repair) => {
        if (!repair.date) return false;
        
        const parseDate = (dateStr) => {
            if (!dateStr) return new Date();
            const parts = dateStr.split('.');
            if (parts.length >= 3) {
                const day = parts[0];
                const month = parts[1];
                const yearTime = parts[2].split(' ');
                const year = yearTime[0];
                return new Date(`${year}-${month}-${day}`);
            }
            return new Date(dateStr) || new Date();
        };

        const repairDate = parseDate(repair.date);
        const diffTime = Math.abs(new Date() - repairDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        return diffDays > 3; // > 3 days means breached SLA
    };

    // Filter Logic
    // Unified Filter Logic
    const filteredRepairs = repairs.filter(r =>
    (r.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // List View specific filter (only 'Beklemede') logic is kept for List Mode if desired,
    // BUT for Board Mode we need ALL statuses to show the flow.
    // So if Board Mode, we show all relevant statuses.
    // If List Mode, we typically showed only 'Beklemede' in this specific component "PendingRepairs".
    // However, to make it a true CRM "Work Board", we should probably show all active repairs in Board mode.
    // Drag and Drop Handlers
    const handleDragStart = (e, repairId) => {
        e.dataTransfer.setData('repairId', repairId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, status) => {
        e.preventDefault();
        const repairId = e.dataTransfer.getData('repairId');

        // Find the repair to check if status is actually changing
        const repair = repairs.find(r => r.id === repairId);
        if (repair && repair.status !== status) {
            updateRepair(repairId, {
                status: status,
                historyNote: `Durum panodan "${status}" olarak güncellendi.`
            });
        }
    };

    const getRepairsForColumn = (columnId) => {
        if (columnId === 'Hazır') {
            return filteredRepairs.filter(r => r.status === 'Hazır' || r.status === 'Cihaz Hazır' || r.status === 'İade Hazır');
        }
        return filteredRepairs.filter(r => r.status === columnId);
    };

    const pendingRepairsList = filteredRepairs.filter(r => r.status === 'Beklemede');
    const incomingTransfers = filteredRepairs.filter(r => r.status === 'Transferde');

    const handleAcceptTransfer = (repair) => {
        updateRepair(repair.id, {
            status: 'Beklemede',
            historyNote: `Cihaz mağazaya ulaştı ve sistem tarafından teslim alındı. (İşlem yapan: ${currentUser?.name || 'Sistem'})`
        });
        alert('Cihaz başarıyla teslim alındı ve işlem bekleyenler sırasına eklendi!');
    };

    // getDeviceImage artik gereksiz, merkezi utility kullanilacak


    const handleSaveDiagnosis = async (result) => {
        let newStatus = 'İşlemde';
        if (result.parts?.some(p => p.needsOrder)) newStatus = "Parça Bekleniyor";
        if (result.targetView === 'apple-center') newStatus = "Apple'a Gönderildi";
        if (result.targetView === 'approval-pending') newStatus = "Müşteri Onayı Bekliyor";
        if (result.targetView === 'ready-pickup') {
            newStatus = result.repairType === 'direct-return' ? "İade Hazır" : "Cihaz Hazır";
        }

        const updates = {
            status: newStatus,
            type: result.targetView,
            diagnosisNotes: result.notes,
            tests: result.tests,
            parts: result.parts,
            repairType: result.repairType || result.originalRepair.repairType,
            quoteAmount: result.quoteAmount,
            appleRepairId: result.targetView === 'apple-center' ? result.repairId : (result.originalRepair.appleRepairId || ''),
            repairId: result.repairId || result.originalRepair.repairId,
            historyNote: result.targetView === 'approval-pending'
                ? `Müşteriye ${result.quoteAmount} TL tutarında teklif sunuldu. Onay bekleniyor.`
                : result.targetView === 'ready-pickup'
                    ? `Cihaz teşhis aşamasında işlemsiz iade statüsüne alındı. Not: ${result.notes}`
                    : `${result.targetView === 'apple-center' ? 'Apple Onarım Merkezi' : 'Mağaza İçi'} onarım süreci başlatıldı.`
        };

        updateRepair(result.originalRepair.id, updates);
        setSelectedRepair(null);

        const targetLabel = result.targetView === 'apple-center' 
            ? 'Apple Onarım Merkezi' 
            : result.targetView === 'approval-pending' 
                ? 'Onay Bekleyenler' 
                : result.targetView === 'ready-pickup'
                    ? 'Teslimat Havuzu'
                    : 'Mağaza İçi Onarım Merkezi';

        if (await appConfirm(`Teşhis Kaydedildi!<br><br><b>${targetLabel}</b> ekranına gitmek ister misiniz?`)) {
            setActiveTab(result.targetView);
        }
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in">

                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
                            <div className="p-3 bg-orange-50 rounded-md text-orange-600 border border-orange-100">
                                <Clock size={28} />
                            </div>
                            İşlem Bekleyenler & İş Akışı
                        </h2>
                        <p className="text-gray-500 mt-2 font-medium pl-1">
                            Toplam <span className="text-orange-600 font-bold">{pendingRepairsList.length}</span> cihaz teşhis veya işlem bekliyor.
                        </p>
                    </div>

                    {/* View Toggle & Search Bar */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex bg-white p-1 rounded-md border border-gray-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Liste Görünümü"
                            >
                                <ListIcon size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Panoya (Kanban) Geç"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>

                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Cihaz, Müşteri, ID..."
                                className="w-full pl-10 pr-4 py-3 rounded-md bg-white border border-gray-200 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-gray-700 shadow-sm text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>

                {/* Gelen Transferler Paneli */}
                {incomingTransfers.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-6 shadow-sm mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-100 p-2 rounded-md text-indigo-600">
                                <Truck size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 leading-none">Gelen Transferler & Kargolar</h3>
                                <p className="text-sm text-gray-500 font-medium">Bu mağazaya sevk edilmiş cihazlar teslim alınmayı bekliyor.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {incomingTransfers.map(repair => (
                                <div key={repair.id} className="bg-white rounded-md p-4 border border-indigo-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-transform hover:scale-[1.01]">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                            <img src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                {repair.device} <span className="text-[10px] font-semibold text-xs uppercase tracking-wide bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">#{repair.id}</span>
                                            </h4>
                                            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                                                <User size={12} /> {repair.customer} • Şikayet: {repair.issue || repair.issueDescription || "Belirtilmedi"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button 
                                            onClick={() => handleAcceptTransfer(repair)}
                                            className="flex-1 md:flex-none gsx-button-primary flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} /> Teslim Al
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Area */}
                {viewMode === 'list' ? (
                    <div className="flex flex-col gap-4">
                        {pendingRepairsList.length > 0 ? (
                            pendingRepairsList.map((repair) => (
                                <div
                                    key={repair.id}
                                    className={`group bg-white rounded-lg p-4 border ${isSlaBreached(repair) ? 'border-red-300 shadow-red-100' : 'border-gray-100'} shadow-sm hover:shadow-sm hover:border-orange-200 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 cursor-pointer relative overflow-hidden`}
                                    onClick={() => setSelectedRepair(repair)}
                                >
                                    {isSlaBreached(repair) && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-semibold text-xs uppercase tracking-wide px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                                            <span className="relative flex h-2 w-2 mr-1">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                            </span>
                                            SLA İhlali (&gt;3 Gün)
                                        </div>
                                    )}
                                    {/* Image & ID */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden shadow-inner border border-gray-100">
                                            <img src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <span className="absolute -top-3 -left-3 bg-white text-gray-900 text-[10px] font-semibold px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                                            #{repair.id}
                                        </span>
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full">

                                        {/* Device & Customer - Col Span 4 */}
                                        <div className="md:col-span-4">
                                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors truncate">{repair.device}</h3>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <User size={14} className="text-gray-400" />
                                                    <span className="font-medium truncate">{repair.customer}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 self-start">
                                                    <Fingerprint size={10} />
                                                    <span className="font-bold uppercase">{repair.serial || repair.serialNumber || 'SN YOK'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Issue - Col Span 5 */}
                                        <div className="md:col-span-5 bg-orange-50/50 p-3 rounded-md border border-orange-100/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle size={12} className="text-orange-500" />
                                                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Şikayet</span>
                                            </div>
                                            <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed">
                                                {repair.issue || repair.issueDescription || "Belirtilmedi"}
                                            </p>
                                        </div>

                                        {/* Date- Col Span 3 */}
                                        <div className="md:col-span-3 flex md:flex-col items-center md:items-end gap-1 md:gap-0 mt-2 md:mt-0">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                                <Calendar size={12} className="text-gray-400" />
                                                <span className="text-xs font-bold text-gray-600">{repair.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col items-center gap-2 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedRepair(repair); }}
                                            className="flex-1 md:flex-initial w-full md:w-40 gsx-button-primary flex items-center justify-center gap-2 group/btn"
                                        >
                                            Teşhis Yap <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedHistoryRepair(repair); }}
                                            className="flex-1 md:flex-initial w-full md:w-40 bg-white border border-[#d2d2d7] text-gray-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#f5f5f7] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Eye size={16} /> Detay
                                        </button>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-dashed border-gray-200">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Clock size={40} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Kayıt Bulunamadı</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                                    {searchQuery ? `"${searchQuery}" aramasına uygun cihaz bulunamadı.` : 'Şu anda işlem bekleyen cihaz bulunmuyor.'}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Kanban Board View
                    <div className="flex gap-6 overflow-x-auto pb-8 items-start min-h-[600px]">
                        {BOARD_COLUMNS.map(column => (
                            <div
                                key={column.id}
                                className="min-w-[320px] w-80 bg-gray-50/50 rounded-lg p-4 flex flex-col h-full border border-gray-200/60"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="font-semibold text-gray-700 uppercase tracking-tight text-sm flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${column.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                        {column.label}
                                    </h3>
                                    <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold text-gray-400 border border-gray-100">
                                        {getRepairsForColumn(column.id).length}
                                    </span>
                                </div>

                                <div className="space-y-3 flex-1">
                                    {getRepairsForColumn(column.id).map(repair => (
                                        <div
                                            key={repair.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, repair.id)}
                                            onClick={() => setSelectedRepair(repair)}
                                            className={`bg-white p-4 rounded-md border ${isSlaBreached(repair) ? 'border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-gray-100'} shadow-sm hover:shadow-md hover:scale-[1.02] cursor-grab active:cursor-grabbing transition-all group relative`}
                                        >
                                            {isSlaBreached(repair) && (
                                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-semibold text-xs uppercase tracking-wide px-2 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1 border-2 border-white">
                                                    SLA İhlali
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[10px] font-semibold bg-gray-50 text-gray-500 px-2 py-1 rounded-lg">#{repair.id}</span>
                                                <button className="text-gray-300 hover:text-gray-600 transition-colors">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>

                                            <div className="flex gap-3 mb-3">
                                                <img src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} className="w-12 h-12 rounded-md object-cover bg-gray-100" />
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{repair.device}</h4>
                                                    <span className="text-xs text-gray-500 font-medium">{repair.customer}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                                <div className="flex -space-x-2">
                                                    {/* Teknisyen Avatarı (Mock) */}
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-blue-600">
                                                        TK
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 ml-auto flex items-center gap-1">
                                                    <Calendar size={10} /> {repair.date}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {getRepairsForColumn(column.id).length === 0 && (
                                        <div className="h-32 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-300 text-xs font-bold text-xs uppercase tracking-wide bg-gray-50/30">
                                            Boş
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                selectedRepair && (
                    <RepairDiagnosisModal
                        repair={selectedRepair}
                        onClose={() => setSelectedRepair(null)}
                        onSave={handleSaveDiagnosis}
                    />
                )
            }

            {/* History Link Modal */}
            {
                selectedHistoryRepair && (
                    <RepairHistoryModal
                        repair={selectedHistoryRepair}
                        onClose={() => setSelectedHistoryRepair(null)}
                    />
                )
            }
        </>
    );
};

export default PendingRepairs;
