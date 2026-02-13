import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Search,
    RefreshCw,
    Download
} from 'lucide-react';

interface CoverageIssue {
    gradeId: string;
    subject: string;
    strandId: string;
    subStrandId: string;
    subStrandName: string;
    reason: string;
}

interface SubjectCoverage {
    subject: string;
    totalSubStrands: number;
    coveredSubStrands: number;
    percentage: number;
    gaps: CoverageIssue[];
}

interface GradeCoverage {
    gradeId: string;
    subjects: SubjectCoverage[];
    overallPercentage: number;
}

interface FullCoverageReport {
    overallPercentage: number;
    grades: GradeCoverage[];
    totalFiles: number;
    lastUpdated: string;
}

export const CoverageReport: React.FC = () => {
    const [report, setReport] = useState<FullCoverageReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});
    const [reIndexing, setReIndexing] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/coverage');
            if (!res.ok) throw new Error('Failed to fetch coverage report');
            const data = await res.json();
            setReport(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReIndex = async () => {
        setReIndexing(true);
        try {
            const res = await fetch('http://localhost:3001/api/coverage/re-index', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to re-index');
            await fetchReport();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setReIndexing(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const toggleGrade = (gradeId: string) => {
        setExpandedGrades(prev => ({ ...prev, [gradeId]: !prev[gradeId] }));
    };

    if (loading && !report) return (
        <div className="flex items-center justify-center p-12">
            <RefreshCw className="animate-spin mr-2" />
            <span>Analyzing Curriculum Coverage...</span>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-red-50 text-red-600 rounded-lg flex items-center">
            <AlertCircle className="mr-2" />
            {error}
        </div>
    );

    if (!report) return null;

    return (
        <div className="space-y-6">
            {/* Header / Summary Card */}
            <div className="card bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="text-accent-primary" />
                            Curriculum Coverage
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Analyzing {report.totalFiles} library resources against GES Curriculum
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-accent-primary">
                            {report.overallPercentage.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                            Overall Readiness
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-4">
                    <button
                        onClick={fetchReport}
                        className="btn btn-sm bg-white/10 hover:bg-white/20 border-0"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handleReIndex}
                        disabled={reIndexing}
                        className="btn btn-sm btn-primary"
                    >
                        <Search size={14} className={reIndexing ? 'animate-spin' : ''} />
                        {reIndexing ? 'AI Re-indexing...' : 'AI Semantic Match'}
                    </button>
                </div>
            </div>

            {/* Grades List */}
            <div className="space-y-4">
                {report.grades.map(grade => (
                    <div key={grade.gradeId} className="card p-0 overflow-hidden">
                        <div
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleGrade(grade.gradeId)}
                        ) >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                                    ${grade.overallPercentage > 80 ? 'bg-green-100 text-green-700' :
                                    grade.overallPercentage > 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                            >
                                {Math.round(grade.overallPercentage)}%
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{grade.gradeId.toUpperCase()}</h3>
                                <p className="text-xs text-slate-500 uppercase">
                                    {grade.subjects.length} Subjects Tracked
                                </p>
                            </div>
                        </div>
                        {expandedGrades[grade.gradeId] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                        {
                        expandedGrades[grade.gradeId] && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
                                {grade.subjects.map(subject => (
                                    <div key={subject.subject} className="bg-white p-4 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{subject.subject}</h4>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {subject.coveredSubStrands} / {subject.totalSubStrands} Sub-strands Covered
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold
                                                ${subject.percentage === 100 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {subject.percentage.toFixed(0)}%
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${subject.percentage === 100 ? 'bg-green-500' : 'bg-accent-primary'}`}
                                                style={{ width: `${subject.percentage}%` }}
                                            />
                                        </div>

                                        {/* Missing Topics */}
                                        {subject.gaps.length > 0 && (
                                            <div className="mt-4">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    Missing Resources
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {subject.gaps.map(gap => (
                                                        <div
                                                            key={gap.subStrandId}
                                                            className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 text-red-700 rounded-full text-xs group cursor-pointer hover:bg-red-100 transition-colors"
                                                            title={`Sub-strand: ${gap.subStrandName}`}
                                                        >
                                                            <AlertCircle size={10} />
                                                            {gap.subStrandName}
                                                            <button className="hidden group-hover:flex items-center text-red-900 ml-1">
                                                                <Download size={10} className="mr-1" /> Scrape
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {subject.percentage === 100 && (
                                            <div className="mt-3 flex items-center gap-2 text-green-600 text-xs font-medium">
                                                <CheckCircle2 size={14} />
                                                Fully Equipped
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    }
                    </div>
                ))}
        </div>
        </div >
    );
};
