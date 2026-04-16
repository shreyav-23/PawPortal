import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Stethoscope,
  ShieldAlert,
  ListChecks,
  Plus,
  Camera,
  X,
  Loader2,
  LayoutDashboard,
  Cat,
  Dog,
  HeartPulse,
  PawPrint,
  ChevronRight,
  ChevronDown,
  Info,
  Syringe,
  Timer,
  FileText,
  Bone,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Send,
  Image as ImageIcon
} from "lucide-react";

/* ================= CONFIG ================= */

// Gemini API Key
const apiKey = "";

// Safe Supabase Init (prevents crashing in preview environment if env vars are missing)
let supabase: any = null;
try {
  // @ts-ignore - Ignoring TS error for import.meta in standard bundlers
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "";
  // @ts-ignore
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.log("Running in local state mode (Supabase credentials not found).");
}

/* ================= TYPES ================= */

type Pet = {
  id?: string;
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Other";
  breed: string;
  age: number;
  weight: number;
  imageUrl?: string;
};

type Interpreter = {
  symptoms: string[];
  behaviorChanges: string[];
  estimatedDuration?: string;
  clinicalSummary: string;
};

type Risk = {
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  urgency: string;
  reasoning: string;
  primaryConcerns?: string[];
};

type Planner = {
  immediateActions: string[];
  questionsForVet: string[];
  thingsToMonitor: string[];
};

type Analysis = {
  interpreter?: Interpreter;
  risk?: Risk;
  planner?: Planner;
};

type Log = {
  id: string;
  pet_id: string | null;
  date: string;
  type: "text" | "image";
  input: string;
  analysis: Analysis;
};

type MedicalRecord = {
  id: string;
  pet_id: string;
  title: string;
  type: "Vaccine" | "Medication" | "Surgery" | "Checkup";
  date: string;
  next_due_date?: string;
  notes?: string;
};

type ActivityLog = {
  id: string;
  pet_id: string;
  type: "Walk" | "Playtime" | "Training" | "Other";
  duration_mins: number;
  date: string;
  notes?: string;
};

/* ================= SCHEMAS ================= */

const interpreterSchema = {
  type: "OBJECT",
  properties: {
    symptoms: { type: "ARRAY", items: { type: "STRING" } },
    behaviorChanges: { type: "ARRAY", items: { type: "STRING" } },
    estimatedDuration: { type: "STRING" },
    clinicalSummary: { type: "STRING" }
  },
  required: ["symptoms", "behaviorChanges", "clinicalSummary"]
};

const riskSchema = {
  type: "OBJECT",
  properties: {
    riskLevel: { type: "STRING", enum: ["Low", "Medium", "High", "Critical"] },
    urgency: { type: "STRING" },
    reasoning: { type: "STRING" },
    primaryConcerns: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["riskLevel", "urgency", "reasoning"]
};

const plannerSchema = {
  type: "OBJECT",
  properties: {
    immediateActions: { type: "ARRAY", items: { type: "STRING" } },
    questionsForVet: { type: "ARRAY", items: { type: "STRING" } },
    thingsToMonitor: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["immediateActions", "questionsForVet", "thingsToMonitor"]
};

/* ================= HELPERS ================= */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiAPI = async (
  prompt: string,
  systemInstruction: string,
  schema: any = null,
  inlineData: { mimeType: string; data: string } | null = null,
  retries = 5
): Promise<any> => {
  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let i = 0; i < retries; i++) {
    try {
      const payload: any = {
        contents: [],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      };

      if (inlineData) {
        payload.contents.push({
          role: "user",
          parts: [{ text: prompt }, { inlineData }]
        });
      } else {
        payload.contents.push({
          role: "user",
          parts: [{ text: prompt }]
        });
      }

      if (schema) {
        payload.generationConfig = {
          responseMimeType: "application/json",
          responseSchema: schema
        };
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) throw new Error("Empty response");

      if (schema) {
        return JSON.parse(textResponse);
      }
      return textResponse;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delays[i]);
    }
  }
};

/* ================= SHARED COMPONENTS ================= */

