import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Upload, Sparkles, CheckCircle, Copy, ArrowRight, ArrowLeft, X } from 'lucide-react';
import api from '../lib/api';
import type { IncidentType, SeverityLevel, SubmitComplaintResponse, AIImproveResponse } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const INCIDENT_TYPES: IncidentType[] = [
    'Sexual Harassment', 'Verbal Abuse', 'Physical Harassment', 'Cyber Harassment',
    'Discrimination', 'Hostile Work Environment', 'Retaliation', 'Other',
];
const ACCUSED_ROLES = ['Supervisor/Manager', 'Colleague/Peer', 'Subordinate', 'Client/Customer', 'Vendor/Contractor', 'Other'];
const ORG_ID = import.meta.env.VITE_ORG_ID ?? '000000000000000000000001';

interface FormData {
    incidentType: IncidentType | '';
    incidentDate: string;
    incidentTime: string;
    location: string;
    description: string;
    accusedRole: string;
    accusedDepartment: string;
    isAnonymous: boolean;
    severityLevel: SeverityLevel;
}

const STEPS = ['Incident Details', 'Description', 'Accused Info', 'Evidence', 'Review'];

export default function ReportPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormData>({
        incidentType: '', incidentDate: '', incidentTime: '', location: '',
        description: '', accusedRole: '', accusedDepartment: '', isAnonymous: true, severityLevel: 'Medium',
    });
    const [files, setFiles] = useState<File[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    // const [aiResult, setAiResult] = useState<AIImproveResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitComplaintResponse | null>(null);
    const [copied, setCopied] = useState(false);

    const update = (field: keyof FormData, value: string | boolean | SeverityLevel) =>
        setForm((f) => ({ ...f, [field]: value }));

    // const handleAiImprove = async () => {
    //     if (form.description.length < 20) return;
    //     setAiLoading(true);
    //     try {
    //         const res = await api.post<AIImproveResponse>('/ai/improve', { description: form.description });
    //         setAiResult(res.data);
    //     } catch { /* silently fail */ }
    //     finally { setAiLoading(false); }
    // };

    // const applyAiSuggestion = () => {
    //     if (!aiResult) return;
    //     update('description', aiResult.improvedText);
    //     update('severityLevel', aiResult.detectedSeverity);
    //     setAiResult(null);
    // };

    const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024);
        setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await api.post<SubmitComplaintResponse>('/complaints', {
                ...form, organizationId: ORG_ID,
            });
            // Upload evidence files
            if (files.length > 0) {
                for (const file of files) {
                    const fd = new FormData();
                    fd.append('file', file);
                    await api.post(`/evidence/${res.data.complaintId}`, fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                }
            }
            setResult(res.data);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to submit complaint. Please check the console for details.');
        }
        finally { setSubmitting(false); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ─── Success Screen ───────────────────────────────────────────────────────
    if (result) {
        return (
            <div className="min-h-screen bg-lenear-to-br from-green-50 to-blue-50 font-main flex flex-col">
                    
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-md text-center">
                        <div className="w-20 h-20 bg-green-100 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complaint Submitted</h2>
                        <p className="text-gray-500 mb-8">Save your Case ID and PIN — you'll need them to track your case.</p>

                        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-4 shadow-sm">
                            <div>
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Case ID</p>
                                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                    <span className="font-mono font-bold text-gray-900 text-xl">{result.caseId}</span>
                                    <button onClick={() => copyToClipboard(result.caseId)} className="text-green-600 hover:text-green-700">
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">One-Time PIN</p>
                                <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                                    <span className="font-mono font-bold text-green-700 text-2xl tracking-widest">{result.pin}</span>
                                    <button onClick={() => copyToClipboard(result.pin)} className="text-green-600 hover:text-green-700">
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            {copied && <p className="text-green-600 text-sm font-medium">Copied to clipboard!</p>}
                        </div>

                        <div className="flex gap-3">
                            <Link to="/track" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all text-center shadow-lg shadow-green-200">
                                Track My Case
                            </Link>
                            <Link to="/" className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all text-center">
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ─── Form Steps ───────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F9FAFB] font-main flex flex-col">
            {/* <Navbar /> */}
            <div className="flex-1 max-w-3xl mx-auto w-full p-4 py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 font-special tracking-wide">File a Complaint</h1>
                    <p className="text-gray-500">Secure, encrypted, and anonymous reporting portal</p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-10 px-2">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-2 ${i <= step ? 'text-green-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${i < step ? 'bg-green-600 border-green-600 text-white' :
                                    i === step ? 'border-green-600 text-green-600 bg-green-50' :
                                        'border-gray-300 text-gray-400 bg-white'
                                    }`}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span className={`text-sm hidden sm:block ${i === step ? 'font-semibold text-gray-900' : ''}`}>{s}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                    {/* Step 0: Incident Details */}
                    {step === 0 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Incident Details</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Incident *</label>
                                <select value={form.incidentType} onChange={(e) => update('incidentType', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                                    <option value="">Select type...</option>
                                    {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                    <input type="date" value={form.incidentDate} onChange={(e) => update('incidentDate', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time (optional)</label>
                                    <input type="time" value={form.incidentTime} onChange={(e) => update('incidentTime', e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)}
                                    placeholder="e.g. Conference Room B, 3rd Floor"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                            </div>
                            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                                <input type="checkbox" id="anon" checked={form.isAnonymous} onChange={(e) => update('isAnonymous', e.target.checked)}
                                    className="w-5 h-5 rounded accent-green-600 text-green-600 focus:ring-green-500" />
                                <label htmlFor="anon" className="text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">Submit anonymously</span>
                                    <span className="text-gray-500 block sm:inline sm:ml-1">(Recommended — your identity will not be revealed)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Description */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Describe the Incident</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                                    rows={8} placeholder="Describe what happened in as much detail as you are comfortable sharing..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all" />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-500">{form.description.length} characters</p>
                                    {/* {form.description.length >= 20 && (
                                        <button onClick={handleAiImprove} disabled={aiLoading}
                                            className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-60">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            {aiLoading ? 'Analyzing...' : 'Improve with AI'}
                                        </button>
                                    )} */}
                                </div>
                            </div>

                           

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Severity Level</label>
                                <div className="flex gap-3">
                                    {(['Low', 'Medium', 'High'] as SeverityLevel[]).map((s) => (
                                        <button key={s} type="button" onClick={() => update('severityLevel', s)}
                                            className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${form.severityLevel === s
                                                ? s === 'High' ? 'bg-red-50 border-red-500 text-red-600 ring-1 ring-red-500' : s === 'Medium' ? 'bg-amber-50 border-amber-500 text-amber-600 ring-1 ring-amber-500' : 'bg-green-50 border-green-500 text-green-600 ring-1 ring-green-500'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Accused Info */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Accused</h2>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
                                <Shield className="w-5 h-5 flex-shrink-0 text-amber-600" />
                                This information helps the ICC investigate strictly and impartially. The accused will not typically know who filed the complaint initially.
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role of Accused *</label>
                                <select value={form.accusedRole} onChange={(e) => update('accusedRole', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                                    <option value="">Select role...</option>
                                    {ACCUSED_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Department (optional)</label>
                                <input type="text" value={form.accusedDepartment} onChange={(e) => update('accusedDepartment', e.target.value)}
                                    placeholder="e.g. Sales, Engineering, HR"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Evidence */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Evidence (Optional)</h2>
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:border-green-500 hover:bg-green-50/30 transition-all group">
                                <div className="w-16 h-16 bg-gray-100 group-hover:bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-600" />
                                </div>
                                <p className="text-gray-900 font-medium mb-1">Drag and drop or click to browse</p>
                                <p className="text-gray-500 text-sm mb-6">Images, PDFs, documents — max 10MB each</p>
                                <label className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-medium px-6 py-3 rounded-xl cursor-pointer transition-colors shadow-lg">
                                    <Upload className="w-4 h-4" />
                                    Choose Files
                                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileAdd} className="hidden" />
                                </label>
                            </div>
                            {files.length > 0 && (
                                <div className="space-y-3">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-gray-500">{f.name.split('.').pop()?.toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                                                <p className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
                                {[
                                    { label: 'Incident Type', value: form.incidentType },
                                    { label: 'Date', value: form.incidentDate },
                                    { label: 'Location', value: form.location },
                                    { label: 'Accused Role', value: form.accusedRole },
                                    { label: 'Severity', value: form.severityLevel },
                                    { label: 'Anonymous', value: form.isAnonymous ? 'Yes' : 'No' },
                                    { label: 'Evidence Files', value: files.length > 0 ? `${files.length} file(s)` : 'None' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                                        <span className="text-gray-500 text-sm">{label}</span>
                                        <span className="text-gray-900 text-sm font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Description</p>
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{form.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-4 mt-10 pt-6 border-t border-gray-100">
                        {step > 0 && (
                            <button onClick={() => setStep((s) => s - 1)}
                                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                                Back
                            </button>
                        )}
                        <div className="flex-1"></div>
                        {step < STEPS.length - 1 ? (
                            <button
                                onClick={() => setStep((s) => s + 1)}
                                disabled={
                                    (step === 0 && (!form.incidentType || !form.incidentDate || !form.location)) ||
                                    (step === 1 && form.description.length < 20) ||
                                    (step === 2 && !form.accusedRole)
                                }
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-green-200">
                                Continue <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-green-200">
                                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Submit Complaint</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
              <p className="text-center mt-8">
                        <Link
                            to="/"
                            className="text-gray-500 hover:text-gray-900 text-sm flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                    </p>
            <Footer />
        </div>
    );
}
