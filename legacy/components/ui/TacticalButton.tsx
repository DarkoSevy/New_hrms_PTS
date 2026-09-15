import React from 'react';

interface TacticalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

/**
 * Standardized Tactical Button that adheres to the Midnight Stealth design language.
 */
export const TacticalButton: React.FC<TacticalButtonProps> = ({ 
    variant = 'secondary', 
    icon, 
    children, 
    className = '', 
    ...props 
}) => {
    
    // Base styles all tactical buttons share
    const baseStyles = "flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Variant-specific styles
    const variants = {
        primary: "executive-gradient text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.2)]",
        secondary: "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20",
        danger: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20",
        ghost: "bg-transparent text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
    };
    
    return (
        <button 
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {icon && <span className="w-4 h-4 flex items-center justify-center -ml-1 text-inherit">{icon}</span>}
            {children}
        </button>
    );
};