function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  const colors: Record<string, string> = {
    Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Critical: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colors[level] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {level} Risk
    </span>
  );
}

/* ================= APP COMPONENTS ================= */

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "pets" | "copilot" | "records" | "activity">("dashboard");
  const [pets, setPets] = useState<Pet[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    fetchPets();
    fetchLogs();
    fetchRecords();
    fetchActivities();
  }, []);
  
  const fetchPets = async () => {
    if (supabase) {
      const { data, error } = await supabase.from("pets").select("*");
      if (!error && data) setPets(data);
    }
  };
  
  const fetchLogs = async () => {
    if (supabase) {
      const { data, error } = await supabase.from("logs").select("*").order("date", { ascending: false });
      if (!error && data) setLogs(data);
    }
  };

  const fetchRecords = async () => {
    if (supabase) {
      const { data, error } = await supabase.from("medical_records").select("*").order("date", { ascending: false });
      if (!error && data) setRecords(data);
    }
  };

  const fetchActivities = async () => {
    if (supabase) {
      const { data, error } = await supabase.from("activity_logs").select("*").order("date", { ascending: false });
      if (!error && data) setActivities(data);
    }
  };

  // --- Views ---
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView pets={pets} logs={logs} records={records} activities={activities} onNavigate={setActiveTab} />;
      case "pets":
        return <PetsView pets={pets} setPets={setPets} />;
      case "copilot":
        return <CopilotView pets={pets} logs={logs} setLogs={setLogs} />;
      case "records":
        return <RecordsView pets={pets} records={records} setRecords={setRecords} />;
      case "activity":
        return <ActivityView pets={pets} activities={activities} setActivities={setActivities} />;
      default:
        return <DashboardView pets={pets} logs={logs} records={records} activities={activities} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 text-[#f58b05]">
          <HeartPulse className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-slate-900">PawPortal</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <SidebarItem
            icon={<LayoutDashboard />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarItem
            icon={<PawPrint />}
            label="My Pets"
            active={activeTab === "pets"}
            onClick={() => setActiveTab("pets")}
          />
          <SidebarItem
            icon={<Stethoscope />}
            label="Vet Copilot"
            active={activeTab === "copilot"}
            onClick={() => setActiveTab("copilot")}
          />
          <SidebarItem
            icon={<FileText />}
            label="Medical Records"
            active={activeTab === "records"}
            onClick={() => setActiveTab("records")}
          />
          <SidebarItem
            icon={<Timer />}
            label="Activity Tracker"
            active={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
          />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#ffc22f]/30 flex items-center justify-center text-[#f58b05] font-bold">
              U
            </div>
            <div className="text-sm font-medium">Pet Parent</div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 overflow-x-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab("dashboard")} className={`p-3 rounded-xl transition-colors ${activeTab === "dashboard" ? "text-[#f58b05] bg-[#f58b05]/10" : "text-slate-500"}`}>
          <LayoutDashboard className="h-6 w-6" />
        </button>
        <button onClick={() => setActiveTab("pets")} className={`p-3 rounded-xl transition-colors ${activeTab === "pets" ? "text-[#f58b05] bg-[#f58b05]/10" : "text-slate-500"}`}>
          <PawPrint className="h-6 w-6" />
        </button>
        <button onClick={() => setActiveTab("copilot")} className={`p-3 rounded-xl transition-colors ${activeTab === "copilot" ? "text-[#f58b05] bg-[#f58b05]/10" : "text-slate-500"}`}>
          <Stethoscope className="h-6 w-6" />
        </button>
        <button onClick={() => setActiveTab("records")} className={`p-3 rounded-xl transition-colors ${activeTab === "records" ? "text-[#f58b05] bg-[#f58b05]/10" : "text-slate-500"}`}>
          <FileText className="h-6 w-6" />
        </button>
        <button onClick={() => setActiveTab("activity")} className={`p-3 rounded-xl transition-colors ${activeTab === "activity" ? "text-[#f58b05] bg-[#f58b05]/10" : "text-slate-500"}`}>
          <Timer className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 md:pb-0">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 md:hidden shrink-0 shadow-sm">
          <HeartPulse className="h-6 w-6 text-[#f58b05] mr-2" />
          <span className="text-lg font-bold">PawPortal</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

/* ================= SIDEBAR COMPONENT ================= */
function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
        active
          ? "bg-[#f58b05]/10 text-[#f58b05] font-medium scale-[1.02]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { className: `h-5 w-5 ${active ? 'animate-pulse' : ''}` })}
      <span>{label}</span>
    </button>
  );
}

