import { useState, useEffect } from 'react';
// Force refresh

import { Shield, LayoutDashboard, Database, Activity, Settings, LogOut, Bell, Search, AlertTriangle, CheckCircle, Lock, Zap, BarChart3, Edit2, Save, X } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('analysis');
    const [stats, setStats] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    // Sidebar Items
    const sidebarItems = [
        { id: 'analysis', icon: Search, label: 'URL Analysis' },
        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
        { id: 'threats', icon: Activity, label: 'Threat Feed' },
        { id: 'logs', icon: Database, label: 'Analysis Logs' },
        { id: 'settings', icon: Settings, label: 'Settings' }
    ];
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Analysis State
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [allLogs, setAllLogs] = useState([]);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { first_name: profileName.split(' ')[0], last_name: profileName.split(' ').slice(1).join(' ') }
            });
            if (error) throw error;
            setIsEditing(false);
            // Refresh user data
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            setUser(updatedUser);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAnalyze = async () => {
        if (!url) return;
        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const data = await api.analyzeUrl(url);
            setResult(data);
            const statsData = await api.getStats();
            setStats(statsData);
            const [threatsData, logsData] = await Promise.all([
                api.getRecentThreats(20),
                api.getAnalysisLogs(20)
            ]);
            setRecentLogs(threatsData.threats || []);
            setAllLogs(logsData.logs || []);
        } catch (err) {
            setError('Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        // Get user session
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUser(user);
                setProfileName(user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : 'Admin User');
            } else {
                navigate('/');
            }
        });

        // Fetch Dashboard Data
        const fetchData = async () => {
            try {
                const [statsData, threatsData, logsData] = await Promise.all([
                    api.getStats(),
                    api.getRecentThreats(20),
                    api.getAnalysisLogs(20)
                ]);
                setStats(statsData);
                setRecentLogs(threatsData.threats || []);
                setAllLogs(logsData.logs || []);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const getInitials = (email) => {
        if (!email) return 'JD';
        return email.substring(0, 2).toUpperCase();
    };

    const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

    const getThreatData = (breakdown) => {
        if (!breakdown) return [];
        return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
    };

    return (
        <div className="flex h-screen bg-bg-primary text-white font-sans overflow-hidden relative selection:bg-primary/30">

            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-accent-pink/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
            </div>

            {/* Sidebar */}
            <aside className="w-64 glass-pane flex flex-col z-20 relative">
                <div className="p-6 flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full opacity-50"></div>
                        <Shield className="w-8 h-8 text-primary relative z-10" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent tracking-wide">
                        CYBERGUARD
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id
                                ? 'bg-primary/20 border border-primary/20 text-white shadow-lg shadow-primary/10 backdrop-blur-md'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-critical hover:bg-critical/10 transition-colors group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 z-10 relative">
                {/* Header */}
                <header className="h-20 glass-header flex items-center justify-between px-8">
                    <h2 className="text-xl font-semibold text-white capitalize">{activeTab}</h2>

                    <div className="flex items-center gap-6">
                        <div className="bg-success/10 text-success px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            System Operational
                        </div>

                        <div className="relative">
                            <div
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] cursor-pointer hover:scale-105 transition-transform"
                            >
                                <div className="w-full h-full rounded-full bg-bg-card flex items-center justify-center font-bold text-sm">
                                    {getInitials(user?.email || 'JD')}
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {showProfileDropdown && (
                                <div className="absolute right-0 top-12 w-48 bg-bg-card border border-white/10 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                                        <p className="text-sm font-semibold text-white">{user?.user_metadata?.first_name || 'User'}</p>
                                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={() => { setActiveTab('settings'); setShowProfileDropdown(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" /> Settings
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-sm text-critical hover:bg-critical/10 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 p-8 overflow-y-auto">

                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                        {[
                                            { label: 'Total Analyzed', value: stats?.total_analyzed || 0, trend: `+${stats?.today_count || 0}`, color: 'primary' },
                                            { label: 'Phishing Detected', value: stats?.phishing_detected || 0, trend: 'Critical', color: 'critical' },
                                            { label: 'Accuracy', value: `${((stats?.detection_accuracy || 0) * 100).toFixed(0)}%`, trend: 'Stable', color: 'success' },
                                            { label: 'Avg Latency', value: `${stats?.avg_response_time_ms?.toFixed(0) || 0}ms`, trend: 'Optimal', color: 'secondary' }
                                        ].map((stat, i) => (
                                            <div key={i} className="glass-card p-6">
                                                <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
                                                <div className="flex items-end justify-between">
                                                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${stat.color}/10 text-${stat.color}`}>
                                                        {stat.trend}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Charts Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                        {/* Activity Chart */}
                                        <div className="lg:col-span-2 glass-card p-6 border-white/5">
                                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-primary" />
                                                Analysis Traffic
                                            </h3>
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={[
                                                        { name: '00:00', val: 12 }, { name: '04:00', val: 18 },
                                                        { name: '08:00', val: 45 }, { name: '12:00', val: 95 },
                                                        { name: '16:00', val: 75 }, { name: '20:00', val: 50 },
                                                        { name: '23:59', val: 24 }
                                                    ]}>
                                                        <defs>
                                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1e2433', border: '1px solid #ffffff10', borderRadius: '8px' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                        <Area type="monotone" dataKey="val" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVal)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Threat Distribution */}
                                        <div className="glass-card p-6 border-white/5">
                                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5 text-critical" />
                                                Threat Breakdown
                                            </h3>
                                            <div className="h-64 w-full flex items-center justify-center relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={getThreatData(stats?.threat_breakdown)}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {getThreatData(stats?.threat_breakdown).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1e2433', border: '1px solid #ffffff10', borderRadius: '8px' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                {/* Legend Overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="text-center">
                                                        <span className="block text-2xl font-bold">{stats?.phishing_detected || 0}</span>
                                                        <span className="text-xs text-slate-400">Total Threats</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Custom Legend */}
                                            <div className="space-y-3 mt-2 max-h-40 overflow-y-auto">
                                                {getThreatData(stats?.threat_breakdown).map((entry, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                            <span className="text-slate-300">{entry.name}</span>
                                                        </div>
                                                        <span className="font-semibold">{((entry.value / (Object.values(stats?.threat_breakdown || {}).reduce((a, b) => a + b, 1))) * 100).toFixed(0)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analysis' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Hero Section Ported from Landing Page */}
                                    <div className="bg-bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-1 pointer-events-none select-none overflow-hidden relative mb-12">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 animate-shimmer" />
                                        <div className="bg-bg-primary rounded-xl p-12 text-center relative overflow-hidden">

                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-xs font-semibold mb-6">
                                                <Zap className="w-3 h-3" />
                                                <span>New: Enhanced Zero-Day Detection</span>
                                            </div>

                                            <h2 className="text-5xl font-bold mb-6 tracking-tight">
                                                Detect Phishing Attacks <br />
                                                <span className="text-gradient">Before They Happen</span>
                                            </h2>
                                            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                                                Real-time URL analysis powered by advanced machine learning.
                                                Protect your organization from brand impersonation and credential theft.
                                            </p>

                                            {/* URL Input */}
                                            <div className="max-w-3xl mx-auto relative group pointer-events-auto">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-xl opacity-75 blur transition duration-1000 group-hover:opacity-100 animate-gradient-x" />
                                                <div className="relative flex items-center bg-bg-secondary rounded-xl p-2 shadow-2xl">
                                                    <div className="pl-4 pr-3 text-slate-400">
                                                        <Lock className="w-5 h-5" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Paste a suspicious URL to analyze..."
                                                        className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 text-lg py-3"
                                                        value={url}
                                                        onChange={(e) => setUrl(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={handleAnalyze}
                                                        disabled={isAnalyzing || !url}
                                                        className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 min-w-[140px] flex justify-center items-center"
                                                    >
                                                        {isAnalyzing ? (
                                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            'Analyze'
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Error Message */}
                                                {error && (
                                                    <div className="mt-4 p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-sm max-w-xl mx-auto backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                                                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                                                        {error}
                                                    </div>
                                                )}

                                                {/* Analysis Result */}
                                                {result && (
                                                    <div className="mt-8 bg-bg-card/90 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 text-left max-w-2xl mx-auto">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                                    {result.prediction === 'Phishing' ? (
                                                                        <span className="text-critical flex items-center gap-2"><AlertTriangle /> Phishing Detected</span>
                                                                    ) : (
                                                                        <span className="text-success flex items-center gap-2"><CheckCircle /> Legitimate URL</span>
                                                                    )}
                                                                </h3>
                                                                <p className="text-slate-400 text-sm mt-1">{url}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm text-slate-400">Confidence</div>
                                                                <div className="text-2xl font-bold text-white">{(result.confidence * 100).toFixed(1)}%</div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                                                            <div>
                                                                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Risk Score</span>
                                                                <div className="text-lg font-medium mt-1">
                                                                    <span className={result.risk_score > 70 ? 'text-critical' : result.risk_score > 30 ? 'text-warning' : 'text-success'}>
                                                                        {result.risk_score}/100
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Threat Type</span>
                                                                <div className="text-lg font-medium text-white mt-1">{result.threat_type || 'None'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>

                                    {/* Feature Highlights */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            {
                                                icon: <BarChart3 className="w-6 h-6 text-accent-cyan" />,
                                                title: "Real-time Analytics",
                                                desc: "Get instant insights into threat patterns and campaign origins with our live dashboard.",
                                                target: 'overview'
                                            },
                                            {
                                                icon: <CheckCircle className="w-6 h-6 text-success" />,
                                                title: "94% Accuracy",
                                                desc: "Our deep learning models are trained on over 26,000 verified phishing samples. Check the logs.",
                                                target: 'logs'
                                            },
                                            {
                                                icon: <AlertTriangle className="w-6 h-6 text-accent-pink" />,
                                                title: "Zero-day Protection",
                                                desc: "Detect never-before-seen attacks using advanced behavioral analysis. Monitor the threat feed.",
                                                target: 'threats'
                                            }
                                        ].map((feature, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setActiveTab(feature.target)}
                                                className="glass-card p-6 hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-white/5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative z-10">
                                                    <div className="w-12 h-12 rounded-lg bg-bg-input flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:border-primary/30">
                                                        {feature.icon}
                                                    </div>
                                                    <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-primary-light transition-colors flex items-center justify-between">
                                                        {feature.title}
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-xs bg-primary/10 px-2 py-1 rounded-full">Explore &rarr;</span>
                                                    </h3>
                                                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300">{feature.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* How It Works Section */}
                                    <div className="mt-12 pt-12 border-t border-white/5">
                                        <div className="text-center mb-10">
                                            <h2 className="text-2xl font-bold mb-3">How CyberGuard Works</h2>
                                            <p className="text-slate-400 max-w-2xl mx-auto text-sm">Our multi-layered approach combines static analysis, heuristic detection, and deep learning to identify threats.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-1">Feature Extraction</h3>
                                                        <p className="text-slate-400 text-sm leading-relaxed">We analyze URL structure, domain age, SSL certificates, and redirect chains to extract 28 key features.</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-sm shrink-0">2</div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-1">ML Classification</h3>
                                                        <p className="text-slate-400 text-sm leading-relaxed">Our Random Forest and Neural Networks classify the URL against a database of millions of known threats.</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center font-bold text-sm shrink-0">3</div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-1">Real-time Verdict</h3>
                                                        <p className="text-slate-400 text-sm leading-relaxed">You get an instant prediction with a confidence score and detailed threat type analysis.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Visual representation */}
                                            <div className="glass-card p-1 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden relative group animate-float">
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                <img
                                                    src="/cyber-shield.png"
                                                    alt="CyberGuard Protection"
                                                    className="w-full h-full object-cover rounded-xl opacity-90 group-hover:scale-105 transition-transform duration-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'threats' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                                <Activity className="w-6 h-6 text-critical" />
                                                Live Threat Feed
                                            </h2>
                                            <p className="text-slate-400">Real-time detection of malicious URLs across the network.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 rounded-full bg-critical/10 text-critical text-sm font-semibold flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-critical animate-pulse" />
                                                Live
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        {recentLogs.length > 0 ? (
                                            recentLogs.map((log, i) => (
                                                <div key={i} className="bg-bg-card/50 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.prediction === 'Phishing' ? 'bg-critical/20 text-critical' : 'bg-success/20 text-success'}`}>
                                                            {log.prediction === 'Phishing' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-white">{log.url}</h4>
                                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                                <span>{new Date().toLocaleTimeString()}</span>
                                                                <span>•</span>
                                                                <span className={log.prediction === 'Phishing' ? 'text-critical' : 'text-success'}>{log.prediction}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs uppercase text-slate-500 font-bold mb-1">Risk Score</div>
                                                        <div className={`text-lg font-bold ${log.risk_score > 70 ? 'text-critical' : 'text-success'}`}>
                                                            {log.risk_score}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">No recent threats detected. The network is clean.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                                            <Database className="w-6 h-6 text-primary" />
                                            Analysis Logs
                                        </h2>
                                        <p className="text-slate-400">Comprehensive history of all URLs scanned by the system.</p>
                                    </div>

                                    <div className="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white/5 border-b border-white/5 text-slate-400 text-sm">
                                                        <th className="p-4 font-medium">Timestamp</th>
                                                        <th className="p-4 font-medium">URL Subject</th>
                                                        <th className="p-4 font-medium">Verdict</th>
                                                        <th className="p-4 font-medium">Confidence</th>
                                                        <th className="p-4 font-medium">Threat Type</th>
                                                        <th className="p-4 font-medium">Risk</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {allLogs.length > 0 ? (
                                                        allLogs.map((log, i) => (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                <td className="p-4 text-slate-400 text-sm">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</td>
                                                                <td className="p-4 text-white font-mono text-sm max-w-xs truncate" title={log.url}>{log.url}</td>
                                                                <td className="p-4">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${log.prediction === 'Phishing' ? 'bg-critical/10 text-critical' : 'bg-success/10 text-success'}`}>
                                                                        {log.prediction}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-slate-300">{(log.confidence * 100).toFixed(1)}%</td>
                                                                <td className="p-4 text-slate-300">{log.threat_type || 'N/A'}</td>
                                                                <td className="p-4">
                                                                    <div className="w-full bg-white/10 rounded-full h-1.5 w-24">
                                                                        <div
                                                                            className={`h-1.5 rounded-full ${log.risk_score > 70 ? 'bg-critical' : 'bg-success'}`}
                                                                            style={{ width: `${log.risk_score}%` }}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="6" className="p-8 text-center text-slate-500">No analysis logs found. Scan a URL to populate this table.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                                        <Settings className="w-6 h-6 text-slate-400" />
                                        Settings & Preferences
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Profile Section */}
                                        <div className="bg-bg-card border border-white/5 rounded-xl p-6">
                                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                                                <h3 className="text-lg font-semibold">Profile Information</h3>
                                                {!isEditing ? (
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                                                    >
                                                        <Edit2 className="w-4 h-4" /> Edit
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={handleUpdateProfile}
                                                            disabled={isSaving}
                                                            className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                                        >
                                                            {isSaving ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setIsEditing(false)}
                                                            className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileName}
                                                        onChange={(e) => setProfileName(e.target.value)}
                                                        disabled={!isEditing}
                                                        className={`w-full bg-bg-secondary border border-white/10 rounded-lg px-4 py-2 text-white transition-all ${isEditing ? 'focus:border-primary focus:ring-1 focus:ring-primary' : 'text-slate-500 cursor-not-allowed opacity-70'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                                                    <input
                                                        type="text"
                                                        value={user?.email || ''}
                                                        disabled
                                                        className="w-full bg-bg-secondary border border-white/10 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed opacity-70"
                                                    />
                                                    {isEditing && <p className="text-xs text-slate-500 mt-1">Email address cannot be changed directly.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preferences */}
                                        <div className="bg-bg-card border border-white/5 rounded-xl p-6">
                                            <h3 className="text-lg font-semibold mb-4 border-b border-white/5 pb-4">System Preferences</h3>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-white">Email Notifications</div>
                                                        <div className="text-xs text-slate-400">Receive alerts for high-risk threats</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-white">Dark Mode</div>
                                                        <div className="text-xs text-slate-400">Always use dark theme</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                                                        <div className="w-11 h-6 bg-primary/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary cursor-not-allowed"></div>
                                                    </label>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-white">API Access</div>
                                                        <div className="text-xs text-slate-400">Enable developer API keys</div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </main>
        </div>
    );
}
