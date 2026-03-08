import { Link } from "react-router-dom";
import { ShieldCheck, Fingerprint, ArrowRight, Sparkles, Zap, Globe } from "lucide-react";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 text-gray-900">
      {/* Top Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              CyberShield
            </span>
          </div>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-emerald-700 font-medium hover:text-emerald-800 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/captcha"
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Enterprise-Grade Security Platform</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Secure Your Digital
            </span>
            <br />
            <span className="text-gray-800">Infrastructure</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Comprehensive cybersecurity solutions for modern enterprises. Protect, monitor, and defend your digital assets with cutting-edge technology.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/captcha"
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-emerald-700 border-2 border-emerald-500 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">99.9%</div>
            <div className="text-gray-600 text-sm">Uptime Guarantee</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-teal-100 text-center">
            <div className="text-4xl font-bold text-teal-600 mb-2">10K+</div>
            <div className="text-gray-600 text-sm">Active Users</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-cyan-100 text-center">
            <div className="text-4xl font-bold text-cyan-600 mb-2">24/7</div>
            <div className="text-gray-600 text-sm">Support</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">ISO</div>
            <div className="text-gray-600 text-sm">Certified</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">System Security</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Advanced protection for your infrastructure with real-time threat detection and automated response systems.
            </p>
            <Link to="/captcha" className="text-emerald-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-teal-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Network Defense</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Comprehensive network monitoring and intrusion prevention with AI-powered anomaly detection.
            </p>
            <Link to="/captcha" className="text-teal-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-cyan-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Fingerprint className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Digital Forensics</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Investigate security incidents with powerful forensic tools and detailed audit trails.
            </p>
            <Link to="/captcha" className="text-cyan-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
              Learn more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-12 text-center text-white shadow-2xl">
          <Globe className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Future?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of organizations trusting CyberShield for their cybersecurity needs.
          </p>
          <Link
            to="/captcha"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold text-white">CyberShield</span>
          </div>
          <p className="mb-4">© {new Date().getFullYear()} CyberShield Systems. All rights reserved.</p>
          <p className="text-sm">Secure • Reliable • Trusted</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
