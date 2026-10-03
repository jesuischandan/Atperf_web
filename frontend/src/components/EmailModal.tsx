import { useState, useEffect } from 'react';
import { Mail, Send, AlertCircle, Loader2, Check } from 'lucide-react';
import API_URL from '../utils/apiUrl';

export type ReportType = 'strap' | 'decision_radar' | 'proextract' | 'strap_analysis' | 'strapilot';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
    pdfBase64: string;
    filename: string;
    
    // Info needed for preview generation
    reportType: ReportType;
    language: string;
    recipientName?: string;
    reportTitle: string;
    overallOutcomes: string;
}

export default function EmailModal({ 
    isOpen, onClose, userEmail, pdfBase64, filename,
    reportType, language, recipientName, reportTitle, overallOutcomes
}: EmailModalProps) {
    const [sendToMe, setSendToMe] = useState(true);
    const [sendToOthers, setSendToOthers] = useState(false);
    const [otherEmails, setOtherEmails] = useState('');
    const [ccMe, setCcMe] = useState(true);
    
    // Preview states
    const [previewSubject, setPreviewSubject] = useState('');
    const [previewBody, setPreviewBody] = useState('');
    const [fetchingPreview, setFetchingPreview] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPreview();
        } else {
            // Reset state when closed
            setSuccess(false);
            setError('');
            setOtherEmails('');
            setSendToOthers(false);
            setSendToMe(true);
            setCcMe(true);
        }
    }, [isOpen]);

    const fetchPreview = async () => {
        setFetchingPreview(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/reports/email/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report_type: reportType,
                    language,
                    recipient_name: recipientName || '',
                    report_title: reportTitle,
                    overall_outcomes: overallOutcomes
                })
            });
            if (!res.ok) throw new Error('Failed to fetch email preview');
            const data = await res.json();
            setPreviewSubject(data.subject);
            setPreviewBody(data.body);
        } catch (err: any) {
            console.error(err);
            // Fallbacks if AI preview fails
            setPreviewSubject(`Report: ${reportTitle}`);
            setPreviewBody(`Please find attached the report for ${reportTitle}.\n\nOutcomes:\n${overallOutcomes}`);
        } finally {
            setFetchingPreview(false);
        }
    };

    if (!isOpen) return null;

    const handleSend = async () => {
        setError('');
        
        let toEmails: string[] = [];
        let ccEmails: string[] = [];

        if (sendToMe && userEmail) {
            toEmails.push(userEmail);
        }

        if (sendToOthers && otherEmails.trim()) {
            const parsedEmails = otherEmails.split(',').map(e => e.trim()).filter(e => e);
            toEmails = [...toEmails, ...parsedEmails];
        }

        if (toEmails.length === 0) {
            setError('Please provide at least one recipient email.');
            return;
        }

        if (sendToOthers && ccMe && userEmail && !toEmails.includes(userEmail)) {
            ccEmails.push(userEmail);
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_emails: toEmails,
                    cc_emails: ccEmails,
                    subject: previewSubject,
                    body: previewBody,
                    filename,
                    pdf_base64: pdfBase64
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to send email');
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'An error occurred while sending the email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-indigo-600 px-6 py-4 flex items-center gap-3 shrink-0">
                    <Mail className="text-white" size={20} />
                    <h2 className="text-lg font-bold text-white">Share Report</h2>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {success ? (
                        <div className="text-center py-8 space-y-3">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Email Sent!</h3>
                            <p className="text-slate-500">The report has been shared successfully.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {/* Send to me */}
                                <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                                        checked={sendToMe}
                                        onChange={(e) => setSendToMe(e.target.checked)}
                                    />
                                    <div>
                                        <div className="font-semibold text-slate-800">Send to me</div>
                                        <div className="text-sm text-slate-500">{userEmail || 'Your account email'}</div>
                                    </div>
                                </label>

                                {/* Send to others */}
                                <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                                        checked={sendToOthers}
                                        onChange={(e) => {
                                            setSendToOthers(e.target.checked);
                                            if (!e.target.checked) setCcMe(false);
                                        }}
                                    />
                                    <div className="w-full">
                                        <div className="font-semibold text-slate-800">Send to someone else</div>
                                        {sendToOthers && (
                                            <div className="mt-3 space-y-3" onClick={e => e.preventDefault()}>
                                                <input
                                                    type="text"
                                                    placeholder="colleague@example.com, manager@domain.com"
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={otherEmails}
                                                    onChange={e => setOtherEmails(e.target.value)}
                                                />
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                                                        checked={ccMe}
                                                        onChange={(e) => setCcMe(e.target.checked)}
                                                    />
                                                    <span className="text-sm text-slate-600">CC me a copy</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>

                            {/* Email Preview Section */}
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    Email Message Preview
                                </h3>
                                
                                {fetchingPreview ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                                        <Loader2 size={16} className="animate-spin" />
                                        Generating professional message...
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                value={previewSubject}
                                                onChange={e => setPreviewSubject(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Message Body</label>
                                            <textarea
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[150px] bg-white text-slate-700"
                                                value={previewBody}
                                                onChange={e => setPreviewBody(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                                    disabled={loading || fetchingPreview}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-70"
                                    disabled={loading || fetchingPreview}
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Send Report
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
