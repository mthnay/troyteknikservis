import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose, message]);

    const bgColors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-orange-50 border-orange-200 text-orange-800'
    };

    const icons = {
        success: <CheckCircle className="text-green-500" size={24} />,
        error: <XCircle className="text-red-500" size={24} />,
        info: <Info className="text-blue-500" size={24} />,
        warning: <AlertCircle className="text-orange-500" size={24} />
    };

    return (
        <div className={`fixed top-6 right-6 z-[200] flex items-start gap-4 p-4 rounded-2xl border shadow-xl animate-in slide-in-from-right-8 fade-in duration-300 max-w-sm w-full ${bgColors[type]}`}>
            <div className="shrink-0 mt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm leading-snug">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default Toast;