/* ================= DASHBOARD VIEW ================= */
function DashboardView({ pets, logs, records, activities, onNavigate }: { pets: Pet[], logs: Log[], records: MedicalRecord[], activities: ActivityLog[], onNavigate: (tab: any) => void }) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Calculate some stats
  const totalActivityMins = activities.reduce((acc, curr) => acc + curr.duration_mins, 0);

  // Chart Data Processing
  const activityData = React.useMemo(() => {
    const aggregated: Record<string, number> = {};
    activities.forEach(a => {
        aggregated[a.type] = (aggregated[a.type] || 0) + a.duration_mins;
    });
    return Object.keys(aggregated).map(key => ({ name: key, duration: aggregated[key] }));
  }, [activities]);

  const speciesData = React.useMemo(() => {
    const aggregated: Record<string, number> = {};
    pets.forEach(p => {
        aggregated[p.species] = (aggregated[p.species] || 0) + 1;
    });
    return Object.keys(aggregated).map(key => ({ name: key, value: aggregated[key] }));
  }, [pets]);

  const PIE_COLORS = ['#f58b05', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{greeting}!</h1>
        <p className="text-slate-500 mt-1">Here is the latest on your furry friends.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div 
          onClick={() => onNavigate("pets")}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer group hover:shadow-md hover:border-[#f58b05] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[#f58b05]/10 flex items-center justify-center text-[#f58b05] mb-4 group-hover:scale-110 transition-transform">
            <PawPrint className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pets.length}</p>
            <p className="text-sm font-medium text-slate-500 group-hover:text-[#f58b05] transition-colors">Registered Pets</p>
          </div>
        </div>
        
        <div 
          onClick={() => onNavigate("records")}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer group hover:shadow-md hover:border-blue-500 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{records.length}</p>
            <p className="text-sm font-medium text-slate-500 group-hover:text-blue-500 transition-colors">Medical Records</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("activity")}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer group hover:shadow-md hover:border-emerald-500 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{Math.floor(totalActivityMins / 60)}h {totalActivityMins % 60}m</p>
            <p className="text-sm font-medium text-slate-500 group-hover:text-emerald-500 transition-colors">Total Activity Logged</p>
          </div>
        </div>

        <div 
          onClick={() => onNavigate("copilot")}
          className="bg-gradient-to-br from-[#f58b05] to-[#ffc22f] rounded-2xl p-6 shadow-md text-white flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white group-hover:rotate-12 transition-transform" />
            </div>
            <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
          </div>
          <div>
             <h3 className="font-semibold text-lg">Vet Copilot</h3>
             <p className="text-white/90 text-sm mt-1">Get instant AI health analysis.</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Breakdown Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
             <BarChart3 className="h-5 w-5 text-emerald-500" />
             <h2 className="text-lg font-semibold text-slate-900">Activity Breakdown</h2>
          </div>
          <div className="p-6 h-72">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="duration" fill="#10b981" radius={[4, 4, 0, 0]} name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="h-10 w-10 text-slate-200 mb-2" />
                <p className="text-sm">No activity logged yet.</p>
                <button onClick={() => onNavigate("activity")} className="text-emerald-500 text-sm mt-2 hover:underline">Log an activity</button>
              </div>
            )}
          </div>
        </div>

        {/* Pets by Species Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
             <PieChartIcon className="h-5 w-5 text-blue-500" />
             <h2 className="text-lg font-semibold text-slate-900">Pets by Species</h2>
          </div>
          <div className="p-6 h-72">
            {speciesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={speciesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {speciesData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '14px', color: '#475569'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <PieChartIcon className="h-10 w-10 text-slate-200 mb-2" />
                <p className="text-sm">No pets registered yet.</p>
                <button onClick={() => onNavigate("pets")} className="text-blue-500 text-sm mt-2 hover:underline">Add a pet</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pets Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-slate-400" /> Your Pets
            </h2>
            <button 
              onClick={() => onNavigate("pets")} 
              className="text-sm font-medium text-[#f58b05] hover:text-[#d67904] hover:underline flex items-center group"
            >
              Manage <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="p-2 flex-1">
            {pets.length === 0 ? (
              <div className="text-slate-500 p-8 text-center flex flex-col items-center">
                <Cat className="h-10 w-10 text-slate-300 mb-3" />
                <p>No pets added yet.</p>
                <button onClick={() => onNavigate("pets")} className="text-[#f58b05] text-sm mt-2 font-medium">Add your first pet</button>
              </div>
            ) : (
              pets.slice(0, 4).map(pet => (
                <div key={pet.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#f58b05]/10 group-hover:text-[#f58b05] transition-colors">
                      {pet.species === "Cat" ? <Cat className="h-6 w-6" /> : pet.species === "Dog" ? <Dog className="h-6 w-6" /> : <PawPrint className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{pet.name}</h3>
                      <p className="text-sm text-slate-500">{pet.breed} • {pet.age} yrs</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                      onClick={(e) => { e.stopPropagation(); onNavigate("activity"); }}
                      className="opacity-0 group-hover:opacity-100 text-emerald-500 hover:bg-emerald-50 p-2 rounded-lg transition-all"
                      title={`Log ${pet.name}'s Activity`}
                    >
                      <Timer className="h-4 w-4" /> 
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onNavigate("copilot"); }}
                      className="opacity-0 group-hover:opacity-100 text-[#f58b05] hover:bg-[#f58b05]/10 p-2 rounded-lg transition-all"
                      title={`Check ${pet.name}'s Health`}
                    >
                      <Activity className="h-4 w-4" /> 
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Health Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-400" /> Recent AI Analyses
            </h2>
            <button 
              onClick={() => onNavigate("copilot")} 
              className="text-sm font-medium text-[#f58b05] hover:text-[#d67904] hover:underline flex items-center group"
            >
              View All <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
             {logs.length === 0 ? (
               <div className="text-slate-500 p-8 text-center flex flex-col items-center">
                 <Stethoscope className="h-10 w-10 text-slate-300 mb-3" />
                 <p>No health logs found.</p>
               </div>
            ) : (
              logs.slice(0, 3).map(log => {
                const pet = pets.find(p => p.id === log.pet_id);
                const isExpanded = expandedLogId === log.id;
                
                return (
                  <div 
                    key={log.id} 
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className={`p-4 transition-all cursor-pointer rounded-xl border ${isExpanded ? 'bg-[#ffc22f]/10 border-[#ffc22f]/40 shadow-sm mb-2' : 'hover:bg-slate-50 border-transparent border-b-slate-50 last:border-0'}`}
                  >
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <RiskBadge level={log.analysis.risk?.riskLevel} />
                          {pet && (
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              {pet.name}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />
                            {new Date(log.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm text-slate-800 ${!isExpanded && 'line-clamp-2'} transition-all`}>
                          "{log.input}"
                        </p>
                      </div>
                      <div className="mt-1 text-slate-400">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                    
                    {/* Expandable Content Area */}
                    {isExpanded && log.analysis.risk && (
                      <div className="mt-4 pt-4 border-t border-[#ffc22f]/30 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                              <ShieldAlert className="h-3 w-3" /> Assessment
                            </p>
                            <p className="text-sm text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                              {log.analysis.risk.reasoning}
                            </p>
                          </div>
                          
                          {log.analysis.planner?.immediateActions && log.analysis.planner.immediateActions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                                <ListChecks className="h-3 w-3" /> Action Items
                              </p>
                              <ul className="space-y-1 mt-1">
                                {log.analysis.planner.immediateActions.map((action, i) => (
                                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-[#f58b05] shrink-0 mt-0.5" /> 
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PETS VIEW ================= */
function PetsView({ pets, setPets }: { pets: Pet[], setPets: React.Dispatch<React.SetStateAction<Pet[]>> }) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddPet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPet = {
      name: formData.get("name") as string,
      species: formData.get("species") as "Dog" | "Cat" | "Bird" | "Other",
      breed: formData.get("breed") as string,
      age: parseInt(formData.get("age") as string, 10),
      weight: parseFloat(formData.get("weight") as string)
    };
    
    if (supabase) {
      // Supabase Insert
      const { data, error } = await supabase.from("pets").insert([newPet]).select();
      if (!error && data) {
        setPets((prev) => [...prev, data[0]]);
      } else {
        console.error("Error adding pet to Supabase:", error);
        setPets((prev) => [...prev, { ...newPet, id: crypto.randomUUID() }]);
      }
    } else {
       // Fallback for missing env vars
       setPets((prev) => [...prev, { ...newPet, id: crypto.randomUUID() }]);
    }
    
    setShowAddForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pet Directory</h1>
          <p className="text-slate-500 mt-1">Manage your pets' profiles.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#f58b05] hover:bg-[#d67904] text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          {showAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          <span className="hidden sm:inline">{showAddForm ? "Cancel" : "Add Pet"}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4">Add a New Pet</h2>
          <form onSubmit={handleAddPet} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input required name="name" type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#f58b05] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Species</label>
              <select name="species" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#f58b05] outline-none">
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Breed</label>
              <input required name="breed" type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#f58b05] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age (Years)</label>
              <input required name="age" type="number" step="0.1" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#f58b05] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
              <input required name="weight" type="number" step="0.1" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#f58b05] outline-none" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-[#f58b05] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#d67904] transition-colors">
                Save Pet Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {pets.length === 0 && !showAddForm ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <PawPrint className="h-16 w-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Pets Found</h3>
          <p className="text-slate-500 mb-6 max-w-md text-center">Add your first pet to start tracking their medical records, activities, and accessing the Vet Copilot.</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-[#f58b05] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#d67904] transition-colors"
          >
            Add Your First Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map(pet => (
            <div key={pet.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 w-full h-16 bg-slate-50"></div>
              <div className="relative w-20 h-20 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center text-slate-300 mb-4 mt-2 z-10 group-hover:scale-105 transition-transform group-hover:text-[#f58b05]">
                {pet.species === "Cat" ? <Cat className="h-10 w-10" /> : pet.species === "Dog" ? <Dog className="h-10 w-10" /> : <PawPrint className="h-10 w-10" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{pet.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{pet.breed}</p>
              
              <div className="w-full grid grid-cols-2 gap-2 text-sm border-t border-slate-100 pt-4 mt-auto">
                <div className="bg-slate-50 rounded-lg py-2">
                  <span className="block text-slate-400 text-xs font-medium">Age</span>
                  <span className="font-semibold text-slate-700">{pet.age} yrs</span>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <span className="block text-slate-400 text-xs font-medium">Weight</span>
                  <span className="font-semibold text-slate-700">{pet.weight} kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= RECORDS VIEW ================= */
function RecordsView({ pets, records, setRecords }: { pets: Pet[], records: MedicalRecord[], setRecords: React.Dispatch<React.SetStateAction<MedicalRecord[]>> }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterpet_id, setFilterpet_id] = useState<string>("");

  const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRecord = {
      pet_id: formData.get("pet_id") as string,
      title: formData.get("title") as string,
      type: formData.get("type") as "Vaccine" | "Medication" | "Surgery" | "Checkup",
      date: formData.get("date") as string,
      next_due_date: (formData.get("next_due_date") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from("medical_records")
        .insert([newRecord])
        .select();

      if (!error && data && data.length > 0) {
        setRecords((prev) => [data[0] as MedicalRecord, ...prev]);
      } else {
        console.error("Insert error:", error);
        setRecords((prev) => [{...newRecord, id: crypto.randomUUID()} as MedicalRecord, ...prev]);
      }
    } else {
      setRecords((prev) => [{...newRecord, id: crypto.randomUUID()} as MedicalRecord, ...prev]);
    }
    
    setShowAddForm(false);
  };

  const filteredRecords = filterpet_id ? records.filter(r => r.pet_id === filterpet_id) : records;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medical Records</h1>
          <p className="text-slate-500 mt-1">Track vaccinations, meds, and history.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {pets.length > 0 && (
            <select 
              value={filterpet_id}
              onChange={(e) => setFilterpet_id(e.target.value)}
              className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Pets</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={pets.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {showAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span className="hidden sm:inline">{showAddForm ? "Cancel" : "Add Record"}</span>
          </button>
        </div>
      </div>

      {pets.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>Please add a pet in the <strong>My Pets</strong> section before adding medical records.</p>
        </div>
      )}

      {showAddForm && pets.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Syringe className="h-5 w-5 text-blue-500"/> New Medical Record</h2>
          <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Pet</label>
              <select required name="pet_id" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Record Type</label>
              <select name="type" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Vaccine">Vaccine</option>
                <option value="Medication">Medication</option>
                <option value="Checkup">General Checkup</option>
                <option value="Surgery">Surgery/Procedure</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title/Description</label>
              <input required name="title" type="text" placeholder="e.g., Rabies Vaccine, Heartworm Meds" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Given</label>
              <input required name="date" type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Due Date (Optional)</label>
              <input name="next_due_date" type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <textarea name="notes" rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredRecords.length === 0 && !showAddForm ? (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <FileText className="h-16 w-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Records Found</h3>
          <p className="text-slate-500 mb-6">Keep track of your pets' vaccinations, checkups, and medications here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map(record => {
            const pet = pets.find(p => p.id === record.pet_id);
            
            // Icon and color mapping
            let Icon = FileText;
            let colorStr = "slate";
            if (record.type === "Vaccine") { Icon = Syringe; colorStr = "blue"; }
            if (record.type === "Medication") { Icon = HeartPulse; colorStr = "rose"; }
            if (record.type === "Checkup") { Icon = Stethoscope; colorStr = "emerald"; }

            return (
              <div key={record.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-4 hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-${colorStr}-50 text-${colorStr}-500`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900">{record.title}</h3>
                    {pet && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{pet.name}</span>}
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-2">
                    <Calendar className="h-3.5 w-3.5" /> {new Date(record.date).toLocaleDateString()}
                  </p>
                  
                  {record.notes && <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded mb-3 border border-slate-100">{record.notes}</p>}
                  
                  {record.next_due_date && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md border border-amber-100">
                      <Clock className="h-3.5 w-3.5" /> Next Due: {new Date(record.next_due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================= ACTIVITY VIEW ================= */
function ActivityView({ pets, activities, setActivities }: { pets: Pet[], activities: ActivityLog[], setActivities: React.Dispatch<React.SetStateAction<ActivityLog[]>> }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterpet_id, setFilterpet_id] = useState<string>("");
  
  const handleAddActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newActivity = {
      pet_id: formData.get("pet_id") as string,
      type: formData.get("type") as "Walk" | "Playtime" | "Training" | "Other",
      duration_mins: parseInt(formData.get("duration") as string, 10),
      date: formData.get("date") as string,
      notes: (formData.get("notes") as string) || undefined
    };
    
    if (supabase) {
      const { data, error } = await supabase
        .from("activity_logs")
        .insert([newActivity])
        .select();

      if (!error && data && data.length > 0) {
        setActivities(prev => [data[0] as ActivityLog, ...prev]);
      } else {
        console.error("Insert activity error:", error);
        setActivities(prev => [{...newActivity, id: crypto.randomUUID()} as ActivityLog, ...prev]);
      }
    } else {
      setActivities(prev => [{...newActivity, id: crypto.randomUUID()} as ActivityLog, ...prev]);
    }

    setShowAddForm(false);
  };

  const filteredActivities = filterpet_id ? activities.filter(a => a.pet_id === filterpet_id) : activities;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity Tracker</h1>
          <p className="text-slate-500 mt-1">Log walks, playtime, and exercises.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {pets.length > 0 && (
            <select 
              value={filterpet_id}
              onChange={(e) => setFilterpet_id(e.target.value)}
              className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Pets</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={pets.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {showAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span className="hidden sm:inline">{showAddForm ? "Cancel" : "Log Activity"}</span>
          </button>
        </div>
      </div>

      {pets.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>Please add a pet in the <strong>My Pets</strong> section before logging activities.</p>
        </div>
      )}

      {showAddForm && pets.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Bone className="h-5 w-5 text-emerald-500"/> Log New Activity</h2>
          <form onSubmit={handleAddActivity} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Pet</label>
              <select required name="pet_id" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Activity Type</label>
              <select name="type" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="Walk">Walk</option>
                <option value="Playtime">Playtime</option>
                <option value="Training">Training</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Minutes)</label>
              <input required name="duration" type="number" min="1" placeholder="e.g. 30" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <input name="notes" type="text" placeholder="e.g. Walked in the park, practiced sit & stay" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                Save Activity
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredActivities.length === 0 && !showAddForm ? (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <Timer className="h-16 w-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Activities Yet</h3>
          <p className="text-slate-500 mb-6">Log your pet's walks, play sessions, and training here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-sm font-medium text-slate-500">Pet</th>
                <th className="p-4 text-sm font-medium text-slate-500">Activity</th>
                <th className="p-4 text-sm font-medium text-slate-500">Duration</th>
                <th className="p-4 text-sm font-medium text-slate-500 hidden sm:table-cell">Date</th>
                <th className="p-4 text-sm font-medium text-slate-500 hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map(activity => {
                const pet = pets.find(p => p.id === activity.pet_id);
                let Icon = PawPrint;
                if (activity.type === "Walk") Icon = Bone;
                
                return (
                  <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs">{pet?.name || 'Unknown'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Icon className="h-3 w-3" />
                        </div>
                        {activity.type}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{activity.duration_mins} min</td>
                    <td className="p-4 text-sm text-slate-500 hidden sm:table-cell">{new Date(activity.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-slate-500 hidden md:table-cell truncate max-w-[200px]">{activity.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================= VET COPILOT VIEW ================= */
function CopilotView({ pets, logs, setLogs }: { pets: Pet[], logs: Log[], setLogs: React.Dispatch<React.SetStateAction<Log[]>> }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [selectedpet_id, setSelectedpet_id] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result.split(",")[1];
        setImageBase64(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageBase64("");
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const runAgentPipeline = async (input: string, imageBase64Data: string | null = null, pet_id: string | null) => {
    setIsProcessing(true);

    try {
      // Step 1
      setProcessingStage("Interpreting symptoms...");
      const interpreter = await callGeminiAPI(
        input || "Analyze image",
        "You are a veterinary interpreter",
        interpreterSchema,
        imageBase64Data ? { mimeType: "image/jpeg", data: imageBase64Data } : null
      );

      // Step 2
      setProcessingStage("Analyzing risk...");
      const risk = await callGeminiAPI(
        JSON.stringify(interpreter),
        "You are a veterinary triage expert",
        riskSchema
      );

      // Step 3
      setProcessingStage("Planning care...");
      const planner = await callGeminiAPI(
        JSON.stringify({ interpreter, risk }),
        "You are a veterinary planner",
        plannerSchema
      );

      const newLogDB = {
        pet_id: pet_id || null,
        date: new Date().toISOString(),
        type: imageBase64Data ? "image" : "text",
        input: input || "Image Analysis",
        analysis: {
          interpreter,
          risk,
          planner
        }
      };

      if (supabase) {
        const { data, error } = await supabase
          .from("logs")
          .insert([newLogDB])
          .select();

        if (!error && data && data.length > 0) {
          const formatted: Log = {
            id: data[0].id,
            pet_id: data[0].pet_id,
            date: data[0].date,
            type: data[0].type,
            input: data[0].input,
            analysis: data[0].analysis
          };

          setLogs((prev) => [formatted, ...prev]);
        } else {
          console.error("Insert log error:", error);
          setLogs(prev => [{...newLogDB, id: crypto.randomUUID()} as Log, ...prev]);
        }
      } else {
        setLogs(prev => [{...newLogDB, id: crypto.randomUUID()} as Log, ...prev]);
      }

      // Reset
      setInputText("");
      setSelectedImage(null);
      setImageBase64("");
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error(error);
      alert("Analysis failed. Check your API configuration.");
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText && !imageBase64) return;
    runAgentPipeline(inputText, imageBase64, selectedpet_id);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-4 shrink-0">
        <h1 className="text-3xl font-bold text-slate-900">Vet Copilot</h1>
        <p className="text-slate-500 mt-1">Describe symptoms or upload an image for instant AI analysis.</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Chat / Logs area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">
          {logs.length === 0 && !isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-20 h-20 bg-[#f58b05]/10 rounded-full flex items-center justify-center mb-4">
                <Stethoscope className="h-10 w-10 text-[#f58b05]" />
              </div>
              <p className="text-lg font-medium text-slate-600">How can I help your pet today?</p>
              <p className="text-sm mt-2 max-w-md text-center">Describe what you're observing or upload a clear photo of the concern to get an instant AI assessment.</p>
            </div>
          ) : (
            logs.map((log) => {
              const pet = pets.find(p => p.id === log.pet_id);
              
              return (
                <div key={log.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RiskBadge level={log.analysis.risk?.riskLevel} />
                      <span className="font-medium text-slate-900">
                        {pet ? pet.name : "Unknown Pet"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(log.date).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="p-5">
                    <div className="mb-4 border-b border-slate-100 pb-4">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Input Query</p>
                      <div className="flex items-start gap-3">
                         {log.type === "image" && <ImageIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />}
                         <p className="text-slate-800 italic">"{log.input}"</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Interpreter */}
                      <div>
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                          <Info className="h-4 w-4 text-blue-500" /> Clinical Summary
                        </h4>
                        <p className="text-sm text-slate-600">{log.analysis.interpreter?.clinicalSummary}</p>
                      </div>

                      {/* Risk */}
                      <div>
                         <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                          <ShieldAlert className="h-4 w-4 text-orange-500" /> Assessment & Urgency
                        </h4>
                        <p className="text-sm text-slate-600">{log.analysis.risk?.reasoning}</p>
                        <p className="text-sm font-medium text-slate-700 mt-2">Urgency: {log.analysis.risk?.urgency}</p>
                      </div>

                      {/* Action Plan */}
                      {log.analysis.planner?.immediateActions && log.analysis.planner.immediateActions.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                            <ListChecks className="h-4 w-4 text-emerald-500" /> Recommended Actions
                          </h4>
                          <ul className="space-y-2">
                            {log.analysis.planner.immediateActions.map((action, i) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {isProcessing && (
            <div className="bg-white border border-[#f58b05]/30 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in-95">
              <Loader2 className="h-8 w-8 text-[#f58b05] animate-spin mb-4" />
              <span className="text-slate-800 font-medium">{processingStage}</span>
              <span className="text-slate-500 text-sm mt-1">Please wait while the AI analyzes the data...</span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-3 md:p-4 bg-white border-t border-slate-200">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
              <button 
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
            {pets.length > 0 && (
              <select 
                value={selectedpet_id}
                onChange={e => setSelectedpet_id(e.target.value)}
                className="hidden md:block h-[42px] px-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#f58b05] outline-none text-slate-600"
              >
                <option value="">Select Pet</option>
                {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-2 py-1 focus-within:ring-2 focus-within:ring-[#f58b05] focus-within:bg-white transition-all">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-[#f58b05] hover:bg-orange-50 rounded-lg transition-colors"
                title="Upload image"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*"
                className="hidden" 
              />
              <input 
                type="text" 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                placeholder="Describe symptoms or paste an image..."
                className="flex-1 bg-transparent px-3 py-2 outline-none text-sm"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isProcessing || (!inputText && !imageBase64)}
              className="h-[42px] px-4 bg-[#f58b05] text-white rounded-xl font-medium hover:bg-[#d67904] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
            >
              <span className="hidden md:inline">Analyze</span>
              <Send className="h-4 w-4 md:ml-2" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}