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
    const lowerRole = userRole.toLowerCase();

    // SuperAdmin always has all permissions
    if (lowerRole === 'admin' || lowerRole === 'superadmin') return true;
    
    if (lowerRole === 'teknisyen') userRole = ROLES.TECHNICIAN;

    // First check dynamic roles
    const dynamicRole = dynamicRoles.find(r => r.name.toLowerCase() === lowerRole || r.displayName.toLowerCase() === lowerRole);
    
    // Special case: If it's a built-in role but found in dynamic, merge permissions
    // or just ensure manage_marketing is there for StoreManager
    if (dynamicRole) {
        if (dynamicRole.permissions && dynamicRole.permissions.includes(permission)) return true;
    }

    // Fallback to static mapping
    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[Object.keys(ROLES).find(k => ROLES[k].toLowerCase() === lowerRole)];
    return permissions ? permissions.includes(permission) : false;
};
