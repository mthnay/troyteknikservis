import React, { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
    X, CheckCircle, Clock, AlertTriangle, Check,
    Save, Play, Pause, RotateCcw, Box, Wrench, FileText, ChevronRight, Activity, Zap, AlertCircle, Users,
    Camera, Plus, Trash2, ArrowRight, ShieldCheck, Microscope, Info
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { appPrompt, appAlert } from '../utils/alert';
import { getSafeRepairImageUrl } from '../utils/productImages';

const TechnicianWorkspace = ({ repairId, onClose, setActiveTab }) => {
    const { repairs, updateRepair, completeJob, currentUser, inventory, updateInventoryItem, usePart, showToast, technicians, sendWhatsApp, uploadMedia, API_URL } = useAppContext();
    const [repair, setRepair] = useState(null);
    const [repairClosingNote, setRepairClosingNote] = useState('');
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [customReturnReason, setCustomReturnReason] = useState('');
    const [uploading, setUploading] = useState(false);
    const [localSerials, setLocalSerials] = useState({});
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteItems, setQuoteItems] = useState([{ name: '', price: '' }]);
    const [quoteNotes, setQuoteNotes] = useState('');

    const fileInputRef = useRef(null);

    const RETURN_REASONS = [
        "Arıza Tekrarlanamadı (NTF)",
        "Müşteri Teklifi Reddetti",
        "Ekonomik Onarım Mümkün Değil (BER)",
        "Yetkisiz Müdahale Tespit Edildi",
        "Yedek Parça Temin Edilemiyor",
        "Müşteri İsteğiyle İade"
    ];

    const DEFAULT_STEPS = [
        { id: 1, label: 'Kozmetik ve Fonksiyonel Ön Kontrol', checked: false },
        { id: 2, label: 'Güvenlik Vidaları ve Vida Sökümü', checked: false },
        { id: 3, label: 'Flex Kabloları ve Batarya İzolasyonu', checked: false },
        { id: 4, label: 'Arızalı Parça Sökümü ve KBB Kaydı', checked: false },
        { id: 5, label: 'Yeni Parça Montajı ve KGB Eşleşmesi', checked: false },
        { id: 6, label: 'PSA Yenileme ve Sıvı Koruma Uygulama', checked: false },
        { id: 7, label: 'Cihaz Kapama ve Tork Ayarlı Vidalama', checked: false },
        { id: 8, label: 'Kalite Kontrol (QC) Testleri Tamamlandı', checked: false },
    ];

    const [steps, setSteps] = useState([]);

    useEffect(() => {
        const found = repairs.find(r => r.id === repairId || r._id === repairId);
        if (found) {
            setRepair(found);
            if (found.steps && found.steps.length > 0) {
                setSteps(found.steps.map(s => ({ ...s, checked: s.checked ?? s.completed ?? false })));
            } else {
                setSteps(DEFAULT_STEPS);
            }
            
            const serials = {};
            (found.parts || []).forEach((p, idx) => {
                serials[`${idx}_kbb`] = p.kbbSerial || '';
                serials[`${idx}_kgb`] = p.kgbSerial || '';
            });
            setLocalSerials(serials);
        }
    }, [repairId, repairs]);

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleStep = (id) => {
        if (!isTimerRunning && repair.technician) {
            setIsTimerRunning(true);
            showToast('Onarım süreci otomatik başlatıldı.', 'info');
        }
        if (!repair.technician) {
            appAlert('Lütfen önce bir teknisyen seçerek onarımı başlatın.', 'warning');
            return;
        }
        const newSteps = steps.map(s => s.id === id ? { ...s, checked: !s.checked } : s);
        setSteps(newSteps);
        updateRepair(repairId, { steps: newSteps });
    };

    const handleComplete = async () => {
        if (!steps.every(s => s.checked)) {
            appAlert('Lütfen tüm onarım adımlarını tamamlayın.', 'warning');
            return;
        }
        if (!repairClosingNote.trim()) {
            appAlert('Lütfen onarım raporunu/notlarını doldurun.', 'warning');
            return;
        }

        const incompletePart = repair.parts?.find((p, idx) => {
            const kgb = localSerials[`${idx}_kgb`] || p.kgbSerial || '';
            return kgb.trim() === '';
        });

        if (incompletePart) {
            appAlert(`${incompletePart.description} için KGB seri numarası zorunludur.`, 'error');
            return;
        }

        const duration = formatTime(timer);
        const success = await updateRepair(repairId, {
            status: 'Cihaz Hazır',
            repairClosingNote: `${repairClosingNote}\n\n[Süre: ${duration}]`,
            repairDuration: duration,
            historyNote: `Onarım tamamlandı. (${duration})`
        });

        if (success) {
            completeJob(currentUser?.id);
            onClose();
            if (setActiveTab) setActiveTab('ready-pickup');
            showToast('Onarım başarıyla sonuçlandırıldı.', 'success');
        }
    };

    if (!repair) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#f5f5f7] flex flex-col animate-fade-in">
            {/* GSX Top Bar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-[#1d1d1f] text-white p-2 rounded-lg">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Servis Atölyesi</span>
                            <ChevronRight size={10} className="text-gray-300" />
                            <span className="text-[10px] font-bold text-[#0071e3] uppercase tracking-widest">Aktif Onarım</span>
                        </div>
                        <h2 className="text-sm font-bold text-[#1d1d1f]">#{repair.id} • {repair.device}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">İşlem Süresi</span>
                        <span className={`text-xl font-mono font-black ${isTimerRunning ? 'text-[#0071e3]' : 'text-gray-300'}`}>{formatTime(timer)}</span>
                    </div>
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isTimerRunning ? 'bg-red-500 text-white' : 'bg-[#0071e3] text-white'}`}>
                        {isTimerRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#1d1d1f] transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Service Info & Steps */}
                <div className="w-[400px] border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
                    <div className="p-6 border-b border-gray-50 bg-[#fbfbfd]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                                <img src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1d1d1f]">{repair.customer}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{repair.serial}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2 py-0.5 bg-blue-50 text-[#0071e3] text-[9px] font-bold rounded uppercase border border-blue-100">Mağaza İçi</span>
                                    {repair.technician && <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded uppercase border border-green-100">👨‍🔧 {repair.technician}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Info size={10} /> Müşteri Şikayeti
                            </h4>
                            <p className="text-[11px] font-medium text-gray-600 leading-relaxed italic">"{repair.issue}"</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-2">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Onarım Akışı Checklist</h4>
                        {steps.map((step, idx) => (
                            <div 
                                key={step.id} onClick={() => toggleStep(step.id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${step.checked ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-lg shadow-[#0071e3]/10' : 'bg-white border-gray-100 hover:border-[#0071e3]/30'}`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${step.checked ? 'bg-white text-[#0071e3] border-white' : 'border-gray-200 text-transparent'}`}>
                                    <Check size={14} strokeWidth={4} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[8px] font-bold uppercase ${step.checked ? 'text-blue-100' : 'text-gray-400'}`}>Adım {idx + 1}</span>
                                    <span className="text-[11px] font-bold tracking-tight">{step.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content: Workbench */}
                <div className="flex-1 overflow-y-auto p-10 bg-[#f5f5f7]">
                    {!repair.technician ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl border border-white text-center">
                                <div className="w-20 h-20 bg-[#f5f5f7] text-[#0071e3] rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                    <Users size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">Workbench Erişimi</h2>
                                <p className="text-sm text-gray-400 font-medium mb-8">İşlemi başlatan teknisyeni seçiniz.</p>
                                <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                                    {technicians.map(tech => (
                                        <button 
                                            key={tech.id} 
                                            onClick={() => updateRepair(repairId, { technician: tech.name, status: 'Onarımda', historyNote: `${tech.name} onarımı başlattı.` })}
                                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-[#0071e3] hover:bg-[#0071e3]/5 transition-all group active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{tech.avatar || '👨‍🔧'}</span>
                                                <span className="font-bold text-[#1d1d1f]">{tech.name}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0071e3]" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Apple Parts Pairing Section */}
                            {repair.parts && repair.parts.length > 0 && (
                                <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-[#f5f5f7] rounded-xl text-[#0071e3]">
                                                <Box size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[#1d1d1f]">Apple Parça Eşleştirme (KBB/KGB)</h3>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Orijinal Parça Entegrasyonu</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100">
                                            <ShieldCheck size={14} /> GÜVENLİ AKTARIM
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {repair.parts.map((part, idx) => (
                                            <div key={idx} className="p-6 bg-[#fbfbfd] rounded-2xl border border-gray-100">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[11px] font-black text-[#1d1d1f] uppercase">{part.description}</span>
                                                    <span className="text-[10px] font-mono text-gray-400 font-bold">P/N: {part.partNumber}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">KBB (Eski Seri)</label>
                                                        <input 
                                                            type="text" placeholder="SERİ NO OKUTUN"
                                                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold focus:border-[#0071e3] outline-none transition-all uppercase"
                                                            value={localSerials[`${idx}_kbb`] || ''}
                                                            onChange={(e) => setLocalSerials({...localSerials, [`${idx}_kbb`]: e.target.value.toUpperCase()})}
                                                            onBlur={() => updateRepair(repairId, { parts: repair.parts.map((p, i) => i === idx ? {...p, kbbSerial: localSerials[`${idx}_kbb`]} : p) })}
                                                        />
                                                    </div>
                                                    <div className="mt-5">
                                                        <ArrowRight size={20} className="text-[#0071e3]/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">KGB (Yeni Seri)</label>
                                                        <input 
                                                            type="text" placeholder="YENİ SERİ NO"
                                                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold focus:border-[#0071e3] outline-none transition-all uppercase"
                                                            value={localSerials[`${idx}_kgb`] || ''}
                                                            onChange={(e) => setLocalSerials({...localSerials, [`${idx}_kgb`]: e.target.value.toUpperCase()})}
                                                            onBlur={() => updateRepair(repairId, { parts: repair.parts.map((p, i) => i === idx ? {...p, kgbSerial: localSerials[`${idx}_kgb`]} : p) })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Repair Report & Media */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-8 flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <FileText size={20} className="text-[#0071e3]" />
                                        <h3 className="font-bold text-[#1d1d1f]">Onarım Raporu</h3>
                                    </div>
                                    <textarea
                                        className="flex-1 min-h-[200px] w-full bg-[#fbfbfd] border border-gray-100 rounded-2xl p-6 text-sm font-medium focus:bg-white focus:border-[#0071e3] transition-all outline-none resize-none"
                                        placeholder="Teknik müdahale detaylarını, yapılan testleri ve varsa ek notları buraya giriniz..."
                                        value={repairClosingNote}
                                        onChange={e => setRepairClosingNote(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <Camera size={20} className="text-[#0071e3]" />
                                            <h3 className="font-bold text-[#1d1d1f]">Görsel Kanıt (QC)</h3>
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-[#f5f5f7] rounded-xl hover:bg-gray-200 transition-all">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setUploading(true);
                                            const res = await uploadMedia(file);
                                            if (res?.url) updateRepair(repairId, { afterImages: [...(repair.afterImages || []), res.url] });
                                            setUploading(false);
                                        }
                                    }} />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {repair.afterImages?.map((url, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button onClick={() => updateRepair(repairId, { afterImages: repair.afterImages.filter((_, i) => i !== idx) })} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!repair.afterImages || repair.afterImages.length === 0) && (
                                            <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-300">
                                                <Camera size={24} />
                                                <span className="text-[10px] font-bold">GÖRSEL YOK</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Action Bar */}
                <div className="w-20 border-l border-gray-200 bg-white flex flex-col items-center py-8 gap-6 shrink-0">
                    <button onClick={() => setShowQuoteModal(true)} className="p-3 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-sm" title="Teklif Gönder">
                        <Zap size={24} />
                    </button>
                    <button onClick={() => setShowReturnModal(true)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="İadesiz Gönder">
                        <RotateCcw size={24} />
                    </button>
                    <div className="flex-1"></div>
                    <button 
                        onClick={handleComplete}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl ${steps.every(s => s.checked) ? 'bg-[#0071e3] text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                    >
                        <Check size={28} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 z-[110] bg-[#1d1d1f]/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-[#1d1d1f]">Yeni Fiyat Teklifi</h3>
                            </div>
                            <button onClick={() => setShowQuoteModal(false)} className="p-2 text-gray-400 hover:text-[#1d1d1f]">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="space-y-4">
                                {quoteItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <input className="flex-1 h-12 px-4 bg-[#f5f5f7] rounded-xl text-sm font-bold outline-none" placeholder="İşlem/Parça Adı" value={item.name} onChange={e => setQuoteItems(quoteItems.map((q, i) => i === idx ? {...q, name: e.target.value} : q))} />
                                        <input type="number" className="w-32 h-12 px-4 bg-[#f5f5f7] rounded-xl text-sm font-bold outline-none" placeholder="Fiyat" value={item.price} onChange={e => setQuoteItems(quoteItems.map((q, i) => i === idx ? {...q, price: e.target.value} : q))} />
                                    </div>
                                ))}
                                <button onClick={() => setQuoteItems([...quoteItems, {name: '', price: ''}])} className="text-xs font-bold text-[#0071e3]">+ YENİ KALEM EKLE</button>
                            </div>
                            <textarea className="w-full h-32 bg-[#f5f5f7] rounded-2xl p-6 text-sm outline-none resize-none" placeholder="Müşteriye teknik açıklama..." value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)}></textarea>
                        </div>
                        <div className="p-8 bg-gray-50 flex items-center justify-between">
                            <div className="text-2xl font-black text-[#1d1d1f]">₺{quoteItems.reduce((a, b) => a + (Number(b.price) || 0), 0).toLocaleString('tr-TR')}</div>
                            <button onClick={() => { updateRepair(repairId, { status: 'Müşteri Onayı Bekliyor', quoteAmount: quoteItems.reduce((a, b) => a + (Number(b.price) || 0), 0).toString() }); onClose(); }} className="px-8 py-4 bg-[#0071e3] text-white font-bold rounded-2xl shadow-xl shadow-[#0071e3]/20">TEKLİFİ GÖNDER</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 z-[110] bg-[#1d1d1f]/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl">
                        <h3 className="text-xl font-bold text-[#1d1d1f] mb-6 flex items-center gap-2">
                            <AlertCircle className="text-red-500" /> İade Gerekçesi
                        </h3>
                        <div className="space-y-3 mb-8">
                            {RETURN_REASONS.map(reason => (
                                <button key={reason} onClick={() => setReturnReason(reason)} className={`w-full p-4 rounded-xl border text-left text-sm font-bold transition-all ${returnReason === reason ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100'}`}>
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowReturnModal(false)} className="flex-1 py-4 text-gray-400 font-bold">İptal</button>
                            <button onClick={() => { updateRepair(repairId, { status: 'İade Hazır', historyNote: `Cihaz iade edildi: ${returnReason}` }); onClose(); }} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl">İADE ET</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicianWorkspace;
