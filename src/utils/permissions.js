// src/utils/permissions.js

export const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    STORE_MANAGER: 'StoreManager',
    RECEPTION: 'Reception',
    TECHNICIAN: 'Technician',
    ACCOUNTANT: 'Accountant'
};

let dynamicRoles = [];

export const setGlobalRoles = (roles) => {
    dynamicRoles = roles;
};

const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
        'view_all_stores', 
        'manage_settings', 
        'manage_users', 
        'view_dashboard', 
        'manage_stock', 
        'edit_repairs',
        'delete_repairs',
        'view_earnings',
        'view_kbb',
        'view_technicians',
        'manage_marketing'
    ],
    [ROLES.STORE_MANAGER]: [
        'view_dashboard', 
        'manage_stock', 
        'edit_repairs',
        'view_earnings',
        'view_kbb',
        'view_technicians',
        'manage_marketing'
    ],
    [ROLES.ACCOUNTANT]: [
        'view_earnings',
        'manage_stock',
        'view_kbb',
        'view_dashboard'
    ],
    [ROLES.RECEPTION]: [
        'create_repair', 
        'view_repairs'
    ],
    [ROLES.TECHNICIAN]: [
        'edit_repairs', 
        'view_own_repairs',
        'view_repairs'
    ]
};

export const hasPermission = (user, permission) => {
    if (!user || !user.role) return false;
    
    // Map older 'Admin' and 'Teknisyen' roles for backward compatibility
    let userRole = user.role;
    if (userRole.toLowerCase() === 'admin') userRole = ROLES.SUPER_ADMIN;
    if (userRole.toLowerCase() === 'teknisyen') userRole = ROLES.TECHNICIAN;

    // First check dynamic roles
    const dynamicRole = dynamicRoles.find(r => r.name.toLowerCase() === userRole.toLowerCase() || r.displayName.toLowerCase() === userRole.toLowerCase());
    if (dynamicRole) {
        // If it's a dynamic role, check its permissions array
        return dynamicRole.permissions && dynamicRole.permissions.includes(permission);
    }

    // Fallback to static mapping if dynamic role not found
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions ? permissions.includes(permission) : false;
};
