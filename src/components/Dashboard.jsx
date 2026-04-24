import React, { useMemo, useState } from 'react';
import { Clock, AlertCircle, CheckCircle, Package, Activity, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, MoreHorizontal, Wallet, Users, Zap, LayoutDashboard, Store, X, ChevronRight, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { hasPermission } from '../utils/permissions';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, trend, trendValue }) => (
    <div className="glass p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center shadow-sm ring-1 ring-black/5`}>
                <Icon size={22} className="text-white" />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${trend === 'up'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trendValue}
                </div>
            )}
        </div>

        <div className="relative z-10">
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-500">{title}</p>
        </div>
    </div>
);

// ActivityItem extracted out as requested
const DonutChart = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0) || 1;
    let accumulatedAngle = 0;

    return (
        <div className="relative w-40 h-40 shrink-0 mx-auto">
            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-lg">
                {data.map((item, index) => {
                    const angle = (item.value / total) * 360;
                    // Eğer 0 ise render etme
                    if (angle <= 0) return null;

                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
                    const strokeDashoffset = -1 * (accumulatedAngle / 360) * circumference;
                    accumulatedAngle += angle;

                    return (
                        <circle
                            key={index} cx="50" cy="50" r={radius} fill="transparent"
                            stroke={item.color} strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out hover:stroke-[12] cursor-pointer hover:opacity-90"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-extrabold text-gray-900">{total > 1 ? total : 0}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Cihaz</span>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { repairs, allRepairs, inventory, currentUser, technicians, earnings, servicePoints, alerts, selectedStoreId } = useAppContext();
    const [selectedStoreDetails, setSelectedStoreDetails] = useState(null);

    // --- Gelişmiş İstatistik Hesaplamaları ---
    const stats = useMemo(() => {
        const totalEarnings = earnings.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const activeTechs = technicians.filter(t => t.status === 'busy').length;
        
        return {
            pending: repairs.filter(r => r.status === 'Beklemede').length,
            inProgress: repairs.filter(r => r.status === 'İşlemde').length,
            completed: repairs.filter(r => r.status === 'Tamamlandı').length,
            criticalSla: alerts.filter(a => a.type === 'critical').length,
            totalRevenue: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalEarnings),
            techUtilization: Math.round((activeTechs / (technicians.length || 1)) * 100)
        };
    }, [repairs, alerts, earnings, technicians]);

    // --- Mağaza Bazlı Durum Takip (Grid İçin) ---
    const storeStatusData = useMemo(() => {
        const sourceRepairs = allRepairs || repairs;
        return servicePoints.map(sp => {
            const storeRepairs = sourceRepairs.filter(r => String(r.storeId) === String(sp.id));
            const activeRepairs = storeRepairs.filter(r => !['Tamamlandı', 'Teslim Edildi', 'İptal', 'İade'].includes(r.status));
            
            // Müşteri beklemede, onay beklemede veya 14 günden eski işlemler kritik sayılabilir
            const criticalRepairs = activeRepairs.filter(r => {
                if (r.status?.includes('Bekliyor')) return true;
                if (!r.date) return false;
                const [d, m, y] = r.date.split(' ')[0].split('.');
                if (!d || !m || !y) return false;
                const repairDate = new Date(y, m - 1, d);
                const daysPass = Math.floor((new Date() - repairDate) / (1000 * 60 * 60 * 24));
                return daysPass > 14; 
            });

            return {
                ...sp,
                pendingCount: activeRepairs.length,
                criticalCount: criticalRepairs.length,
                activeRepairs,
                criticalRepairs
            };
        }).sort((a,b) => b.pendingCount - a.pendingCount);
    }, [servicePoints, allRepairs, repairs]);

    // --- Mağaza Bazlı Kıyaslama (Admin İçin) ---
    const storePerformance = useMemo(() => {
        if (!hasPermission(currentUser, 'view_all_stores')) return [];
        return servicePoints.map(sp => {
            const storeRepairs = repairs.filter(r => String(r.storeId) === String(sp.id));
            const storeEarnings = earnings.filter(e => String(e.storeId) === String(sp.id));
            const totalE = storeEarnings.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            return {
                name: sp.name,
                shipTo: sp.shipTo,
                count: storeRepairs.length,
                revenue: totalE,
                successRate: storeRepairs.length > 0 ? Math.round((storeRepairs.filter(r => r.status === 'Tamamlandı').length / storeRepairs.length) * 100) : 0
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [servicePoints, repairs, earnings, currentUser]);

    // --- Cihaz Dağılımını Hesapla ---
    const deviceDistribution = useMemo(() => {
        const counts = { 'iPhone': 0, 'Mac': 0, 'iPad': 0, 'Diğer': 0 };
        repairs.forEach(r => {
            const d = r.device || '';
            if (d.includes('iPhone')) counts['iPhone']++;
            else if (d.includes('Mac')) counts['Mac']++;
            else if (d.includes('iPad')) counts['iPad']++;
            else counts['Diğer']++;
        });

        return [
            { name: 'iPhone', value: counts['iPhone'], color: '#007AFF' }, // Apple Blue
            { name: 'Mac', value: counts['Mac'], color: '#1d1d1f' }, // Apple Dark
            { name: 'iPad', value: counts['iPad'], color: '#5856D6' }, // Purple
            { name: 'Diğer', value: counts['Diğer'], color: '#FF9500' } // Orange
        ];
    }, [repairs]);

    // --- Kritik Stok ---
    const lowStockItems = useMemo(() => {
        return inventory.filter(i => i.quantity <= i.minLevel).slice(0, 3);
    }, [inventory]);

    const { date, time } = {
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    return (
        <div className="p-8 space-y-8 pb-24 animate-fade-in max-w-[1600px] mx-auto">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Merhaba, {currentUser?.name?.split(' ')[0]} 👋
                    </h2>
                    <p className="text-gray-500 mt-1 font-medium">
                        Bugün servis operasyonları oldukça yoğun görünüyor.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="bg-white/50 backdrop-blur-sm border border-white/60 px-5 py-2 rounded-2xl shadow-sm text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{date}</p>
                        <p className="text-2xl font-light text-gray-900 font-mono tracking-tighter">{time}</p>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="İşlem Bekleyen"
                    value={stats.pending}
                    icon={Clock}
                    colorClass="bg-gradient-to-tr from-orange-400 to-orange-600 shadow-orange-200"
                    trend="up"
                    trendValue="Yeni"
                />
                <StatCard
                    title="Toplam Ciro"
                    value={stats.totalRevenue}
                    icon={Wallet}
                    colorClass="bg-gradient-to-tr from-emerald-500 to-emerald-700 shadow-emerald-200"
                    trend="up"
                    trendValue="%12 Artış"
                />
                <StatCard
                    title="Teknisyen Verimliliği"
                    value={`%${stats.techUtilization}`}
                    icon={Zap}
                    colorClass="bg-gradient-to-tr from-blue-500 to-blue-700 shadow-blue-200"
                    trend="up"
                    trendValue="Aktif"
                />
                <StatCard
                    title="SLA Kritik"
                    value={stats.criticalSla}
                    icon={AlertCircle}
                    colorClass="bg-gradient-to-tr from-red-500 to-red-700 shadow-red-200"
                    trend={stats.criticalSla > 0 ? "up" : "down"}
                    trendValue="İhlal"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Sol Kolon: Aktivite Listesi ve Mağaza Kıyaslama */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Admin Store Comparison */}
                    {hasPermission(currentUser, 'view_all_stores') && (
                        <div className="glass rounded-[32px] overflow-hidden border border-white/50">
                            <div className="p-6 border-b border-gray-100/50 bg-white/40 flex justify-between items-center">
                                <h3 className="font-black text-gray-900 flex items-center gap-2.5">
                                    <Store size={20} className="text-apple-blue" />
                                    Mağaza Performans Endeksi
                                </h3>
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Canlı Veri</span>
                            </div>
                            <div className="p-2 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                            <th className="px-6 py-4">Şube</th>
                                            <th className="px-6 py-4">Ship-To</th>
                                            <th className="px-6 py-4">İşlem</th>
                                            <th className="px-6 py-4">Başarı %</th>
                                            <th className="px-6 py-4 text-right">Ciro</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {storePerformance.map((store, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900 text-sm group-hover:text-apple-blue transition-colors">{store.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{store.shipTo || 'Tanımsız'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">{store.count}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 max-w-[60px] bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${store.successRate}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-black text-emerald-600">%{store.successRate}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-gray-900">{new Intl.NumberFormat('tr-TR').format(store.revenue)} ₺</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="glass rounded-[32px] overflow-hidden flex flex-col min-h-[500px] border border-white/50">
                        <div className="p-6 border-b border-gray-100/50 flex justify-between items-center bg-white/40">
                            <h3 className="font-black text-gray-900 flex items-center gap-2.5">
                                <LayoutDashboard size={20} className="text-indigo-600" /> 
                                Mağaza Operasyon Şeması
                            </h3>
                            <button className="p-2 hover:bg-gray-100/50 rounded-xl transition text-gray-400 hover:text-gray-600">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <div className="bg-gray-50/30 p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {storeStatusData.map(sp => (
                                    <div 
                                        key={sp.id} 
                                        onClick={() => setSelectedStoreDetails(sp)}
                                        className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                                    >
                                        {sp.criticalCount > 0 && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-red-500/20 transition-all"></div>}
                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                                    <Store size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 leading-tight">{sp.name}</h4>
                                                    <p className="text-[10px] font-mono text-gray-500 font-bold">SHIP-TO: {sp.shipTo || 'YOK'}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 relative z-10">
                                            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100/50">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">İşlem Bekleyen</p>
                                                <p className="text-2xl font-black text-gray-900">{sp.pendingCount}</p>
                                            </div>
                                            <div className={`rounded-2xl p-3 border ${sp.criticalCount > 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                                <p className={`text-[10px] uppercase font-black tracking-widest mb-1 ${sp.criticalCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Kritik Süre</p>
                                                <p className={`text-2xl font-black flex items-center gap-2 ${sp.criticalCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                                    {sp.criticalCount}
                                                    {sp.criticalCount > 0 && <ShieldAlert size={18} className="animate-pulse" />}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                    </div>
                {/* Sağ Kolon: Charts & Stok */}
                <div className="flex flex-col gap-6">
                    {/* Dağılım */}
                    <div className="glass p-6 rounded-3xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <PieChart size={18} className="text-gray-400" />
                                Cihaz Dağılımı
                            </h3>
                        </div>

                        {repairs.length > 0 ? (
                            <div className="flex flex-col items-center">
                                <DonutChart data={deviceDistribution} />
                                <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                                    {deviceDistribution.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/40 transition border border-transparent hover:border-gray-100">
                                            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: item.color }}></span>
                                            <div className="flex flex-col leading-none">
                                                <span className="text-xs text-gray-500 font-medium mb-0.5">{item.name}</span>
                                                <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 text-sm py-12 bg-gray-50/50 rounded-2xl">Yeterli veri yok.</div>
                        )}
                    </div>

                    {/* Kritik Stok Widget */}
                    <div className="glass p-6 rounded-3xl flex-1">
                        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <Package size={18} className="text-orange-600" />
                            Kritik Stok Uyarıları
                        </h3>
                        <div className="space-y-4">
                            {lowStockItems.length > 0 ? lowStockItems.map(item => (
                                <div key={item.id} className="group">
                                    <div className="flex justify-between items-center text-xs mb-1.5">
                                        <span className="text-gray-700 font-bold">{item.name}</span>
                                        <span className="text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-md shadow-sm">{item.quantity} Adet Kalıyor</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full transition-all duration-700 group-hover:bg-red-500"
                                            style={{ width: `${Math.min((item.quantity / item.minLevel) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-xs text-emerald-700 font-bold bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center">
                                        <CheckCircle size={14} className="text-emerald-700" />
                                    </div>
                                    Tüm stok seviyeleri ideal durumda.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Store Details Modal */}
            {selectedStoreDetails && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-3xl p-8 shadow-2xl animate-scale-up border border-white/50 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Store size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedStoreDetails.name}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">SHIP-TO: {selectedStoreDetails.shipTo || 'YOK'}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStoreDetails(null)} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                                    <p className="text-xs font-black uppercase tracking-widest text-blue-900/60 mb-2">Tüm İşlem Bekleyenler</p>
                                    <h4 className="text-4xl font-black text-blue-900">{selectedStoreDetails.activeRepairs.length}</h4>
                                </div>
                                <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100/50">
                                    <p className="text-xs font-black uppercase tracking-widest text-red-900/60 mb-2">Kritik Süre Olanlar</p>
                                    <h4 className="text-4xl font-black text-red-600 flex items-center gap-3">
                                        {selectedStoreDetails.criticalRepairs.length}
                                        {selectedStoreDetails.criticalRepairs.length > 0 && <ShieldAlert size={28} />}
                                    </h4>
                                </div>
                            </div>

                            {selectedStoreDetails.criticalRepairs.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-red-500"/> Kritik İşlemler ({selectedStoreDetails.criticalRepairs.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedStoreDetails.criticalRepairs.map(r => (
                                            <div key={r.id} className="flex justify-between items-center bg-white border-2 border-red-100 p-4 rounded-2xl">
                                                <div>
                                                    <p className="font-bold text-gray-900">{r.device} - {r.customer}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium">No: {r.id} | Tarih: {r.date}</p>
                                                </div>
                                                <span className="bg-red-100 text-red-700 font-black text-[10px] uppercase px-3 py-1.5 rounded-lg border border-red-200">
                                                    {r.status || 'Bekliyor'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                                    <Clock size={16} className="text-blue-500"/> Diğer Açık İşlemler
                                </h4>
                                <div className="space-y-2">
                                    {selectedStoreDetails.activeRepairs.filter(r => !selectedStoreDetails.criticalRepairs.includes(r)).map(r => (
                                        <div key={r.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                            <div>
                                                <p className="font-bold text-gray-900">{r.device} - {r.customer}</p>
                                                <p className="text-[11px] text-gray-500 font-medium">No: {r.id} | Tarih: {r.date}</p>
                                            </div>
                                            <span className="bg-gray-200 text-gray-700 font-black text-[10px] uppercase px-3 py-1.5 rounded-lg">
                                                {r.status || 'İşlemde'}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedStoreDetails.activeRepairs.length === selectedStoreDetails.criticalRepairs.length && (
                                        <p className="text-sm text-gray-400 font-medium text-center py-4">Sadece kritik onarımlar mevcut.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
