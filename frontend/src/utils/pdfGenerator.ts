import jsPDF from 'jspdf';

// Common styling constants
const MARGIN = 20;
const LINE_HEIGHT = 7;
const PAGE_WIDTH = 210; // A4
const PAGE_HEIGHT = 297; // A4

const FOOTER_TEXT = "Atperf Conseil | 3 AVENUE DE LA REINE ANNE 78490 MONTFORT-L'AMAURY | atperf.com/contact | r.rabhi@atperf.com | +33 6 61 40 95 29";

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
};

const addHeaderAndFooter = async (doc: jsPDF) => {
    try {
        const logoImg = await loadImage('/Logo_Atperf_transpart.png');
        const totalPages = doc.getNumberOfPages();
        // The logo natural size is 286x139. 
        // 10mm height maps very closely to Tailwind's 'h-10' visual weight on A4.
        const logoHeight = 10; 
        const logoWidth = logoHeight * (286 / 139); // ~ 20.57
        
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // Render Logo Top Right
            doc.addImage(logoImg, 'PNG', PAGE_WIDTH - MARGIN - logoWidth, 10, logoWidth, logoHeight);

            // Render Footer Bottom Center
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "normal");
            doc.text(FOOTER_TEXT, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });
        }
    } catch (e) {
        console.error("Failed to load PDF branding assets", e);
    }
};

