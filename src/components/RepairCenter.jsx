import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Clock,
    CheckCircle,
    AlertCircle,
    Play,
    MoreVertical,
    User,
    Phone,
    Wrench,
    Truck,
    Package,
    ChevronRight,
    Calendar,
    Save,
    ArrowRight,
    Zap,
    Box,
    Eye
} from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import TechnicianWorkspace from './TechnicianWorkspace';
import SwapWorkspace from './SwapWorkspace';
import AppleLogisticsModal from './AppleLogisticsModal';
import RepairHistoryModal from './RepairHistoryModal';
import PartArrivalModal from './PartArrivalModal';
import { useAppContext } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';

const RepairCenter = ({ type, setActiveTab }) => {
    // type: 'in-store' | 'apple-center'
    const { repairs, API_URL } = useAppContext();

    // Resim URL'sini Çözümleme Yardımcısı
    const getSafeImageUrl = (imagePath, productGroup, device) => {
        // Bilinen bozuk/örnek linkleri görmezden gel
        const isDeadLink = imagePath && (
            imagePath.includes('officialapple.store') || 
            imagePath.includes('example.com') ||
            imagePath.includes('broken-link')
        );

        if (imagePath && imagePath.startsWith('http') && !isDeadLink) return imagePath;
        if (imagePath && imagePath.startsWith('data:')) return imagePath;
        
        // Eğer veritabanında sadece dosya adı varsa API URL ile birleştir
        if (imagePath && imagePath.length > 0 && !isDeadLink) {
            const baseUrl = (API_URL || 'http://localhost:5001/api').replace('/api', '');
            return `${baseUrl}/uploads/${imagePath.replace(/^\//, '')}`;
        }

        // Resim yoksa veya bozuksa varsayılan ürün grubu görselini getir
        return getProductImage(productGroup, device);
    };

    const [filterStatus, setFilterStatus] = useState('all');
    const [activeRepairId, setActiveRepairId] = useState(null);
    const [logisticsModalId, setLogisticsModalId] = useState(null);
    const [selectedHistoryRepair, setSelectedHistoryRepair] = useState(null);
    const [showPartArrivalId, setShowPartArrivalId] = useState(null);

    const filteredRepairs = repairs.filter(r => {
        if (type === 'in-store') {
            // Sadece Mağaza İçi olanlar (Beklemede/Hazır/Tamamlananlar ve Müşteri Onayı Bekleyenler hariç)
            return r.type !== 'apple-center' && 
                   r.status !== 'Beklemede' && 
                   r.status !== 'Tamamlandı' && 
                   r.status !== 'Teslim Edildi' && 
                   r.status !== 'Cihaz Hazır' && 
                   r.status !== 'Müşteri Onayı Bekliyor' &&
                   r.status !== 'İade Hazır' &&
                   r.status !== 'İade Edildi';
        }
        if (type === 'apple-center') {
            // Sadece Apple Center sürecinde olanlar. 
            // Cihaz mağazaya geri geldiğinde (Cihaz Hazır / İade Hazır) artık lojistik listesinde görünmemeli.
            const terminalStatuses = ['Tamamlandı', 'Teslim Edildi', 'Cihaz Hazır', 'İade Hazır', 'İade Edildi'];
            return (r.type === 'apple-center' || r.status === "Apple'a Gönderildi") && !terminalStatuses.includes(r.status);
        }
        return true;
    });

    const stats = {
        pending: repairs.filter(r => r.status === 'Beklemede').length,
        processing: repairs.filter(r => r.status === 'İşlemde' || r.status === "Apple'a Gönderildi").length,
        parts: repairs.filter(r => r.status === 'Parça Bekleniyor').length,
        completed: repairs.filter(r => r.status === 'Tamamlandı').length
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Teknisyen Bekleniyor': return 'bg-gray-100/80 text-gray-600 border-gray-200 backdrop-blur-sm';
            case 'İşlemde': return 'bg-blue-50/90 text-blue-600 border-blue-200 backdrop-blur-sm animate-pulse';
            case 'Parça Bekleniyor': return 'bg-orange-50/90 text-orange-600 border-orange-200 backdrop-blur-sm';
            case 'Tamamlandı': return 'bg-green-50/90 text-green-600 border-green-200 backdrop-blur-sm';
            case "Apple'a Gönderildi": return 'bg-purple-50/90 text-purple-600 border-purple-200 backdrop-blur-sm';
            default: return 'bg-gray-50/80 text-gray-500 border-gray-200 backdrop-blur-sm';
        }
    };

    const handleManageRepair = (repairId) => {
        if (type === 'in-store') {
            setActiveRepairId(repairId);
        } else if (type === 'apple-center') {
            setLogisticsModalId(repairId);
        }
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-32 animate-fade-in px-4 md:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl bg-white/40 p-6 rounded-[32px] border border-white/50 shadow-sm sticky top-4 z-30">
                <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ${type === 'in-store' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'}`}>
                        {type === 'in-store' ? <Wrench size={28} /> : <Truck size={28} />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">
                            {type === 'in-store' ? 'Teknik Servis Merkezi' : 'Lojistik & Apple Merkezi'}
                        </h2>
                        <p className="text-gray-500 font-medium">
                            {type === 'in-store'
                                ? 'Aktif servis kayıtlarını yönetin, teknisyen atayın ve durumlarını güncelleyin.'
                                : 'Cihaz lojistiğini, kargo takiplerini ve Apple servis süreçlerini izleyin.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative group w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Kayıt ara..."
                            className="w-full md:w-72 bg-white/80 pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all group-hover:bg-white group-hover:shadow-md"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    </div>
                    <button className="bg-white/80 hover:bg-white text-gray-700 px-5 py-3.5 rounded-2xl font-bold border border-gray-200 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap active:scale-95">
                        <Filter size={18} />
                        <span className="hidden md:inline">Filtrele</span>
                    </button>
                </div>
            </div>

            {/* İstatistik Kartları (Özet) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Bekleyen Cihaz', value: stats.pending, icon: Clock, color: 'text-gray-900', bg: 'bg-white', border: 'group-hover:border-gray-300', iconBg: 'bg-gray-100' },
                    { label: 'İşlem Gören', value: stats.processing, icon: Zap, color: 'text-blue-600', bg: 'bg-white', border: 'group-hover:border-blue-300', iconBg: 'bg-blue-50' },
                    { label: 'Parça Bekleyen', value: stats.parts, icon: Box, color: 'text-orange-600', bg: 'bg-white', border: 'group-hover:border-orange-300', iconBg: 'bg-orange-50' },
                    { label: 'Tamamlanan', value: stats.completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-white', border: 'group-hover:border-green-300', iconBg: 'bg-green-50' }
                ].map((stat, idx) => (
                    <div key={idx} className={`${stat.bg} p-6 rounded-[28px] flex items-center justify-between border border-transparent shadow-lg shadow-gray-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray-100 ${stat.border}`}>
                        <div>
                            <p className={`text-xs font-black uppercase tracking-widest mb-2 opacity-60 ${stat.color}`}>{stat.label}</p>
                            <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className={`w-14 h-14 ${stat.iconBg} rounded-2xl flex items-center justify-center ${stat.color} shadow-inner transition-transform group-hover:rotate-6`}>
                            <stat.icon size={28} strokeWidth={2.5} />
                        </div>
                    </div>
                ))}
            </div>

            {/* İçerik Görünümü (Listeleme) */}
            {type === 'apple-center' ? (
                <div className="flex flex-col gap-4">
                    {filteredRepairs.map((repair) => (
                        <div key={repair.id} className="group bg-white rounded-[24px] md:rounded-full p-4 pr-6 flex flex-col md:flex-row items-center gap-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
                            {/* Device Avatar */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-md">
                                    <img 
                                        src={getSafeImageUrl(repair.image, repair.productGroup, repair.device)} 
                                        alt={repair.device} 
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = getProductImage(repair.productGroup, repair.device);
                                        }}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                                    />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <h3 className="font-black text-gray-900 text-sm truncate">{repair.device}</h3>
                                    <div className="flex items-center gap-2 mt-1 xl:mt-0">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 hidden lg:inline-block">#{repair.id}</span>
                                        <span className="text-[11px] font-bold text-gray-500 truncate">{repair.customer}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="w-full md:w-48 flex shrink-0 justify-start md:justify-center">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/50 ${getStatusColor(repair.status)}`}>
                                    {repair.status}
                                </span>
                            </div>

                            {/* Takip Bilgileri */}
                            <div className="flex-1 grid grid-cols-2 gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 group-hover:bg-purple-50/50 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                                        <Truck size={14} className="text-purple-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase text-gray-400">Kargo Takip No</p>
                                        <p className="text-xs font-mono font-bold text-gray-900 truncate">{repair.shipmentCode || 'Takip No Girilmedi'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 group-hover:bg-indigo-50/50 transition-colors">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Zap size={14} className="text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase text-gray-400">Apple GSX ID</p>
                                        <p className="text-xs font-mono font-bold text-gray-900 truncate">{repair.appleRepairId || 'ID Bekleniyor'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Eylemler */}
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0 justify-end">
                                <button
                                    onClick={() => setSelectedHistoryRepair(repair)}
                                    className="w-12 h-12 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 rounded-2xl flex items-center justify-center border border-gray-200 transition-all active:scale-95 shadow-sm"
                                    title="Müşteri Detayı"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => handleManageRepair(repair.id)}
                                    className="h-12 px-6 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/20"
                                >
                                    LOJİSTİK YÖNETİMİ <ArrowRight size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {filteredRepairs.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-[40px] border border-dashed border-gray-300">
                            <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                <Truck size={32} className="text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Lojistik Kaydı Bulunamadı</h3>
                            <p className="text-gray-500 font-medium">Apple Merkezi sürecinde olan veya Kargoya verilmiş cihaz yok.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredRepairs.map((repair) => (
                        <div 
                            key={repair.id} 
                            className="group relative bg-white rounded-[28px] transition-all duration-500 flex items-stretch overflow-hidden border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-blue-200"
                        >
                            {/* Sol Taraf - Kompakt Görsel */}
                            <div className="relative w-40 shrink-0 bg-gray-50 overflow-hidden border-r border-gray-50">
                                <img 
                                    src={getSafeImageUrl(repair.image, repair.productGroup, repair.device)} 
                                    alt={repair.device} 
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        const fallback = getProductImage(repair.productGroup, repair.device);
                                        e.target.src = fallback === e.target.src ? 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=800&auto=format&fit=crop' : fallback;
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-40" />
                                
                                {/* ID Badge */}
                                <div className="absolute top-3 left-3 z-20">
                                    <span className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[9px] font-black font-mono border border-white/10">
                                        #{repair.id}
                                    </span>
                                </div>

                                {/* Status Overlay (Bottom) */}
                                <div className="absolute bottom-3 left-3 right-3 z-20">
                                    <span className={`block text-center px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/30 truncate ${getStatusColor(repair.status)}`}>
                                        {repair.status}
                                    </span>
                                </div>
                            </div>

                            {/* Sağ Taraf - İçerik Alanı */}
                            <div className="p-5 flex-1 flex flex-col min-w-0 justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-black text-gray-900 text-sm leading-tight line-clamp-1 flex-1 group-hover:text-blue-600 transition-colors" title={repair.device}>
                                            {repair.device}
                                        </h3>
                                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter ${repair.serviceType === 'exchange' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {repair.serviceType === 'exchange' ? 'D' : 'O'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-500">
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                            <User size={12} />
                                        </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold truncate">{repair.customer}</span>
                                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter">S/N: {repair.serial || repair.serialNumber || 'YOK'}</span>
                                    </div>
                                    </div>

                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Wrench size={10} className="text-gray-400 shrink-0" />
                                            <span className="text-[10px] font-bold text-gray-600 truncate">{repair.technician?.split(' ')[0] || 'Atanmadı'}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">{repair.date?.split(' ')[0]}</span>
                                    </div>
                                </div>

                                {/* Butonlar */}
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => handleManageRepair(repair.id)}
                                        className="flex-1 h-9 rounded-xl text-[9px] font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-white bg-gray-900 hover:bg-black shadow-gray-200"
                                    >
                                        BAŞLA <ArrowRight size={12} strokeWidth={3} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedHistoryRepair(repair)}
                                        className="w-9 h-9 bg-white hover:bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center border border-gray-200 transition-all active:scale-95"
                                        title="Detay"
                                    >
                                        <Eye size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* KGB Küçük Alert */}
                            {repair.parts && repair.parts.length > 0 && repair.parts.some(p => !p.kgbSerial || p.needsOrder) && (
                                <div className="absolute top-0 right-0 p-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredRepairs.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-[40px] border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Wrench size={24} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Kayıt Bulunamadı</h3>
                            <p className="text-gray-400 text-sm font-medium">Bu kategoride aktif bir cihaz yok.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Teknisyen Çalışma Alanı Modalı */}
            {activeRepairId && (() => {
                const activeRepair = repairs.find(r => r.id === activeRepairId);
                if (!activeRepair) return null;

                return activeRepair.serviceType === 'exchange' ? (
                    <SwapWorkspace
                        repairId={activeRepairId}
                        onClose={() => setActiveRepairId(null)}
                        setActiveTab={setActiveTab}
                    />
                ) : (
                    <TechnicianWorkspace
                        repairId={activeRepairId}
                        onClose={() => setActiveRepairId(null)}
                        setActiveTab={setActiveTab}
                    />
                );
            })()}

            {/* Apple Logistics Modal */}
            {logisticsModalId && (
                <AppleLogisticsModal
                    repairId={logisticsModalId}
                    onClose={() => setLogisticsModalId(null)}
                />
            )}

            {/* History Link Modal */}
            {selectedHistoryRepair && (
                <RepairHistoryModal
                    repair={selectedHistoryRepair}
                    onClose={() => setSelectedHistoryRepair(null)}
                />
            )}

            {showPartArrivalId && (
                <PartArrivalModal
                    repairId={showPartArrivalId}
                    onClose={() => setShowPartArrivalId(null)}
                />
            )}
        </div>
    );
};

export default RepairCenter;
