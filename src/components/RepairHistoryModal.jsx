import React, { useState, useMemo } from 'react';
import {
    X, CheckCircle, Clock, Truck, MessageCircle, Wrench, Phone, User,
    Calendar, ArrowRight, Printer, FileText, Shield, Eye, Package,
    ChevronRight, Save, Pencil, PlusCircle, Send, Receipt, Hash, ShieldCheck,
    AlertCircle, FileInput, Fingerprint, Coins, Camera, Info, Image, Bell, Trash2
} from 'lucide-react';
import ServiceFormPrint from './ServiceFormPrint';
import DeliveryFormPrint from './DeliveryFormPrint';
import { useAppContext } from '../context/AppContext';
import { appPrompt, appAlert, appConfirm } from '../utils/alert';
import CustomerNotificationModal from './CustomerNotificationModal';

const STATUS_STEPS = [
    { id: 'entry', label: 'Servis Kabul', keys: ['Kayıt Oluşturuldu', 'Beklemede'] },
    { id: 'diagnosis', label: 'Arıza Tespit', keys: ['Teşhis Ediliyor', 'Teklif Sunuldu', 'Müşteri Onayı Bekliyor', 'Teklif Onaylandı', 'Teklif Reddedildi'] },
    { id: 'repair', label: 'Onarımda', keys: ['İşlemde', "Apple'a Gönderildi", 'Transferde'] },
    { id: 'ready', label: 'Kalite & Hazır', keys: ['Tamamlandı', 'Cihaz Hazır', 'İade Hazır'] },
    { id: 'delivered', label: 'Teslim', keys: ['Teslim Edildi', 'İade Edildi'] },
];

const REPAIR_TYPE_LABELS = {
    'carry-in': 'Mağaza İçi Onarım',
    'apple-center': 'Apple Onarım Merkezi',
    'direct-return': 'İşlemsiz İade',
    'service': 'Onarım Olmayan Servis',
    'mail-in': 'Bütün Birim Posta',
    'approval': 'Teklif Bekliyor',
    'returnbefore': 'Değiştirmeden Önce İade'
};