export const generateTicketPDF = async (ticket: any, returnBase64: boolean = false) => {
    const doc = new jsPDF();
    let y = MARGIN;

    // Helper function to add wrapped text and manage pagination
    const addText = (text: string, fontSize: number, isBold: boolean, color: number[], indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        
        const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
            if (y > PAGE_HEIGHT - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
            doc.text(line, MARGIN + indent, y);
            y += LINE_HEIGHT;
        });
        
        // Add a little extra space after a block if it's not the end
        if (text.trim() !== "") {
            y += 2; 
        }
    };

    // Header
    addText(`ProExtract Ticket: ${ticket.title}`, 18, true, [15, 23, 42]);
    y += 4;
    
    addText(`Location: ${ticket.process_location || 'N/A'} | Date: ${new Date(ticket.created_at).toLocaleString()}`, 10, false, [100, 116, 139]);
    y += 8;

    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
    y += 4;

    if (ticket.standard_statement) {
        addText("STANDARD STATEMENT", 10, true, [15, 23, 42]);
        addText(ticket.standard_statement, 12, false, [51, 65, 85], 5);
        y += 6;
    }

    if (ticket.extracted_json) {
        addText("AI ROOT CAUSE", 10, true, [79, 70, 229]); // Indigo
        addText(ticket.extracted_json.root_cause_category, 12, false, [51, 65, 85], 5);
        y += 6;

        addText("INVOLVED TOOLS", 10, true, [100, 116, 139]);
        const tools = ticket.extracted_json.involved_tools.join(", ");
        addText(tools || "None identified", 11, false, [51, 65, 85], 5);
        y += 6;
    }

    if (ticket.resolution_steps && ticket.resolution_steps.length > 0) {
        addText("RESOLUTION PATH", 10, true, [15, 23, 42]);
        ticket.resolution_steps.forEach((step: string, index: number) => {
            addText(`${index + 1}. ${step}`, 11, false, [51, 65, 85], 5);
        });
        y += 6;
    }

    if (ticket.benchmark_gap) {
        addText("INDUSTRY BENCHMARK & GAPS", 10, true, [15, 23, 42]);
        addText(ticket.benchmark_gap, 11, false, [51, 65, 85], 5);
        y += 6;
    }

    addText("ORIGINAL DESCRIPTION", 10, true, [100, 116, 139]);
    addText(ticket.description, 11, false, [51, 65, 85], 5);

    const filename = `ProExtract_Ticket_${ticket.title.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    await addHeaderAndFooter(doc);

    if (returnBase64) {
        return { base64: doc.output('datauristring'), filename };
    }
    doc.save(filename);
    return null;
};

export const generateRadarPDF = async (radarAnalysis: any, returnBase64: boolean = false, chartImage?: string) => {
    const doc = new jsPDF();
    let y = MARGIN;

    // Helper function to add wrapped text and manage pagination
    const addText = (text: string, fontSize: number, isBold: boolean, color: number[], indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        
        const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
            if (y > PAGE_HEIGHT - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
            doc.text(line, MARGIN + indent, y);
            y += LINE_HEIGHT;
        });
        
        if (text.trim() !== "") {
            y += 2;
        }
    };

    // Header
    addText("Decision Radar Analysis", 18, true, [15, 23, 42]);
    y += 4;
    
    addText(`Date: ${new Date(radarAnalysis.created_at || Date.now()).toLocaleString()} | Language: ${(radarAnalysis.language || 'en').toUpperCase()}`, 10, false, [100, 116, 139]);
    y += 8;

    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
    y += 4;

    addText("TOPICS SCORED", 12, true, [15, 23, 42]);
    y += 4;

    radarAnalysis.topics.forEach((topic: any, index: number) => {
        addText(`${index + 1}. ${topic.name}`, 12, true, [51, 65, 85], 5);
        addText(`Impact: ${topic.impact} | Frequency: ${topic.frequency} | Cross-Func: ${topic.cross_functionality} | Anticipation: ${topic.anticipation}`, 10, false, [100, 116, 139], 10);
        y += 4;
    });
    
    y += 4;

    y += 4;

    if (chartImage) {
        // Line separator
        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
        y += 4;

        addText("RADAR CHART", 12, true, [15, 23, 42]);
        y += 4;

        // Calculate dimensions to fit width while maintaining aspect ratio
        // html2canvas usually retains the original element ratio
        const imgWidth = PAGE_WIDTH - MARGIN * 2;
        const imgHeight = imgWidth * 0.6; // Approximate ratio

        // Check page break
        if (y + imgHeight > PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            y = MARGIN;
        }

        try {
            doc.addImage(chartImage, 'PNG', MARGIN, y, imgWidth, imgHeight);
            y += imgHeight + 8;
        } catch (e) {
            console.error("Failed to add chart image to PDF", e);
        }
    }

    if (radarAnalysis.overall_diagnostic) {
        // Line separator
        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
        y += 4;

        addText("AI DIAGNOSTIC", 12, true, [79, 70, 229]); // Indigo
        y += 2;

        const paragraphs = radarAnalysis.overall_diagnostic.split('\n').filter((p: string) => p.trim() !== '');
        paragraphs.forEach((p: string) => {
            addText(p, 11, false, [51, 65, 85], 5);
            y += 2;
        });
    }

    // Determine filename
    const dateStr = new Date(radarAnalysis.created_at || Date.now()).toISOString().split('T')[0];
    const filename = `Decision_Radar_Analysis_${dateStr}.pdf`;
    
    await addHeaderAndFooter(doc);

    if (returnBase64) {
        return { base64: doc.output('datauristring'), filename };
    }
    doc.save(filename);
    return null;
};

export const generateStrapDiagPDF = async (diagnostic: any, returnBase64: boolean = false) => {
    const doc = new jsPDF();
    let y = MARGIN;

    // Helper function to add wrapped text and manage pagination
    const addText = (text: string, fontSize: number, isBold: boolean, color: number[], indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        
        const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
            if (y > PAGE_HEIGHT - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
            doc.text(line, MARGIN + indent, y);
            y += LINE_HEIGHT;
        });
        
        if (text.trim() !== "") {
            y += 2;
        }
    };

    // Header
    addText("Diagnostic StrAP - Résultat", 18, true, [15, 23, 42]);
    y += 4;
    
    addText(`Date: ${new Date(diagnostic.created_at || Date.now()).toLocaleString()}`, 10, false, [100, 116, 139]);
    y += 8;

    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
    y += 4;

    addText("SCORE STRAP", 12, true, [15, 23, 42]);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`${diagnostic.score_100} / 100`, MARGIN, y);
    y += 10;
    addText(diagnostic.category_result, 12, false, [51, 65, 85]);
    y += 8;

    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
    y += 4;

    addText("PERTES INVISIBLES ESTIMÉES", 12, true, [220, 38, 38]); // Red theme
    y += 2;
    addText(`Entre ${diagnostic.loss_pct_min}% et ${diagnostic.loss_pct_max}% du chiffre d'affaires par an.`, 14, true, [51, 65, 85]);
    addText("Ces pertes sont diluées dans l'inefficacité, la non-qualité et le manque d'anticipation de votre organisation.", 11, false, [100, 116, 139]);
    y += 8;

    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
    y += 4;

    addText("RECOMMANDATION STRATÉGIQUE (IA)", 12, true, [79, 70, 229]); // Indigo 
    y += 2;

    const paragraphs = (diagnostic.ai_advice || "").split('\n').filter((p: string) => p.trim() !== '');
    paragraphs.forEach((p: string) => {
        addText(p, 11, false, [51, 65, 85], 0);
        y += 2;
    });

    const dateStr = new Date(diagnostic.created_at || Date.now()).toISOString().split('T')[0];
    const filename = `Diagnostic_StrAP_${dateStr}.pdf`;
    
    await addHeaderAndFooter(doc);

    if (returnBase64) {
        return { base64: doc.output('datauristring'), filename };
    }
    doc.save(filename);
    return null;
};

