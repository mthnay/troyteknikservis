import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    Truck, Package, ArrowRight, CheckCircle,
    Calendar, MapPin, ExternalLink, Box, AlertCircle, Wrench, Clock, Plus, Trash2, FileText, Pencil, DollarSign, X,
    MessageCircle, MoreHorizontal, Mail, Map, Download, Camera, Printer, Settings, BarChart
} from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import CustomerNotificationModal from './CustomerNotificationModal';
import { useAppContext } from '../context/AppContext';

const AppleLogisticsModal = ({ repairId, onClose }) => {
    const { updateRepair, repairs, showToast } = useAppContext();
    const [repair, setRepair] = useState(null);
    const [shipmentCode, setShipmentCode] = useState('');
    const [gsxNo, setGsxNo] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [arcResult, setArcResult] = useState('');
    const [arcParts, setArcParts] = useState([]);
    const [activeTimeline, setActiveTimeline] = useState(2); // Mock: 2. adımda (Apple Merkezi'nde)
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);
    const { uploadMedia } = useAppContext();

    useEffect(() => {
        const found = repairs.find(r => r.id === repairId);
        if (found) {
            setRepair(found);
            
            // Sadece ilk açılışta veya ID değiştiğinde yerel state'i senkronize et
            // Bu sayede global repairs güncellendiğinde (örneğin timer) kullanıcının yazdıkları silinmez
            if (!repair || repair.id !== found.id) {
                setShipmentCode(found.shipmentCode || '');
                setGsxNo(found.appleRepairId || '');
                setArcResult(found.diagnosisNotes?.startsWith('ARC SONUCU:') ? found.diagnosisNotes.replace('ARC SONUCU: ', '') : '');
                setArcParts(found.parts || []);
            }
        }
    }, [repairId, repairs, repair]);

    const handleStartTracking = () => {
        if (!shipmentCode) {
            alert('Lütfen UPS Takip Numarasını giriniz.');
            return;
        }

        // Durumu güncelle ve takip numarasını kaydet
        updateRepair(repairId, {
            status: "Apple'a Gönderildi",
            shipmentCode: shipmentCode,
            historyNote: `UPS Takip No girildi: ${shipmentCode}. Cihaz Apple Onarım Merkezi'ne gönderildi.`
        });

        alert('Takip numarası kaydedildi ve cihaz durumu güncellendi.');
    };

    const handleReceiveFromARC = () => {
        if (!arcResult) {
            alert('Lütfen Apple Merkezi onarım sonucunu (pencerenin alt kısmındaki alan) giriniz.');
            // Opsiyonel: Textarea'ya scroll yapabiliriz
            const el = document.querySelector('textarea');
            if (el) el.focus();
            return;
        }

        const isReturn = repair.status === 'İade Bekleniyor' || repair.repairType === 'direct-return';

        updateRepair(repairId, {
            status: isReturn ? 'İade Hazır' : 'Cihaz Hazır',
            diagnosisNotes: `ARC SONUCU: ${arcResult}`,
            parts: arcParts,
            appleRepairId: gsxNo,
            historyNote: `Cihaz Apple Onarım Merkezi'nden geldi. Sonuç: ${arcResult}. Değişen Parça Sayısı: ${arcParts.length}`
        });

        alert(`Cihaz başarıyla teslim alındı ve "${isReturn ? 'İade Hazır' : 'Hazır'}" durumuna çekildi.`);
        onClose();
    };

    const handleSaveGSX = () => {
        updateRepair(repairId, {
            appleRepairId: gsxNo,
            historyNote: `Apple Onarım No (GSX) güncellendi: ${gsxNo}`
        });
        setIsEditing(false);
        alert('Onarım numarası güncellendi.');
    };

    const handleSaveDraft = () => {
        updateRepair(repairId, {
            shipmentCode: shipmentCode,
            appleRepairId: gsxNo,
            diagnosisNotes: arcResult ? `ARC GÜNCEL DURUM: ${arcResult}` : repair.diagnosisNotes,
            parts: arcParts,
            historyNote: 'Apple servis süreci güncellendi (Taslak).'
        });
        alert('İlerleme kaydedildi.');
    };

    const handleQuoteReceived = async () => {
        const { value: amount } = await Swal.fire({
            title: 'Teklif Alındı',
            input: 'number',
            inputLabel: 'Müşteriye iletilecek teklif tutarı (TL)',
            inputPlaceholder: '0.00',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            cancelButtonText: 'Vazgeç',
            confirmButtonText: 'Kaydet'
        });

        if (amount) {
            updateRepair(repairId, {
                status: 'Müşteri Onayı Bekliyor',
                quoteAmount: amount,
                historyNote: `Apple ARC'den teklif geldi: ${amount} TL. Müşteri onayı bekleniyor.`
            });
            showToast('Kayıt "Onay Bekliyor" durumuna çekildi.', 'info');
        }
    };

    const handleQuoteResolution = (isApproved) => {
        if (isApproved) {
            updateRepair(repairId, {
                status: "Apple'a Gönderildi",
                historyNote: 'Müşteri teklifi onayladı. Onarım süreci Apple ARC kanalında devam ediyor.'
            });
            showToast('Onay kaydedildi. Süreç devam ediyor.', 'success');
        } else {
            updateRepair(repairId, {
                status: 'İade Bekleniyor',
                historyNote: 'Müşteri teklifi reddetti. Apple ARC\'den iade istendi.'
            });
            showToast('Red kaydedildi. Cihaz Apple merkezinden iade bekleniyor durumuna alındı.', 'info');
        }
    };

    const addArcPart = () => {
        setArcParts([...arcParts, { partNumber: '', description: '', kbbSerial: '', kgbSerial: '' }]);
    };

    const removeArcPart = (index) => {
        setArcParts(arcParts.filter((_, i) => i !== index));
    };

    const updateArcPart = (index, field, value) => {
        setArcParts(prev => {
            const newParts = [...prev];
            newParts[index] = { ...newParts[index], [field]: value };
            return newParts;
        });
    };

    const handleAddPhoto = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await uploadMedia(file);
            if (data && data.url) {
                // Determine if it's "before shipping" or "after receiving"
                const isAfter = repair.status.includes('Hazır') || repair.status.includes('Teslim');
                const field = isAfter ? 'afterImages' : 'beforeImages';
                const currentList = repair[field] || [];
                
                await updateRepair(repairId, {
                    [field]: [...currentList, data.url]
                });
                showToast('Lojistik fotoğrafı kaydedildi.', 'success');
            }
        } catch (error) {
            console.error(error);
            showToast('Yükleme hatası.', 'error');
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const removePhoto = async (index, category) => {
        const newList = [...(repair[category] || [])];
        newList.splice(index, 1);
        await updateRepair(repairId, { [category]: newList });
    };

    if (!repair) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-4xl flex flex-col max-h-[90vh]">

                {/* Header - Premium Glassmorphism */}
                <div className="p-8 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex justify-between items-start sticky top-0 z-50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
                            <Truck size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                                    Apple Onarım Merkezi
                                </span>
                                <span className="text-gray-400 text-xs font-bold font-mono tracking-tighter opacity-60">#{repair.id}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{repair.device}</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-70">Lojistik ve ARC Süreç Yönetimi</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-all active:scale-95 border border-transparent hover:border-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Üst Bilgi Kartları - Premium Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="group bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-500/5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold uppercase text-blue-500 tracking-widest">Gönderi Kodu (UPS)</span>
                                <Truck size={16} className="text-blue-400" />
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    className="w-full bg-white border border-blue-200/50 rounded-2xl px-4 py-3 text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm"
                                    placeholder="UPS Takip No"
                                    value={shipmentCode}
                                    onChange={(e) => setShipmentCode(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleStartTracking}
                                        className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                                    >
                                        Takibi Başlat
                                    </button>
                                    <button className="w-12 h-12 flex items-center justify-center bg-white text-blue-600 border border-blue-200 rounded-2xl hover:bg-blue-50 transition-all">
                                        <ExternalLink size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="group bg-purple-50/50 p-6 rounded-[32px] border border-purple-100/50 transition-all hover:bg-purple-50 hover:shadow-xl hover:shadow-purple-500/5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase text-purple-500 tracking-widest">GSX Onarım No</span>
                                    <Wrench size={16} className="text-purple-400" />
                                </div>
                                <div className="flex items-center gap-4">
                                    {isEditing ? (
                                        <div className="flex-1 flex gap-2 animate-in slide-in-from-right-2">
                                            <input
                                                type="text"
                                                className="flex-1 bg-white border border-purple-200 rounded-2xl px-4 py-2.5 text-sm font-mono font-bold outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all shadow-sm"
                                                value={gsxNo}
                                                onChange={(e) => setGsxNo(e.target.value)}
                                                autoFocus
                                            />
                                            <button onClick={handleSaveGSX} className="bg-purple-600 text-white px-4 rounded-2xl text-[10px] font-bold uppercase shadow-lg shadow-purple-200">Kaydet</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setIsEditing(true)}>
                                            <span className="text-2xl font-mono font-bold text-purple-900 tracking-tight leading-none">
                                                {gsxNo || 'Girilmedi'}
                                            </span>
                                            <div className="w-8 h-8 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-purple-400 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                <Pencil size={14} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!isEditing && gsxNo && (
                                <div className="mt-6 flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-100/50 w-fit">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-tight">{repair.status}</span>
                                </div>
                            )}
                        </div>

                        <div className="group bg-gray-50/50 p-6 rounded-[32px] border border-gray-100/50 transition-all hover:bg-gray-50 hover:shadow-xl hover:shadow-gray-500/5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Tahmini Teslim</span>
                                <Calendar size={16} className="text-gray-300" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">30 Ocak 2024</h3>
                                <div className="space-y-2">
                                    <div className="w-full bg-gray-200/50 h-2.5 rounded-full overflow-hidden shadow-inner">
                                        <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full w-[60%] rounded-full shadow-lg shadow-emerald-500/20 transition-all duration-1000" />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Lojistik Aşaması: %60</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kayıt ve Cihaz Detayları Paneli - Premium Info */}
                    <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm mb-10 group hover:shadow-xl hover:shadow-gray-200/30 transition-all duration-500">
                        <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-purple-600 shadow-sm">
                                    <FileText size={18} />
                                </div>
                                <h3 className="font-bold text-gray-900 tracking-tight uppercase text-xs tracking-widest">Kayıt Detayları</h3>
                            </div>
                            <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                Son Güncelleme: {repair.updatedAt || 'Yeni'}
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Müşteri Profili</span>
                                    <div className="flex items-start gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                                        <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-purple-500 shadow-sm shrink-0">
                                            <span className="font-bold text-lg">{repair.customer?.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-900 tracking-tight">{repair.customer}</p>
                                            <p className="text-xs font-bold text-gray-500 flex items-center gap-2 mt-1">
                                                <MyPhoneIcon size={14} className="text-gray-400" /> {repair.customerPhone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cihaz Bilgisi</span>
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                                        <p className="text-sm font-bold text-gray-900 mb-1">{repair.device}</p>
                                        <p className="text-xs font-mono text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded-xl border border-purple-100/50 inline-block">
                                            SN: {repair.serial || repair.serialNumber || 'Bilinmiyor'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Arıza Açıklaması</span>
                                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50 border-l-4 border-l-orange-400">
                                        <p className="text-sm text-gray-700 leading-relaxed italic">
                                            "{repair.issue || repair.issueDescription || 'Belirtilmedi'}"
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Teknik Tanı & Notlar</span>
                                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50 border-l-4 border-l-purple-400">
                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                            {repair.diagnosisNotes || 'Henüz bir teknik not girilmemiş.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Apple Merkezi Dönüş Bölümü - Premium Input Area */}
                    {(repair.status === "Apple'a Gönderildi" || repair.status === "İade Bekleniyor" || repair.status === "Müşteri Onayı Bekliyor" || repair.status === "Cihaz Hazır" || repair.status === "İade Hazır") && (
                        <div className="mt-12 p-8 bg-purple-50/50 rounded-[40px] border border-purple-100 animate-in slide-in-from-bottom-6 duration-700 shadow-2xl shadow-purple-200/20">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">ARC Kargo Kabul & Sonuç Girişi</h4>
                                    <p className="text-[10px] text-purple-600 font-bold uppercase tracking-tighter opacity-70">Onarım Merkezi Geri Bildirim Verilerini İşleyin</p>
                                </div>
                            </div>
                            
                            <div className="relative group mb-6">
                                <textarea
                                    className="w-full p-6 rounded-3xl border border-purple-100 bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none text-sm font-medium min-h-[120px] transition-all shadow-inner"
                                    placeholder="Apple Onarım Merkezi'nden iletilen onarım sonucunu veya yapılan işlemleri buraya yazınız..."
                                    value={arcResult}
                                    onChange={e => setArcResult(e.target.value)}
                                ></textarea>
                                <div className="absolute top-4 right-4 opacity-10 group-focus-within:opacity-30 transition-opacity">
                                    <MessageCircle size={24} />
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <Box size={14} className="text-purple-400" />
                                        <h5 className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">ARC'de Değişen Parçalar</h5>
                                    </div>
                                    <button
                                        onClick={addArcPart}
                                        className="text-[10px] bg-white text-purple-700 px-4 py-2 rounded-xl font-bold border border-purple-100 hover:bg-purple-600 hover:text-white transition-all duration-300 flex items-center gap-2 shadow-sm"
                                    >
                                        <Plus size={14} strokeWidth={3} /> PARÇA EKLE
                                    </button>
                                </div>
                                
                                {arcParts.length === 0 ? (
                                    <div className="text-center py-10 bg-white/40 border border-dashed border-purple-200 rounded-3xl text-purple-300 text-[10px] font-bold uppercase tracking-widest">
                                        Henüz parça eklenmedi
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {arcParts.map((part, index) => (
                                            <div key={index} className="bg-white p-5 rounded-3xl border border-purple-100 relative group shadow-sm hover:shadow-lg transition-all duration-300 animate-in zoom-in-95">
                                                <button
                                                    onClick={() => removeArcPart(index)}
                                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Parça No</p>
                                                            <input
                                                                type="text"
                                                                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono font-bold outline-none focus:border-purple-300 focus:bg-white transition-all"
                                                                value={part.partNumber}
                                                                onChange={e => updateArcPart(index, 'partNumber', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tanım</p>
                                                            <input
                                                                type="text"
                                                                className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold outline-none focus:border-purple-300 focus:bg-white transition-all"
                                                                value={part.description || part.name || part.itemName || ''}
                                                                onChange={e => updateArcPart(index, 'description', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-3 relative pt-2 border-t border-gray-50">
                                                        <div className="space-y-1.5">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">KBB (Arızalı)</p>
                                                            <input
                                                                type="text"
                                                                className={`w-full p-2.5 bg-gray-50 border ${part.kbbSerial ? 'border-green-100 bg-green-50/20' : 'border-gray-100'} rounded-xl text-[10px] font-mono font-bold outline-none focus:border-purple-300 transition-all`}
                                                                value={part.kbbSerial || ''}
                                                                onChange={e => updateArcPart(index, 'kbbSerial', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">KGB (Yeni)</p>
                                                            <input
                                                                type="text"
                                                                className={`w-full p-2.5 bg-gray-50 border ${part.kgbSerial ? 'border-green-100 bg-green-50/20' : 'border-gray-100'} rounded-xl text-[10px] font-mono font-bold outline-none focus:border-purple-300 transition-all`}
                                                                value={part.kgbSerial || ''}
                                                                onChange={e => updateArcPart(index, 'kgbSerial', e.target.value)}
                                                            />
                                                        </div>
                                                        {part.kgbSerial && part.kbbSerial && (
                                                            <div className="absolute -top-1 right-2 bg-green-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-green-500/20 animate-in zoom-in">
                                                                EŞLEŞTİ
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleReceiveFromARC}
                                className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-[24px] font-bold flex items-center justify-center gap-3 transition-all shadow-2xl shadow-gray-400/50 active:scale-95 group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package size={18} />
                                </div>
                                CIHAZI MAĞAZAYA TESLIM AL VE HAZIRLA
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* Lojistik Görsel Belgeleme */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-[28px] border border-gray-100">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-md shadow-sm text-purple-600 border border-purple-50">
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-tight">Lojistik Görsel Arşivi</h4>
                                    <p className="text-[10px] text-gray-400 font-bold text-xs uppercase tracking-wide">Gönderi ve Teslimat Kanıtları</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleAddPhoto}
                                disabled={uploading}
                                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-md text-[10px] font-semibold text-xs uppercase tracking-wide flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:bg-gray-400"
                            >
                                {uploading ? <Clock size={14} className="animate-spin" /> : <Plus size={14} />}
                                Fotoğraf Çek / Ekle
                            </button>
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Gönderim Fotoğrafları */}
                            {repair.beforeImages?.map((url, idx) => (
                                <div key={`before-${idx}`} className="relative group aspect-video rounded-md overflow-hidden border border-gray-200 shadow-sm bg-white animate-in zoom-in-95 duration-300">
                                    <img src={url} className="w-full h-full object-cover" alt="Pre-shipment" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[8px] text-white font-semibold uppercase tracking-tight">Kargo Gönderme</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => window.open(url, '_blank')} className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white"><ExternalLink size={12} /></button>
                                        <button onClick={() => removePhoto(idx, 'beforeImages')} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {/* Dönüş Fotoğrafları */}
                            {repair.afterImages?.map((url, idx) => (
                                <div key={`after-${idx}`} className="relative group aspect-video rounded-md overflow-hidden border border-emerald-100 shadow-sm bg-white animate-in zoom-in-95 duration-300">
                                    <img src={url} className="w-full h-full object-cover" alt="Post-arrival" />
                                    <div className="absolute inset-x-0 bottom-0 bg-emerald-600/70 backdrop-blur-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[8px] text-white font-semibold uppercase tracking-tight">Apple'dan Gelen</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => window.open(url, '_blank')} className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white"><ExternalLink size={12} /></button>
                                        <button onClick={() => removePhoto(idx, 'afterImages')} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {(!repair.beforeImages?.length && !repair.afterImages?.length) && (
                                <div className="col-span-full py-10 text-center bg-gray-100/50 rounded-md border border-dashed border-gray-200">
                                    <Camera size={32} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-[11px] font-bold text-gray-400">Henüz lojistik görseli eklenmemiş.</p>
                                    <p className="text-[10px] text-gray-300 mt-1 uppercase font-semibold tracking-widest">Kargo Kanıtlarını Buraya Ekleyin</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-md border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowNotificationModal(true)}
                                className="flex items-center gap-3 p-3 bg-white hover:bg-orange-50 rounded-md shadow-sm border border-gray-100 transition-colors text-left group"
                            >
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-200 transition-colors">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-orange-700">Durum Güncellemesi Bildir</h4>
                                    <p className="text-xs text-gray-500 group-hover:text-orange-600/70">Müşteriye SMS/Email gönder</p>
                                </div>
                            </button>
                        </div>
                        <div className="flex gap-3">
                            {repair.status === 'Müşteri Onayı Bekliyor' ? (
                                <>
                                    <button
                                        onClick={() => handleQuoteResolution(true)}
                                        className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Onaylandı (Devam)
                                    </button>
                                    <button
                                        onClick={() => handleQuoteResolution(false)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                                    >
                                        <X size={16} /> Reddedildi (İade)
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleQuoteReceived}
                                    className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors flex items-center gap-2"
                                >
                                    <DollarSign size={16} /> Teklif Geldi (Beklet)
                                </button>
                            )}
                            <button
                                onClick={handleSaveDraft}
                                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                Süreci Kaydet
                            </button>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${isEditing ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'}`}
                            >
                                {isEditing ? 'Düzenlemeyi Kapat' : 'Kaydı Düzenle'}
                            </button>
                            <button
                                onClick={handleReceiveFromARC}
                                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-gray-300 flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                Mağazaya Teslim Al
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Notification Modal */}
            {showNotificationModal && (
                <CustomerNotificationModal
                    repair={repair}
                    onClose={() => setShowNotificationModal(false)}
                    onActionComplete={() => {
                        setShowNotificationModal(false);
                        onClose();
                    }}
                />
            )}
        </div>
    );
};

export default AppleLogisticsModal;
