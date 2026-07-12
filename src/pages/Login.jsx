import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Car, Truck, Anchor, BarChart2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const loginEmail = email || 'fleet@transitops.com';
    const loginPassword = password || 'password123';

    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Left Pane - Branding & Info */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center border-r border-border/50 relative overflow-hidden bg-[#0A0D14]">
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
              <Car className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">TransOps</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            Manage your <br className="hidden md:block" /> fleet with ease.
          </h1>
          <p className="text-lg text-slate-400 mb-12 max-w-md">
            Keep track of your vehicles, drivers, and trips all in one place. Built for teams that need things to just work.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="mt-1 bg-blue-500/10 p-2 rounded-full text-blue-500 h-fit">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-widest text-slate-300 uppercase mb-1">Fleet Managers</h3>
                <p className="text-sm text-slate-500">Add vehicles, log maintenance, and make sure everything is running smoothly.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 bg-amber-500/10 p-2 rounded-full text-amber-500 h-fit">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-widest text-slate-300 uppercase mb-1">Dispatchers</h3>
                <p className="text-sm text-slate-500">Plan routes, assign drivers, and keep an eye on active trips.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 bg-emerald-500/10 p-2 rounded-full text-emerald-500 h-fit">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-widest text-slate-300 uppercase mb-1">Analytics & Finance</h3>
                <p className="text-sm text-slate-500">Track fuel costs, log expenses, and see how the business is doing.</p>
              </div>
            </div>
          </div>

          <div className="mt-16 flex items-center justify-between text-xs text-slate-500">
            <span>© 2026 TransOps Inc.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300 transition-colors">System Status</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Support</a>
            </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0D1117] relative">
        <div className="w-full max-w-md space-y-8">

          <div className="bg-[#121820] border border-slate-800 rounded-xl p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-white">Welcome back</h2>
              <p className="text-sm text-slate-400">
                Sign in to your enterprise workspace.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Work Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="fleet@transitops.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#0A0D14] border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                  />
                  <div className="absolute left-3 top-2.5 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-[#0A0D14] border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                  />
                  <div className="absolute left-3 top-2.5 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-400"
                >
                  Remember me for 30 days
                </label>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-[#B4C6FF] text-[#1E2B5E] hover:bg-[#A3B8FF] font-semibold" size="lg">
                {isLoading ? "Signing In..." : "Sign In"}
                {!isLoading && <svg className="ml-2 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <span className="border-b border-slate-800 w-1/5 lg:w-1/4"></span>
              <span className="text-xs text-center text-slate-500 uppercase">Or continue with</span>
              <span className="border-b border-slate-800 w-1/5 lg:w-1/4"></span>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                theme="filled_black"
                shape="rectangular"
                text="signin_with"
                size="large"
                width="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
