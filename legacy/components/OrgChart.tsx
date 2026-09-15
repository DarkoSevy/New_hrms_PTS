import React, { useState } from 'react';
import { SystemRole, Department } from '../types';
import { roleHierarchy, roleToDepartment } from '../utils/roleHelpers';
import { ChevronDownIcon, ChevronRightIcon, UserGroupIcon } from './icons';

interface OrgNode {
    role: SystemRole;
    department: Department;
    children: OrgNode[];
}

const buildOrgTree = (): OrgNode => {
    // Start with Board as root
    const root: OrgNode = {
        role: SystemRole.Board,
        department: Department.Executive,
        children: [],
    };

    // Build tree recursively
    const addChildren = (node: OrgNode) => {
        const children = Object.entries(roleHierarchy)
            .filter(([_, reportsTo]) => reportsTo === node.role)
            .map(([role, _]) => ({
                role: role as SystemRole,
                department: roleToDepartment[role as SystemRole],
                children: [],
            }));

        node.children = children;
        children.forEach(child => addChildren(child));
    };

    addChildren(root);
    return root;
};

const OrgNode: React.FC<{ node: OrgNode; level: number }> = ({ node, level }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

    const hasChildren = node.children.length > 0;
    const indent = level * 24;

    const departmentColors: Record<Department, string> = {
        [Department.Executive]: 'bg-purple-500/10 border-purple-500/50 text-purple-400',
        [Department.Operations]: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
        [Department.AdminFinance]: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
        [Department.Commercial]: 'bg-orange-500/10 border-orange-500/50 text-orange-400',
        [Department.Support]: 'bg-slate-500/10 border-slate-500/50 text-slate-400',
    };

    return (
        <div className="relative">
            {level > 0 && (
                <div 
                    className="absolute border-l border-white/10" 
                    style={{ left: `${indent - 12}px`, top: '-10px', bottom: '20px' }}
                />
            )}
            <div
                className="flex items-center gap-3 py-2 px-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
                style={{ marginLeft: `${indent}px` }}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                {hasChildren ? (
                    <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-cyan-400/50 transition-colors">
                        {isExpanded ? (
                            <ChevronDownIcon className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
                        ) : (
                            <ChevronRightIcon className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
                        )}
                    </div>
                ) : (
                    <div className="w-6 h-6 flex-shrink-0" />
                )}

                <div className={`flex-1 flex items-center gap-4 px-5 py-3 rounded-2xl border-l-4 shadow-xl transition-all hover:scale-[1.01] ${departmentColors[node.department]} backdrop-blur-md`}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                        <UserGroupIcon className="w-5 h-5 opacity-80" />
                    </div>
                    <div className="flex-1">
                        <div className="font-black text-white text-xs uppercase tracking-tight">{node.role}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-0.5">{node.department}</div>
                    </div>
                    {hasChildren && (
                        <span className="text-[10px] font-black bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-white">
                            {node.children.length}
                        </span>
                    )}
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div>
                    {node.children.map((child, idx) => (
                        <OrgNode key={idx} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const OrgChart: React.FC = () => {
    const orgTree = buildOrgTree();
    const [viewMode, setViewMode] = useState<'tree' | 'departments'>('tree');

    const departmentGroups = Object.values(Department).map(dept => ({
        department: dept,
        roles: Object.entries(roleToDepartment)
            .filter(([_, d]) => d === dept)
            .map(([role, _]) => role as SystemRole),
    }));

    const departmentColors: Record<Department, string> = {
        [Department.Executive]: 'border-purple-500 bg-purple-50',
        [Department.Operations]: 'border-blue-500 bg-blue-50',
        [Department.AdminFinance]: 'border-green-500 bg-green-50',
        [Department.Commercial]: 'border-orange-500 bg-orange-50',
        [Department.Support]: 'border-gray-500 bg-gray-50',
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Identity Hierarchy</h2>
                <p className="text-slate-500 text-sm font-medium mt-1 tracking-widest uppercase">Structural Integrity & Reporting Protocols</p>
            </div>

            {/* View Mode Toggle */}
            <div className="glass-card rounded-2xl border border-white/5 p-4 mb-8 shadow-2xl inline-flex">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'tree'
                            ? 'bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        Tree Protocol
                    </button>
                    <button
                        onClick={() => setViewMode('departments')}
                        className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'departments'
                            ? 'bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                            : 'text-slate-500 hover:text-white'
                            }`}
                    >
                        Sector Analysis
                    </button>
                </div>
            </div>

            {/* Hierarchy View */}
            {viewMode === 'tree' && (
                <div className="glass-card rounded-2xl border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="mb-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center gap-3 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                            Recursive Expansion: Click nodes to visualize deep team structures
                        </p>
                    </div>
                    <div className="relative z-10">
                        <OrgNode node={orgTree} level={0} />
                    </div>
                </div>
            )}

            {/* Department View */}
            {viewMode === 'departments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departmentGroups.map(({ department, roles }) => (
                        <div
                            key={department}
                            className={`glass-card rounded-2xl shadow-2xl p-8 border-l-8 transition-all hover:scale-[1.02] ${departmentColors[department]}`}
                        >
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                    <UserGroupIcon className="w-6 h-6 opacity-70" />
                                </div>
                                {department}
                            </h3>
                            <div className="space-y-3">
                                {roles.map(role => (
                                    <div
                                        key={role}
                                        className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-[11px] font-bold text-slate-300 hover:border-white/20 transition-all uppercase tracking-tight"
                                    >
                                        {role}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Active Capacity
                                </p>
                                <span className="text-cyan-400 font-black text-xs">{roles.length} Units</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="mt-12 glass-card rounded-2xl shadow-2xl p-8 border border-white/5">
                <h3 className="font-black text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Sector Classification
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {Object.entries(departmentColors).map(([dept, color]) => (
                        <div key={dept} className="flex items-center gap-3 group cursor-help">
                            <div className={`w-4 h-4 rounded-lg border-2 shadow-[0_0_10px_rgba(255,255,255,0.05)] transition-all group-hover:scale-110 ${color}`}></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-200">{dept}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrgChart;
