import React, { useState } from 'react';
import { Search, ChevronRight, Apple, ArrowLeft, ShieldCheck } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';

const TrackingInput = ({ onSelectTrack }) => {
    const [trackId, setTrackId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (trackId.trim()) {
            onSelectTrack(trackId.trim());
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] p-4 relative overflow-hidden select-none">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-50/40 blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-50/40 blur-[100px] animate-pulse delay-700"></div>

            <div className="relative w-full max-w-[420px] z-20">
                <div className="bg-white/60 backdrop-blur-[32px] p-8 md:p-12 rounded-[48px] border border-white/60 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)]">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-[28px] text-white shadow-2xl mb-8 group hover:scale-110 transition-transform duration-500">
                            <MyPhoneIcon size={40} strokeWidth={1.5} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3 italic">TROY SERVICE</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest opacity-80">Onarım Takip Merkezi</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-gray-400 ml-5 uppercase tracking-[0.2em] block">Takip Numarası</label>
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 transition-all duration-300" size={24} />
                                <input
                                    type="text"
                                    placeholder="Örn: R-1024"
                                    className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-white border border-transparent focus:border-gray-100 shadow-sm outline-none transition-all duration-300 font-extrabold text-xl placeholder:text-gray-200 placeholder:font-bold tracking-tight"
                                    value={trackId}
                                    onChange={(e) => setTrackId(e.target.value.toUpperCase())}
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white font-black py-5 rounded-[24px] shadow-xl shadow-gray-200 hover:bg-black hover:-translate-y-1 active:scale-[0.98] transition-all duration-400 flex items-center justify-center gap-3 group"
                        >
                            <span className="text-sm tracking-[0.15em] ml-2">DURUMU SORGULA</span>
                            <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-black/[0.04]">
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                <ShieldCheck size={16} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-widest">SSL GÜVENLİ SORGULAMA</span>
                            </div>
                            
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Personel Girişine Dön
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[11px] text-gray-300 font-black uppercase tracking-[0.3em] font-mono">TROY APPLE ASP SOLUTIONS</p>
                </div>
            </div>
        </div>
    );
};

export default TrackingInput;
