import React, { createContext, useContext, useState, useEffect } from 'react';
import Toast from '../components/Toast';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

    // --- State Definitions ---
    const [servicePoints, setServicePoints] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = localStorage.getItem('currentUser');
            if (saved && saved !== 'undefined' && saved !== 'null') {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Local storage parse error:", e);
            localStorage.removeItem('currentUser');
        }
        return null;
    });

    const [emailSettings, setEmailSettings] = useState({
        host: 'smail05.doruk.net.tr',
        port: '465',
        incomingHost: 'smail05.doruk.net.tr',
        incomingPort: '993',
        user: 'servis.mavibahce@troyapr.com',
        pass: '1A@Uv*5k8TOd'
    });

    const [companyProfile, setCompanyProfile] = useState({
        name: "TROY",
        title: "ARTIBİLGİ TEKNOLOJİ BİLİŞİM VE DIŞ TİC. A.Ş.",
        address: "Bağdat Caddesi No:123, 34728 Kadıköy / İstanbul",
        phone: "0216 123 45 67",
        mersis: "0085034123400018",
        dealerCode: "TR-APR-0042"
    });

    const [selectedStoreId, setSelectedStoreId] = useState(0);
    const [repairs, setRepairs] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [earnings, setEarnings] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // SLA Helper
    const checkSLA = (repair) => {
        if (!repair.date || repair.status === 'Teslim Edildi' || repair.status === 'Cihaz Hazır' || repair.status === 'Tamamlandı') return null;
        const parseDateString = (dateStr) => {
            try {
                const [datePart, timePart] = dateStr.split(' ');
                const [day, month, year] = datePart.split('.');
                const isoDate = `${year}-${month}-${day}T${timePart || '00:00:00'}`;
                return new Date(isoDate);
            } catch (e) { return new Date(); }
        };
        const startDate = parseDateString(repair.date);
        const now = new Date();
        const diffHours = (now - startDate) / (1000 * 60 * 60);
        if (repair.status === 'Beklemede') {
            if (diffHours > 48) return { type: 'critical', message: '48 Saati Geçti (Kritik Gecikme)', hours: diffHours };
            if (diffHours > 24) return { type: 'warning', message: '24 Saati Geçti (Gecikme Başladı)', hours: diffHours };
        }
        if (repair.status === 'Müşteri Onayı Bekliyor' && diffHours > 72) {
            return { type: 'info', message: 'Müşteri 3 Gündür Karar Vermedi', hours: diffHours };
        }
        return null;
    };

    const computeAlerts = (repairsList) => {
        const newAlerts = [];
        repairsList.forEach(r => {
            const sla = checkSLA(r);
            if (sla) {
                newAlerts.push({ id: r.id, repair: r, ...sla });
            }
        });
        setAlerts(newAlerts);
    };

    useEffect(() => {
        if (repairs.length > 0) computeAlerts(repairs);
    }, [repairs]);

    const uploadMedia = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                return await res.json(); // Returns { url, id }
            }
            return null;
        } catch (error) {
            console.error("Upload Error:", error);
            return null;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, servicePointsRes] = await Promise.all([
                    fetch(`${API_URL}/users`),
                    fetch(`${API_URL}/service-points`)
                ]);
                if (usersRes.ok) {
                    const fetchedUsers = await usersRes.json();
                    setUsers(fetchedUsers);
                    if (currentUser) {
                        const updatedSelf = fetchedUsers.find(u => u.id === currentUser.id || u._id === currentUser._id);
                        if (updatedSelf) setCurrentUser(updatedSelf);
                    }
                }
                if (servicePointsRes.ok) setServicePoints(await servicePointsRes.json());
                if (!currentUser) return;
                let queryParams = '';
                const role = currentUser.role?.toLowerCase();
                if (role !== 'admin' && currentUser.storeId) {
                    queryParams = `?storeId=${currentUser.storeId}`;
                }
                const [repairsRes, inventoryRes, techniciansRes, settingsRes, customersRes, companyRes, earningsRes] = await Promise.all([
                    fetch(`${API_URL}/repairs${queryParams}`),
                    fetch(`${API_URL}/inventory${queryParams}`),
                    fetch(`${API_URL}/technicians${queryParams}`),
                    fetch(`${API_URL}/settings/emailSettings`),
                    fetch(`${API_URL}/customers${queryParams}`),
                    fetch(`${API_URL}/settings/companyProfile`),
                    fetch(`${API_URL}/earnings${queryParams}`)
                ]);
                if (repairsRes.ok) setRepairs(await repairsRes.json());
                if (inventoryRes.ok) setInventory(await inventoryRes.json());
                if (techniciansRes.ok) setTechnicians(await techniciansRes.json());
                if (earningsRes.ok) setEarnings(await earningsRes.json());
                if (settingsRes.ok) {
                    const settings = await settingsRes.json();
                    if (settings) setEmailSettings(settings);
                }
                if (companyRes.ok) {
                    const profile = await companyRes.json();
                    if (profile) setCompanyProfile(profile);
                }
                if (customersRes.ok) setCustomers(await customersRes.json());
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
        else localStorage.removeItem('currentUser');
    }, [currentUser]);

    const saveSettings = async (key, value) => {
        try {
            await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
        } catch (error) { console.error("Error saving settings:", error); }
    };

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (res.ok) {
                const user = await res.json();
                setCurrentUser(user);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login Error:", error);
            return false;
        }
    };

    const logout = () => setCurrentUser(null);

    const addUser = async (user) => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...user, id: user.id || `u${Date.now()}` })
            });
            if (res.ok) {
                const saved = await res.json();
                setUsers(prev => [...prev, saved]);
                return true;
            }
        } catch (error) { console.error("Error adding user:", error); return false; }
    };

    const updateUser = async (id, updates) => {
        try {
            console.log(`[AppContext] Updating user ${id}...`, updates);
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const updated = await res.json();
                console.log("[AppContext] Update success:", updated);
                
                setUsers(prev => prev.map(u => {
                    const uId = String(u._id || u.id);
                    const updatedId = String(updated._id || updated.id);
                    return uId === updatedId ? { ...u, ...updated } : u;
                }));

                const currentId = String(currentUser?._id || currentUser?.id);
                const updatedId = String(updated._id || updated.id);
                if (currentId === updatedId) {
                    setCurrentUser(prev => ({ ...prev, ...updated }));
                    localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, ...updated }));
                }
                return true;
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("[AppContext] Update failed on server:", res.status, errorData);
                throw new Error(errorData.message || `Sunucu hatası: ${res.status}`);
            }
        } catch (error) { 
            console.error("[AppContext] Network error updating user:", error); 
            return false; 
        }
    };

    const removeUser = async (id) => {
        try {
            const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id && u._id !== id));
                return true;
            }
            return false;
        } catch (error) { console.error("Error removing user:", error); return false; }
    };

    const addRepair = async (repair) => {
        const newRepairInitial = {
            ...repair,
            id: repair.id || `TR-${Math.floor(Math.random() * 10000)}`,
            date: new Date().toLocaleString('tr-TR'),
            status: 'Beklemede',
            history: [{ status: 'Kayıt Oluşturuldu', date: new Date().toLocaleString(), note: 'Cihaz servise kabul edildi.' }],
            storeId: parseInt(currentUser?.storeId) || 0
        };
        try {
            const res = await fetch(`${API_URL}/repairs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRepairInitial)
            });
            if (res.ok) {
                const saved = await res.json();
                setRepairs(prev => [saved, ...prev]);
                return saved;
            }
        } catch (error) { console.error("Error adding repair:", error); return null; }
    };

    const removeRepair = async (id) => {
        try {
            const res = await fetch(`${API_URL}/repairs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRepairs(prev => prev.filter(r => r.id !== id && r._id !== id));
                return true;
            }
            return false;
        } catch (error) { console.error("Error removing repair:", error); return false; }
    };

    const updateRepair = async (id, updates) => {
        const repair = repairs.find(r => r.id === id || r._id === id);
        if (!repair) return false;
        let newHistory = repair.history || [];
        const extraUpdates = {};

        if (updates.status && updates.status !== repair.status) {
            newHistory = [...newHistory, { status: updates.status, date: new Date().toLocaleString(), note: updates.historyNote || 'Durum güncellendi.' }];
            
            // Performans Takibi için Tarihsel Damgalar
            if (updates.status === 'İşlemde' && !repair.startedAt) {
                extraUpdates.startedAt = new Date();
            }
            if (['Tamamlandı', 'Cihaz Hazır', 'Teslim Edildi'].includes(updates.status) && !repair.completedAt) {
                extraUpdates.completedAt = new Date();
            }
        }

        try {
            const res = await fetch(`${API_URL}/repairs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updates, ...extraUpdates, history: newHistory })
            });
            if (res.ok) {
                const updated = await res.json();
                setRepairs(prev => prev.map(r => (r._id === updated._id || r.id === id) ? updated : r));
                return true;
            }
        } catch (error) { console.error("Error updating repair:", error); return false; }
    };

    const updateRepairStatus = async (id, status, note = '') => {
        return updateRepair(id, { status, historyNote: note });
    };

    const addTechnician = async (tech) => {
        try {
            const res = await fetch(`${API_URL}/technicians`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...tech, id: tech.id || `t${Date.now()}` })
            });
            if (res.ok) {
                const saved = await res.json();
                setTechnicians(prev => [...prev, saved]);
                return true;
            }
        } catch (error) { console.error("Error adding tech:", error); return false; }
    };

    const updateTechnician = async (id, updates) => {
        try {
            const res = await fetch(`${API_URL}/technicians/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updated = await res.json();
                setTechnicians(prev => prev.map(t => (t._id === updated._id || t.id === id) ? updated : t));
                return updated;
            }
        } catch (error) { console.error("Error updating technician:", error); return null; }
    };

    const removeTechnician = async (id) => {
        try {
            const res = await fetch(`${API_URL}/technicians/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTechnicians(prev => prev.filter(t => t.id !== id && t._id !== id));
                return true;
            }
            return false;
        } catch (error) { console.error("Error removing technician:", error); return false; }
    };

    const assignTechnician = async (repairId, techId) => {
        const updatedTech = await updateTechnician(techId, { status: 'busy', currentJob: repairId });
        if (updatedTech) await updateRepairStatus(repairId, 'İşlemde', `${techId} atandı.`);
    };

    const completeJob = async (techId) => {
        await updateTechnician(techId, { status: 'available', currentJob: null });
    };

    const updateServicePoint = async (id, updates) => {
        try {
            const res = await fetch(`${API_URL}/service-points/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updated = await res.json();
                setServicePoints(prev => prev.map(p => (p._id === updated._id || p.id === id) ? updated : p));
                return true;
            }
        } catch (error) { console.error("Error updating service point:", error); return false; }
    };

    const removeServicePoint = async (id) => {
        try {
            const res = await fetch(`${API_URL}/service-points/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setServicePoints(prev => prev.filter(p => p.id !== id && p._id !== id));
                return true;
            }
        } catch (error) { console.error("Error removing service point:", error); return false; }
    };

    const addServicePoint = async (point) => {
        try {
            const res = await fetch(`${API_URL}/service-points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...point, id: point.id || Date.now() })
            });
            if (res.ok) {
                const saved = await res.json();
                setServicePoints(prev => [...prev, saved]);
                return { success: true };
            }
            const errData = await res.json();
            return { success: false, message: errData.message || 'Sunucu hatası' };
        } catch (error) {
            console.error("Error adding service point:", error);
            return { success: false, message: error.message };
        }
    };

    const updateCustomer = async (id, updates) => {
        try {
            const res = await fetch(`${API_URL}/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updated = await res.json();
                setCustomers(prev => prev.map(c => (c._id === updated._id || c.id === id) ? updated : c));
                return true;
            }
        } catch (error) { console.error("Error updating customer:", error); return false; }
    };

    const removeCustomer = async (id) => {
        try {
            const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCustomers(prev => prev.filter(c => c.id !== id && c._id !== id));
                return true;
            }
            return false;
        } catch (error) { console.error("Error removing customer:", error); return false; }
    };

    const addInventoryItem = async (item) => {
        try {
            const res = await fetch(`${API_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, storeId: item.storeId || currentUser?.storeId || 0 })
            });
            if (res.ok) {
                const saved = await res.json();
                setInventory(prev => [...prev, saved]);
                return true;
            }
        } catch (error) { console.error("Error adding item:", error); return false; }
    };

    const updateInventoryItem = async (id, updates) => {
        try {
            const res = await fetch(`${API_URL}/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updated = await res.json();
                setInventory(prev => prev.map(i => (i._id === updated._id || i.id === id) ? updated : i));
                return true;
            }
        } catch (error) { console.error("Error updating item:", error); return false; }
    };

    const removeInventoryItem = async (id) => {
        try {
            const res = await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setInventory(prev => prev.filter(i => i.id !== id && i._id !== id));
                return true;
            }
            return false;
        } catch (error) { console.error("Error removing item:", error); return false; }
    };

    const usePart = async (partId, quantity = 1) => {
        try {
            const res = await fetch(`${API_URL}/inventory/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partId, quantity })
            });
            if (res.ok) {
                const updated = await res.json();
                setInventory(prev => prev.map(i => (i._id === updated._id || i.id === partId) ? updated : i));
                return true;
            }
        } catch (error) { console.error("Error using part:", error); return false; }
    };

    const addEarning = async (earning) => {
        try {
            const res = await fetch(`${API_URL}/earnings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(earning)
            });
            if (res.ok) {
                const saved = await res.json();
                setEarnings(prev => [...prev, saved]);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error adding earning:", error);
            return false;
        }
    };

    const getStoreRepairs = () => {
        if (!currentUser) return [];
        if (currentUser.role?.toLowerCase() === 'admin') {
            if (String(selectedStoreId) === '0') return repairs;
            return repairs.filter(r => String(r.storeId) === String(selectedStoreId));
        }
        return repairs.filter(r => String(r.storeId) === String(currentUser.storeId));
    };

    const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });
    const sendWhatsApp = (phone, message) => {
        if (!phone) return;
        // Sadece rakamları al
        const cleanPhone = phone.replace(/\D/g, '');
        // Başına ülke kodu ekle (yoksa Türkiye 90)
        const finalPhone = cleanPhone.startsWith('90') ? cleanPhone : (cleanPhone.startsWith('0') ? '90' + cleanPhone.substring(1) : '90' + cleanPhone);
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${finalPhone}?text=${encodedMsg}`, '_blank');
    };

    const showToast = (message, type = 'info') => setToast({ message, type, isVisible: true });
    const hideToast = () => setToast(prev => ({ ...prev, isVisible: false }));

    return (
        <AppContext.Provider value={{
            repairs: getStoreRepairs(),
            allRepairs: repairs,
            users,
            currentUser,
            servicePoints,
            inventory: inventory.filter(i => currentUser?.role === 'admin' ? (selectedStoreId === 0 || String(i.storeId) === String(selectedStoreId)) : String(i.storeId) === String(currentUser?.storeId)),
            allInventory: inventory,
            technicians: (() => {
                const baseTechnicians = technicians.filter(t => currentUser?.role === 'admin' ? (selectedStoreId === 0 || String(t.storeId) === String(selectedStoreId)) : String(t.storeId) === String(currentUser?.storeId));
                
                // Kullanıcılar arasından teknisyen rolündekileri bul
                const technicianUsers = users
                    .filter(u => u.role?.toLowerCase() === 'technician' && (currentUser?.role === 'admin' ? (selectedStoreId === 0 || String(u.storeId) === String(selectedStoreId)) : String(u.storeId) === String(currentUser?.storeId)))
                    .map(u => ({
                        ...u,
                        name: u.name,
                        id: u.id || u._id,
                        specialty: u.specialty || 'Genel Teknisyen',
                        status: 'Müsait',
                        isUserAcc: true // Kullanıcı hesabından geldiğini belirtmek için
                    }));

                // Çakışanları temizle (Hem teknisyen hem kullanıcı olarak eklenmişse kullanıcıyı baz al veya tekilleştir)
                const combined = [...baseTechnicians];
                technicianUsers.forEach(uTech => {
                    const exists = combined.some(ct => (ct.name?.toLowerCase() === uTech.name?.toLowerCase()) || (ct.email?.toLowerCase() === uTech.email?.toLowerCase()));
                    if (!exists) combined.push(uTech);
                });

                return combined;
            })(),
            allTechnicians: technicians,
            customers: customers.filter(c => currentUser?.role === 'admin' ? (selectedStoreId === 0 || String(c.storeId) === String(selectedStoreId)) : String(c.storeId) === String(currentUser?.storeId)),
            allCustomers: customers,
            earnings: earnings.filter(e => currentUser?.role === 'admin' ? (selectedStoreId === 0 || String(e.storeId) === String(selectedStoreId)) : String(e.storeId) === String(currentUser?.storeId)),
            allEarnings: earnings,
            login, logout, addUser, updateUser, removeUser, addRepair, removeRepair, updateRepair, updateRepairStatus,
            addTechnician, updateTechnician, removeTechnician, assignTechnician, completeJob, addServicePoint, updateServicePoint, removeServicePoint,
            updateCustomer, removeCustomer, addInventoryItem, updateInventoryItem, removeInventoryItem, usePart, addEarning,
            emailSettings, setEmailSettings: (s) => { setEmailSettings(s); saveSettings('emailSettings', s); },
            companyProfile, setCompanyProfile: (p) => { setCompanyProfile(p); saveSettings('companyProfile', p); },
            selectedStoreId, setSelectedStoreId, showToast, alerts, checkSLA, API_URL, sendWhatsApp, uploadMedia
        }}>
            {children}
            {toast.isVisible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </AppContext.Provider>
    );
};