const RepairHistoryModal = ({ repair: initialRepair, onClose }) => {
    const { updateRepair, updateRepairStatus, removeRepair, repairs, servicePoints, currentUser, showToast } = useAppContext();
    const repair = repairs.find(r => r.id === initialRepair.id) || initialRepair;
    
    // UI States
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'docs', 'finance', 'media'
    const [selectedPhoto, setSelectedPhoto] = useState(null); // Fullscreen preview
    const [showAcceptancePrint, setShowAcceptancePrint] = useState(false);
    const [showDeliveryPrint, setShowDeliveryPrint] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [targetStoreId, setTargetStoreId] = useState('');
    const [newNote, setNewNote] = useState('');
    const [invoiceNo, setInvoiceNo] = useState(repair?.invoiceNumber || '');

    // Edit Form State
    const [editForm, setEditForm] = useState({
        customer: repair?.customer || '',
        customerPhone: repair?.customerPhone || '',
        device: repair?.device || '',
        serial: repair?.serial || repair?.serialNumber || '',
        issue: repair?.issue || ''
    });

    React.useEffect(() => {
        if (repair) {
            setEditForm({
                customer: repair.customer,
                customerPhone: repair.customerPhone,
                device: repair.device,
                serial: repair.serial || repair.serialNumber,
                issue: repair.issue
            });
            setInvoiceNo(repair.invoiceNumber || '');
        }
    }, [repair]);

    if (!repair) return null;

    // Logic Functions
    const handleSave = () => {
        updateRepair(repair.id, { ...editForm });
        setIsEditing(false);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const noteObj = {
            text: newNote,
            date: new Date().toLocaleString('tr-TR'),
            user: currentUser?.name || 'Sistem'
        };
        const updatedNotes = repair.internalNotes ? [...repair.internalNotes, noteObj] : [noteObj];
        updateRepair(repair.id, { internalNotes: updatedNotes });
        setNewNote('');
    };

    const handleSaveInvoice = () => {
        updateRepair(repair.id, { invoiceNumber: invoiceNo });
        appAlert('Fatura numarası başarıyla kaydedildi.', 'success');
    };

    const handleAddProcess = async () => {
        const note = await appPrompt("Yeni işlem için açıklama giriniz (Örn: Müşteri tekrar getirdi, 2. arıza tespit edildi):");
        if (note) {
            updateRepairStatus(repair.id, 'İşlemde', `YENİ SÜREÇ BAŞLATILDI: ${note}`);
        }
    };

    const handleWhatsApp = () => {
        let phone = repair.customerPhone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) phone = phone.substring(1);
        const trackingLink = `${window.location.origin}/?track=${repair.id}`;
        let message = `Merhaba ${repair.customer}, Troy Servis'e bıraktığınız ${repair.device} cihazınızın durumunu şu linkten takip edebilirsiniz:\n${trackingLink}`;
        if (repair.status === 'Müşteri Onayı Bekliyor') {
            message = `Merhaba ${repair.customer}, Troy Servis'te bulunan cihazınızın incelemesi tamamlandı. Teklif için tıklayın:\n${trackingLink}`;
        } else if (['Hazır', 'Cihaz Hazır', 'Tamamlandı'].includes(repair.status)) {
            message = `Merhaba ${repair.customer}, Troy Servis'teki ${repair.device} cihazınız teslim için sizi bekliyor! Detay:\n${trackingLink}`;
        }
        window.open(`https://wa.me/90${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleTransfer = async () => {
        if (!targetStoreId) return;
        const targetStore = servicePoints.find(sp => String(sp.id) === String(targetStoreId));
        const storeName = targetStore ? targetStore.name : 'Diğer Mağaza';
        await updateRepair(repair.id, {
            storeId: parseInt(targetStoreId),
            status: 'Transferde',
            historyNote: `Cihaz ${storeName} şubesine doğru yola çıktı (Transfer). (İşlem yapan: ${currentUser?.name || 'Sistem'})`
        });
        appAlert(`Cihaz başarıyla ${storeName} şubesine transfer edildi. Ancak karşı şubenin ekranına düşmesi için kargoyu/transferi teslim alması gerekir.`, "success");
        setShowTransferModal(false);
        onClose();
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            appAlert("Dosya boyutu çok büyük (Maks 5MB)", "error");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const photoObj = {
                id: Date.now(),
                url: reader.result,
                date: new Date().toLocaleString(),
                user: currentUser?.name || 'Teknisyen'
            };
            const updatedPhotos = repair.photos ? [...repair.photos, photoObj] : [photoObj];
            updateRepair(repair.id, { photos: updatedPhotos, historyNote: 'Sisteme yeni servis fotoğrafı eklendi.' });
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoDelete = async (url, category = 'after') => {
        const confirmed = await appConfirm("Bu fotoğrafı arşivden silmek istediğinize emin misiniz?");
        if (confirmed) {
            const field = category === 'before' ? 'beforeImages' : 'afterImages';
            const newList = (repair[field] || []).filter(item => item !== url);
            updateRepair(repair.id, { [field]: newList });
            if (selectedPhoto?.url === url) setSelectedPhoto(null);
        }
    };

    const handleDeleteRepair = async () => {
        const confirmed = await appConfirm(
            `<div class="text-red-600 font-bold mb-2">DİKKAT: KAYIT SİLİNİYOR</div>
            <span><b>#${repair.id}</b> numaralı kayıt veritabanından tamamen silinecektir. Bu işlem geri alınamaz!</span>`
        );

        if (confirmed) {
            const success = await removeRepair(repair._id || repair.id);
            if (success) {
                showToast('Kayıt başarıyla silindi.', 'success');
                onClose();
            } else {
                showToast('Silme işlemi başarısız oldu.', 'error');
            }
        }
    };

    // Calculate Progress
    const determineStepIndex = () => {
        for (let i = STATUS_STEPS.length - 1; i >= 0; i--) {
            if (STATUS_STEPS[i].keys.includes(repair.status)) return i;
        }
        return 2; // Default to middle if unknown
    };
    const currentStepIndex = determineStepIndex();

    // Stream Combiner & Sorter
    const parseDate = (dString) => {
        if (!dString) return 0;
        try {
            const [datePart, timePart] = dString.split(' ');
            if (!datePart) return 0;
            const [day, month, year] = datePart.split('.');
            const [hr, min, sec] = (timePart || '00:00').split(':');
            return new Date(year, month - 1, day, hr || 0, min || 0, sec || 0).getTime();
        } catch { return 0; }
    };

    const combinedStream = useMemo(() => {
        const stream = [];
        (repair.history || []).forEach(h => stream.push({ ...h, streamType: 'history' }));
        (repair.internalNotes || []).forEach(n => stream.push({ ...n, streamType: 'note', status: 'Dahili Not' }));
        
        // Notları Birleşik Akışa (Timeline) Ekleme
        const defaultDate = repair.history?.[0]?.date || new Date().toLocaleString('tr-TR');

        if (repair.technicianNote) {
            stream.push({ 
                status: 'İlk Giriş Teknisyen Notu', 
                text: repair.technicianNote, 
                date: defaultDate, 
                streamType: 'report', 
                user: 'Teknisyen' 
            });
        }
        
        if (repair.tests) {
            const diagDate = repair.history?.find(h => h.status.includes('Teşhis') || h.status.includes('Teklif'))?.date || defaultDate;
            stream.push({ 
                status: 'Tanı Testleri & Gözlemler', 
                text: repair.tests, 
                date: diagDate, 
                streamType: 'report', 
                user: 'İnceleme' 
            });
        }
        
        if (repair.diagnosisNotes) {
            const diagDate = repair.history?.find(h => h.status.includes('Teşhis') || h.status.includes('Teklif'))?.date || defaultDate;
            let text = repair.diagnosisNotes;
            if (repair.quoteAmount) text += `\n>> Teklif Tutarı: ${repair.quoteAmount} ₺`;
            stream.push({ 
                status: 'Arıza Tanı Raporu', 
                text: text, 
                date: diagDate, 
                streamType: 'report', 
                user: 'Arıza Tespit' 
            });
        }
        
        if (repair.repairClosingNote) {
            const closeDate = repair.history?.find(h => h.status.includes('Tamamlandı') || h.status.includes('Hazır'))?.date || defaultDate;
            let text = repair.repairClosingNote;
            if (repair.parts?.length > 0) text += `\n>> Değişen Parçalar: ` + repair.parts.map(p => p.description).join(', ');
            stream.push({ 
                status: 'Kapanış Raporu', 
                text: text, 
                date: closeDate, 
                streamType: 'report', 
                user: 'Onarım' 
            });
        }

        return stream.sort((a, b) => parseDate(a.date) - parseDate(b.date));
    }, [repair.history, repair.internalNotes, repair.technicianNote, repair.tests, repair.diagnosisNotes, repair.repairClosingNote, repair.quoteAmount, repair.parts]);

    // Helpers
    const getStatusIcon = (status) => {
        if (status === 'Dahili Not') return <MessageCircle size={14} />;
        if (status.includes('Teknisyen Notu') || status.includes('Raporu')) return <FileText size={14} />;
        if (status.includes('Kayıt')) return <Phone size={14} />;
        if (status.includes('Teklif') || status.includes('Onay')) return <AlertCircle size={14} />;
        if (status.includes('İşlem')) return <Wrench size={14} />;
        if (status.includes('Gönderildi') || status.includes('Transfer')) return <Truck size={14} />;
        if (status.includes('Tamamlandı') || status.includes('Hazır')) return <CheckCircle size={14} />;
        if (status.includes('Teslim')) return <ShieldCheck size={14} />;
        return <Clock size={14} />;
    };

    const getStatusColor = (status) => {
        if (status === 'Dahili Not') return 'bg-yellow-500 border-yellow-200';
        if (status.includes('Teknisyen Notu')) return 'bg-indigo-500 border-indigo-200';
        if (status.includes('Tanı Raporu')) return 'bg-orange-500 border-orange-200';
        if (status.includes('Kapanış')) return 'bg-teal-500 border-teal-200';
        if (status.includes('Kayıt')) return 'bg-blue-500 border-blue-200';
        if (status.includes('Onay Bekliyor')) return 'bg-orange-500 border-orange-200';
        if (status.includes('Reddedildi')) return 'bg-red-500 border-red-200';
        if (status.includes('İşlem')) return 'bg-purple-500 border-purple-200';
        if (status.includes('Tamamlandı') || status.includes('Hazır')) return 'bg-green-500 border-green-200';
        if (status.includes('Teslim')) return 'bg-apple-blue border-blue-200';
        return 'bg-gray-400 border-gray-200';
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-6xl flex flex-col max-h-[90vh]">
                
                {/* Header & Progress Bar */}
                <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                    <div className="p-6 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100">
                                {repair.device.includes('iPhone') ? '📱' : '💻'}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase text-apple-blue px-2 py-1 bg-blue-50 rounded border border-blue-100/50">#{repair.id}</span>
                                    {repair.productGroup && (
                                        <span className="text-[9px] font-black uppercase text-white bg-gray-900 px-2 py-1 rounded shadow-sm">{repair.productGroup}</span>
                                    )}
                                    {isEditing ? (
                                        <input value={editForm.device} onChange={e => setEditForm({...editForm, device: e.target.value})} className="text-xl font-black text-gray-900 border-b-2 border-apple-blue outline-none bg-transparent"/>
                                    ) : (
                                        <h3 className="text-xl font-black text-gray-900">{repair.device}</h3>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-1">
                                    <User size={12} className="text-gray-400"/> {repair.customer} ({repair.customerPhone})
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <button onClick={handleSave} className="h-10 px-5 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center gap-2 font-bold shadow transition-all"><Save size={16} /> Kaydet</button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="h-10 w-10 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl flex items-center justify-center border border-gray-200 shadow-sm transition-all"><Pencil size={18} /></button>
                            )}
                            <button onClick={onClose} className="h-10 w-10 bg-white hover:bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl flex items-center justify-center border border-gray-200 shadow-sm transition-all"><X size={20} /></button>
                        </div>
                    </div>

                    {/* Progress Tracker Widget */}
                    <div className="px-10 pb-6 pt-2">
                        <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto">
                            {/* Connecting Line Backdrop */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full"></div>
                            {/* Progress Connecting Line */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-apple-blue rounded-full transition-all duration-700" style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}></div>
                            
                            {STATUS_STEPS.map((step, idx) => {
                                const isCompleted = idx < currentStepIndex;
                                const isActive = idx === currentStepIndex;
                                return (
                                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2 group">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 shadow-md ${isActive ? 'bg-apple-blue border-blue-200 text-white scale-125' : isCompleted ? 'bg-green-500 border-green-200 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                                            {isCompleted ? <CheckCircle size={14} /> : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-gray-300'}`}></div>}
                                        </div>
                                        <span className={`text-[10px] uppercase tracking-wide font-bold absolute -bottom-6 whitespace-nowrap transition-colors ${isActive ? 'text-apple-blue' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#f5f5f7]">
                    
                    {/* Left: Tabbed Properties Panel */}
                    <div className="w-full lg:w-[400px] flex flex-col border-r border-gray-200/60 bg-white/40">
                        {/* Tab Headers */}
                        <div className="flex p-2 gap-1 bg-gray-100/50 border-b border-gray-200/50 backdrop-blur-sm">
                            <button onClick={() => setActiveTab('info')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'info' ? 'bg-white text-apple-blue shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}>
                                <Fingerprint size={14}/> Cihaz Bilgisi
                            </button>
                            <button onClick={() => setActiveTab('docs')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'docs' ? 'bg-white text-apple-blue shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}>
                                <FileInput size={14}/> Rapor & Belge
                            </button>
                            <button onClick={() => setActiveTab('finance')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'finance' ? 'bg-white text-apple-blue shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}>
                                <Coins size={14}/> Finans
                            </button>
                            <button onClick={() => setActiveTab('media')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'media' ? 'bg-white text-apple-blue shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}>
                                <Camera size={14}/> VMI
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {/* INFO TAB */}
                            {activeTab === 'info' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Temel Kimlik</h4>
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <input value={editForm.customer} onChange={e => setEditForm({...editForm, customer: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold bg-gray-50"/>
                                                <input value={editForm.customerPhone} onChange={e => setEditForm({...editForm, customerPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-mono"/>
                                                <input value={editForm.serial} onChange={e => setEditForm({...editForm, serial: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 font-mono placeholder:text-gray-400" placeholder="Seri Numarası..."/>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">{repair.customer}</p>
                                                <p className="text-sm text-gray-500 font-medium">{repair.customerPhone}</p>
                                                <div className="mt-3 inline-flex px-2 py-1 bg-gray-50 rounded-md border border-gray-100 text-xs font-mono text-gray-600">S/N: {repair.serial || repair.serialNumber || 'Girilmedi'}</div>
                                            </div>
                                        )}
                                        {repair.repairType && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm flex items-center gap-1.5">
                                                    <Wrench size={10} />
                                                    {REPAIR_TYPE_LABELS[repair.repairType] || repair.repairType}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`p-4 rounded-xl border ${repair.findMyOff ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} flex flex-col items-center justify-center text-center`}>
                                            <span className="text-[9px] font-bold uppercase mb-1 opacity-70">FMI (Bul)</span>
                                            <span className="text-xs font-black">{repair.findMyOff ? 'KAPALI' : 'AÇIK'}</span>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${repair.backupTaken ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'} flex flex-col items-center justify-center text-center`}>
                                            <span className="text-[9px] font-bold uppercase mb-1 opacity-70">Aygıt Yedek</span>
                                            <span className="text-xs font-black">{repair.backupTaken ? 'ALINDI' : 'YOK'}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3"><AlertCircle size={12}/> Müşteri Şikayeti</h4>
                                        {isEditing ? (
                                            <textarea value={editForm.issue} onChange={e => setEditForm({...editForm, issue: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"/>
                                        ) : (
                                            <p className="text-sm text-gray-800 font-medium italic pl-3 border-l-2 border-apple-blue leading-relaxed">"{repair.issue || repair.issueDescription || 'Belirtilmedi'}"</p>
                                        )}
                                        {repair.visualCondition && repair.visualCondition.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-1.5">
                                                {repair.visualCondition.map((v, i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-bold">{v}</span>)}
                                            </div>
                                        )}

                                        {/* Teslim Görselleri (Giriş Esnası) */}
                                        {repair.mediaFiles && repair.mediaFiles.filter(f => !f.isDefault).length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-gray-50">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                                    <Camera size={12} /> Kayıt Esnasında Çekilen Görseller
                                                </h5>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {repair.mediaFiles.filter(f => !f.isDefault).map((file, index) => (
                                                        <div 
                                                            key={index} 
                                                            onClick={() => window.open(file.url, '_blank')}
                                                            className="aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in hover:scale-105 transition-transform"
                                                        >
                                                            <img src={file.url} alt="Intake" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* DOCS & LOGS TAB */}
                            {activeTab === 'docs' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2">Basılı Evraklar</h4>
                                        <button onClick={() => setShowAcceptancePrint(true)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-apple-blue transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-50 text-apple-blue rounded-xl flex items-center justify-center group-hover:bg-apple-blue group-hover:text-white transition-colors"><Printer size={16} /></div>
                                                <div className="text-left"><span className="text-sm font-bold text-gray-800 block">Servis Kabul Formu</span><span className="text-[10px] text-gray-400 font-medium">Giriş Belgesi PDF</span></div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-apple-blue transition-all group-hover:translate-x-1" />
                                        </button>
                                        {(repair.status === 'Teslim Edildi' || repair.status === 'Cihaz Hazır' || repair.status === 'Tamamlandı' || repair.status === 'İade Hazır' || repair.status === 'İade Edildi') && (
                                            <button onClick={() => setShowDeliveryPrint(true)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-green-500 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors"><Printer size={16} /></div>
                                                    <div className="text-left"><span className="text-sm font-bold text-gray-800 block">Cihaz Teslim Formu</span><span className="text-[10px] text-gray-400 font-medium">Çıkış Belgesi PDF</span></div>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-all group-hover:translate-x-1" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {(repair.diagnosisNotes || repair.repairClosingNote) && (
                                        <div className="space-y-3 pt-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2">Özel Teknik Raporlar</h4>
                                            {repair.diagnosisNotes && (
                                                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex gap-3">
                                                    <Shield size={16} className="text-orange-500 shrink-0 mt-0.5"/>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-orange-800 uppercase mb-1">Arıza Tanı Raporu</p>
                                                        <p className="text-xs text-gray-700 font-medium leading-relaxed">{repair.diagnosisNotes}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {repair.repairClosingNote && (
                                                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex gap-3">
                                                    <FileText size={16} className="text-teal-600 shrink-0 mt-0.5"/>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-teal-800 uppercase mb-1">Kapanış Onarım Raporu</p>
                                                        <p className="text-xs text-gray-700 font-medium leading-relaxed">{repair.repairClosingNote}</p>
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {repair.repairDuration && (
                                                                <span className="text-[9px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm">
                                                                    <Clock size={10} strokeWidth={3} /> {repair.repairDuration}
                                                                </span>
                                                            )}
                                                            {repair.parts && repair.parts.length > 0 && 
                                                                repair.parts.map((p,i)=><span key={i} className="text-[9px] bg-white border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-bold">{p.description || p.name || p.itemName}</span>)
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Admin-only Dangerous Zone */}
                                    {currentUser?.role === 'admin' && (
                                        <div className="mt-10 pt-6 border-t-2 border-dashed border-red-100/50">
                                            <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-black">!</div>
                                                    <div>
                                                        <h5 className="text-xs font-black text-red-900 uppercase">Yönetici İşlemleri</h5>
                                                        <p className="text-[10px] text-red-500 font-bold opacity-70">Bu alandaki işlemler geri alınamaz.</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleDeleteRepair}
                                                    className="w-full py-3 bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-red-200"
                                                >
                                                    <Trash2 size={14} /> Kaydı Veritabanından Sil
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FINANCE TAB */}
                            {activeTab === 'finance' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500"><Receipt size={18}/></div>
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900">Garanti & Fatura</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{repair.warrantyStatus || 'Garanti Dışı'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase ${repair.invoiceNumber ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {repair.invoiceNumber ? 'Kesildi' : 'Beklemede'}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"><Hash size={10} className="inline mr-1"/> Fatura Kayıt No</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Fatura numarası bağlayın..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold font-mono focus:bg-white focus:border-blue-500 outline-none uppercase transition-all" />
                                                <button onClick={handleSaveInvoice} disabled={invoiceNo === repair.invoiceNumber} className="bg-gray-900 text-white px-5 rounded-xl font-bold hover:bg-black disabled:opacity-30 disabled:bg-gray-400 transition-all text-xs">Kaydet</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl text-center flex flex-col items-center">
                                        <Coins size={32} className="text-apple-blue mb-3 opacity-50"/>
                                        <p className="text-sm font-medium text-blue-900">Gelir ve ödeme tahsilat modülü detayları bir sonraki geliştirmede bu alanda görüntülenmek üzere rezerve edilmiştir.</p>
                                    </div>
                                </div>
                            )}

                            {/* MEDIA TAB - Gelişmiş Öncesi/Sonrası Galerisi */}
                            {activeTab === 'media' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300 pb-10">
                                    
                                    {/* Kabul Fotoğrafları (Öncesi) */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center px-1">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                <Camera size={14} /> Cihaz Kabul Arşivi (Öncesi)
                                            </h4>
                                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 uppercase">
                                                {repair.beforeImages?.length || 0} Fotoğraf
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {repair.beforeImages?.map((url, idx) => (
                                                <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all ring-offset-2 hover:ring-2 ring-indigo-500/20">
                                                    <img 
                                                        src={url} 
                                                        className="w-full h-full object-cover cursor-zoom-in group-hover:scale-110 transition-transform duration-500" 
                                                        onClick={() => setSelectedPhoto({ url, user: 'Servis Kabul', date: repair.date })} 
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-[9px] text-white font-black uppercase tracking-tight">Kabul Durumu</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!repair.beforeImages || repair.beforeImages.length === 0) && (
                                                <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                    <Camera size={24} className="mx-auto text-gray-300 mb-2" />
                                                    <p className="text-[10px] font-bold text-gray-400">Kabul fotoğrafı bulunmuyor.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Onarım Fotoğrafları (Sonrası) */}
                                    <div className="flex flex-col gap-4 pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-center px-1">
                                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                <CheckCircle size={14} /> Onarım Sonu & Teslim (Sonrası)
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100 uppercase">
                                                    {repair.afterImages?.length || 0} Fotoğraf
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {repair.afterImages?.map((url, idx) => (
                                                <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all ring-offset-2 hover:ring-2 ring-emerald-500/20">
                                                    <img 
                                                        src={url} 
                                                        className="w-full h-full object-cover cursor-zoom-in group-hover:scale-110 transition-transform duration-500" 
                                                        onClick={() => setSelectedPhoto({ url, user: repair.technician || 'Teknisyen', date: new Date().toLocaleString() })} 
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                                                        <p className="text-[9px] text-white font-black uppercase tracking-tight">Final Durumu</p>
                                                        <button onClick={() => handlePhotoDelete(url, 'after')} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg pointer-events-auto"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!repair.afterImages || repair.afterImages.length === 0) && (
                                                <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                    <Camera size={24} className="mx-auto text-gray-300 mb-2" />
                                                    <p className="text-[10px] font-bold text-gray-400 font-black uppercase">Henüz Sonuç Yok</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[28px] border border-blue-100/50 flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-black text-blue-900 mb-1">Şeffaf Servis Politikası</h5>
                                            <p className="text-[11px] text-blue-700/80 font-medium leading-tight">
                                                Cihaz kabul ve teslimat fotoğrafları, olası anlaşmazlıkları önlemek ve iş kalitesini belgelemek için bulut sunucularımızda güvenle saklanmaktadır.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Right: Unified Activity Stream (Zaman Akışı) */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white/60">
                        <div className="px-8 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Clock size={12} className="text-apple-blue" /> Birleşik Servis Akışı</h4>
                            <button onClick={handleAddProcess} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 hover:text-apple-blue hover:border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm">
                                <PlusCircle size={12} /> Durum Ekle
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="relative pl-6">
                                {/* Feed Back-Line */}
                                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-100 rounded-full"></div>

                                <div className="space-y-6">
                                    {combinedStream.map((entry, idx) => (
                                        <div key={idx} className="relative group animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                            {/* Dot icon */}
                                            <div className={`absolute -left-[30px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-white border-[3px] border-[#f5f5f7] shadow-sm z-10 transition-transform group-hover:scale-110 ${getStatusColor(entry.status).split(' ')[0]}`}>
                                                {getStatusIcon(entry.status)}
                                            </div>

                                            <div className={`bg-white p-4 rounded-2xl border transition-all ${
                                                entry.streamType === 'note' ? 'border-yellow-100 hover:border-yellow-300 shadow-[0_2px_10px_-2px_rgba(234,179,8,0.1)]' 
                                                : entry.streamType === 'report' ? 'border-purple-200 bg-purple-50/20 hover:border-purple-400 shadow-[0_2px_10px_-2px_rgba(168,85,247,0.1)]'
                                                : 'border-gray-100 hover:border-blue-200 shadow-sm'
                                            }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h5 className={`text-sm font-black tracking-tight ${
                                                            entry.streamType === 'note' ? 'text-yellow-700' 
                                                            : entry.streamType === 'report' ? 'text-purple-800'
                                                            : 'text-gray-900 group-hover:text-apple-blue'
                                                        }`}>
                                                            {entry.status}
                                                        </h5>
                                                        <span className="text-[9px] font-bold text-gray-400 capitalize">{entry.user || 'Sistem Aksiyonu'}</span>
                                                    </div>
                                                    <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-[9px] font-mono border border-gray-100">
                                                        {entry.date}
                                                    </span>
                                                </div>
                                                <p className={`text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                                                    entry.streamType === 'note' ? 'text-yellow-800/80 italic' 
                                                    : entry.streamType === 'report' ? 'text-purple-900/90'
                                                    : 'text-gray-600'
                                                }`}>
                                                    {entry.streamType === 'note' || entry.streamType === 'report' ? entry.text : (entry.note || 'İşlem detay belirtilmedi.')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {combinedStream.length === 0 && <div className="text-center py-10 text-xs text-gray-400 font-medium">Henüz bir aksiyon kaydı yok.</div>}
                                </div>
                            </div>
                        </div>
                        
                        {/* Stream Action Input */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200/60 shrink-0">
                            <div className="relative flex items-center max-w-2xl mx-auto w-full">
                                <span className="absolute left-4 text-gray-400"><MessageCircle size={16}/></span>
                                <input 
                                    type="text" 
                                    value={newNote} 
                                    onChange={(e)=>setNewNote(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    placeholder="Dahili bir operasyon notu yazıp ENTER'a basın..." 
                                    className="w-full pl-12 pr-14 py-3.5 bg-white border border-gray-300 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 ring-blue-500/10 focus:border-apple-blue transition-all shadow-sm"
                                />
                                <button onClick={handleAddNote} disabled={!newNote.trim()} className="absolute right-2 p-2 bg-apple-blue text-white rounded-xl disabled:opacity-40 hover:bg-blue-600 transition-all"><Send size={14}/></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Quick Actions */}
                <div className="bg-white px-6 py-4 flex flex-wrap justify-between items-center shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] border-t border-gray-200/50 z-30">
                    <div className="flex gap-2">
                         {repair.status === 'Beklemede' && (
                             <button onClick={() => setShowTransferModal(true)} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 flex items-center gap-2 transition-all">
                                 <Truck size={14} /> Şubeye Yolla
                             </button>
                         )}
                         <button onClick={() => setShowNotificationModal(true)} className="px-4 py-2 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold rounded-xl hover:bg-amber-100 flex items-center gap-2 transition-all shadow-sm">
                             <Bell size={14} /> Teklif & Bildirim
                         </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button onClick={handleWhatsApp} className="px-4 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#128C7E] flex items-center gap-2 shadow-sm shadow-[#25D366]/20 transition-all">
                            <MessageCircle size={14} /> Müşteriye Yaz
                        </button>
                        <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black flex items-center gap-2 shadow-sm transition-all ml-2">
                            Kapat <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

            </div>

             {/* Transfer Modal Ekranı  */}
             {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-up">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Truck size={24} /></div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Servis Transferi</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Kaydı hedefe yönlendirin.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Hedef Şube</label>
                            <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold text-gray-700 transition-all" value={targetStoreId} onChange={(e) => setTargetStoreId(e.target.value)}>
                                <option value="">Mağaza Seçiniz...</option>
                                {servicePoints.filter(sp => String(sp.id) !== String(repair.storeId)).map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setShowTransferModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200">İptal</button>
                            <button onClick={handleTransfer} disabled={!targetStoreId} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50">Onayla ve Transfer Et</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Fullscreen Preview */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setSelectedPhoto(null)}>
                    <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                        <X size={32} />
                    </button>
                    <img src={selectedPhoto.url} className="max-w-full max-h-full object-contain shadow-2xl animate-scale-up" />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                        <p className="text-white font-bold text-sm">{selectedPhoto.user} tarafından yüklendi</p>
                        <p className="text-white/60 text-xs font-mono">{selectedPhoto.date}</p>
                    </div>
                </div>
            )}

            {/* Print Modals */}
            {showAcceptancePrint && (
                <ServiceFormPrint 
                    formData={{
                        ...repair,
                        customerName: repair.customer,
                        customerPhone: repair.customerPhone,
                        customerAddress: repair.customerAddress,
                        customerEmail: repair.customerEmail,
                        serialNumber: repair.serial || repair.serialNumber,
                        deviceName: repair.device,
                        issue: repair.issue,
                        visualCondition: repair.visualCondition || [],
                        findMyOff: repair.findMyOff,
                        backupTaken: repair.backupTaken,
                        technicianNote: repair.technicianNote,
                        storeId: repair.storeId,
                        customerSignature: repair.customerSignature
                    }}
                    repairId={repair.id}
                    onClose={() => setShowAcceptancePrint(false)}
                />
            )}

            {showDeliveryPrint && (
                <DeliveryFormPrint 
                    repair={repair}
                    signature={repair.deliverySignature}
                    onClose={() => setShowDeliveryPrint(false)}
                />
            )}

            {showNotificationModal && (
                <CustomerNotificationModal
                    repair={repair}
                    onClose={() => setShowNotificationModal(false)}
                />
            )}
        </div>
    );
};

export default RepairHistoryModal;
