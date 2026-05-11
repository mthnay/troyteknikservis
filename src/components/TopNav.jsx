import React, { useState } from 'react';
import { Home, Wrench, Users, BarChart2, Settings, Truck, Clock, Package, LogOut, CheckCircle, Archive as ArchiveIcon, MessageCircle, Megaphone, Search, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { hasPermission } from '../utils/permissions';
import MyPhoneIcon from './LocalIcons';
import NotificationCenter from './NotificationCenter';

const TopNav = ({ activeTab, setActiveTab }) => {
    const { logout, currentUser, selectedStoreId, setSelectedStoreId, servicePoints, alerts, searchQuery, setSearchQuery, repairs } = useAppContext();

    const CATEGORIES = [
        {
            id: 'dashboard',
            label: 'Ana Sayfa',
            items: [
                { id: 'dashboard', icon: Home, label: 'Genel Bakış' }
            ]
        },
        {
            id: 'servis',
            label: 'Servis',
            items: [
                { id: 'service', icon: MyPhoneIcon, label: 'Servis Kabul' },
                { id: 'pending-repairs', icon: Clock, label: 'İşlem Bekleyenler' },
                { id: 'approval-pending', icon: MessageCircle, label: 'Onay Bekleyenler' }
            ]
        },
        {
            id: 'merkez',
            label: 'Operasyon',
            items: [
                { id: 'in-store', icon: Wrench, label: 'Mağaza İçi Onarım' },
                { id: 'apple-center', icon: Truck, label: 'Apple Merkezi' },
                { id: 'ready-pickup', icon: CheckCircle, label: 'Teslimat Havuzu' },
                { id: 'archive', icon: ArchiveIcon, label: 'Arşiv' }
            ]
        },
        {
            id: 'musteri',
            label: 'Müşteri',
            items: [
                { id: 'customers', icon: Users, label: 'Müşteri Yönetimi' },
                { id: 'marketing', icon: Megaphone, label: 'Otomasyon & Pazarlama' }
            ]
        },
        {
            id: 'stok_rapor',
            label: 'Stok & Rapor',
            items: [
                { id: 'stock', icon: Package, label: 'Yedek Parça & Stok' },
                { id: 'reports', icon: BarChart2, label: 'Raporlar' }
            ]
        },
        {
            id: 'yonetim',
            label: 'Yönetim',
            items: [
                { id: 'technicians', icon: Users, label: 'Teknisyenler' },
                { id: 'store-operations', icon: Home, label: 'Operasyon Şeması' },
                ...(hasPermission(currentUser, 'manage_settings') ? [{ id: 'settings', icon: Settings, label: 'Sistem Ayarları' }] : [])
            ]
        }
    ];

    const currentStore = Number(selectedStoreId) === 0 && hasPermission(currentUser, 'view_all_stores')
        ? 'Tüm Mağazalar'
        : (servicePoints.find(p => Number(p.id) === Number(selectedStoreId || currentUser?.storeId))?.name || 'Mağaza Seçilmedi');

    return (
        <div className="w-full fixed top-0 left-0 z-50">
            {/* Unified Top Navigation Bar */}
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                
                {/* Left: Logo & Navigation Combined */}
                <div className="flex items-center gap-8">
                    {/* OSS Logo */}
                    <div className="flex items-center">
                        <span className="text-xl font-black tracking-tighter text-[#1d1d1f]">OSS</span>
                    </div>

                    {/* Categorized Navigation */}
                    <div className="flex items-center gap-1">
                        {CATEGORIES.map(category => {
                            const isCategoryActive = category.items.some(item => item.id === activeTab);
                            
                            return (
                                <div key={category.id} className="relative group">
                                    <button 
                                        onClick={() => category.id === 'dashboard' ? setActiveTab('dashboard') : null}
                                        className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5
                                            ${isCategoryActive ? 'text-apple-blue bg-apple-blue/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'}
                                        `}>
                                        {category.label}
                                        {category.items.length > 1 && category.id !== 'dashboard' && <ChevronDown size={12} className="opacity-50 group-hover:rotate-180 transition-transform" />}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {category.items.length > 1 && (
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                                            <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-xl rounded-xl p-1.5 w-56 flex flex-col gap-0.5">
                                                {category.items.map(item => {
                                                    const isActive = activeTab === item.id;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => setActiveTab(item.id)}
                                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors
                                                                ${isActive ? 'bg-[#f5f5f7] text-apple-blue' : 'text-gray-600 hover:bg-[#f5f5f7] hover:text-gray-900'}
                                                            `}
                                                        >
                                                            <item.icon size={16} className={isActive ? 'text-apple-blue' : 'text-gray-400'} />
                                                            {item.label}
                                                            {item.id === 'pending-repairs' && alerts.length > 0 && (
                                                                <span className="ml-auto w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full bg-apple-red text-white">
                                                                    {alerts.length}
                                                                </span>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right: Search & User Info */}
                <div className="flex items-center gap-6">
                    <div className="relative w-56 hidden lg:block">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Kayıt veya müşteri ara..." 
                            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-apple-blue focus:ring-1 focus:ring-apple-blue transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchQuery.trim()) {
                                    const foundRepair = repairs.find(r => 
                                        r.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        r.serial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        r.customer?.toLowerCase().includes(searchQuery.toLowerCase())
                                    );
                                    if (foundRepair) {
                                        // Determine which tab to show based on repair status
                                        let target = 'pending-repairs';
                                        if (foundRepair.status === 'Müşteri Onayı Bekliyor') target = 'approval-pending';
                                        else if (['İşlemde', 'Parça Bekleniyor'].includes(foundRepair.status)) target = 'in-store';
                                        else if (foundRepair.status === "Apple'a Gönderildi") target = 'apple-center';
                                        else if (['Cihaz Hazır', 'İade Hazır'].includes(foundRepair.status)) target = 'ready-pickup';
                                        
                                        setActiveTab(target);
                                    } else {
                                        setActiveTab('pending-repairs');
                                    }
                                }
                            }}
                        />
                    </div>
                    
                    <div className="h-6 w-px bg-gray-200 hidden lg:block"></div>
                    
                    <NotificationCenter />

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-gray-900 leading-none">{currentUser?.name || 'Kullanıcı'}</div>
                            <div className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-widest">{currentUser?.role}</div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200"
                            title="Çıkış Yap"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default TopNav;
