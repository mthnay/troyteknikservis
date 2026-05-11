import React, { useState, useRef } from 'react';
import { CheckCircle, User, Package, Printer, X, PenTool, FileText, Calendar, MapPin, Eye, ArrowRight, ShieldCheck, Search, Download } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';
import RepairHistoryModal from './RepairHistoryModal';
import DeliveryFormPrint from './DeliveryFormPrint';
import { getSafeRepairImageUrl } from '../utils/productImages';

const ReadyForPickup = () => {
    const { repairs, updateRepair, API_URL } = useAppContext();
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [selectedDetailRepair, setSelectedDetailRepair] = useState(null);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showExportForm, setShowExportForm] = useState(false);
    const [signature, setSignature] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const canvasRef = useRef(null);

    // List and filter repairs that are ready for pickup
    const readyRepairs = repairs.filter(r => {
        const isReady = r.status === 'Tamamlandı' || r.status === 'Cihaz Hazır' || r.status === 'İade Hazır';
        if (!isReady) return false;
        
        const searchLower = searchTerm.toLowerCase();
        return r.id.toLowerCase().includes(searchLower) || 
               (r.customer && r.customer.toLowerCase().includes(searchLower));
    });

    const handleOpenDelivery = (repair) => {
        setSelectedRepair(repair);
        setShowDeliveryModal(true);
    };

    const startSignature = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
    };

    const drawSignature = (e) => {
        if (e.buttons !== 1) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignature(null);
    };

    const handleDeliveryConfirm = () => {
        const canvas = canvasRef.current;
        const sigData = canvas.toDataURL();
        setSignature(sigData);
        setShowDeliveryModal(false);
        setShowExportForm(true);
        const isReturned = selectedRepair.status === 'İade Hazır';
        const finalStatus = isReturned ? 'İade Edildi' : 'Teslim Edildi';
        const finalNote = isReturned 
            ? 'Cihaz müşteriye işlemsiz olarak iade edildi ve teslimat imzası alındı.'
            : 'Cihaz müşteriye başarıyla teslim edildi ve teslimat imzası alındı.';

        // Cihaz durumunu ve teslimat imzasını kalıcı olarak kaydet
        updateRepair(selectedRepair.id, {
            status: finalStatus,
            deliverySignature: sigData,
            historyNote: finalNote
        });
    };


    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header - Ana Sayfa Stili */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-md text-emerald-600 border border-emerald-100 shadow-sm">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Teslime Hazır</h2>
                        <p className="text-gray-500 mt-1 font-medium">Onarımı tamamlanan ve teslim edilmeyi bekleyen cihazlar.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Müşteri, Cihaz veya Seri No..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        className="h-10 px-4 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2 shadow-md active:scale-95"
                    >
                        <Download size={16} /> DIŞA AKTAR
                    </button>
                </div>
            </div>

            {/* Liste Görünümü - Ana Sayfa Stili */}
            <div className="flex flex-col gap-4">
                {readyRepairs.length > 0 ? readyRepairs.map(repair => (
                    <div key={repair.id} className="group bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:border-green-200 transition-all flex flex-col md:flex-row items-center gap-6">
                        {/* Device Info */}
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
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">#{repair.id}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{repair.productGroup}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-base truncate">{repair.device}</h3>
                                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                    <User size={12} className="text-gray-400" /> {repair.customer}
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="w-full md:w-40 flex shrink-0 justify-start md:justify-center">
                            <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100 shadow-sm">
                                HAZIR
                            </span>
                        </div>

                        {/* Eylemler */}
                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end mt-2 md:mt-0">
                            <button
                                onClick={() => setSelectedDetailRepair(repair)}
                                className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-md flex items-center justify-center border border-gray-200 transition-all shadow-sm"
                                title="Detay"
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                onClick={() => handleOpenDelivery(repair)}
                                className="h-10 px-4 rounded-md text-[11px] font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-white bg-gray-900 hover:bg-black"
                            >
                                TESLİM ET <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Package size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Teslim Edilecek Cihaz Yok</h3>
                        <p className="text-sm text-gray-500">Şu anda teslimat bekleyen bir kayıt bulunmuyor.</p>
                    </div>
                )}
            </div>

            {/* Premium Repair History Modal Integration */}
            {selectedDetailRepair && (
                <RepairHistoryModal
                    repair={selectedDetailRepair}
                    onClose={() => setSelectedDetailRepair(null)}
                />
            )}

            {/* Delivery Modal (Signature Required) */}
            {showDeliveryModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white/95 backdrop-blur-xl rounded-lg w-full max-w-xl shadow-2xl p-10 animate-scale-in border border-white/40">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Cihaz Teslim Onayı</h3>
                                <p className="text-gray-500 mt-2 font-medium">Güvenlik prosedürü gereği müşteri imzası zorunludur.</p>
                            </div>
                            <button onClick={() => setShowDeliveryModal(false)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-gray-50 p-6 rounded-lg flex items-center gap-5 border border-gray-100">
                                <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center shadow-sm border border-gray-100">
                                    <MyPhoneIcon className="text-gray-900" size={28} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold text-xs uppercase tracking-wide mb-0.5">{selectedRepair.id}</p>
                                    <p className="font-bold text-gray-900 text-lg">{selectedRepair.device}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end px-1">
                                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <PenTool size={18} className="text-blue-600" /> Müşteri İmzası
                                    </label>
                                    <button onClick={clearSignature} className="text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">Temizle</button>
                                </div>
                                <div className="relative group">
                                    <canvas
                                        ref={canvasRef}
                                        width={500}
                                        height={220}
                                        onMouseDown={startSignature}
                                        onMouseMove={drawSignature}
                                        className="bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair w-full shadow-inner group-hover:border-blue-400 transition-colors"
                                    />
                                    <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none opacity-40">
                                        <p className="text-[10px] text-gray-400 font-bold text-xs uppercase tracking-wide">İmza Alanı</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 font-medium text-center">İşlem onayı için lütfen yukarıdaki alana imza atın.</p>
                            </div>

                            <button
                                onClick={handleDeliveryConfirm}
                                className="w-full bg-gray-900 text-white py-4 rounded-md font-bold text-lg shadow-xl shadow-gray-300 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle size={24} />
                                Teslimatı Tamamla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Form Modal (Printable) */}
            {showExportForm && (
                <DeliveryFormPrint
                    repair={selectedRepair}
                    signature={signature}
                    onClose={() => setShowExportForm(false)}
                />
            )}
        </div>
    );
};

export default ReadyForPickup;
