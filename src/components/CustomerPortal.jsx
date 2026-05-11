import React, { useState, useEffect } from 'react';
import { Apple, CheckCircle, Clock, XCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { appConfirm } from '../utils/alert';
import { getSafeRepairImageUrl } from '../utils/productImages';

const CustomerPortal = ({ trackId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [repair, setRepair] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/public/repairs/${trackId}`);
                if (!res.ok) {
                    throw new Error('Kayıt bulunamadı. Lütfen takip numaranızı kontrol edin.');
                }
                const data = await res.json();
                setRepair(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [trackId]);

    const handleQuote = async (action) => {
        if (!(await appConfirm(`Teklifi ${action === 'accept' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz? Bu işlem geri alınamaz.`))) return;
        
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/public/repairs/${trackId}/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (res.ok) {
                setRepair(prev => ({ 
                    ...prev, 
                    status: data.status,
                    history: [...prev.history, { status: data.status, date: new Date().toLocaleString('tr-TR'), note: action === 'accept' ? 'Online Onay' : 'Online İptal' }]
                }));
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('İşlem başarısız oldu. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Apple size={48} className="text-gray-400 mb-4" />
                    <p className="text-gray-500 font-medium">Cihaz durumu sorgulanıyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg text-center">
                    <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Bulunamadı</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    const { status, device, issue, history, quoteAmount, diagnosisNotes } = repair;
    const isPendingApproval = status === 'Müşteri Onayı Bekliyor';

    // Status styling mapping
    const getStatusStyle = (s) => {
        if(s.includes('Beklemede')) return "bg-yellow-100 text-yellow-800 border-yellow-200";
        if(s.includes('İşlemde')) return "bg-blue-100 text-blue-800 border-blue-200";
        if(s.includes('Onayı')) return "bg-orange-100 text-orange-800 border-orange-200";
        if(s.includes('Hazır')) return "bg-green-100 text-green-800 border-green-200";
        if(s.includes('Teslim')) return "bg-gray-100 text-gray-800 border-gray-200";
        return "bg-purple-100 text-purple-800 border-purple-200";
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans pb-12">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Apple size={24} className="text-black" />
                        <span className="font-semibold text-lg tracking-tight">Onarım Takip Merkezi</span>
                    </div>
                    <span className="text-xs font-medium bg-gray-100 px-3 py-1.5 rounded-full text-gray-600 tracking-wide">
                        {trackId}
                    </span>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
                
                {/* Device Info Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100">
                            <img 
                                src={getSafeRepairImageUrl(repair.image, repair.productGroup, repair.device, API_URL)} 
                                className="w-full h-full object-cover" 
                                alt={repair.device} 
                            />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{device}</h1>
                            <p className="text-gray-500 mb-4">{issue || repair.issueDescription || "Belirtilmedi"}</p>
                            <div className="inline-flex items-center gap-2">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getStatusStyle(status)}`}>
                                    {status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quote Action Card (If pending) */}
                {isPendingApproval && (
                    <div className="bg-white rounded-[2rem] p-8 shadow-lg border-2 border-orange-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 opacity-50"></div>
                        
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="text-orange-500" size={24} />
                            <h2 className="text-xl font-bold text-gray-900">Teklif Onayınız Bekleniyor</h2>
                        </div>
                        
                        <div className="bg-gray-50 rounded-md p-4 mb-6 text-sm text-gray-700 leading-relaxed border border-gray-100">
                            <p className="mb-3 font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center justify-between">
                                <span>Teknisyen Notu:</span>
                                {repair.quotationDetails?.date && <span className="text-xs text-gray-400 font-normal">{repair.quotationDetails.date}</span>}
                            </p>
                            <p className="mb-4">{diagnosisNotes || "Cihazınızın incelemesi tamamlanmış olup onarım için fiyat çıkartılmıştır."}</p>
                            
                            {repair.quotationDetails?.items && repair.quotationDetails.items.length > 0 && (
                                <div className="mt-4 border-t border-gray-200 pt-4">
                                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-widest">Teklif Detayı</h4>
                                    <div className="space-y-2">
                                        {repair.quotationDetails.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                                <span className="font-medium text-gray-800">{item.name}</span>
                                                <span className="font-mono text-gray-600 font-bold">{Number(item.price).toLocaleString('tr-TR')} ₺</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">Onarım Tutarı</p>
                                <p className="text-4xl font-bold text-gray-900">
                                    {Number(quoteAmount).toLocaleString('tr-TR')} <span className="text-2xl text-gray-500">TL</span>
                                </p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => handleQuote('reject')}
                                    disabled={actionLoading}
                                    className="flex-1 sm:flex-none px-6 py-3 rounded-full font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Reddet
                                </button>
                                <button 
                                    onClick={() => handleQuote('accept')}
                                    disabled={actionLoading}
                                    className="flex-1 sm:flex-none px-8 py-3 rounded-full font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                                >
                                    Onayla
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-8">İşlem Geçmişi</h2>
                    
                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        
                        {history && history.map((item, index) => {
                            const isLast = index === history.length - 1;
                            const isFirst = index === 0;
                            
                            return (
                                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        {isLast ? <CheckCircle size={18} /> : <Clock size={18} />}
                                    </div>
                                    
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-md bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-bold text-gray-900 text-sm">{item.status}</h3>
                                            <span className="text-xs font-medium text-gray-500">{item.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {item.note}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        
                    </div>
                </div>

                <div className="text-center mt-8 text-sm text-gray-400 pb-8">
                    Troy Apple Yetkili Servis Sağlayıcısı
                </div>
            </div>
        </div>
    );
};

export default CustomerPortal;
