import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    X, CheckCircle, Clock, AlertTriangle, Check,
    Save, Play, Pause, RotateCcw, Box, Wrench, FileText, ChevronRight, Activity, Zap, AlertCircle, Users,
    Camera, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { appPrompt, appAlert } from '../utils/alert';

const TechnicianWorkspace = ({ repairId, onClose, setActiveTab }) => {
    const { repairs, updateRepair, completeJob, currentUser, inventory, updateInventoryItem, usePart, showToast, technicians, sendWhatsApp, uploadMedia } = useAppContext();
    const [repair, setRepair] = useState(null);
    const [repairClosingNote, setRepairClosingNote] = useState('');
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [customReturnReason, setCustomReturnReason] = useState('');
    const [uploading, setUploading] = useState(false);
    
    // Quotation States
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteItems, setQuoteItems] = useState([{ name: '', price: '' }]);
    const [quoteNotes, setQuoteNotes] = useState('');

    const fileInputRef = React.useRef(null);

    const RETURN_REASONS = [
        "Arıza Tekrarlanamadı (No Trouble Found)",
        "Müşteri Teklifi Reddetti",
        "Ekonomik Onarım Mümkün Değil (BER)",
        "Yetkisiz Müdahale Tespit Edildi",
        "Yedek Parça Temin Edilemiyor",
        "Müşteri İsteğiyle İade"
    ];

    const DEFAULT_STEPS = [
        { id: 1, label: 'Cihazın dış kozmetik kontrolü yapıldı', checked: false },
        { id: 2, label: 'Güvenlik vidaları ve Vida Sökümü', checked: false },
        { id: 3, label: 'Ekran flex kabloları ayrıldı', checked: false },
        { id: 4, label: 'Batarya bağlantısı kesildi', checked: false },
        { id: 5, label: 'Yeni parça montajı ve testleri', checked: false },
        { id: 6, label: 'PSA Yenileme ve Sıvı Koruma Uygulama', checked: false },
        { id: 7, label: 'Cihaz kapatıldı ve vidalandı', checked: false },
        { id: 8, label: 'Son fonksiyon ve kalite testleri', checked: false },
    ];

    const [steps, setSteps] = useState(() => {
        const found = repairs.find(r => r.id === repairId);
        // Eğer kayıtlı steps varsa ve boş değilse onu kullan, yoksa varsayılanları getir.
        if (found?.steps && found.steps.length > 0) {
            return found.steps.map(s => ({
                ...s,
                checked: s.checked !== undefined ? s.checked : (s.completed || false)
            }));
        }
        return DEFAULT_STEPS;
    });

    useEffect(() => {
        const found = repairs.find(r => r.id === repairId || r._id === repairId);
        if (found) setRepair(found);
    }, [repairId, repairs]);

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleStep = (id) => {
        if (!isTimerRunning) {
            if (repair.technician) {
                setIsTimerRunning(true);
                showToast('Onarım süresi otomatik başlatıldı.', 'info');
            } else {
                appAlert('Lütfen önce kendinizi veya bir teknisyeni seçerek onarımı başlatın.', 'warning');
                return;
            }
        }
        const newSteps = steps.map(step => step.id === id ? { ...step, checked: !step.checked } : step);
        setSteps(newSteps);
        updateRepair(repairId, { steps: newSteps });
    };

    const handleReturn = () => {
        if (!returnReason) return;
        const duration = formatTime(timer);
        const finalReason = returnReason === 'Diğer' ? customReturnReason : returnReason;

        updateRepair(repairId, {
            status: 'İade Hazır',
            repairClosingNote: `İŞLEMSİZ İADE: ${finalReason}\n\n[Süre: ${duration}]`,
            repairDuration: duration,
            historyNote: `Cihaz iade edildi: ${finalReason}`
        });

        completeJob(currentUser?.id || 'T1');
        onClose();
        if (setActiveTab) setActiveTab('ready-pickup');
    };

    const handleAddPhoto = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await uploadMedia(file);
            if (data && data.url) {
                const currentAfterImages = repair.afterImages || [];
                const success = await updateRepair(repairId, {
                    afterImages: [...currentAfterImages, data.url]
                });
                if (success) showToast('Onarım sonu fotoğrafı eklendi.', 'success');
            }
        } catch (error) {
            console.error(error);
            showToast('Fotoğraf yüklenemedi.', 'error');
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const removePhoto = async (index) => {
        const newList = [...(repair.afterImages || [])];
        newList.splice(index, 1);
        await updateRepair(repairId, { afterImages: newList });
    };

    const handleComplete = async () => {
        if (!steps.every(s => s.checked) || !repairClosingNote.trim()) {
            appAlert('Lütfen tüm adımları tamamlayın ve onarım raporunu yazın.', 'warning');
            return;
        }

        const incompletePart = repair.parts?.find(p => p.needsOrder || !p.kgbSerial);
        if (incompletePart) {
            appAlert(`Lütfen ${incompletePart.description} için KGB seri nosunu giriniz.`, 'info');
            return;
        }

        const duration = formatTime(timer);
        
        // --- CRITICAL: Subtract parts from inventory before finishing ---
        if (repair.parts && repair.parts.length > 0) {
            for (const part of repair.parts) {
                // Determine the correct part ID (inventoryId is usually the custom ID or _id)
                const partId = part.inventoryId || part.id;
                if (partId) {
                    await usePart(partId, 1);
                }
            }
        }

        const success = await updateRepair(repairId, {
            status: 'Cihaz Hazır',
            repairClosingNote: `${repairClosingNote}\n\n[Süre: ${duration}]`,
            repairDuration: duration,
            historyNote: `Onarım başarıyla tamamlandı ve kullanılan parçalar stoktan düşüldü.`
        });

        if (success) {
            completeJob(currentUser?.id || 'T1');
            
            // WhatsApp Bildirimi Sor
            const { isConfirmed } = await Swal.fire({
                title: 'Onarım Tamamlandı!',
                text: 'Müşteriye WhatsApp üzerinden bilgi vermek ister misiniz?',
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Evet, Bildir',
                cancelButtonText: 'Kapat',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#6b7280'
            });

            if (isConfirmed && repair.customerPhone) {
                const message = `Merhaba ${repair.customer}, ${repair.device} cihazınızın onarımı tamamlanmıştır. Cihazınızı servisimizden teslim alabilirsiniz.`;
                sendWhatsApp(repair.customerPhone, message);
            }

            onClose();
            if (setActiveTab) setActiveTab('ready-pickup');
            showToast('Onarım tamamlandı ve stoklar güncellendi.', 'success');
        }
    };

    const handleSendQuote = async () => {
        const totalAmount = quoteItems.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
        
        if (totalAmount <= 0) {
            appAlert('Lütfen geçerli bir teklif tutarı giriniz.', 'warning');
            return;
        }

        const quoteDetails = {
            items: quoteItems,
            totalAmount: totalAmount,
            notes: quoteNotes,
            date: new Date().toLocaleString('tr-TR')
        };

        const success = await updateRepair(repairId, {
            status: 'Müşteri Onayı Bekliyor',
            quoteAmount: totalAmount.toString(),
            quotationDetails: quoteDetails,
            diagnosisNotes: quoteNotes,
            historyNote: `Müşteriye ek onarım teklifi sunuldu: ₺${totalAmount}`
        });

        if (success) {
            if (repair.customerPhone || repair.phone) {
                const phone = repair.customerPhone || repair.phone;
                const link = `${window.location.origin}/?track=${repair.id}`;
                const message = `⚠️ *SERVİS ONAYI GEREKİYOR* ⚠️\n\nMerhaba ${repair.customer},\n\n#{repair.id} kayıt numaralı cihazınızın detaylı incelemesi sırasında ek işlem gerektiren bir durum tespit edilmiştir:\n\n*Durum:* ${quoteNotes || 'Parça değişimi / Ek onarım'}\n💰 *Ek Tutar:* ${totalAmount} TL\n\nİşleme devam edebilmemiz için müşteri portalımız üzerinden teklifi onaylamanızı/reddetmenizi rica ederiz:\n🔗 ${link}`;
                sendWhatsApp(phone, message);
            }

            appAlert('Fiyat teklifi müşteriye başarıyla iletildi ve cihaz bekleme moduna alındı.', 'success');
            onClose();
            if (setActiveTab) setActiveTab('approval-pending');
        }
    };

    if (!repair) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-7xl h-[92vh] flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-hidden">

                {/* Sol Panel - Onarım Adımları */}
                <div className="w-full lg:w-1/3 bg-gray-50/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col shrink-0 lg:shrink lg:h-full">
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-white text-gray-900 px-3 py-1 rounded-md text-xs font-mono font-bold border border-gray-100">{repair.id}</span>
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-bold uppercase">MAĞAZA İÇİ</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2 tracking-tight">{repair.device}</h2>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                                <span className="font-bold uppercase">S/N: {repair.serial || repair.serialNumber || 'YOK'}</span>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 font-medium flex items-center justify-between gap-2">
                            {repair.technician ? (
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-1">
                                        <Activity size={10} /> {repair.technician} Onarıyor
                                    </span>
                                    <button 
                                        onClick={() => updateRepair(repairId, { technician: null })}
                                        className="text-[10px] text-gray-400 hover:text-red-500 font-bold underline transition-colors"
                                    >
                                        Değiştir
                                    </button>
                                </div>
                            ) : (
                                <span className="text-gray-400">👤 {repair.customer}</span>
                            )}
                        </div>
                        {(repair.tcNo || repair.customerAddress) && (
                            <div className="mt-4 p-3 bg-white/50 rounded-2xl border border-gray-100 space-y-2">
                                {repair.tcNo && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TC / VKN</span>
                                        <span className="text-[10px] font-mono font-bold text-gray-600">{repair.tcNo}</span>
                                    </div>
                                )}
                                {repair.customerAddress && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Adres</span>
                                        <span className="text-[10px] font-medium text-gray-500 leading-tight line-clamp-2">{repair.customerAddress}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <label key={step.id} className={`flex items-start gap-4 p-5 rounded-[24px] border cursor-pointer transition-all ${step.checked ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${step.checked ? 'bg-white text-blue-600 border-white' : 'border-gray-200'}`}>
                                        <CheckCircle size={14} strokeWidth={4} />
                                    </div>
                                    <input type="checkbox" checked={step.checked} onChange={() => toggleStep(step.id)} className="hidden" />
                                    <div className="flex flex-col">
                                        <span className={`text-[9px] font-black uppercase opacity-60 ${step.checked ? 'text-blue-50' : 'text-gray-400'}`}>ADIM {index + 1}</span>
                                        <span className="text-sm font-bold">{step.label}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Parça & KGB Takibi */}
                    {repair.parts && repair.parts.length > 0 && (
                        <div className="p-6 border-t border-gray-100 bg-white">
                            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2">
                                <Box size={14} className="text-indigo-500" />
                                Parça & KGB Durumu
                            </h4>
                            <div className="space-y-2">
                                {repair.parts.map((p, i) => (
                                    <div key={i} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-bold text-gray-700 truncate">{p.description}</span>
                                            {p.kgbSerial ? (
                                                <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-black uppercase">GİRİLDİ</span>
                                            ) : (
                                                <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">EKSİK</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-mono text-gray-400 italic">{p.kgbSerial || 'Bekleniyor...'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Orta Panel */}
                <div className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-md">
                    <div className="h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-10">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> İŞLEM SÜRESİ</span>
                                <span className={`text-4xl font-mono font-bold ${isTimerRunning ? 'text-gray-900' : 'text-gray-300'}`}>{formatTime(timer)}</span>
                            </div>
                            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isTimerRunning ? 'bg-red-500 text-white' : 'bg-green-500 text-white shadow-lg'}`}>
                                {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto flex flex-col items-center justify-center">
                        {!repair.technician ? (
                            <div className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-indigo-100 shadow-xl">
                                    <Users size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Onarımı Kim Yapıyor?</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Süreyi başlatmak için isminizi seçiniz</p>
                                
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-8">
                                    {/* Kendim Yapıyorum Shortcut */}
                                    {currentUser && (
                                        <button 
                                            onClick={() => {
                                                updateRepair(repairId, { 
                                                    technician: currentUser.name, 
                                                    technicianId: currentUser.id || currentUser._id,
                                                    status: 'İşlemde', 
                                                    historyNote: `${currentUser.name} onarımı başlattı.` 
                                                });
                                                setIsTimerRunning(true);
                                            }}
                                            className="w-full p-3 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl border-2 border-indigo-200 text-sm font-black transition-all flex items-center justify-between group active:scale-95 shadow-lg shadow-indigo-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">✨</span>
                                                <span>Kendim Yapıyorum ({currentUser.name})</span>
                                            </div>
                                            <ChevronRight size={18} className="text-indigo-400 group-hover:text-white" />
                                        </button>
                                    )}

                                    <div className="pt-2 pb-1 text-[9px] font-black text-gray-400 text-left px-2 uppercase tracking-widest">Diğer Teknisyenler</div>
                                    
                                    {technicians.filter(t => t.name !== currentUser?.name).map(tech => (
                                        <button 
                                            key={tech.id} 
                                            onClick={() => {
                                                updateRepair(repairId, { 
                                                    technician: tech.name, 
                                                    technicianId: tech.id || tech._id,
                                                    status: 'İşlemde', 
                                                    historyNote: `${tech.name} onarımı başlattı.` 
                                                });
                                                setIsTimerRunning(true);
                                            }}
                                            className="w-full p-3 bg-gray-50 hover:bg-indigo-600 hover:text-white rounded-xl border border-gray-100 text-sm font-black transition-all flex items-center justify-between group active:scale-95"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{tech.avatar || '👨‍🔧'}</span>
                                                <span>{tech.name}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-white" />
                                        </button>
                                    ))}
                                </div>
                                
                                <button onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Vazgeç ve Kapat</button>
                            </div>
                        ) : (
                            <>
                                <div className="relative mb-6 group">
                                    <div className="absolute inset-0 bg-blue-500 blur-[40px] opacity-10 rounded-full group-hover:opacity-20 transition-all duration-700"></div>
                                    {repair.image ? (
                                        <img src={repair.image} className="w-56 h-56 object-cover rounded-[32px] shadow-2xl border-4 border-white transition-transform group-hover:scale-105" alt="Device" />
                                    ) : (
                                        <div className="w-56 h-56 rounded-[32px] bg-gray-50 border-4 border-white shadow-xl flex items-center justify-center">
                                            <Wrench size={48} className="text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-2xl font-black text-gray-900 mb-2">{repair.device}</h1>
                                <p className="text-sm text-gray-500 font-medium mb-10 max-w-md text-center">{repair.issue}</p>

                                {/* Apple KGB/KBB Pairing Automation */}
                                {repair.parts && repair.parts.length > 0 && (
                                    <div className="w-full max-w-xl mt-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
                                        <div className="bg-white border-2 border-indigo-100 rounded-[36px] p-6 shadow-2xl shadow-indigo-100/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                                                        <RotateCcw size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Apple Parça Eşleştirme</h4>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">KBB (Eski) → KGB (Yeni)</p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black border border-indigo-100">
                                                    OTOMASYON AKTİF
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {repair.parts.map((part, idx) => (
                                                    <div key={idx} className="p-4 bg-gray-50 rounded-[24px] border border-gray-100 flex flex-col gap-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                                                <h5 className="text-[11px] font-black text-gray-800 uppercase">{part.description}</h5>
                                                            </div>
                                                            <span className="text-[9px] font-mono text-gray-400">P/N: {part.partNumber}</span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
                                                            {/* KBB Input */}
                                                            <div className="relative">
                                                                <input 
                                                                    type="text"
                                                                    placeholder="KBB (Arızalı Seri)"
                                                                    className={`w-full h-10 px-4 bg-white border ${part.kbbSerial ? 'border-green-200 bg-green-50/30' : 'border-gray-200'} rounded-xl text-[10px] font-black font-mono focus:border-indigo-500 outline-none transition-all uppercase`}
                                                                    value={part.kbbSerial || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toUpperCase().replace(/\s/g, '');
                                                                        const updatedParts = repair.parts.map(p => {
                                                                            if (p.inventoryId === part.inventoryId) {
                                                                                const newPart = { ...p, kbbSerial: val };
                                                                                if (newPart.kgbSerial && newPart.kbbSerial) newPart.status = 'Installed';
                                                                                return newPart;
                                                                            }
                                                                            return p;
                                                                        });
                                                                        updateRepair(repairId, { parts: updatedParts });
                                                                    }}
                                                                />
                                                                {part.kbbSerial && <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                                                            </div>

                                                            <div className="flex justify-center">
                                                                <ArrowRight size={16} className={part.kgbSerial && part.kbbSerial ? 'text-green-500' : 'text-indigo-300'} />
                                                            </div>

                                                            {/* KGB Input */}
                                                            <div className="relative">
                                                                <input 
                                                                    type="text"
                                                                    placeholder="KGB (Yeni Seri)"
                                                                    className={`w-full h-10 px-4 bg-white border ${part.kgbSerial ? 'border-green-200 bg-green-50/30' : 'border-gray-200'} rounded-xl text-[10px] font-black font-mono focus:border-indigo-500 outline-none transition-all uppercase`}
                                                                    value={part.kgbSerial || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toUpperCase().replace(/\s/g, '');
                                                                        const updatedParts = repair.parts.map(p => {
                                                                            if (p.inventoryId === part.inventoryId) {
                                                                                const newPart = { ...p, kgbSerial: val };
                                                                                if (newPart.kgbSerial && newPart.kbbSerial) newPart.status = 'Installed';
                                                                                return newPart;
                                                                            }
                                                                            return p;
                                                                        });
                                                                        updateRepair(repairId, { parts: updatedParts });
                                                                    }}
                                                                />
                                                                {part.kgbSerial && <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-6 bg-white border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-white/80 backdrop-blur-xl">
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={onClose} className="px-4 py-3.5 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all text-[11px] uppercase tracking-wider">Kapat</button>
                            <button onClick={() => setShowReturnModal(true)} className="px-4 py-3.5 bg-red-50 text-red-600 border border-red-100 font-black rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-[9px] uppercase">
                                <RotateCcw size={14} /> İade Et
                            </button>
                            <button onClick={() => setShowQuoteModal(true)} className="px-4 py-3.5 bg-orange-50 text-orange-600 border border-orange-100 font-black rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95 text-[9px] uppercase">
                                <Activity size={14} /> Teklif Ver
                            </button>
                        </div>
                        <button 
                            onClick={handleComplete} 
                            disabled={!steps.every(s => s.checked)}
                            className="w-full py-4 bg-gray-900 text-white font-black rounded-[24px] shadow-xl hover:bg-black transition-all disabled:opacity-30 flex items-center justify-center gap-3 text-sm tracking-tight"
                        >
                            ONARIMI TAMAMLA <ChevronRight size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Sağ Panel */}
                <div className="w-full lg:w-1/4 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col p-8 shrink-0 lg:shrink lg:h-full overflow-y-auto">
                    <h3 className="text-[9px] font-black uppercase text-gray-400 mb-2 flex items-center gap-2"><FileText size={14} /> Teşhis Notları</h3>
                    <p className="text-xs font-semibold text-gray-500 mb-8 border-b border-gray-50 pb-8">{repair.diagnosisNotes || 'Not girilmemiş.'}</p>
                    
                    <textarea
                        className="h-32 w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 outline-none focus:bg-white text-xs font-bold resize-none mb-6"
                        placeholder="Onarım raporunu buraya yazınız..."
                        value={repairClosingNote}
                        onChange={e => setRepairClosingNote(e.target.value)}
                    ></textarea>

                    {/* Onarım Sonu Fotoğrafları */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-2">
                                <Camera size={14} className="text-emerald-500" /> Onarım Sonrası (Görsel)
                            </h4>
                            <button 
                                onClick={handleAddPhoto}
                                disabled={uploading}
                                className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100"
                            >
                                {uploading ? <Clock size={14} className="animate-spin" /> : <Plus size={14} />}
                            </button>
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

                        <div className="grid grid-cols-2 gap-3">
                            {repair.afterImages?.map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 shadow-sm animate-in zoom-in-95">
                                    <img src={url} className="w-full h-full object-cover" alt="After" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => removePhoto(idx)} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {(!repair.afterImages || repair.afterImages.length === 0) && (
                                <button 
                                    onClick={handleAddPhoto}
                                    className="aspect-square rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-emerald-200 hover:text-emerald-500 transition-all"
                                >
                                    <Camera size={20} />
                                    <span className="text-[8px] font-black uppercase">FOTO EKLE</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-8 animate-in fade-in">
                    <div className="bg-white p-8 rounded-[36px] w-full max-w-2xl shadow-2xl flex flex-col max-h-full opacity-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Yeni Fiyat Teklifi Gönder</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Müşteri portalı üzerinden bilgilendirilir</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar min-h-[300px]">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-gray-400">Teklif Kalemleri</label>
                                {quoteItems.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-center">
                                        <input 
                                            className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-300 outline-none"
                                            placeholder="Örn: Anakart Onarımı, Yeni Ekran..."
                                            value={item.name}
                                            onChange={(e) => {
                                                const newItems = [...quoteItems];
                                                newItems[index].name = e.target.value;
                                                setQuoteItems(newItems);
                                            }}
                                        />
                                        <div className="relative w-40">
                                            <input 
                                                type="number"
                                                className="w-full p-4 pl-8 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black focus:border-orange-300 outline-none font-mono"
                                                placeholder="0.00"
                                                value={item.price}
                                                onChange={(e) => {
                                                    const newItems = [...quoteItems];
                                                    newItems[index].price = e.target.value;
                                                    setQuoteItems(newItems);
                                                }}
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
                                        </div>
                                        <button 
                                            onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== index))}
                                            className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setQuoteItems([...quoteItems, { name: '', price: '' }])}
                                    className="w-full p-3 border-2 border-dashed border-orange-200 text-orange-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-50 transition-colors"
                                >
                                    + Kalem Ekle
                                </button>
                            </div>

                            <div className="space-y-2 mt-4">
                                <label className="text-[10px] font-black uppercase text-gray-400">Müşteriye İletilecek Teknik Not (Açıklama)</label>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:border-orange-300 outline-none resize-none h-24"
                                    placeholder="Müşteriye durumun nedenini açıklayınız (Örn: Cihazda sıvı teması tespit edildi, ek müdahale gerekiyor...)"
                                    value={quoteNotes}
                                    onChange={(e) => setQuoteNotes(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="bg-orange-50 p-6 rounded-3xl mb-6 flex justify-between items-center border border-orange-100">
                            <span className="text-sm font-black text-orange-900 uppercase">Toplam Teklif Tutarı</span>
                            <span className="text-3xl font-black text-orange-900 font-mono">
                                ₺{quoteItems.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0).toLocaleString('tr-TR')}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowQuoteModal(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">İptal</button>
                            <button onClick={handleSendQuote} className="flex-[2] py-4 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-200 flex items-center justify-center gap-2 transition-all">
                                Teklifi Gönder & Beklemeye Al
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-8 animate-in fade-in">
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-lg shadow-2xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2"><AlertCircle className="text-red-500" /> İade Sebebi</h3>
                        <div className="space-y-3 mb-8">
                            {RETURN_REASONS.map(reason => (
                                <label key={reason} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${returnReason === reason ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    <input type="radio" name="returnReason" value={reason} checked={returnReason === reason} onChange={(e) => setReturnReason(e.target.value)} className="accent-red-600" />
                                    {reason}
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowReturnModal(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl">Vazgeç</button>
                            <button onClick={handleReturn} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-200">İade Et</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicianWorkspace;
