import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { forgotPassword, resetPassword } from '../lib/api';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface PasswordStrength {
  score: number;
  feedback: string[];
}

const AuthForm: React.FC = () => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  
  // Reset password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Fixed password validation regex to match backend exactly
  const passwordRegex = {
    length: /.{8,}/,
    upper: /[A-Z]/,
    lower: /[a-z]/,
    digit: /[0-9]/,
    special: /[!@#$%^&*(),.?\"{}|<>\[\]\\/'`~_=+;-]/
  };

  const validatePassword = (pw: string): string | null => {
    if (!passwordRegex.length.test(pw)) return 'הסיסמה חייבת להכיל לפחות 8 תווים.';
    if (!passwordRegex.upper.test(pw)) return 'הסיסמה חייבת להכיל לפחות אות גדולה אחת.';
    if (!passwordRegex.lower.test(pw)) return 'הסיסמה חייבת להכיל לפחות אות קטנה אחת.';
    if (!passwordRegex.digit.test(pw)) return 'הסיסמה חייבת להכיל לפחות ספרה אחת.';
    if (!passwordRegex.special.test(pw)) return 'הסיסמה חייבת להכיל לפחות תו מיוחד אחד.';
    return null;
  };

  const getPasswordStrength = (pw: string): PasswordStrength => {
    const checks = [
      { test: passwordRegex.length, text: 'לפחות 8 תווים' },
      { test: passwordRegex.upper, text: 'אות גדולה' },
      { test: passwordRegex.lower, text: 'אות קטנה' },
      { test: passwordRegex.digit, text: 'ספרה' },
      { test: passwordRegex.special, text: 'תו מיוחד' }
    ];
    
    const passed = checks.filter(check => check.test.test(pw));
    const failed = checks.filter(check => !check.test.test(pw));
    
    return {
      score: passed.length,
      feedback: failed.map(check => check.text)
    };
  };

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setForgotError(null);
    setForgotMsg(null);
    setResetError(null);
    setResetMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    
    if (!email || !password) {
      setError('אנא מלא את כל השדות');
      return;
    }

    if (mode === 'register') {
      const pwErr = validatePassword(password);
      if (pwErr) {
        setError(pwErr);
        return;
      }
    }

    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      if (mode === 'register') {
        await register(email, password);
        setSuccess('ההרשמה בוצעה בהצלחה!');
      } else {
        await login(email, password);
        setSuccess('ברוך הבא!');
      }
    } catch (err: unknown) {
      // Enhanced error handling for backend error messages
      let msg = 'התחברות נכשלה';
      if (err && typeof err === 'object') {
        // Axios error shape
        const anyErr = err as any;
        if (anyErr.response && anyErr.response.data && anyErr.response.data.error) {
          msg = anyErr.response.data.error;
        } else if ('message' in err) {
          msg = (err as { message?: string }).message ?? msg;
        }
      }
      setError(msg);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    setForgotError(null);
    
    if (!forgotEmail) {
      setForgotError('אנא הזן כתובת אימייל');
      return;
    }

    try {
      await forgotPassword({ email: forgotEmail });
      setForgotMsg('אם האימייל קיים, נשלח קישור לאיפוס סיסמה. בדוק את קונסול השרת עבור הטוקן (הדגמה).');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setForgotError((err as { message?: string }).message ?? 'שליחת הבקשה נכשלה');
      } else {
        setForgotError('שליחת הבקשה נכשלה');
      }
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setResetError(null);
    
    if (!resetEmail || !resetToken || !resetPasswordVal) {
      setResetError('אנא מלא את כל השדות');
      return;
    }

    const pwErr = validatePassword(resetPasswordVal);
    if (pwErr) {
      setResetError(pwErr);
      return;
    }

    try {
      await resetPassword({ email: resetEmail, token: resetToken, newPassword: resetPasswordVal });
      setResetMsg('הסיסמה אופסה בהצלחה! כעת תוכל להתחבר.');
      setTimeout(() => setMode('login'), 2000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setResetError((err as { message?: string }).message ?? 'איפוס הסיסמה נכשל');
      } else {
        setResetError('איפוס הסיסמה נכשל');
      }
    }
  };

  const passwordStrength = mode === 'register' ? getPasswordStrength(password) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4" dir="rtl">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      <div className="relative w-full max-w-md">
        {/* Card glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-lg opacity-25 animate-pulse"></div>
        
        <div className="relative backdrop-blur-xl bg-white/10 p-8 rounded-3xl shadow-2xl border border-white/20">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {mode === 'login' && 'ברוך הבא'}
              {mode === 'register' && 'צור חשבון חדש'}
              {mode === 'forgot' && 'שכחת סיסמה?'}
              {mode === 'reset' && 'איפוס סיסמה'}
            </h2>
            
            <p className="text-gray-300 text-sm">
              {mode === 'login' && 'התחבר למערכת ניהול המעליות החכמה'}
              {mode === 'register' && 'הצטרף למערכת הניהול המתקדמת ביותר'}
              {mode === 'forgot' && 'הזן את כתובת האימייל שלך ונשלח לך קישור'}
              {mode === 'reset' && 'הזן את הטוקן שקיבלת והסיסמה החדשה'}
            </p>
          </div>

          {/* Login/Register Form */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2 text-right">
                  כתובת אימייל
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                    placeholder="your@email.com"
                    dir="ltr"
                  />
                  <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2 text-right">
                  סיסמה
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right pr-12"
                    dir="ltr"
                  />
                  <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator for register */}
                {mode === 'register' && password && passwordStrength && (
                  <div className="mt-3 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">חוזק הסיסמה</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-8 h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score >= level
                                ? passwordStrength.score <= 2
                                  ? 'bg-red-500'
                                  : passwordStrength.score <= 4
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="text-xs text-gray-400 text-right">
                        חסר: {passwordStrength.feedback.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    שכחת סיסמה?
                  </button>
                  <label className="flex items-center cursor-pointer">
                    <span className="ml-2 text-sm text-gray-300">זכור אותי</span>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                    />
                  </label>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl">
                  <p className="text-sm text-red-200 flex items-center text-right">
                    <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl">
                  <p className="text-sm text-green-200 flex items-center text-right">
                    <svg className="w-5 h-5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  mode === 'register' ? 'הרשמה' : 'התחברות'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                >
                  {mode === 'login' ? "אין לך חשבון? הרשם" : 'כבר יש לך חשבון? התחבר'}
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-200 mb-2 text-right">
                  כתובת אימייל
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                    placeholder="your@email.com"
                    dir="ltr"
                  />
                  <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {forgotError && (
                <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl">
                  <p className="text-sm text-red-200 text-right">{forgotError}</p>
                </div>
              )}

              {forgotMsg && (
                <div className="p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl">
                  <p className="text-sm text-green-200 text-right">{forgotMsg}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                שלח קישור איפוס
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-purple-300 hover:text-purple-200 transition-colors"
                >
                  יש לך טוקן? אפס סיסמה
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-purple-300 hover:text-purple-200 transition-colors"
                >
                  חזרה להתחברות
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-200 mb-2 text-right">
                  כתובת אימייל
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                  placeholder="your@email.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label htmlFor="reset-token" className="block text-sm font-medium text-gray-200 mb-2 text-right">
                  טוקן איפוס
                </label>
                <input
                  id="reset-token"
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                  placeholder="הזן את הטוקן שקיבלת"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-200 mb-2 text-right">
                  סיסמה חדשה
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-right"
                  dir="ltr"
                />
              </div>

              {resetError && (
                <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl">
                  <p className="text-sm text-red-200 text-right">{resetError}</p>
                </div>
              )}

              {resetMsg && (
                <div className="p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl">
                  <p className="text-sm text-green-200 text-right">{resetMsg}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                אפס סיסמה
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                >
                  חזרה להתחברות
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;