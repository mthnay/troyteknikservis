import React, { useState, useEffect } from 'react';
import { 
    Megaphone, Users, MessageCircle, Mail, Filter, Search, CheckSquare, 
    Square, ChevronRight, Zap, Bell, ShieldCheck, ToggleLeft, ToggleRight, 
    Settings, Clock, Send, Sparkles, Layout, Target, Info, AlertCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { appAlert, appConfirm } from '../utils/alert';

const MarketingAutomation = () => {
    const { allRepairs, notificationSettings, setNotificationSettings, showToast, sendWhatsApp } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isSending, setIsSending] = useState(false);
    
    // Notification Panel State
    const [messageSubject, setMessageSubject] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [activeChannel, setActiveChannel] = useState('whatsapp');

    // Automation Logs (Notifications)
    const [automationLogs, setAutomationLogs] = useState([
        { id: 1, type: 'Zap', title: 'Hazır Bildirimi', detail: 'Ahmet Yılmaz (iPhone 13) - WhatsApp iletildi.', time: '2 dk önce', status: 'success' },
        { id: 2, type: 'Bell', title: 'SLA Uyarısı', detail: 'TR-1024 nolu cihaz 48 saati geçti. Yöneticiye e-posta gönderildi.', time: '15 dk önce', status: 'warning' },
        { id: 3, type: 'Clock', title: 'Teklif Hatırlatıcı', detail: 'Mehmet Kaya - Teklif hatırlatma SMS sıraya alındı.', time: '1 saat önce', status: 'info' },
        { id: 4, type: 'Zap', title: 'Kampanya Gönderimi', detail: 'Haftalık bakım bülteni 142 müşteriye ulaştırıldı.', time: '3 saat önce', status: 'success' },
        { id: 5, type: 'Bell', title: 'Stok Kritik', detail: 'iPhone 13 Ekran stoku kritik seviyenin altına düştü (2 adet).', time: '5 saat önce', status: 'warning' }
    ]);

    // Map global settings to UI rules
    const rules = [
        { id: 'sla_tracking', title: 'Otomatik SLA Takibi', desc: '48 saati geçen işlemlerde yöneticilere bildirim gönder.', active: notificationSettings?.automations?.sla_tracking, icon: Bell, color: 'bg-red-50 text-red-500' },
        { id: 'ready_notification', title: 'Hazır Bildirim Otomasyonu', desc: 'Cihaz "Hazır" olduğunda müşteriye WhatsApp & E-Posta gönder.', active: notificationSettings?.automations?.ready_notification, icon: Zap, color: 'bg-blue-50 text-blue-500' },
        { id: 'satisfaction_survey', title: 'Memnuniyet Anketi', desc: 'Teslimattan 24 saat sonra müşteri portalına NPS anketi ekle.', active: notificationSettings?.automations?.satisfaction_survey, icon: ShieldCheck, color: 'bg-green-50 text-green-500' },
        { id: 'quote_reminder', title: 'Teklif Hatırlatıcı', desc: 'Onay bekleyen teklifleri 2 gün sonra müşteriye tekrar hatırlat.', active: notificationSettings?.automations?.quote_reminder, icon: Clock, color: 'bg-orange-50 text-orange-500' }
    ];

    const toggleRule = (ruleId) => {
        const updatedAutomations = {
            ...notificationSettings.automations,
            [ruleId]: !notificationSettings.automations[ruleId]
        };
        setNotificationSettings({
            ...notificationSettings,
            automations: updatedAutomations
        });
        showToast('Otomasyon kuralı güncellendi.', 'success');
    };

    // Filter Logic
    let filteredList = allRepairs.map(r => ({
        id: r.id,
        name: r.customer,
        phone: r.customerPhone,
        email: r.customerEmail,
        device: r.device,
        lastDate: r.createdAt || r.date,
        status: r.status
    })).filter((obj, index, self) => 
        index === self.findIndex((t) => (t.phone === obj.phone))
    );

    if (filterType === 'old_repairs') {
        filteredList = filteredList.filter(item => item.status === 'Teslim Edildi' || item.status === 'İade Edildi');
    }

    if (searchTerm) {
        filteredList = filteredList.filter(user => 
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.phone?.includes(searchTerm)
        );
    }

    const toggleSelect = (phone) => {
        if (selectedUsers.includes(phone)) {
            setSelectedUsers(selectedUsers.filter(p => p !== phone));
        } else {
            setSelectedUsers([...selectedUsers, phone]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredList.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredList.map(u => u.phone));
        }
    };

    const handleBulkSend = async () => {
        if (selectedUsers.length === 0) {
            showToast('Lütfen önce hedef kitle seçin.', 'warning');
            return;
        }
        if (!messageContent.trim()) {
            showToast('Lütfen mesaj içeriği girin.', 'warning');
            return;
        }

        const confirmed = await appConfirm(`${selectedUsers.length} müşteriye toplu ${activeChannel.toUpperCase()} bildirimi gönderilecektir. Onaylıyor musunuz?`);
        
        if (confirmed) {
            setIsSending(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                showToast(`${selectedUsers.length} bildirim başarıyla kuyruğa alındı.`, 'success');
                setMessageContent('');
                setMessageSubject('');
                setSelectedUsers([]);
            } catch (error) {
                showToast('Gönderim sırasında hata oluştu.', 'error');
            } finally {
                setIsSending(false);
            }
        }
    };

    const insertPlaceholder = (tag) => {
        setMessageContent(prev => prev + ` {${tag}}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Megaphone size={20} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">Pazarlama & Otomasyon</h1>
                    </div>
                    <p className="text-gray-500 font-medium">Hedef kitlenizi belirleyin ve akıllı bildirimler ile sadakati artırın.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-blue-700">API Durumu: Aktif</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Notification Panel */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                                    <Send size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg">Bildirim Gönder</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kampanya & Duyuru Paneli</p>
                                </div>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setActiveChannel('whatsapp')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeChannel === 'whatsapp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    WhatsApp
                                </button>
                                <button 
                                    onClick={() => setActiveChannel('email')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeChannel === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    E-Posta
                                </button>
                                <button 
                                    onClick={() => setActiveChannel('sms')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeChannel === 'sms' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    SMS
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {activeChannel === 'email' && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">E-Posta Konusu</label>
                                    <input 
                                        type="text" 
                                        value={messageSubject}
                                        onChange={(e) => setMessageSubject(e.target.value)}
                                        placeholder="Kampanya başlığı..."
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Mesaj İçeriği</label>
                                <textarea 
                                    rows={6}
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Mesajınızı buraya yazın..."
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-3xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm leading-relaxed"
                                />
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                                    <button onClick={() => insertPlaceholder('customerName')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 transition-colors shrink-0">{"{Müşteri Adı}"}</button>
                                    <button onClick={() => insertPlaceholder('device')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 transition-colors shrink-0">{"{Cihaz}"}</button>
                                    <button onClick={() => insertPlaceholder('lastDate')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-200 transition-colors shrink-0">{"{Son Tarih}"}</button>
                                </div>
                            </div>

                            <button 
                                onClick={handleBulkSend}
                                disabled={isSending || selectedUsers.length === 0}
                                className={`w-full py-5 rounded-[20px] font-black text-sm tracking-wide uppercase flex items-center justify-center gap-3 transition-all shadow-xl ${
                                    isSending 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : selectedUsers.length === 0
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-900 text-white hover:bg-black hover:scale-[1.02] active:scale-95 shadow-gray-200'
                                }`}
                            >
                                {isSending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                        İşleniyor...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} className="fill-current" />
                                        {selectedUsers.length} Kişiye Gönderimi Başlat
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Automation Center & Logs */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h3 className="font-black text-gray-900 flex items-center gap-2">
                                <Zap size={18} className="text-blue-600" /> Akıllı Otomasyon Merkezi
                            </h3>
                            <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Tümünü Gör</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {automationLogs.map(log => (
                                <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        log.status === 'success' ? 'bg-green-50 text-green-600' : 
                                        log.status === 'warning' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {log.type === 'Zap' ? <Zap size={18} /> : log.type === 'Bell' ? <Bell size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-sm font-black text-gray-900">{log.title}</h4>
                                            <span className="text-[9px] font-bold text-gray-400">{log.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium line-clamp-1">{log.detail}</p>
                                    </div>
                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Automation Rules Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rules.map(rule => (
                            <div key={rule.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.color}`}>
                                        <rule.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900">{rule.title}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium">{rule.active ? 'Sistem Aktif' : 'Devre Dışı'}</p>
                                    </div>
                                </div>
                                <button onClick={() => toggleRule(rule.id)} className={`transition-all ${rule.active ? 'text-blue-600' : 'text-gray-300'}`}>
                                    {rule.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Target Audience Selector */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden h-full flex flex-col">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm border border-gray-100">
                                        <Target size={20} />
                                    </div>
                                    <h3 className="font-black text-gray-900">Hedef Kitle</h3>
                                </div>
                                <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-100">
                                    {selectedUsers.length} / {filteredList.length}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Müşteri veya telefon..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm font-bold shadow-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setFilterType('all')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${filterType === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        Tümü
                                    </button>
                                    <button 
                                        onClick={() => setFilterType('old_repairs')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${filterType === 'old_repairs' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        Eski Kayıtlar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
                                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-blue-600 uppercase tracking-widest pl-2 transition-colors">
                                    {selectedUsers.length === filteredList.length ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                                    {selectedUsers.length === filteredList.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                                </button>
                                {selectedUsers.length > 0 && (
                                    <button onClick={() => setSelectedUsers([])} className="text-[10px] font-black text-red-500 hover:underline uppercase">İptal</button>
                                )}
                            </div>

                            <div className="divide-y divide-gray-50">
                                {filteredList.map((user, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => toggleSelect(user.phone)}
                                        className={`p-4 flex items-center gap-4 cursor-pointer transition-colors hover:bg-gray-50 ${selectedUsers.includes(user.phone) ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className={`shrink-0 transition-colors ${selectedUsers.includes(user.phone) ? 'text-blue-600' : 'text-gray-300'}`}>
                                            {selectedUsers.includes(user.phone) ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                                            <p className="text-[10px] font-medium text-gray-400 truncate">{user.device} • {user.phone}</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{user.lastDate?.split(' ')[0]}</p>
                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">Müşteri</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingAutomation;