export const generateStrapilotPDF = async (sessionData: any, returnBase64: boolean = false, chartsImages: string[] = []) => {
    const doc = new jsPDF();
    let y = MARGIN;

    const addText = (text: string, fontSize: number, isBold: boolean, color: number[], indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        
        const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
            if (y > PAGE_HEIGHT - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
            doc.text(line, MARGIN + indent, y);
            y += LINE_HEIGHT;
        });
        
        if (text.trim() !== "") {
            y += 2;
        }
    };

    // Header
    addText("StrAPilot - AI Analytics Dashboard", 18, true, [15, 23, 42]);
    y += 4;
    addText(`Date: ${new Date(sessionData.created_at || Date.now()).toLocaleString()} | File: ${sessionData.file_name || 'Dataset'}`, 10, false, [100, 116, 139]);
    y += 8;

    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
    y += 4;

    const dash = sessionData.dashboard_payload || sessionData;

    if (dash && dash.stats && dash.stats.length > 0) {
        addText("OVERVIEW", 12, true, [15, 23, 42]);
        
        let statText = "";
        dash.stats.forEach((st: any) => {
            statText += `${st.label}: ${st.value}    `;
        });
        addText(statText, 14, true, [234, 88, 12]); // Orange
        y += 4;
    }

    if (dash && dash.overall_analysis) {
        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
        y += 4;

        addText("EXECUTIVE ANALYSIS (AI)", 12, true, [79, 70, 229]); // Indigo
        y += 2;
        
        const paragraphs = (dash.overall_analysis || "").split('\n').filter((p: string) => p.trim() !== '');
        paragraphs.forEach((p: string) => {
            addText(p, 11, false, [51, 65, 85], 0);
            y += 2;
        });
    }

    if (dash && dash.kpis && dash.kpis.length > 0) {
        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
        y += 4;

        addText("KEY PERFORMANCE INDICATORS", 12, true, [15, 23, 42]);
        y += 4;

        dash.kpis.forEach((kpi: any, index: number) => {
            const chartImg = chartsImages[index];
            addText(`${index + 1}. ${kpi.title.toUpperCase()}`, 11, true, [51, 65, 85], 5);
            addText(kpi.explanation, 10, false, [100, 116, 139], 10);
            y += 4;

            if (chartImg) {
                const imgWidth = PAGE_WIDTH - MARGIN * 2 - 10;
                const imgHeight = imgWidth * 0.45;
                
                if (y + imgHeight > PAGE_HEIGHT - MARGIN) {
                    doc.addPage();
                    y = MARGIN;
                    addText(`${kpi.title} (Cont.)`, 11, true, [15, 23, 42], 5);
                }

                try {
                    doc.addImage(chartImg, 'PNG', MARGIN + 5, y, imgWidth, imgHeight);
                    y += imgHeight + 8;
                } catch (e) {
                    console.error("Failed to add chart image to PDF", e);
                }
            }
        });
    }

    const dateStr = new Date(sessionData.created_at || Date.now()).toISOString().split('T')[0];
    const filename = `StrAPilot_Dashboard_${dateStr}.pdf`;
    
    // @ts-ignore
    await addHeaderAndFooter(doc);

    if (returnBase64) {
        return { base64: doc.output('datauristring'), filename };
    }
    doc.save(filename);
    return null;
};

