import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Shield,
  Layers,
  Globe,
  Lock,
  ArrowRight,
  AlertCircle,
  UserRound,
} from 'lucide-react';
import { Logo } from './Logo.js';
import { GoogleUser } from '../types.js';
import { loginWithGoogleOAuth, loginAsGuest } from '../services/googleAuth.js';

interface WelcomePageProps {
  onLoginSuccess: (user: GoogleUser) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await loginWithGoogleOAuth();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(
        err.message ||
          'ការចូលដោយប្រើ Google មិនបានសម្រេចឡើយ។ សូមព្យាយាមម្តងទៀត។'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = () => {
    try {
      const guest = loginAsGuest();
      onLoginSuccess(guest);
    } catch (err: any) {
      console.error('Guest Sign In Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0E] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#6366F1]/30 selection:text-[#F8FAFC] relative overflow-x-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-[#6366F1]/15 via-[#4285F4]/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[350px] bg-[#3B82F6]/10 blur-3xl rounded-full" />
        <div className="absolute top-[35%] left-[-10%] w-[400px] h-[400px] bg-[#8B5CF6]/10 blur-3xl rounded-full" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="md" className="shadow-lg shadow-[#6366F1]/20" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                CHAT <span className="text-[#818CF8]">GPR</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/30 font-medium tracking-wide font-sans">
                v2.5 PRO
              </span>
            </div>
            <span className="text-[11px] text-[#94A3B8] font-khmer block -mt-0.5">
              ជំនួយការបញ្ញាសិប្បនិម្មិតឆ្លាតវៃ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121620] border border-[#242A38] text-xs text-[#94A3B8] font-khmer">
            <Shield className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Google Account Verified</span>
          </div>
        </div>
      </header>

      {/* Main Hero & Content Section */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center py-6 sm:py-12">
        {/* Hero Header */}
        <div className="text-center max-w-3xl space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A202C]/80 border border-[#2D3748] text-xs sm:text-sm text-[#A5B4FC] backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-[#F59E0B] animate-pulse" />
            <span className="font-khmer font-medium">
              ប្រព័ន្ធ AI ឆ្លាតវៃពហុទម្រង់ — ភាសាខ្មែរ & អន្តរជាតិ
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-snug font-khmer">
            សូមស្វាគមន៍មកកាន់{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818CF8] via-[#60A5FA] to-[#38BDF8]">
              CHAT GPR
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed font-khmer max-w-2xl mx-auto">
            វេទិកា AI ជំនាន់ថ្មីដែលរួមបញ្ចូលការវិភាគរូបភាព (Vision OCR),
            ដោះស្រាយលំហាត់គណិតវិទ្យា (KaTeX), ស្វែងរកព័ត៌មានជាក់ស្តែងទាន់ហេតុការណ៍ (Live Web Grounding)
            និងដំណើរការដោយ Google Account ប្រកបដោយសុវត្ថិភាព។
          </p>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-start gap-3 text-left max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#FCA5A5] font-khmer leading-relaxed">
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Sign-in Call To Action Group */}
          <div className="pt-2 sm:pt-4 max-w-md mx-auto w-full space-y-3.5">
            {/* Primary Google Login Button */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-[#F1F5F9] active:scale-[0.99] text-[#0F172A] font-bold text-base font-khmer transition-all shadow-xl shadow-white/10 hover:shadow-white/20 disabled:opacity-60 cursor-pointer group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                  <span>កំពុងចូលទៅកាន់ Google...</span>
                </>
              ) : (
                <>
                  {/* Google SVG Official Icon */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="tracking-wide font-sans font-semibold">Continue with Google</span>
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-0.5">
              <div className="flex-1 h-px bg-[#202634]" />
              <span className="text-xs text-[#64748B] font-khmer px-1">ឬ (Or)</span>
              <div className="flex-1 h-px bg-[#202634]" />
            </div>

            {/* Quick Guest Mode Button */}
            <button
              id="guest-signin-btn"
              onClick={handleGuestSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#131620] hover:bg-[#1A1F2C] border border-[#242A38] hover:border-[#6366F1]/50 text-white transition-all shadow-lg active:scale-[0.99] cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#818CF8] group-hover:scale-105 transition-transform flex-shrink-0">
                  <UserRound className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white font-khmer truncate">
                      Guest / ចូលប្រើភ្លាមៗ
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 font-sans font-medium flex-shrink-0">
                      No Account
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#94A3B8] font-khmer mt-0.5 truncate">
                    មិនចាំបាច់បង្កើត Account — ប្រើមុខងារ AI បានភ្លាមៗ
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-[#64748B] font-khmer pt-0.5">
              <Lock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>សុវត្ថិភាពខ្ពស់ — ដំណើរការរហ័ស និងឯកជនភាព</span>
            </div>
          </div>
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-10 sm:mt-14">
          {/* Card 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#11141C] border border-[#202532] hover:border-[#6366F1]/40 transition-all group flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#818CF8] group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-khmer mb-1">
                ការសន្ទនា & ដោះស្រាយបញ្ហា
              </h3>
              <p className="text-xs text-[#94A3B8] font-khmer leading-relaxed">
                យល់ដឹងភាសាខ្មែរយ៉ាងស៊ីជម្រៅ សរសេរកូដ និងវិភាគតក្កវិជ្ជាបានរហ័ស។
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#11141C] border border-[#202532] hover:border-[#38BDF8]/40 transition-all group flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center text-[#38BDF8] group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-khmer mb-1">
                Live Web Grounding
              </h3>
              <p className="text-xs text-[#94A3B8] font-khmer leading-relaxed">
                ស្វែងរកព័ត៌មានទាន់ហេតុការណ៍ពីអ៊ីនធឺណិតជាមួយប្រភពយោងជាក់ស្តែង។
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#11141C] border border-[#202532] hover:border-[#10B981]/40 transition-all group flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-khmer mb-1">
                Vision OCR & ឯកសារ
              </h3>
              <p className="text-xs text-[#94A3B8] font-khmer leading-relaxed">
                អានអក្សរពីរូបថត វិភាគក្រាហ្វ និងសម្រង់ទិន្នន័យពីឯកសារ PDF ភ្លាមៗ។
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#11141C] border border-[#202532] hover:border-[#F59E0B]/40 transition-all group flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-khmer mb-1">
                គណិតវិទ្យា & សរសេរកូដ
              </h3>
              <p className="text-xs text-[#94A3B8] font-khmer leading-relaxed">
                ដោះស្រាយសមីការ KaTeX រូបមន្តវិទ្យាសាស្ត្រ និង Syntax Highlighting គ្រប់ភាសា។
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-[#1A1F2B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] font-khmer">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} CHAT GPR. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Protected by Google Identity Services</span>
          <span>•</span>
          <span>Fast & Encrypted Storage</span>
        </div>
      </footer>
    </div>
  );
};
