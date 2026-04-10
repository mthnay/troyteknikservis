import React, { useState, useRef } from 'react';
import { CheckCircle, User, Package, Printer, X, PenTool, FileText, Calendar, MapPin, Eye, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';
import RepairHistoryModal from './RepairHistoryModal';
import DeliveryFormPrint from './DeliveryFormPrint';

const ReadyForPickup = () => {
    const { repairs, updateRepair } = useAppContext();
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
        <div className="max-w-[1600px] mx-auto space-y-8 pb-32 animate-fade-in px-4 md:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2.5 bg-green-100 rounded-xl text-green-700">
                            <Package size={24} />
                        </div>
                        Hazır Cihazlar (Teslimat Havuzu)
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium max-w-2xl">Onarımı başarıyla tamamlanmış ve kalite kontrol testlerinden geçmiş cihazlar burada listelenir. Teslimat işlemini başlatmak için ilgili kaydı seçin.</p>
                </div>

                {/* Gelişmiş Arama Kutusu */}
                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-0 bg-blue-100/30 blur-2xl group-within:bg-blue-200/40 transition-all rounded-full"></div>
                    <div className="relative flex items-center">
                        <Search className="absolute left-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Servis No veya Müşteri Ara..."
                            className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-md border border-gray-200 rounded-[28px] focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none font-bold text-gray-900 shadow-sm group-hover:shadow-md transition-all placeholder:text-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-5 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-all"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {readyRepairs.length > 0 ? readyRepairs.map(repair => (
                    <div key={repair.id} className="group bg-white rounded-[24px] hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden border border-gray-100 relative">
                        {/* Card Top - Icon/Image Area */}
                        <div className="relative h-40 bg-gray-50 overflow-hidden">
                            <div className="absolute top-4 left-4 z-20">
                                <span className="bg-white/90 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-xl text-[10px] font-black font-mono shadow-sm border border-white/50">
                                    #{repair.id}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4 z-20">
                                <span className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg border border-white/20">
                                    HAZIR
                                </span>
                            </div>
                            <img 
                                src={repair.image || (repair.device.toLowerCase().includes('iphone') ? 'https://images.unsplash.com/photo-1556656793-062ff9878273?q=80&w=800&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop')} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                alt="" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent"></div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="mb-4">
                                <h3 className="font-black text-gray-900 text-base leading-tight mb-1 truncate">{repair.device}</h3>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold">
                                    <User size={12} className="text-gray-400" /> {repair.customer}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[9px] text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-100 uppercase font-black mb-4">
                                <ShieldCheck size={12} strokeWidth={3} />
                                <span>Kalite Kontrol Tamam</span>
                            </div>

                            <div className="mt-auto grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => handleOpenDelivery(repair)}
                                    className="w-full bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl font-black text-[10px] shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <CheckCircle size={14} /> TESLİM ET
                                </button>
                                <button
                                    onClick={() => setSelectedDetailRepair(repair)}
                                    className="w-full bg-white hover:bg-gray-50 text-gray-400 py-2.5 rounded-xl font-black text-[10px] border border-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Eye size={14} /> DETAYLAR
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full glass p-20 flex flex-col items-center justify-center text-gray-400 gap-6 rounded-[48px] border border-dashed border-gray-300/60">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                            <Package size={48} className="text-gray-300" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Teslim Edilecek Cihaz Yok</h3>
                            <p className="font-medium text-gray-500">Şu anda tamamlanmış ve teslimat bekleyen bir kayıt bulunmuyor.</p>
                        </div>
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
                    <div className="bg-white/95 backdrop-blur-xl rounded-[40px] w-full max-w-xl shadow-2xl p-10 animate-scale-in border border-white/40">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Cihaz Teslim Onayı</h3>
                                <p className="text-gray-500 mt-2 font-medium">Güvenlik prosedürü gereği müşteri imzası zorunludur.</p>
                            </div>
                            <button onClick={() => setShowDeliveryModal(false)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-gray-50 p-6 rounded-3xl flex items-center gap-5 border border-gray-100">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                    <MyPhoneIcon className="text-gray-900" size={28} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5">{selectedRepair.id}</p>
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
                                        className="bg-white border-2 border-dashed border-gray-300 rounded-3xl cursor-crosshair w-full shadow-inner group-hover:border-blue-400 transition-colors"
                                    />
                                    <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none opacity-40">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">İmza Alanı</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 font-medium text-center">İşlem onayı için lütfen yukarıdaki alana imza atın.</p>
                            </div>

                            <button
                                onClick={handleDeliveryConfirm}
                                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-300 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
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
