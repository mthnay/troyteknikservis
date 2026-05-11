import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Onayla', cancelText = 'Vazgeç', type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-md">
                <div className="p-8 text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${type === 'danger' ? 'bg-red-50 text-red-500 shadow-red-100' : 'bg-blue-50 text-blue-500 shadow-blue-100'
                        }`}>
                        <AlertTriangle size={40} strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
                    <p className="text-gray-500 font-medium leading-relaxed mb-8">
                        {message}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-md font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 py-3.5 rounded-md font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${type === 'danger'
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                    : 'bg-gray-900 hover:bg-black shadow-gray-200'
                                }`}
                        >
                            <Check size={18} strokeWidth={3} />
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
