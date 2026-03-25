import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc,
  serverTimestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Clock,
  User
} from 'lucide-react';

// === CONFIGURATION ===
const firebaseConfig = {
  apiKey: "AIzaSyAnO68l7UBc8uuMQ0ZTygDJ8h1kMcsRIT0",
  authDomain: "schedule-8feb6.firebaseapp.com",
  projectId: "schedule-8feb6",
  storageBucket: "schedule-8feb6.firebasestorage.app",
  messagingSenderId: "85118501498",
  appId: "1:85118501498:web:8e3f1fa68535963736f1c3",
};

// === INITIALIZE SERVICES ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) {}

const APP_PATH_ID = 'altar-server-app';
const MASS_TIMES = ["5:00 AM", "6:30 AM", "8:00 AM", "9:30 AM", "4:00 PM", "5:30 PM", "7:00 PM"];
const ROLES = ["Thurifer", "Boat", "Cross", "Candle 1", "Candle 2", "Server"];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', time: MASS_TIMES[0], role: ROLES[0] });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsInitializing(false);
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    const payload = { 
      ...formData, 
      name: formData.name.trim(), 
      userId: user?.uid, 
      createdAt: serverTimestamp() 
    };
    
    try {
      await addDoc(collection(db, 'artifacts', APP_PATH_ID, 'public', 'data', 'schedule'), payload);
      setFormData({ ...formData, name: '' });
      setSuccessMessage('Successfully Registered!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-10 text-white text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h1 className="text-2xl font-black uppercase tracking-tighter">Server Registry</h1>
          <p className="text-blue-100 text-sm opacity-80">Sunday Altar Service</p>
        </div>

        <div className="p-8 space-y-6">
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mass Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <select 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full pl-9 pr-4 py-4 rounded-2xl border-2 border-slate-100 bg-white font-bold text-xs appearance-none"
                  >
                    {MASS_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignment</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 bg-white font-bold text-xs appearance-none"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirm Attendance"}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-4 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Metropolitan Cathedral of San Fernando • Ministry of Altar Servers</p>
        </div>
      </div>
    </div>
  );
}
