import React, { useState } from 'react';
import { LogoIcon } from './icons';
import { authAPI } from '../services/api';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(username, password);
            const { token, user } = response.data;

            // Store token and user info
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            onLogin();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden font-sans">
            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="glass-card p-10 rounded-[2rem] border border-white/10 shadow-2xl w-full max-w-md relative z-10 backdrop-blur-3xl">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)] mb-6 ring-1 ring-white/20">
                        <LogoIcon className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">PTS <span className="text-cyan-400">HRMS</span></h1>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Executive Access Protocol</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" id="login-form">
                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Tag</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-700 font-medium"
                            placeholder="e.g. j.stark@pts.com"
                            required
                            disabled={loading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" name="password-label" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Cipher</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-700 font-medium"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full executive-gradient text-black font-black py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs flex items-center justify-center gap-3 mt-8"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                Authenticating...
                            </>
                        ) : 'Grant Access'}
                    </button>
                </form>

                <div className="mt-10 text-center border-t border-white/5 pt-8">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">System Credentials</p>
                    <div className="inline-flex flex-col gap-1 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <p className="font-mono text-[9px] text-cyan-400/80">USR: admin@pts.com</p>
                        <p className="font-mono text-[9px] text-cyan-400/80">PWD: password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;