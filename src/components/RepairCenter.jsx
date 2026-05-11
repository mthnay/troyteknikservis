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
import { getProductImage, getSafeRepairImageUrl } from '../utils/productImages';

const RepairCenter = ({ type, setActiveTab }) => {
    // type: 'in-store' | 'apple-center'
    const { repairs, API_URL, searchQuery, setSearchQuery } = useAppContext();

    // getSafeImageUrl is now replaced by the centralized getSafeRepairImageUrl utility

    const [filterStatus, setFilterStatus] = useState('all');
    const [activeRepairId, setActiveRepairId] = useState(null);
    const [logisticsModalId, setLogisticsModalId] = useState(null);
    const [selectedHistoryRepair, setSelectedHistoryRepair] = useState(null);
    const [showPartArrivalId, setShowPartArrivalId] = useState(null);

    const filteredRepairs = repairs.filter(r => {
        // First filter by search query
        const matchesSearch = !searchQuery || 
            (r.device?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.serial?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (!matchesSearch) return false;

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
        <div className="space-y-6">
            {/* Header - Ana Sayfa Stili */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-md border shadow-sm ${type === 'in-store' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        {type === 'in-store' ? <Wrench size={28} /> : <Truck size={28} />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                            {type === 'in-store' ? 'Teknik Servis Merkezi' : 'Lojistik & Apple Merkezi'}
                        </h2>
                        <p className="text-gray-500 mt-1 font-medium">
                            {type === 'in-store'
                                ? 'Aktif servis kayıtlarını yönetin ve teknisyen atayın.'
                                : 'Cihaz lojistiğini ve Apple servis süreçlerini izleyin.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Kayıt veya müşteri ara..."
                            className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-md font-bold text-xs border border-gray-200 transition-all flex items-center gap-2 active:scale-95 shadow-sm">
                        <Filter size={16} />
                        <span className="hidden md:inline">Filtrele</span>
                    </button>
                </div>
            </div>

            {/* İstatistik Kartları (Özet) */}
            {/* İstatistik Kartları - Ana Sayfa Stili */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'BEKLEYEN', value: stats.pending, icon: Clock, color: 'text-gray-400', bg: 'bg-white', iconBg: 'bg-gray-50' },
                    { label: 'İŞLEMDE', value: stats.processing, icon: Zap, color: 'text-blue-500', bg: 'bg-white', iconBg: 'bg-blue-50' },
                    { label: 'PARÇA BEKLEYEN', value: stats.parts, icon: Box, color: 'text-orange-500', bg: 'bg-white', iconBg: 'bg-orange-50' },
                    { label: 'TAMAMLANAN', value: stats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-white', iconBg: 'bg-green-50' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 ${stat.iconBg} rounded-md flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                ))}
            </div>

            {/* İçerik Görünümü (Listeleme) - Ana Sayfa Stili */}
            {type === 'apple-center' ? (
                <div className="flex flex-col gap-4">
                    {filteredRepairs.map((repair) => (
                        <div key={repair.id} className="group bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:border-purple-200 transition-all flex flex-col md:flex-row items-center gap-6">
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
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">#{repair.id}</span>
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
                                <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(repair.status)}`}>
                                    {repair.status}
                                </span>
                            </div>

                            {/* Takip Bilgileri - Kompakt */}
                            <div className="flex-1 grid grid-cols-2 gap-3 w-full md:w-auto">
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                    <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest mb-1">Kargo Takip</p>
                                    <p className="text-[11px] font-mono font-bold text-gray-700 truncate">{repair.shipmentCode || 'Girilmedi'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                    <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest mb-1">GSX ID</p>
                                    <p className="text-[11px] font-mono font-bold text-gray-700 truncate">{repair.appleRepairId || 'Bekleniyor'}</p>
                                </div>
                            </div>

                            {/* Eylemler */}
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end mt-2 md:mt-0">
                                <button
                                    onClick={() => setSelectedHistoryRepair(repair)}
                                    className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-md flex items-center justify-center border border-gray-200 transition-all shadow-sm"
                                    title="Detay"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => handleManageRepair(repair.id)}
                                    className="h-10 px-4 rounded-md text-[11px] font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-white bg-gray-900 hover:bg-black"
                                >
                                    YÖNET <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {filteredRepairs.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-lg border border-dashed border-gray-300">
                            <div className="w-20 h-20 bg-purple-50 rounded-lg flex items-center justify-center mb-6 shadow-sm">
                                <Truck size={32} className="text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Lojistik Kaydı Bulunamadı</h3>
                            <p className="text-gray-500 font-medium">Apple Merkezi sürecinde olan veya Kargoya verilmiş cihaz yok.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredRepairs.map((repair) => (
                        <div 
                            key={repair.id} 
                            className="group bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:border-blue-200 transition-all flex flex-col md:flex-row items-center gap-6"
                        >
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
                                        <span className="text-[10px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">#{repair.id}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{repair.productGroup}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-blue-600 transition-colors">{repair.device}</h3>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                            <User size={12} className="text-gray-400" /> {repair.customer}
                                        </p>
                                        <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-tight">SN: {repair.serial || repair.serialNumber || 'YOK'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="w-full md:w-40 flex shrink-0 justify-start md:justify-center">
                                <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(repair.status)}`}>
                                    {repair.status}
                                </span>
                            </div>

                            {/* Tech Info */}
                            <div className="w-full md:w-48 p-3 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-[11px] font-bold text-gray-600 truncate">{repair.technician?.split(' ')[0] || 'Atanmadı'}</span>
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Calendar size={10} /> {repair.date?.split(' ')[0]}
                                </div>
                            </div>

                            {/* Eylemler */}
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end mt-2 md:mt-0">
                                <button
                                    onClick={() => setSelectedHistoryRepair(repair)}
                                    className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-md flex items-center justify-center border border-gray-200 transition-all shadow-sm"
                                    title="Detay"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => handleManageRepair(repair.id)}
                                    className="h-10 px-4 rounded-md text-[11px] font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-white bg-gray-900 hover:bg-black"
                                >
                                    BAŞLA <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredRepairs.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-lg border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Wrench size={24} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">Kayıt Bulunamadı</h3>
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
