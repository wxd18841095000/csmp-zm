
import React, { useState, useCallback } from 'react';
import { WorkflowStage, AnalysisResult } from './types';
import { SubtitleService } from './services/geminiService';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [stage, setStage] = useState<WorkflowStage>(WorkflowStage.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [confirmedText, setConfirmedText] = useState<string>('');
  const [finalSubtitles, setFinalSubtitles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const service = new SubtitleService();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setError(null);
    setStage(WorkflowStage.ANALYSIS);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await service.analyzeAudio(base64, uploadedFile.type);
        setAnalysis(result);
        setConfirmedText(result.fullTranscript);
        setStage(WorkflowStage.CONFIRMATION);
        setLoading(false);
      };
      reader.readAsDataURL(uploadedFile);
    } catch (err: any) {
      setError(err.message || '分析过程中发生错误');
      setLoading(false);
      setStage(WorkflowStage.UPLOAD);
    }
  };

  const handleFinalFormat = async () => {
    setLoading(true);
    setError(null);
    setStage(WorkflowStage.FORMATTING);
    try {
      const formatted = await service.formatSubtitles(confirmedText);
      setFinalSubtitles(formatted);
      setStage(WorkflowStage.COMPLETED);
    } catch (err: any) {
      setError(err.message || '格式化过程中发生错误');
      setStage(WorkflowStage.CONFIRMATION);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalSubtitles.join('\n'));
    alert('字幕已复制到剪贴板！');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight flex items-center justify-center gap-2">
            <SparklesIcon className="w-10 h-10" />
            两阶段字幕工作流助手
          </h1>
          <p className="mt-2 text-lg text-gray-600">先确认原文，再智能格式化，打造完美字幕</p>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            {Object.values(WorkflowStage).map((s, idx) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  stage === s ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 
                  Object.values(WorkflowStage).indexOf(stage) > idx ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-[10px] mt-1 text-gray-500 hidden sm:block uppercase tracking-wider">{s}</span>
              </div>
            ))}
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div 
              style={{ width: `${(Object.values(WorkflowStage).indexOf(stage) + 1) / Object.keys(WorkflowStage).length * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
            ></div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 min-h-[400px] flex flex-col">
          {stage === WorkflowStage.UPLOAD && (
            <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-xl p-12 transition-all hover:border-indigo-100">
              <CloudArrowUpIcon className="w-16 h-16 text-indigo-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">上传音频文件</p>
              <p className="text-sm text-gray-500 mb-6">支持 MP3, WAV, AAC 等格式</p>
              <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-lg">
                选择文件
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {stage === WorkflowStage.ANALYSIS && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-600 animate-pulse">正在进行高精度转录与内容分析...</p>
            </div>
          )}

          {stage === WorkflowStage.CONFIRMATION && analysis && (
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-indigo-50 p-4 rounded-xl">
                <h3 className="text-indigo-800 font-bold mb-2 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" /> 【A】内容摘要与关键点
                </h3>
                <ul className="list-disc list-inside space-y-1 text-indigo-900 text-sm">
                  {analysis.summary.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                  <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> 【B】待确认词汇列表
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.uncertainTerms.length > 0 ? analysis.uncertainTerms.map((t, i) => (
                    <span key={i} className="bg-white border border-amber-200 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                      {t}
                    </span>
                  )) : <span className="text-amber-600 text-sm italic">无明显疑难词汇</span>}
                </div>
                <p className="mt-3 text-xs text-amber-700 font-medium italic">
                  * 以上词汇由于背景噪音或专业性较强可能存在偏差，请在下方文稿中重点核对。
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">最终文稿确认 (请在此修正错误后继续):</label>
                <textarea 
                  value={confirmedText}
                  onChange={(e) => setConfirmedText(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-700"
                  placeholder="编辑文稿以修正错误..."
                />
              </div>

              <button 
                onClick={handleFinalFormat}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
              >
                确认文稿，进入阶段2：格式化
              </button>
            </div>
          )}

          {stage === WorkflowStage.FORMATTING && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-600">正在清洗口水词并智能断句...</p>
            </div>
          )}

          {stage === WorkflowStage.COMPLETED && (
            <div className="flex-1 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">格式化结果</h3>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" /> 复制全部
                </button>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto font-mono text-sm border border-gray-200">
                {finalSubtitles.map((line, i) => (
                  <div key={i} className="bg-white p-3 rounded shadow-sm border-l-4 border-indigo-500">
                    {line}
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setStage(WorkflowStage.CONFIRMATION)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  重新编辑
                </button>
                <button 
                  onClick={() => {
                    setStage(WorkflowStage.UPLOAD);
                    setFile(null);
                    setAnalysis(null);
                    setFinalSubtitles([]);
                  }}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md"
                >
                  处理新文件
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-400">
          基于 Google Gemini 3 Flash 高性能模型构建
        </div>
      </div>
    </div>
  );
};

export default App;
