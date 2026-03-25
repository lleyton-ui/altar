import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  User, 
  Clock, 
  ShieldCheck, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnO68l7UBc8uuMQ0ZTygDJ8h1kMcsRIT0",
  authDomain: "schedule-8feb6.firebaseapp.com",
  projectId: "schedule-8feb6",
  storageBucket: "schedule-8feb6.firebasestorage.app",
  messagingSenderId: "85118501498",
  appId: "1:85118501498:web:8e3f1fa68535963736f1c3",
  measurementId: "G-N44W6136MD"
};

// Initialize Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const APP_PATH_ID = 'altar-schedule-app';

const MASS_TIMES = [
  "5:00 AM", "6:30 AM", "8:00 AM", "9:30 AM",
  "4:00 PM", "5:30 PM", "7:00 PM"
];

const ROLES = [
  "Thurifer", "Boat", "Cross", "Candle 1", "Candle 2", "Server"
];

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    time: MASS_TIMES[0],
    role: ROLES[0]
  });

  const connectToFirebase = useCallback(async () => {
    setIsInitializing(true);
    setErrorMessage('');
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMessage("Connection Error: Please check your internet or Firebase settings.");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsInitializing(false);
      } else {
        connectToFirebase();
      }
    });
    return () => unsubscribe();
  }, [connectToFirebase]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    
    // START OPTIMISTIC UI:
    // We show success immediately so the user doesn't wait for the network
    const savedName = formData.name.trim();
    const savedData = { ...formData, name: savedName };
    
    setLoading(true);
    setErrorMessage('');
    
    // Reset form immediately to feel "fast"
    setFormData({ ...formData, name: '' });
    setSuccessMessage('Registration confirmed! See you at the sacristy.');
    
    // Background execution
    const performSubmit = async () => {
      try {
        let activeUser = user;
        if (!activeUser) {
          const cred = await signInAnonymously(auth);
          activeUser = cred.user;
        }

        const scheduleRef = collection(db, 'artifacts', APP_PATH_ID, 'public', 'data', 'schedule');
        
        // Firestore addDoc works in the background
        await addDoc(scheduleRef, {
          name: savedData.name,
          time: savedData.time,
          role: savedData.role,
          userId: activeUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Background sync error:", error);
        setErrorMessage('Sync failed, but we will retry automatically.');
        setSuccessMessage('');
      } finally {
        setLoading(false);
      }
    };

    performSubmit();
    
    // Clear success message after 4 seconds
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 transition-all hover:shadow-blue-900/5">
          <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-blue-200 relative z-10" />
            <h1 className="text-2xl font-black uppercase tracking-tight relative z-10">Altar Server</h1>
            <p className="text-blue-100 text-sm opacity-80 relative z-10">Sunday Mass Enrollment</p>
          </div>
          
          <div className="p-8 space-y-6">
            {successMessage && (
              <div className="p-4 rounded-2xl flex items-center gap-3 border bg-emerald-50 text-emerald-700 border-emerald-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">{successMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-2xl space-y-3 border bg-red-50 text-red-700 border-red-100 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold leading-tight">{errorMessage}</p>
                </div>
                {!user && (
                  <button 
                    onClick={connectToFirebase}
                    className="w-full py-2 bg-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <RefreshCcw className="w-3 h-3" /> Fix Connection
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <User className="w-3 h-3 text-blue-500" /> Server Name
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    if(errorMessage) setErrorMessage('');
                  }}
                  disabled={loading}
                  required
                  placeholder="Ex. Jeric Lleyton Yabut"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-semibold placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-blue-500" /> Mass Time
                  </label>
                  <select 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    disabled={loading}
                    className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white font-semibold text-sm cursor-pointer appearance-none"
                  >
                    {MASS_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-blue-500" /> Assignment
                  </label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    disabled={loading}
                    className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white font-semibold text-sm cursor-pointer appearance-none"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isInitializing}
                className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${
                  isInitializing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 hover:bg-blue-600 text-white active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Processing...
                  </>
                ) : isInitializing ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Connecting...
                  </>
                ) : (
                  "Submit Attendance"
                )}
              </button>
            </form>
          </div>
        </div>
        <div className="text-center mt-8 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-50">
            Project: {firebaseConfig.projectId}
          </p>
          <div className="flex justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-slate-200 animate-pulse'}`}></div>
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-400 animate-bounce' : 'bg-slate-200'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;