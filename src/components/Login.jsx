import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { LogIn, Mail, Lock, Store } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';

const Login = ({ onTrackingClick }) => {
    const { login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const success = await login(email, password);
            if (!success) {
                setError('E-posta veya şifre hatalı. Lütfen kontrol edin.');
            }
        } catch (err) {
            setError('Sunucu bağlantı hatası oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/users/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await response.json();
            
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'İşlem Başarılı',
                    text: 'Eğer e-posta adresi kayıtlıysa, şifre sıfırlama talimatları gönderilecektir.',
                    confirmButtonText: 'Tamam',
                    confirmButtonColor: '#111827',
                    customClass: {
                        popup: 'rounded-lg',
                        confirmButton: 'rounded-md px-8 py-3'
                    }
                });
                setShowForgotPassword(false);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: data.message,
                    confirmButtonText: 'Tekrar Dene',
                    confirmButtonColor: '#111827',
                    customClass: {
                        popup: 'rounded-lg'
                    }
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Bağlantı Hatası',
                text: 'Sunucuya bağlanılamadı.',
                confirmButtonColor: '#111827'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] p-4 relative overflow-hidden font-sans select-none">
            {/* --- Subtle Dynamic Background --- */}
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-50/50 blur-[100px] animate-blob transition-all duration-1000"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-50/50 blur-[100px] animate-blob animation-delay-2000 transition-all duration-1000"></div>

            {/* --- Compact Container --- */}
            <div className="relative w-full max-w-[380px] z-20">
                <div className="bg-white/50 backdrop-blur-[30px] p-8 md:p-10 rounded-lg border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.02] animate-fade-in-up duration-700">
                    
                    {/* Compact Header */}
                    <div className="text-center mb-8">
                        <div className="relative inline-block mb-6">
                            <div className="relative w-16 h-16 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg flex items-center justify-center text-white shadow-xl ring-1 ring-white/20">
                                <Store size={32} strokeWidth={2} />
                            </div>
                        </div>
                        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-1">OSS</h1>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] opacity-70">Servis Yazılımı</span>
                    </div>

                    {!showForgotPassword ? (
                        <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-500">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-400 ml-4 text-xs uppercase tracking-wide block opacity-80">Personel E-Posta</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 transition-all duration-300" size={20} />
                                    <input
                                        type="email"
                                        placeholder="ad.soyad@oss.com"
                                        className="w-full pl-12 pr-5 py-4 rounded-md bg-white/60 border border-transparent focus:bg-white focus:border-gray-100 shadow-sm outline-none transition-all duration-300 font-bold text-base placeholder:text-gray-200"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-400 ml-4 text-xs uppercase tracking-wide block opacity-80">Güvenlik Anahtarı</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 transition-all duration-300" size={20} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-5 py-4 rounded-md bg-white/60 border border-transparent focus:bg-white focus:border-gray-100 shadow-sm outline-none transition-all duration-300 font-mono text-base tracking-[0.3em] placeholder:text-gray-200 placeholder:tracking-normal"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-center text-[11px] text-red-500 font-semibold bg-red-50/40 backdrop-blur-md py-3.5 rounded-md flex items-center justify-center gap-2 border border-red-100/50 animate-shake">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gray-900 text-white font-semibold py-4.5 rounded-md shadow-lg shadow-gray-100 hover:bg-black hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-400 flex items-center justify-center gap-3 group disabled:opacity-50 mt-2"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="text-[13px] tracking-[0.1em]">SİSTEME GİRİŞ</span>
                                        <LogIn size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-[11px] text-gray-400 hover:text-gray-900 font-semibold transition-all duration-300 text-xs uppercase tracking-wide"
                                >
                                    Şifremi Unuttum?
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-4 animate-in slide-in-from-right-2 duration-500">
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-gray-400 ml-4 text-xs uppercase tracking-wide block opacity-80">Kurtarma E-Postası</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 focus-within:text-gray-900" size={20} />
                                    <input
                                        type="email"
                                        placeholder="eposta adresinizi yazın..."
                                        className="w-full pl-12 pr-5 py-4 rounded-md bg-white/60 border border-transparent focus:bg-white shadow-sm outline-none transition-all font-bold text-base"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 text-white font-semibold py-4.5 rounded-md shadow-lg shadow-indigo-50 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-400 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : <span className="text-[13px] tracking-widest">TALEBİ GÖNDER</span>}
                            </button>

                            <div className="text-center pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="text-[11px] text-gray-400 hover:text-gray-900 font-semibold transition-all duration-300 text-xs uppercase tracking-wide"
                                >
                                    ← GERİ DÖN
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Footer Branding */}
                    <div className="mt-6 pt-6 border-t border-black/[0.03] text-center">
                        <p className="text-[11px] text-gray-300 font-semibold uppercase tracking-[0.1em] mb-4 font-mono">OSS Operating Software Solution - 2026 Tüm Hakları Saklıdır</p>
                        
                        <button 
                            onClick={onTrackingClick}
                            className="w-full py-4 bg-blue-50 text-blue-600 rounded-md font-semibold text-[11px] tracking-widest uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 flex items-center justify-center gap-2"
                        >
                            <MyPhoneIcon size={14} /> Cihaz Durumu Sorgula
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
