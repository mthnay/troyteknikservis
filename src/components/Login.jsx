import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { LogIn, Mail, Lock, Store, ChevronRight, ArrowLeft, ShieldCheck, User, Sparkles } from 'lucide-react';
import MyPhoneIcon from './LocalIcons';
import { useAppContext } from '../context/AppContext';

const Login = ({ onTrackingClick }) => {
    const { login, API_URL } = useAppContext();
    const [step, setStep] = useState(1); // 1: Email, 2: Password
    const [email, setEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/users/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            
            if (data.success) {
                setUserName(data.name);
                setStep(2);
            } else {
                setError(data.message || 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
            }
        } catch (err) {
            setError('Sunucu bağlantı hatası oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const success = await login(email, password);
            if (!success) {
                setError('Hatalı şifre. Lütfen tekrar deneyin.');
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
            const response = await fetch(`${API_URL}/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await response.json();
            
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'İşlem Başarılı',
                    text: 'Şifre sıfırlama talimatları gönderilecektir.',
                    confirmButtonText: 'Tamam',
                    confirmButtonColor: '#007aff'
                });
                setShowForgotPassword(false);
            } else {
                Swal.fire({ icon: 'error', title: 'Hata', text: data.message });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Sunucuya bağlanılamadı.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#000] p-4 relative overflow-hidden font-sans select-none">
            {/* --- Premium Background Effects --- */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="relative w-full max-w-[420px] z-20">
                <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[40px] border border-white/20 shadow-2xl relative overflow-hidden group">
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                    
                    {/* Top Branding */}
                    <div className="text-center mb-12 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-blue-500/30 transform transition-transform group-hover:scale-110 duration-500">
                            <Store size={40} strokeWidth={2} />
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">OSS</h1>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.3em] opacity-80">Operating Software Solution</p>
                    </div>

                    {!showForgotPassword ? (
                        <div className="relative">
                            {step === 1 ? (
                                <form onSubmit={handleCheckEmail} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Kullanıcı Hesabı</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                                            <input
                                                type="email"
                                                placeholder="E-posta adresiniz"
                                                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-blue-500 shadow-inner outline-none transition-all text-white font-medium text-lg placeholder:text-gray-600"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-4 px-5 rounded-2xl flex items-center gap-3 animate-shake">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_red]"></div>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span>İLERLE</span>
                                                <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 mb-8">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                            <User size={24} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">HOŞ GELDİNİZ</p>
                                            <h3 className="text-white font-bold truncate">{userName}</h3>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => { setStep(1); setPassword(''); }}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Güvenlik Anahtarı</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-blue-500 shadow-inner outline-none transition-all text-white font-mono text-lg tracking-[0.3em] placeholder:text-gray-600 placeholder:tracking-normal"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                autoFocus
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-4 px-5 rounded-2xl flex items-center gap-3 animate-shake">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_red]"></div>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span>GİRİŞ YAP</span>
                                                <ShieldCheck size={20} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                            
                            <div className="text-center mt-8">
                                <button 
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                                >
                                    Erişim Sorunu mu Yaşıyorsunuz?
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">E-Posta Adresi</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Kayıtlı e-posta adresiniz"
                                        className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-blue-500 outline-none transition-all text-white font-medium"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div> : "KURTARMA BAĞLANTISI GÖNDER"}
                            </button>

                            <button 
                                type="button"
                                onClick={() => setShowForgotPassword(false)}
                                className="w-full text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors text-center"
                            >
                                Geri Dön
                            </button>
                        </form>
                    )}

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <button 
                            onClick={onTrackingClick}
                            className="w-full py-4 bg-white/5 text-gray-300 rounded-2xl font-bold text-[10px] tracking-widest uppercase hover:bg-white/10 hover:text-white transition-all border border-white/5 flex items-center justify-center gap-3"
                        >
                            <Sparkles size={16} className="text-blue-400" /> Cihaz Durumu Sorgula
                        </button>
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em]">OSS Operating Software Solution © 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
