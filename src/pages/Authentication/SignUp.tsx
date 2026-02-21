import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Building, CheckCircle2, Building2 } from "lucide-react";
import { authApi } from "../../services/api";
import { Alert } from "../../components/ui/Alert";

const DEPARTMENTS = ["Engineering","Marketing","Sales","HR","Finance","Operations","Design","Legal","Product","Support"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const STRENGTH_COLORS = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"];

function getPasswordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return Math.min(score, 5);
}

const SignUp: React.FC = () => {
  const [form, setForm] = useState({ firstName:"",lastName:"",email:"",password:"",confirmPassword:"",position:"",department:"" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (strength < 2) { setError("Please use a stronger password."); return; }
    setLoading(true);
    try {
      await authApi.register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, position: form.position, department: form.department });
      setSuccess("Account created! Redirecting to sign in...");
      setTimeout(() => navigate("/auth/signin"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.messageResponse || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">HRPRO</h1>
          <p className="text-slate-400 text-sm">Create your account</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          <AnimatePresence>
            {error && <div className="mb-4"><Alert variant="danger" message={error} onClose={() => setError("")} /></div>}
            {success && <div className="mb-4"><Alert variant="success" message={success} /></div>}
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Jane" className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Doe" className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@company.com" className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Position / Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="position" value={form.position} onChange={handleChange} required placeholder="e.g. Developer" className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select name="department" value={form.department} onChange={handleChange} required className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                    <option value="" className="bg-slate-800">Select dept.</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-800">{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required placeholder="" className="w-full pl-9 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {Array.from({length:5}).map((_,i) => (
                      <motion.div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? STRENGTH_COLORS[strength] : "bg-white/20"}`} initial={{scaleX:0}} animate={{scaleX:1}} />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 font-medium ${strength <= 1 ? "text-red-400" : strength <= 2 ? "text-yellow-400" : strength <= 3 ? "text-blue-400" : "text-green-400"}`}>{STRENGTH_LABELS[strength]}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="" className="w-full pl-9 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                )}
              </div>
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{scale:0.98}} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account...</span> : "Create Account"}
            </motion.button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-4">
            Already have an account?{" "}
            <Link to="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
