import React, { useState } from 'react';
import { Archive as ArchiveIcon, Search, FileText, User, Calendar, Eye, Download, Filter, CheckCircle, ChevronDown, Store, CalendarDays, CalendarClock } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';
import { getProductImage, getSafeRepairImageUrl } from '../utils/productImages';
import RepairHistoryModal from './RepairHistoryModal';
import BatchExportModal from './BatchExportModal';
import { hasPermission } from '../utils/permissions';

const Archive = () => {
    const { repairs, servicePoints, currentUser, API_URL } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [showBatchExport, setShowBatchExport] = useState(false);

    // Filter archived repairs with robust search
    const archivedRepairs = repairs.filter(r => {
        const isArchived = r.status === 'Teslim Edildi' || r.status === 'İade Edildi' || r.status === 'Tamamlandı';
        if (!isArchived) return false;

        if (!searchTerm.trim()) return true;

        const searchLower = searchTerm.toLowerCase().trim();
        return (
            (r.customer && r.customer.toLowerCase().includes(searchLower)) ||
            (r.id && r.id.toString().toLowerCase().includes(searchLower)) ||
            (r.device && r.device.toLowerCase().includes(searchLower)) ||
            (r.serial && r.serial.toLowerCase().includes(searchLower)) ||
            (r.serialNumber && r.serialNumber.toLowerCase().includes(searchLower))
        );
    });

    // Grouping
    const grouped = {};
    
    // Yalnızca kullanıcının görebileceği mağazaları boş klasör şablonu olarak ekle
    const allowedStores = hasPermission(currentUser, 'view_all_stores')
        ? servicePoints
        : servicePoints.filter(sp => String(sp.id) === String(currentUser?.storeId));

    allowedStores.forEach(sp => {
        grouped[sp.name] = {};
    });

    archivedRepairs.forEach(repair => {
        const store = servicePoints.find(sp => sp.id === repair.storeId);
        const storeName = store ? store.name : 'Bilinmeyen Mağaza / Dış Kayıt';

        const dateStr = repair.history?.find(h => h.status === 'Teslim Edildi' || h.status === 'İade Edildi')?.date || repair.date || '';
        let year = 'Bilinmeyen Yıl';
        let month = 'Bilinmeyen Ay';
        let week = 'Hafta ?';

        if (dateStr) {
            const parts = dateStr.split(' ')[0].split('.');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const monthIdx = parseInt(parts[1], 10);
                year = parts[2];

                const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                month = months[monthIdx - 1] || 'Bilinmeyen Ay';
                
                week = `${Math.ceil(day / 7)}. Hafta`;
            }
        }

        if (!grouped[storeName]) grouped[storeName] = {};
        if (!grouped[storeName][year]) grouped[storeName][year] = {};
        if (!grouped[storeName][year][month]) grouped[storeName][year][month] = {};
        if (!grouped[storeName][year][month][week]) grouped[storeName][year][month][week] = [];

        grouped[storeName][year][month][week].push(repair);
    });

    // Render Repair row for Table
    const renderRepairRow = (repair) => (
        <tr key={repair.id} className="hover:bg-blue-50/40 transition-colors group">
            <td className="px-8 py-5 font-mono font-bold text-gray-500 text-xs group-hover:text-blue-600 transition-colors">
                #{repair.id}
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shrink-0 shadow-sm">
                        <img src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm truncate">{repair.customer}</span>
                            {repair.productGroup && (
                                <span className="px-1.5 py-0.5 bg-gray-900 text-white text-[8px] font-semibold uppercase tracking-tight rounded shrink-0">
                                    {repair.productGroup}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 truncate">
                            <MyPhoneIcon size={10} /> {repair.device}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5 text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {repair.date?.split(' ')[0]}
                </div>
            </td>
            <td className="px-6 py-5 text-green-700 font-bold bg-green-50/30">
                <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600" />
                    {repair.history?.find(h => h.status === 'Teslim Edildi')?.date?.split(' ')[0] || repair.date?.split(' ')[0]}
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="max-w-[240px] truncate text-gray-500 text-xs font-medium italic">
                    "{repair.historyNote || repair.issue || repair.issueDescription || 'Genel Bakım ve Onarım İşlemleri'}"
                </p>
            </td>
            <td className="px-8 py-5 text-right">
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                    onClick={() => setSelectedRepair(repair)}
                >
                    <Eye size={14} /> Detaylar
                </button>
            </td>
        </tr>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header - Ana Sayfa Stili */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-md text-gray-600 border border-gray-200 shadow-sm">
                        <ArchiveIcon size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Servis Arşivi</h2>
                        <p className="text-gray-500 mt-1 font-medium">Teslim edilmiş ve süreci tamamlanmış geçmiş servis kayıtları.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Müşteri, Cihaz veya Seri No..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowBatchExport(true)}
                        className="h-10 px-4 bg-gray-900 text-white rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2 shadow-md active:scale-95"
                    >
                        <Download size={16} /> DIŞA AKTAR
                    </button>
                </div>
            </div>

            {/* List / Categorized View */}
            {searchTerm ? (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <th className="px-6 py-4">Takip No</th>
                                    <th className="px-6 py-4">Müşteri & Cihaz</th>
                                    <th className="px-6 py-4 text-center">Kabul Tarihi</th>
                                    <th className="px-6 py-4 text-center">Teslim Tarihi</th>
                                    <th className="px-6 py-4 text-right">Aksiyon</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {archivedRepairs.length > 0 ? (
                                    archivedRepairs.map(repair => (
                                        <tr key={repair.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-gray-500 text-xs">#{repair.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden border border-gray-100">
                                                        <img src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{repair.customer}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{repair.device}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-500 text-center">{repair.date?.split(' ')[0]}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-green-600 text-center">{repair.history?.find(h => h.status === 'Teslim Edildi')?.date?.split(' ')[0] || repair.date?.split(' ')[0]}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setSelectedRepair(repair)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all">
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Kayıt bulunamadı</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Categorized Tree View
                <div className="space-y-6">
                    {Object.keys(grouped).length > 0 ? (
                        Object.entries(grouped).map(([storeName, years]) => (
                            <details key={storeName} className="group glass rounded-lg border border-white/60 shadow-xl shadow-gray-200/50 overflow-hidden" open>
                                <summary className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white cursor-pointer select-none border-b border-gray-100/50 hover:bg-gray-50/80 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-md bg-gray-900 flex items-center justify-center text-white shadow-md">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">{storeName}</h3>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{Object.values(years).reduce((acc, months) => acc + Object.values(months).reduce((sum, weeks) => sum + Object.values(weeks).flat().length, 0), 0)} Kayıt</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform duration-300 transform" size={24} />
                                </summary>

                                <div className="p-6 space-y-6 bg-white/50">
                                    {Object.keys(years).length > 0 ? (
                                        Object.entries(years).sort((a,b) => b[0] - a[0]).map(([year, months]) => (
                                            <details key={year} className="group/year bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden" open>
                                                <summary className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer select-none">
                                                    <div className="flex items-center gap-3">
                                                        <CalendarDays className="text-blue-500" size={20} />
                                                        <h4 className="text-lg font-semibold text-gray-800">{year} Yılı</h4>
                                                        <span className="bg-white px-2.5 py-0.5 rounded-lg text-xs font-bold text-gray-500 border border-gray-200">
                                                            {Object.values(months).reduce((acc, weeks) => acc + Object.values(weeks).flat().length, 0)} Kayıt
                                                        </span>
                                                    </div>
                                                    <ChevronDown className="text-gray-400 group-open/year:rotate-180 transition-transform duration-300 transform" size={20} />
                                                </summary>

                                                <div className="p-4 space-y-4">
                                                    {Object.entries(months).map(([month, weeks]) => (
                                                        <div key={month} className="border border-gray-100 rounded-md overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                                                            <div className="bg-blue-50/50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    <span className="font-semibold text-gray-900 text-xs uppercase tracking-wide text-sm">{month}</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                                                                    {Object.values(weeks).flat().length} Teslimat
                                                                </span>
                                                            </div>

                                                            {Object.entries(weeks).map(([week, items], wIndex) => (
                                                                <details key={week} className="group/week border-b border-gray-50 last:border-0" open={wIndex === 0}>
                                                                    <summary className="flex items-center gap-3 p-3 bg-white cursor-pointer hover:bg-gray-50 transition-colors select-none">
                                                                        <CalendarClock className="text-gray-400" size={16} />
                                                                        <span className="font-bold text-gray-700 text-sm">{week}</span>
                                                                        <span className="text-xs font-medium text-gray-400">({items.length} kayıt)</span>
                                                                        <ChevronDown className="ml-auto text-gray-300 group-open/week:rotate-180 transition-transform duration-200" size={16} />
                                                                    </summary>
                                                                    
                                                                    <div className="overflow-x-auto bg-white border-t border-gray-50 pb-2">
                                                                        <table className="w-full text-left border-collapse">
                                                                            <thead>
                                                                                <tr className="text-[10px] font-semibold text-xs uppercase tracking-wide text-gray-400">
                                                                                    <th className="px-6 py-2">Takip No</th>
                                                                                    <th className="px-4 py-2">Müşteri</th>
                                                                                    <th className="px-4 py-2">Cihaz</th>
                                                                                    <th className="px-4 py-2">Teslim T.</th>
                                                                                    <th className="px-4 py-2 text-right">Detay</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-50">
                                                                                {items.map(repair => (
                                                                                    <tr key={repair.id} className="hover:bg-blue-50/40 text-xs">
                                                                                        <td className="px-6 py-2 font-mono font-bold text-gray-500">#{repair.id}</td>
                                                                                        <td className="px-4 py-2 font-bold text-gray-900">{repair.customer}</td>
                                                                                        <td className="px-4 py-2 text-gray-600">{repair.device}</td>
                                                                                        <td className="px-4 py-2 text-green-600 font-bold">{repair.history?.find(h => h.status === 'Teslim Edildi')?.date?.split(' ')[0] || repair.date?.split(' ')[0]}</td>
                                                                                        <td className="px-4 py-2 text-right">
                                                                                            <button className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-100 rounded-lg transition-colors" onClick={() => setSelectedRepair(repair)}>
                                                                                                <Eye size={14} />
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </details>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50 rounded-md border border-gray-100 border-dashed">
                                            <p className="text-sm font-bold text-gray-400 text-xs uppercase tracking-wide">Henüz Arşiv Kaydı Yok</p>
                                        </div>
                                    )}
                                </div>
                            </details>
                        ))
                    ) : (
                        <div className="glass rounded-lg p-24 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                    <ArchiveIcon size={40} className="text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Arşiv Boş</h3>
                                    <p className="text-gray-500 mt-1">Sisteme kayıtlı hiçbir geçmiş teslimat bulunmuyor.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedRepair && (
                <RepairHistoryModal
                    repair={selectedRepair}
                    onClose={() => setSelectedRepair(null)}
                />
            )}

            {showBatchExport && (
                <BatchExportModal 
                    onClose={() => setShowBatchExport(false)} 
                />
            )}
        </div>
    );
};

export default Archive;
