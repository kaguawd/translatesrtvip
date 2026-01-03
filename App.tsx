
import React, { useState } from 'react';
import { 
  Wand2, 
  Download, 
  Settings2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ScrollText,
  MessageSquareQuote,
  Sparkles,
  Laugh,
  Swords,
  Ghost,
  Coffee,
  Crown
} from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { parseSRT, rebuildSRT, downloadSRT } from './utils/srtUtils';
import { GeminiSRTService, NarrativeStyle } from './services/geminiService';
import { ProcessingState } from './types';

const STYLES: { id: NarrativeStyle; label: string; icon: any; desc: string; color: string }[] = [
  { id: 'funny', label: 'Hài hước', icon: Laugh, desc: 'Vui nhộn, lầy lội', color: 'text-yellow-400' },
  { id: 'dramatic', label: 'Kịch tính', icon: Swords, desc: 'Hào hùng, gay cấn', color: 'text-red-500' },
  { id: 'cheeky', label: 'Bố láo', icon: Crown, desc: 'Tự tin, ' + '"kèo trên"', color: 'text-orange-400' },
  { id: 'horror', label: 'Kinh dị', icon: Ghost, desc: 'Đáng sợ, bí ẩn', color: 'text-purple-400' },
  { id: 'chill', label: 'Bình thản', icon: Coffee, desc: 'Nhẹ nhàng, thư giãn', color: 'text-blue-400' },
];

