import React, { useState } from 'react';
import {
    MessageSquare, Mail, Send, X, Check,
    Bell, AlertCircle, Eye, ChevronRight, MessageCircle, History
} from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';

const CustomerNotificationModal = ({ repair, onClose, onActionComplete }) => {
    const { emailSettings, notificationSettings, notificationTemplates, updateRepair, showToast, sendWhatsApp } = useAppContext();
    const [activeChannel, setActiveChannel] = useState('whatsapp'); // WhatsApp'ı varsayılan yaptık
    const [selectedTemplate, setSelectedTemplate] = useState(repair.status === 'Müşteri Onayı Bekliyor' ? 'status_update' : (repair.quoteAmount && repair.quoteAmount !== '0.00' ? 'repair_requote' : 'status_update'));
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [recipient, setRecipient] = useState(repair.customerEmail || '');

    React.useEffect(() => {
        if (showHistory) {
            fetchHistory();
        }
    }, [showHistory]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notifications?repairId=${repair.id}`);
            if (res.ok) {
                const data = await res.json();
                setHistoryData(data);
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const saveNotification = async (channel, message, subject) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repairId: repair.id,
                    customerEmail: recipient || repair.customerEmail || 'demo@target.com',
                    customerPhone: repair.customerPhone || repair.phone || '0000',
                    channel: channel,
                    message: message,
                    subject: subject || ''
                })
            });
        } catch(err) {
            console.error('Failed to save notification', err);
        }
    };

    if (!repair) return null;

    const templates = notificationTemplates;


    const handleSend = async () => {
        if (activeChannel === 'whatsapp') {
            const message = getReplacedText(templates.whatsapp[selectedTemplate]);
            sendWhatsApp(repair.customerPhone || repair.phone, message);
            await saveNotification('whatsapp', message, '');
            setIsSent(true);
            setTimeout(() => {
                setIsSent(false);
                if (onActionComplete) onActionComplete();
                onClose();
            }, 1000);
            return;
        }

        if (activeChannel === 'sms') {
            const message = getReplacedText(templates.sms[selectedTemplate]);
            await saveNotification('sms', message, '');
            setIsSent(true);
            setTimeout(() => {
                setIsSent(false);
                if (onActionComplete) onActionComplete();
                onClose();
                showToast('SMS başarıyla sıraya alındı!', 'success'); // Use Toast
            }, 1500);
            return;
        }

        setIsLoading(true);
        try {
            const template = templates.email[selectedTemplate];
            let finalBody = getReplacedText(template.body);

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipient || repair.customerEmail || 'demo@target.com',
                    subject: template.subject.replace(/{serviceNo}/g, repair.id || ''),
                    body: finalBody,
                    auth: emailSettings
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Sunucu hatası veya zaman aşımı.' }));
                throw new Error(errorData.message || 'E-posta gönderilemedi.');
            }

            const data = await response.json();
            if (data.success) {
                await saveNotification('email', finalBody, template.subject.replace(/{serviceNo}/g, repair.id || ''));
                setIsSent(true);
                setTimeout(() => {
                    setIsSent(false);
                    if (onActionComplete) {
                        onActionComplete();
                    }
                    onClose();
                    showToast('E-posta başarıyla gönderildi.', 'success');
                }, 1500);
            } else {
                showToast(data.message || 'E-posta gönderilemedi.', 'error');
            }
        } catch (error) {
            console.error('Send Error:', error);
            showToast(error.message || 'Email sunucusuna bağlanılamadı.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

        // Template Replacer Function
    const getReplacedText = (text) => {
        if (!text) return 'İçerik bulunamadı.';
        let res = text
            .replace(/{customerName}/g, repair.customer || '')
            .replace(/{serviceNo}/g, repair.id || '')
            .replace(/{cost}/g, repair.quoteAmount || '0.00')
            .replace(/{device}/g, repair.device || '')
            .replace(/{status}/g, repair.status || '')
            .replace(/{damageReason}/g, repair.diagnosisNotes || repair.issue || 'Belirtilmedi');
            
        if (notificationSettings?.requireDamageDescription && !text.includes('{damageReason}')) {
            if (repair.diagnosisNotes) res += `\n\n*Uzman Tanısı:* ${repair.diagnosisNotes}`;
            else if (repair.issue) res += `\n\n*Müşteri Şikayeti:* ${repair.issue}`;
        }
        
        return res;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-2xl flex flex-col">

                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-apple-blue shadow-lg shadow-blue-100 ring-2 ring-white">
                            <Bell size={24} className="fill-current" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-xl tracking-tight">Müşteri Bildirimi</h3>
                            <p className="text-sm font-medium text-gray-400 mt-1 flex items-center gap-2">
                                <span>Kime:</span>
                                <span className="text-gray-900 font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{repair.customer}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowHistory(!showHistory)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${showHistory ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <History size={14} />
                            {showHistory ? 'Yeni Bildirim' : 'Geçmiş'}
                        </button>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-gray-100 border border-gray-200 transition-all shadow-sm">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {showHistory ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <History size={16} className="text-apple-blue" />
                                Gönderilen Bildirimler
                            </h4>
                            {loadingHistory ? (
                                <div className="py-10 text-center text-gray-400 text-sm font-medium">Geçmiş yükleniyor...</div>
                            ) : historyData.length === 0 ? (
                                <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium">
                                    Bu cihaza ait geçmiş bildirim bulunmuyor.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyData.map(item => (
                                        <div key={item._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                            <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2 rounded-lg text-white ${item.channel === 'whatsapp' ? 'bg-emerald-500' : item.channel === 'email' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                                        {item.channel === 'whatsapp' ? <MessageCircle size={14} /> : item.channel === 'email' ? <Mail size={14} /> : <MessageSquare size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-wider text-gray-900">{item.channel}</p>
                                                        <p className="text-[10px] font-bold text-gray-400">{new Date(item.sentAt).toLocaleString('tr-TR')}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded uppercase tracking-widest border border-green-100">Başarılı</span>
                                            </div>
                                            {item.subject && <p className="text-sm font-bold text-gray-800">{item.subject}</p>}
                                            <p className="text-xs text-gray-600 font-medium whitespace-pre-wrap">{item.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Channel Selector */}
                    <div className="flex p-1.5 bg-gray-100/80 rounded-2xl border border-gray-100 gap-1">
                        <button
                            onClick={() => setActiveChannel('whatsapp')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all duration-300 ${activeChannel === 'whatsapp' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                        >
                            <MessageCircle size={16} /> WhatsApp
                        </button>
                        <button
                            onClick={() => setActiveChannel('sms')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all duration-300 ${activeChannel === 'sms' ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                        >
                            <MessageSquare size={16} /> SMS
                        </button>
                        <button
                            onClick={() => setActiveChannel('email')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all duration-300 ${activeChannel === 'email' ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                }`}
                        >
                            <Mail size={16} /> E-Posta
                        </button>
                    </div>

                    {activeChannel === 'email' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Alıcı E-Posta Adresleri (Virgülle Ayırın)</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm text-gray-700"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="ornek@mail.com, ikincimail@mail.com"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-[1fr_1.5fr] gap-6">
                        {/* Template Selector */}
                        <div className="space-y-3">
                        <div className="flex justify-between items-end pl-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İçerik Şablonu</label>
                            <span className="text-[10px] font-bold text-apple-blue cursor-pointer hover:underline">Tümünü Gör</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
                            {Object.values(templates.email).map((tmpl) => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => setSelectedTemplate(tmpl.id)}
                                    className={`p-4 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden ${selectedTemplate === tmpl.id
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100'
                                        : 'border-gray-200 hover:border-blue-300 bg-white text-gray-600 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`absolute right-3 top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedTemplate === tmpl.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                        {selectedTemplate === tmpl.id && <Check size={10} className="text-white" strokeWidth={4} />}
                                    </div>
                                    <p className="text-xs font-bold leading-tight pr-6">{tmpl.title}</p>
                                    <p className="text-[10px] font-medium opacity-60 mt-1 line-clamp-1">{tmpl.subject}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-200/60 relative overflow-hidden group shadow-inner">
                        <div className="absolute top-4 right-4 z-10">
                            <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                <Eye size={12} className="text-apple-blue" /> Canlı Önizleme
                            </span>
                        </div>

                        {activeChannel === 'whatsapp' ? (
                            <div className="flex flex-col gap-2 max-w-[85%] animate-in slide-in-from-left-4 fade-in duration-500">
                                <div className="bg-[#dcf8c6] p-5 rounded-2xl rounded-tl-none text-sm text-gray-800 leading-relaxed shadow-sm font-medium border border-[#c7eba9]">
                                    {getReplacedText(templates.whatsapp[selectedTemplate])}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold text-right mr-1">İletildi ✓✓</span>
                            </div>
                        ) : activeChannel === 'sms' ? (
                            <div className="flex flex-col gap-2 max-w-[85%] animate-in slide-in-from-left-4 fade-in duration-500">
                                <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-tight">TroyServis Bilgilendirme</span>
                                <div className="bg-[#e9e9eb] p-5 rounded-2xl rounded-tl-none text-sm text-gray-800 leading-relaxed shadow-sm font-medium border border-gray-200">
                                    {getReplacedText(templates.sms[selectedTemplate])}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold text-right mr-1">Az önce</span>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-[20px] shadow-xl border border-gray-100 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                <div className="border-b border-gray-100 pb-4 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">E-Posta Konusu</p>
                                        <div className="flex gap-1.5 opacity-40">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-gray-900 leading-tight">
                                        {templates.email[selectedTemplate]?.subject.replace(/{serviceNo}/g, repair.id || '') || 'Konu Yok'}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto pr-2 custom-scrollbar font-medium">
                                    {getReplacedText(templates.email[selectedTemplate]?.body)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}
        </div>

                {/* Footer */}
                {!showHistory && (
                <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 px-8 sticky bottom-0 z-20">
                    <button
                        onClick={onClose}
                        className="px-6 py-3.5 text-gray-500 font-bold hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all text-sm"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSent || isLoading}
                        className={`px-8 py-3.5 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all text-xs tracking-wide uppercase ${isSent
                            ? 'bg-green-500 text-white shadow-green-200 scale-105'
                            : isLoading
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-gray-900 text-white shadow-gray-300 hover:bg-black hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Gönderiliyor...
                            </>
                        ) : isSent ? (
                            <>
                                <Check size={16} strokeWidth={3} /> İletildi
                            </>
                        ) : (
                            <>
                                <Send size={16} strokeWidth={2.5} /> {activeChannel === 'sms' ? 'SMS Gönder' : 'E-Posta Gönder'}
                            </>
                        )}
                    </button>
                </div>
                )}
            </div>
        </div>
    );
};

export default CustomerNotificationModal;
