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

                {/* Header */}
                <div className="p-6 bg-[#f5f5f7] border-b border-gray-200 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border border-purple-200">
                                Apple Onarım Merkezi
                            </span>
                            <span className="text-gray-400 text-sm font-mono">#{repair.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{repair.device}</h2>
                        <p className="text-sm text-gray-500 mt-1">Lojistik ve Onarım Durum Takibi</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* Üst Bilgi Kartları */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                            <span className="block text-xs font-bold uppercase text-blue-400 mb-2">Gönderi Kodu (UPS)</span>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Truck className="text-blue-600" size={20} />
                                    <input
                                        type="text"
                                        className="flex-1 bg-white border border-blue-100 rounded-lg px-3 py-2 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-200"
                                        placeholder="UPS Takip No"
                                        value={shipmentCode}
                                        onChange={(e) => setShipmentCode(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleStartTracking}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
                                    >
                                        Takibi Başlat
                                    </button>
                                    <button className="p-2 bg-white text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50">
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex flex-col justify-between">
                            <div>
                                <span className="block text-xs font-bold uppercase text-purple-400 mb-2">Apple Onarım No (GSX)</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                        <Wrench size={20} />
                                    </div>
                                    {isEditing ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-purple-200"
                                                value={gsxNo}
                                                onChange={(e) => setGsxNo(e.target.value)}
                                                autoFocus
                                            />
                                            <button onClick={handleSaveGSX} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">Kaydet</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                                            <span className="text-xl font-mono font-black text-purple-900 tracking-tight">
                                                {gsxNo || 'Girilmedi'}
                                            </span>
                                            <Pencil size={14} className="text-purple-300 group-hover:text-purple-600 transition-colors" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {!isEditing && gsxNo && <div className="text-[10px] font-black uppercase text-purple-600 mt-3 flex items-center gap-1.5 bg-white/50 w-fit px-2 py-0.5 rounded-md border border-purple-100/50">
                                <Clock size={10} /> {repair.status}
                            </div>}
                        </div>

                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                            <span className="block text-xs font-bold uppercase text-gray-400 mb-2">Tahmini Teslim</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="text-gray-600" size={20} />
                                <span className="text-lg font-bold text-gray-900">30 Ocak 2024</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4 overflow-hidden">
                                <div className="bg-green-500 h-full w-[60%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Kayıt ve Cihaz Detayları Paneli */}
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm mb-8">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <FileText size={18} className="text-purple-600" />
                            <h3 className="font-bold text-gray-900">Mevcut Kayıt Bilgileri</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Müşteri Detayları</span>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-gray-900">{repair.customer}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                            <MyPhoneIcon size={14} className="text-gray-400" /> {repair.customerPhone}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cihaz Bilgisi</span>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-gray-900">{repair.device}</p>
                                        <p className="text-xs font-mono text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded inline-block">
                                            SN: {repair.serial || repair.serialNumber || 'Bilinmiyor'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Arıza Açıklaması</span>
                                    <p className="text-sm text-gray-700 leading-relaxed italic bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        "{repair.issue || repair.issueDescription || 'Belirtilmedi'}"
                                    </p>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Teknik Tanı & Notlar</span>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {repair.diagnosisNotes || 'Henüz bir teknik not girilmemiş.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Apple Merkezi Dönüş Bölümü */}
                    {(repair.status === "Apple'a Gönderildi" || repair.status === "İade Bekleniyor" || repair.status === "Müşteri Onayı Bekliyor" || repair.status === "Cihaz Hazır" || repair.status === "İade Hazır") && (
                        <div className="mt-12 p-6 bg-purple-50 rounded-2xl border-2 border-purple-100 animate-in slide-in-from-bottom-4 shadow-lg shadow-purple-100/50">
                            <div className="flex items-center gap-2 mb-4 text-purple-700">
                                <CheckCircle size={20} />
                                <h4 className="font-bold uppercase tracking-tight">ARC'den Geldi (Kabul ve Sonuç Girişi)</h4>
                            </div>
                            <textarea
                                className="w-full p-4 rounded-xl border border-purple-100 bg-white focus:ring-2 focus:ring-purple-200 outline-none text-sm min-h-[100px] mb-4"
                                placeholder="Apple Onarım Merkezi'nden iletilen onarım sonucunu veya yapılan işlemleri buraya yazınız..."
                                value={arcResult}
                                onChange={e => setArcResult(e.target.value)}
                            ></textarea>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-xs font-bold uppercase text-purple-400">ARC'de Değişen Parçalar</h5>
                                    <button
                                        onClick={addArcPart}
                                        className="text-[10px] bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-bold hover:bg-purple-200 transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Parça Ekle
                                    </button>
                                </div>
                                {arcParts.length === 0 ? (
                                    <div className="text-center py-4 bg-white/50 border border-dashed border-purple-200 rounded-xl text-purple-300 text-xs">
                                        Henüz parça eklenmedi. (Gerekliyse ekleyin)
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {arcParts.map((part, index) => (
                                            <div key={index} className="bg-white p-4 rounded-xl border border-purple-100 relative group shadow-sm">
                                                <button
                                                    onClick={() => removeArcPart(index)}
                                                    className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                                                    <input
                                                        type="text"
                                                        placeholder="Parça No"
                                                        className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-mono outline-none focus:border-purple-300"
                                                        value={part.partNumber}
                                                        onChange={e => updateArcPart(index, 'partNumber', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Tanım (Örn: Ekran)"
                                                        className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:border-purple-300"
                                                        value={part.description || part.name || part.itemName || ''}
                                                        onChange={e => updateArcPart(index, 'description', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="KBB (Arızalı)"
                                                        className={`p-2 bg-gray-50 border ${part.kbbSerial ? 'border-green-100 bg-green-50/20' : 'border-gray-100'} rounded-lg text-[10px] font-mono outline-none focus:border-purple-300 transition-all`}
                                                        value={part.kbbSerial || ''}
                                                        onChange={e => updateArcPart(index, 'kbbSerial', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="KGB (Yeni)"
                                                        className={`p-2 bg-gray-50 border ${part.kgbSerial ? 'border-green-100 bg-green-50/20' : 'border-gray-100'} rounded-lg text-[10px] font-mono outline-none focus:border-purple-300 transition-all`}
                                                        value={part.kgbSerial || ''}
                                                        onChange={e => updateArcPart(index, 'kgbSerial', e.target.value)}
                                                    />
                                                    {part.kgbSerial && part.kbbSerial && (
                                                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-sm animate-in zoom-in">
                                                            EŞLEŞTİ
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleReceiveFromARC}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-200"
                            >
                                <Package size={18} />
                                Cihazı Mağazaya Teslim Al ve Hazırla
                            </button>
                        </div>
                    )}

                    {/* Lojistik Görsel Belgeleme */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-[28px] border border-gray-100">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-purple-600 border border-purple-50">
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Lojistik Görsel Arşivi</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gönderi ve Teslimat Kanıtları</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleAddPhoto}
                                disabled={uploading}
                                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:bg-gray-400"
                            >
                                {uploading ? <Clock size={14} className="animate-spin" /> : <Plus size={14} />}
                                Fotoğraf Çek / Ekle
                            </button>
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Gönderim Fotoğrafları */}
                            {repair.beforeImages?.map((url, idx) => (
                                <div key={`before-${idx}`} className="relative group aspect-video rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white animate-in zoom-in-95 duration-300">
                                    <img src={url} className="w-full h-full object-cover" alt="Pre-shipment" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[8px] text-white font-black uppercase tracking-tight">Kargo Gönderme</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => window.open(url, '_blank')} className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white"><ExternalLink size={12} /></button>
                                        <button onClick={() => removePhoto(idx, 'beforeImages')} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {/* Dönüş Fotoğrafları */}
                            {repair.afterImages?.map((url, idx) => (
                                <div key={`after-${idx}`} className="relative group aspect-video rounded-2xl overflow-hidden border border-emerald-100 shadow-sm bg-white animate-in zoom-in-95 duration-300">
                                    <img src={url} className="w-full h-full object-cover" alt="Post-arrival" />
                                    <div className="absolute inset-x-0 bottom-0 bg-emerald-600/70 backdrop-blur-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[8px] text-white font-black uppercase tracking-tight">Apple'dan Gelen</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => window.open(url, '_blank')} className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white"><ExternalLink size={12} /></button>
                                        <button onClick={() => removePhoto(idx, 'afterImages')} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {(!repair.beforeImages?.length && !repair.afterImages?.length) && (
                                <div className="col-span-full py-10 text-center bg-gray-100/50 rounded-2xl border border-dashed border-gray-200">
                                    <Camera size={32} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-[11px] font-bold text-gray-400">Henüz lojistik görseli eklenmemiş.</p>
                                    <p className="text-[10px] text-gray-300 mt-1 uppercase font-black tracking-widest">Kargo Kanıtlarını Buraya Ekleyin</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowNotificationModal(true)}
                                className="flex items-center gap-3 p-3 bg-white hover:bg-orange-50 rounded-xl shadow-sm border border-gray-100 transition-colors text-left group"
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
                />
            )}
        </div>
    );
};

export default AppleLogisticsModal;
