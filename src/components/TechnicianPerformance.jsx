import React from 'react';
import { Award, Clock, CheckCircle, TrendingUp, User, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const TechnicianPerformance = () => {
    const { repairs, technicians } = useAppContext();

    const calculateStats = (techName) => {
        const techRepairs = repairs.filter(r => r.technician === techName);
        const completed = techRepairs.filter(r => ['Tamamlandı', 'Teslim Edildi', 'Cihaz Hazır'].includes(r.status));
        const active = techRepairs.filter(r => r.status?.includes('İşlem'));
        
        // Ortalama süre hesaplama (dakika cinsinden)
        let totalMinutes = 0;
        let countWithTime = 0;
        
        completed.forEach(r => {
            if (r.startedAt && r.completedAt) {
                const start = new Date(r.startedAt);
                const end = new Date(r.completedAt);
                const diff = (end - start) / (1000 * 60); // Dakika
                if (diff > 0) {
                    totalMinutes += diff;
                    countWithTime++;
                }
            }
        });

        const avgTime = countWithTime > 0 ? Math.round(totalMinutes / countWithTime) : 0;
        
        return {
            total: techRepairs.length,
            completed: completed.length,
            active: active.length,
            avgTime: avgTime,
            efficiency: techRepairs.length > 0 ? Math.round((completed.length / techRepairs.length) * 100) : 0
        };
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Üst Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <CheckCircle size={24} />
                        </div>
                        <TrendingUp size={20} className="text-indigo-200" />
                    </div>
                    <div className="text-3xl font-black mb-1">{repairs.filter(r => ['Tamamlandı', 'Teslim Edildi'].includes(r.status)).length}</div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80">Toplam Biten Onarım</div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{repairs.filter(r => r.status?.includes('İşlem')).length}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Aktif Onarımlar</div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900 mb-1">~42 dk</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Ort. Tamir Hızı</div>
                </div>
            </div>

            {/* Teknisyen Detay Tablosu */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <h3 className="text-xl font-black text-gray-900">Teknisyen Verimlilik Raporu</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gerçek Zamanlı Performans Analizi</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">Teknisyen</th>
                                <th className="px-6 py-5">Biten İş</th>
                                <th className="px-6 py-5">Aktif Yük</th>
                                <th className="px-6 py-5">Ort. Hız</th>
                                <th className="px-6 py-5">Skor</th>
                                <th className="px-8 py-5 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {technicians.map(tech => {
                                const stats = calculateStats(tech.name);
                                return (
                                    <tr key={tech.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                                    {tech.avatar || tech.name.substring(0,1)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{tech.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">{tech.specialty}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-black text-gray-700">{stats.completed}</td>
                                        <td className="px-6 py-6 font-black text-orange-500">{stats.active}</td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-300" />
                                                <span className="text-sm font-bold text-gray-600">{stats.avgTime > 0 ? `${stats.avgTime} dk` : '--'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[60px] overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${stats.efficiency > 70 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${stats.efficiency}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-black text-gray-900">%{stats.efficiency}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                tech.status === 'busy' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {tech.status === 'busy' ? 'İŞTE' : 'MÜSAİT'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TechnicianPerformance;
