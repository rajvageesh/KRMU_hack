import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Send, CheckCircle, Clock, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { formatRelative, formatDateTime, getStatusColor, getSeverityColor } from '../lib/utils';
import type { Complaint, Message } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const STATUS_STEPS = ['Submitted', 'Under Review', 'Inquiry', 'Resolved', 'Closed'];

export default function TrackPage() {
    const [caseId, setCaseId] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [complaintId, setComplaintId] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'status' | 'chat'>('status');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Poll messages every 10s
    useEffect(() => {
        if (!complaintId) return;
        const fetchMessages = async () => {
            try {
                const res = await api.get<Message[]>(`/complaints/${complaintId}/messages?pin=${pin}`);
                setMessages(res.data);
            } catch { /* ignore */ }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [complaintId, pin]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post<{ complaint: Complaint; complaintId: string }>('/complaints/verify', { caseId: caseId.trim().toUpperCase(), pin: pin.trim() });
            setComplaint(res.data.complaint);
            setComplaintId(res.data.complaintId);
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMsg.trim()) return;
        setSending(true);
        try {
            const res = await api.post<Message>(`/complaints/${complaintId}/messages`, {
                message: newMsg.trim(), senderRole: 'employee', pin,
            });
            setMessages((prev) => [...prev, res.data]);
            setNewMsg('');
        } catch { /* ignore */ }
        finally { setSending(false); }
    };

    const currentStepIndex = complaint ? STATUS_STEPS.indexOf(complaint.status) : -1;

    // ─── Verify Form ──────────────────────────────────────────────────────────
    if (!complaint) {
        return (
            <div className=" bg-[#F9FAFB] font-main flex flex-col">
                {/* <Navbar /> */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full h-screen flex flex-col justify-center max-w-md">
                        <div className="text-center mb-10">
                          
                            <h1 className="text-3xl font-bold text-gray-900 font-special tracking-wide">Track Your Case</h1>
                            <p className="text-gray-500 mt-2">Enter your Case ID and PIN to view status</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg shadow-gray-100">
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Case ID</label>
                                    <input type="text" value={caseId} onChange={(e) => setCaseId(e.target.value)} required
                                        placeholder="SD-2024-0001"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">PIN</label>
                                    <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required
                                        placeholder="6-digit PIN"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                                </div>
                                {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                                <button type="submit" disabled={loading}
                                    className="w-full bg-green-500 hover:scale-102 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search className="w-5 h-5" /> Find My Case</>}
                                </button>
                            </form>
                        </div>
                        <p className="text-center mt-8">
                            <Link to="/" className="text-gray-500 hover:text-gray-900 text-sm transition-colors flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to Home
                            </Link>
                        </p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ─── Case View ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F9FAFB] font-main flex flex-col">
            {/* <Navbar /> */}
            <div className="flex-1 max-w-4xl mx-auto w-full p-4 py-8">
                <div className="flex items-center gap-4 mb-8 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                   
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Case ID</p>
                        <h1 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{complaint.caseId}</h1>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                complaint.status === 'Closed' ? 'bg-gray-100 text-gray-700' :
                                    'bg-blue-100 text-blue-700'
                            }`}>
                            {complaint.status}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${complaint.severityLevel === 'High' ? 'bg-red-100 text-red-700' :
                                complaint.severityLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                    'bg-green-100 text-green-700'
                            }`}>
                            {complaint.severityLevel} Severity
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-xl mb-8 w-fit mx-auto">
                    {(['status', 'chat'] as const).map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {tab === 'chat' ? 'Chat with ICC' : 'Case Status'}
                        </button>
                    ))}
                </div>

                {/* Status Tab */}
                {activeTab === 'status' && (
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                        {/* Timeline */}
                        <div className="space-y-0 mb-10 relative">
                            {/* Connector Line */}
                            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100"></div>

                            {STATUS_STEPS.map((s, i) => {
                                const done = i <= currentStepIndex;
                                const active = i === currentStepIndex;
                                return (
                                    <div key={s} className="relative flex items-center gap-6 py-4 first:pt-0 last:pb-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-4 border-white ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
                                            {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4 text-gray-400" />}
                                        </div>
                                        <div className={`flex-1 p-4 rounded-xl border transition-all ${active ? 'bg-green-50 border-green-100' : 'bg-transparent border-transparent'}`}>
                                            <p className={`text-sm font-bold ${active ? 'text-green-800' : done ? 'text-gray-900' : 'text-gray-400'}`}>{s}</p>
                                            {active && <p className="text-xs text-green-600 mt-1 font-medium">Current stage of investigation</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Details */}
                        <div className="border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Incident Type', value: complaint.incidentType },
                                { label: 'Date', value: complaint.incidentDate },
                                { label: 'Location', value: complaint.location },
                                { label: 'Filed', value: formatDateTime(complaint.createdAt) },
                                { label: 'Last Updated', value: formatRelative(complaint.updatedAt) },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <span className="text-gray-500 text-xs uppercase tracking-wide block mb-1">{label}</span>
                                    <span className="text-gray-900 font-medium block">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="bg-white border border-gray-200 rounded-3xl flex flex-col shadow-sm overflow-hidden" style={{ height: '600px' }}>
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-gray-500 text-sm">
                            <Shield className="w-4 h-4" />
                            Secure, end-to-end encrypted channel
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F9FAFB]">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium">No messages yet.</p>
                                    <p className="text-xs mt-1">The ICC will respond here securely.</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg._id} className={`flex ${msg.senderRole === 'employee' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm shadow-sm ${msg.senderRole === 'employee'
                                                ? 'bg-green-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                            }`}>
                                            <p className={`text-xs font-bold mb-1 ${msg.senderRole === 'employee' ? 'text-green-100' : 'text-blue-600'}`}>
                                                {msg.senderRole === 'employee' ? 'You' : 'ICC Committee'}
                                            </p>
                                            <p className="leading-relaxed">{msg.message}</p>
                                            <p className={`text-[10px] mt-2 text-right ${msg.senderRole === 'employee' ? 'text-green-100/70' : 'text-gray-400'}`}>
                                                {formatRelative(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-3">
                            <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                                placeholder={complaint.status === 'Closed' ? 'Case is closed' : 'Type a secure message...'}
                                disabled={complaint.status === 'Closed'}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:opacity-50 disabled:bg-gray-100" />
                            <button type="submit" disabled={!newMsg.trim() || sending || complaint.status === 'Closed'}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-3 rounded-xl transition-all shadow-md shadow-green-100">
                                {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );





}
