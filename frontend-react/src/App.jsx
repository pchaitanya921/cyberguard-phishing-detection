import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle, BarChart3, Lock, Zap, User, LogOut } from 'lucide-react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import { supabase } from './lib/supabaseClient'

function LandingPage() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  const handleAnalyze = async () => {
    if (!url) return
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const data = await import('./lib/api').then(m => m.api.analyzeUrl(url))
      setResult(data)
    } catch (err) {
      setError('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    navigate('/')
  }

  const [showStatsModal, setShowStatsModal] = useState(false)

  const scrollToDocs = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6 text-accent-cyan" />,
      title: "Real-time Analytics",
      desc: "Get instant insights into threat patterns and campaign origins with our live dashboard.",
      action: () => navigate('/dashboard'),
      btnText: "View Dashboard"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-success" />,
      title: "94% Accuracy",
      desc: "Our deep learning models are trained on over 26,000 verified phishing samples.",
      action: () => setShowStatsModal(true),
      btnText: "View Stats"
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-accent-pink" />,
      title: "Zero-day Protection",
      desc: "Detect never-before-seen attacks using advanced behavioral analysis and heuristics.",
      action: scrollToDocs,
      btnText: "Learn More"
    }
  ]

  return (
    <div className="min-h-screen bg-bg-primary text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-bg-secondary/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-md opacity-50" />
                <Shield className="w-8 h-8 text-primary relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent tracking-tight">
                  CYBERGUARD
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide">AI-POWERED PROTECTION</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={scrollToDocs} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it Works</button>

            {session ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <button className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all">
                    Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all">Sign In</button>
                </Link>
                <Link to="/signup">
                  <button className="btn-primary text-sm shadow-lg shadow-primary/25">Get Started</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {/* Hero Section */}
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

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {features.map((feature, i) => (
            <div
              key={i}
              onClick={feature.action}
              className="glass-card p-6 hover:bg-white/5 transition-all duration-300 group cursor-pointer hover:translate-y-[-4px] hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="w-12 h-12 rounded-lg bg-bg-input flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/5">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-light transition-colors">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{feature.desc}</p>
              <div className="text-primary-light text-sm font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                {feature.btnText} <span aria-hidden="true">&rarr;</span>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How CyberGuard Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Our multi-layered approach combines static analysis, heuristic detection, and deep learning to identify threats.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Feature Extraction</h3>
                  <p className="text-slate-400">We analyze URL structure, domain age, SSL certificates, and redirect chains to extract 28 key features.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">ML Classification</h3>
                  <p className="text-slate-400">Our Random Forest and Neural Networks classify the URL against a database of millions of known threats.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Real-time Verdict</h3>
                  <p className="text-slate-400">You get an instant prediction with a confidence score and detailed threat type analysis.</p>
                </div>
              </div>
            </div>

            {/* Visual representation placeholder */}
            <div className="glass-card p-1 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10">
              <div className="bg-bg-primary/50 backdrop-blur rounded-xl p-8 h-full flex items-center justify-center min-h-[300px]">
                <Shield className="w-32 h-32 text-slate-700 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-bg-card border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowStatsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <LogOut className="w-5 h-5 rotate-180" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold">Model Performance</h3>
              <p className="text-slate-400 text-sm">Verified on Feb 05, 2026</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <span className="text-slate-300">Accuracy</span>
                <span className="text-success font-bold text-lg">94.2%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <span className="text-slate-300">False Positive Rate</span>
                <span className="text-white font-bold text-lg">0.8%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <span className="text-slate-300">Training Samples</span>
                <span className="text-white font-bold text-lg">26,450</span>
              </div>
            </div>

            <button
              onClick={() => setShowStatsModal(false)}
              className="w-full mt-8 btn-primary text-center py-3"
            >
              Close Technical Report
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div className="h-screen flex items-center justify-center bg-bg-primary"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>

  if (!session) return <Navigate to="/login" replace />

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
