
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    id: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
    onClick: (id: string) => void;
    isPreparation?: boolean;
    price?: string;
    badgeText?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ 
    id, label, icon: Icon, active, onClick, isPreparation, price, badgeText 
}) => {
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                active 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} />
                <div className="text-left">
                    <p className={`text-sm font-bold uppercase tracking-tight ${active ? 'text-white' : ''}`}>
                        {label}
                    </p>
                    {price && !active && (
                        <p className="text-[10px] font-black text-emerald-500 tracking-widest">{price}</p>
                    )}
                </div>
            </div>
            {badgeText ? (
                <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase shrink-0">{badgeText}</span>
            ) : isPreparation ? (
                <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase shrink-0">Em Breve</span>
            ) : null}
        </button>
    );
};