const App: React.FC = () => {
  const [originalSRT, setOriginalSRT] = useState<{ content: string; name: string } | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<NarrativeStyle>('dramatic');
  const [customPrompt, setCustomPrompt] = useState("");
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [resultSRT, setResultSRT] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!originalSRT) return;

    setProcessing({ status: 'processing', progress: 0, message: 'Đang khởi tạo AI Narrative Engine...' });
    setResultSRT(null);

    try {
      const blocks = parseSRT(originalSRT.content);
      if (blocks.length === 0) throw new Error("Không tìm thấy nội dung SRT hợp lệ.");

      const service = new GeminiSRTService();
      const chunkSize = 20;
      const totalChunks = Math.ceil(blocks.length / chunkSize);
      let allRewrittenContent: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, blocks.length);
        const chunk = blocks.slice(start, end);

        setProcessing(prev => ({
          ...prev,
          progress: Math.round(((i + 1) / totalChunks) * 100),
          message: `Đang viết phong cách ${STYLES.find(s => s.id === selectedStyle)?.label} (${i + 1}/${totalChunks})...`
        }));

        const rewrittenChunk = await service.rewriteSRTChunk(
          chunk,
          customPrompt,
          selectedStyle
        );
        
        allRewrittenContent = [...allRewrittenContent, ...rewrittenChunk];
      }

      const finalSRT = rebuildSRT(blocks, allRewrittenContent);
      setResultSRT(finalSRT);
      setProcessing({ 
        status: 'completed', 
        progress: 100, 
        message: 'Hoàn tất! Câu chuyện của bạn đã sẵn sàng.' 
      });
    } catch (error: any) {
      console.error(error);
      setProcessing({ 
        status: 'error', 
        progress: 0, 
        message: 'Có lỗi xảy ra trong quá trình xử lý.',
        error: error.message || 'Lỗi không xác định'
      });
    }
  };

  const handleDownload = () => {
    if (resultSRT && originalSRT) {
      const styleLabel = STYLES.find(s => s.id === selectedStyle)?.label || 'VN';
      const newName = originalSRT.name.replace('.srt', `_VN_${styleLabel}.srt`);
      downloadSRT(resultSRT, newName);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-6xl mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full mb-6 border border-emerald-500/20 shadow-inner">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Minecraft Narrative Engine v3.0</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">
          MINECRAFT <span className="text-emerald-500 italic">NARRATOR</span>
        </h1>
        <p className="text-stone-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Việt hóa 100% phong cách kể chuyện. Giữ nguyên timestamps chuẩn tuyệt đối.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Styles */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Upload */}
          <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <ScrollText className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. Tải lên SRT gốc</h2>
            </div>
            <FileUpload 
              label="Tệp SRT Gốc (Tiếng Anh)" 
              fileName={originalSRT?.name}
              onFileSelect={(content, name) => setOriginalSRT({ content, name })}
              onClear={() => setOriginalSRT(null)}
              description="Hệ thống sẽ dựa vào đây để lấy dấu thời gian chuẩn"
            />
          </div>

          {/* Style Selector */}
          <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. Chọn phong cách kể</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {STYLES.map((style) => {
                const Icon = style.icon;
                const isActive = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                      isActive 
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : 'bg-stone-950/40 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-3 ${style.color} ${isActive ? 'scale-110' : ''} transition-transform`} />
                    <span className="text-sm font-bold text-white mb-1 leading-tight">{style.label}</span>
                    <span className="text-[10px] text-stone-500 uppercase tracking-tighter text-center leading-tight">{style.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-stone-900/40 border border-stone-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquareQuote className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Bối cảnh bổ sung (Tùy chọn)</h2>
            </div>
            <textarea 
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ví dụ: Tập phim này tôi đi tìm Fortress, tâm trạng đang khá lo lắng..."
              className="w-full h-24 bg-stone-950/50 border border-stone-800 rounded-xl p-4 text-stone-200 placeholder:text-stone-700 focus:outline-none focus:border-emerald-500/50 transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        {/* Right Column: Execution */}
        <div className="lg:col-span-5">
          <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-8 h-full flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
            
            <div className="w-full mb-8 relative z-10 text-center">
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tighter">Bảng điều khiển</h3>
              <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-10 w-full relative z-10">
              {processing.status === 'idle' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-stone-800/30 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-stone-700 shadow-xl">
                    <Wand2 className="w-10 h-10 text-stone-600" />
                  </div>
                  <p className="text-stone-400 font-medium">Sẵn sàng để bắt đầu...</p>
                </div>
              )}

              {processing.status === 'processing' && (
                <div className="w-full text-center">
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <Loader2 className="w-32 h-32 text-emerald-500 animate-spin absolute top-0 left-0" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white">{processing.progress}%</span>
                      <span className="text-[10px] uppercase text-emerald-500/60 tracking-tighter">Processing</span>
                    </div>
                  </div>
                  <p className="text-emerald-400 font-bold mb-2 animate-pulse text-lg">{processing.message}</p>
                </div>
              )}

              {processing.status === 'completed' && (
                <div className="text-center w-full">
                  <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40 rotate-3 transition-transform hover:rotate-0">
                    <CheckCircle2 className="w-12 h-12 text-stone-950" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-2 italic">NHIỆM VỤ HOÀN THÀNH</h4>
                  <p className="text-sm text-stone-400 mb-8">{processing.message}</p>
                  <button 
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-lg"
                  >
                    <Download className="w-6 h-6" />
                    TẢI FILE KẾT QUẢ
                  </button>
                </div>
              )}

              {processing.status === 'error' && (
                <div className="text-center w-full">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-500 font-bold mb-4">Lỗi Hệ Thống</p>
                  <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/20 mb-6 max-h-32 overflow-y-auto">
                    <p className="text-xs text-stone-400 font-mono text-left">{processing.error}</p>
                  </div>
                  <button 
                    onClick={() => setProcessing({ status: 'idle', progress: 0, message: '' })}
                    className="text-stone-100 font-bold uppercase text-xs hover:text-emerald-400 transition-colors"
                  >
                    Quay lại
                  </button>
                </div>
              )}
            </div>

            {processing.status === 'idle' && (
              <button 
                onClick={handleProcess}
                disabled={!originalSRT}
                className={`flex items-center justify-center gap-3 w-full py-5 font-black rounded-2xl transition-all text-lg relative z-10 ${
                  originalSRT 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-xl shadow-emerald-500/20 active:scale-95' 
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                }`}
              >
                <Wand2 className="w-6 h-6" />
                BẮT ĐẦU VIẾT LẠI
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Benefits Footer */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full border-t border-stone-800 pt-12">
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
            <Settings2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h5 className="text-white font-bold text-sm uppercase mb-1">Cấu trúc khung cứng</h5>
            <p className="text-stone-500 text-xs leading-relaxed">Giữ nguyên số thứ tự và dấu thời gian. Không gộp dòng, không lệch tiếng.</p>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h5 className="text-white font-bold text-sm uppercase mb-1">Phong cách Việt hóa</h5>
            <p className="text-stone-500 text-xs leading-relaxed">Nhiều phong cách kể chuyện chuyên sâu, từ hài hước đến "bố láo" tự tin.</p>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <div className="p-2 bg-stone-900 rounded-lg border border-stone-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h5 className="text-white font-bold text-sm uppercase mb-1">AI Voice Optimized</h5>
            <p className="text-stone-500 text-xs leading-relaxed">Văn phong gãy gọn, không dùng từ vựng tiếng Anh, dễ đọc cho các công cụ Text-to-Speech.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
