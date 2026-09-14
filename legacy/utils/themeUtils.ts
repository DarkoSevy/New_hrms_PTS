import { EmployeeStatus, LeaveStatus, VehicleStatus, VacancyStatus, CandidateStage } from '../types';

export interface StatusColors {
    text: string;
    bg: string;
    dot: string;
}

/**
 * Global mapping logic for standardizing status colors across the application.
 * Normalizes "Success", "Warning", "Danger", and "Info" hues.
 */
export const getStatusColors = (status: string): StatusColors => {
    // Determine the base semantic category based on the status string
    const s = status.toLowerCase();
    
    // Success / Active Categories (Emeralds)
    if (
        s === 'active' || 
        s === 'approved' || 
        s === 'available' || 
        s === 'hired'
    ) {
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' };
    }
    
    // Warning / Yield Categories (Ambers/Yellows/Oranges)
    if (
        s === 'on leave' || 
        s === 'onleave' ||
        s === 'pending' || 
        s === 'maintenance' || 
        s === 'on hold' ||
        s === 'onhold' ||
        s === 'sourced'
    ) {
        // Warning variations - amber or orange depending on exact context, leaning into Amber to match the original style
        if (s === 'maintenance' || s === 'pending') {
            return { text: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' };
        }
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' };
    }
    
    // Danger / Critical / Terminated Categories (Roses/Reds)
    if (
        s === 'terminated' || 
        s === 'rejected' || 
        s === 'out of service' || 
        s === 'outofservice'
    ) {
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', dot: 'bg-rose-400' };
    }

    // Info / Neutral / In Process Categories (Blues/Cyans)
    if (
        s === 'in use' || 
        s === 'inuse' ||
        s === 'open' || 
        s === 'screening' || 
        s === 'interview' || 
        s === 'offer'
    ) {
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-400' };
    }
    
    // Closed or Inactive (Grays)
    if (s === 'closed' || s === 'inactive') {
        return { text: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-400' };
    }

    // Fallback default
    return { text: 'text-slate-400', bg: 'bg-white/5', dot: 'bg-slate-400' };
};