export const generateStrapAnalysisPDF = async (sessionData: any, returnBase64: boolean = false) => {
    const doc = new jsPDF();
    let y = MARGIN;

    const addText = (text: string, fontSize: number, isBold: boolean, color: number[], indent: number = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(color[0], color[1], color[2]);
        
        const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
            if (y > PAGE_HEIGHT - MARGIN) {
                doc.addPage();
                y = MARGIN;
            }
            doc.text(line, MARGIN + indent, y);
            y += LINE_HEIGHT;
        });
        
        if (text.trim() !== "") {
            y += 2;
        }
    };

    // Header
    addText("Analyse STRAP - Intelligence Opérationnelle", 18, true, [15, 23, 42]);
    y += 4;
    addText(`Date: ${new Date(sessionData.created_at || Date.now()).toLocaleString()} | Fichier: ${sessionData.file_name || 'Dataset'}`, 10, false, [100, 116, 139]);
    y += 8;

    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
    y += 4;

    const dash = sessionData.strap_analysis_payload;

    if (!dash) {
        addText("Erreur : Données manquantes", 12, true, [220, 38, 38]);
        if (returnBase64) return { base64: doc.output('datauristring'), filename: "Error.pdf" };
        doc.save("Error.pdf");
        return null;
    }

    // 1. Synthèse
    addText("1. SYNTHÈSE GLOBALE", 14, true, [15, 23, 42]);
    addText(`Niveau de maîtrise: ${dash.summary.control_level?.toUpperCase()}`, 11, true, 
        dash.summary.control_color === 'green' ? [16, 185, 129] : 
        dash.summary.control_color === 'red' ? [239, 68, 68] : [245, 158, 11]);
    
    addText("Problème principal:", 11, true, [51, 65, 85]);
    addText(dash.summary.main_problem, 11, false, [100, 116, 139], 5);
    
    addText("Levier clé:", 11, true, [51, 65, 85]);
    addText(dash.summary.key_lever, 11, false, [100, 116, 139], 5);
    
    addText("Risque:", 11, true, [51, 65, 85]);
    addText(dash.summary.risk, 11, false, [100, 116, 139], 5);
    
    addText("Action prioritaire:", 11, true, [51, 65, 85]);
    addText(dash.summary.priority_action, 11, false, [100, 116, 139], 5);
    y += 6;

    // 2. KPIs
    if (dash.kpi_cards && dash.kpi_cards.length > 0) {
        addText("2. INDICATEURS CLÉS", 14, true, [15, 23, 42]);
        dash.kpi_cards.forEach((kpi: any) => {
            const color = kpi.color === 'red' ? [239, 68, 68] : kpi.color === 'green' ? [16, 185, 129] : [245, 158, 11];
            addText(`${kpi.label}: ${kpi.value} (${kpi.trend})`, 12, true, color);
        });
        y += 6;
    }

    // 3. Variables influentes
    if (dash.influential_variables && dash.influential_variables.length > 0) {
        addText("3. VARIABLES INFLUENTES", 14, true, [15, 23, 42]);
        dash.influential_variables.forEach((v: any) => {
            addText(`- ${v.name} (Impact: ${v.impact.toUpperCase()})`, 11, true, [51, 65, 85], 5);
            addText(v.reason, 10, false, [100, 116, 139], 10);
            y += 2;
        });
        y += 4;
    }

    // 4. Signaux faibles
    if (dash.weak_signals && dash.weak_signals.length > 0) {
        addText("4. SIGNAUX FAIBLES & ANOMALIES", 14, true, [15, 23, 42]);
        dash.weak_signals.forEach((ws: any) => {
            addText(`- ${ws.title}`, 11, true, [245, 158, 11], 5);
            addText(ws.detail, 10, false, [100, 116, 139], 10);
            y += 2;
        });
        y += 4;
    }

    // 5. Actions
    if (dash.actions && dash.actions.length > 0) {
        addText("5. ACTIONS RECOMMANDÉES", 14, true, [15, 23, 42]);
        dash.actions.forEach((act: any, idx: number) => {
            addText(`Action ${idx + 1}: ${act.title}`, 11, true, [234, 88, 12], 5);
            addText(act.reason, 10, false, [100, 116, 139], 10);
            y += 2;
        });
        y += 4;
    }

    const dateStr = new Date(sessionData.created_at || Date.now()).toISOString().split('T')[0];
    const filename = `StrAPilot_Analyse_${dateStr}.pdf`;
    
    await addHeaderAndFooter(doc);

    if (returnBase64) {
        return { base64: doc.output('datauristring'), filename };
    }
    doc.save(filename);
    return null;
};
