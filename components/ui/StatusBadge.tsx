import React from 'react';
import { getStatusColors } from '../../utils/themeUtils';

interface StatusBadgeProps {
    status: string;
    className?: string;
    noBorder?: boolean;
}

/**
 * Renders a standardized Midnight Stealth status badge with the glowing dot indicator.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', noBorder = false }) => {
    const colors = getStatusColors(status);
    
    return (
        <span 
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${!noBorder ? 'border border-white/5' : ''} ${colors.bg} ${colors.text} ${className}`}
        >
            <span 
                className={`w-1.5 h-1.5 rounded-full ${colors.dot} shadow-[0_0_8px_currentColor]`} 
                style={{ opacity: 0.8 }}
            ></span>
            {status}
        </span>
    );
};
