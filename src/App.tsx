import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  ArrowLeftRight, 
  Scale, 
  BrainCircuit, 
  History, 
  Menu, 
  X,
  Upload,
  Send,
  Trash2,
  Moon,
  Sun,
  LayoutGrid,
  Code2,
  FlaskConical,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  Camera,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { useDropzone } from 'react-dropzone';
import { cn } from './lib/utils';
import { HistoryItem, AIMessage, UnitType, Unit } from './types';

// --- Constants ---
const TABS = [
  { id: 'calc', label: 'الحاسبة', icon: Calculator },
  { id: 'convert', label: 'المحولات', icon: ArrowLeftRight },
  { id: 'health', label: 'الصحة', icon: Scale },
  { id: 'ai', label: 'المنقذ الذكي', icon: BrainCircuit },
  { id: 'history', label: 'السجل', icon: History },
];

const MASS_UNITS: Unit[] = [
  { label: 'جرام (g)', value: 'g', factor: 1 },
  { label: 'كيلوجرام (kg)', value: 'kg', factor: 1000 },
  { label: 'مليجرام (mg)', value: 'mg', factor: 0.001 },
  { label: 'طن (t)', value: 't', factor: 1000000 },
  { label: 'باوند (lb)', value: 'lb', factor: 453.592 },
  { label: 'أونصة (oz)', value: 'oz', factor: 28.3495 },
];

const VOLUME_UNITS: Unit[] = [
  { label: 'لتر (L)', value: 'l', factor: 1 },
  { label: 'مليليتر (ml)', value: 'ml', factor: 0.001 },
  { label: 'متر مكعب (m³)', value: 'm3', factor: 1000 },
  { label: 'جالون (gal)', value: 'gal', factor: 3.78541 },
];

const DISTANCE_UNITS: Unit[] = [
  { label: 'متر (m)', value: 'm', factor: 1 },
  { label: 'كيلومتر (km)', value: 'km', factor: 1000 },
  { label: 'سنتيمتر (cm)', value: 'cm', factor: 0.01 },
  { label: 'مليمتر (mm)', value: 'mm', factor: 0.001 },
  { label: 'ميل (mi)', value: 'mi', factor: 1609.34 },
  { label: 'قدم (ft)', value: 'ft', factor: 0.3048 },
  { label: 'بوصة (in)', value: 'in', factor: 0.0254 },
];

// --- Sub-components ---

// 1. Calculator Component
const CalculatorTab = ({ onAddHistory }: { onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void }) => {
  const [mode, setMode] = useState<'standard' | 'scientific' | 'programming'>(() => {
    return (localStorage.getItem('rouh_calc_mode') as any) || 'standard';
  });
  const [display, setDisplay] = useState(() => localStorage.getItem('rouh_calc_display') || '0');
  const [equation, setEquation] = useState(() => localStorage.getItem('rouh_calc_equation') || '');
  
  useEffect(() => {
    localStorage.setItem('rouh_calc_mode', mode);
    localStorage.setItem('rouh_calc_display', display);
    localStorage.setItem('rouh_calc_equation', equation);
  }, [mode, display, equation]);

  const handleAction = (e: React.MouseEvent, val: string) => {
    e.preventDefault();
    if (val === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (val === 'DEL') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      return;
    }
    
    if (val === '=') {
      try {
        let sanitized = display
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/√\(/g, 'Math.sqrt(')
          .replace(/\^/g, '**');

        const res = eval(sanitized);
        const resultStr = Number.isInteger(res) ? String(res) : res.toFixed(4).replace(/\.?0+$/, "");
        
        onAddHistory({
          type: 'calculator',
          title: `حساب (${mode === 'standard' ? 'عادي' : mode === 'scientific' ? 'علمي' : 'برمجي'})`,
          details: display,
          result: resultStr
        });
        
        setEquation(display + ' =');
        setDisplay(resultStr);
      } catch (e) {
        setDisplay('Error');
      }
      return;
    }

    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const standardKeys = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='];
  const scientificKeys = ['sin(', 'cos(', 'tan(', 'π', 'log(', 'ln(', '√(', '^', 'C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='];
  const programmingKeys = ['0b', '0x', '<<', '>>', '&', '|', '^', '~', 'C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='];

  const keys = mode === 'standard' ? standardKeys : mode === 'scientific' ? scientificKeys : programmingKeys;

  return (
    <div className="flex flex-col h-full gap-2 p-2 sm:p-4 max-w-lg mx-auto w-full overflow-hidden">
      <div className="flex bg-[#1a1c1e] p-1 rounded-xl w-full shrink-0">
        {(['standard', 'scientific', 'programming'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={(e) => { 
              e.preventDefault();
              setMode(m); 
              setDisplay('0'); 
              setEquation(''); 
            }}
            className={cn(
              "flex-1 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all",
              mode === m ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {m === 'standard' ? 'عادي' : m === 'scientific' ? 'علمي' : 'برمجي'}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1c1e] rounded-2xl p-3 sm:p-4 shadow-xl border border-gray-800 flex flex-col flex-1 min-h-0">
        {/* Display Area - Force LTR for math */}
        <div className="flex flex-col items-end gap-1 mb-3 h-20 sm:h-24 justify-end p-3 bg-black/40 rounded-xl overflow-hidden shrink-0" dir="ltr">
          <div className="text-gray-500 font-mono text-[10px] sm:text-xs h-5 truncate w-full text-right">{equation}</div>
          <div className="text-2xl sm:text-3xl font-mono text-white tracking-wider break-all text-right w-full leading-tight font-bold">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className={cn(
          "grid gap-1 sm:gap-2 flex-1 min-h-0",
          "grid-cols-4"
        )}>
          {keys.map((btn) => (
            <button
              key={btn}
              type="button"
              onClick={(e) => handleAction(e, btn)}
              className={cn(
                "rounded-lg sm:rounded-xl font-mono transition-all active:scale-90 flex items-center justify-center p-1 font-bold",
                mode === 'standard' ? "text-lg sm:text-xl" : "text-xs sm:text-sm",
                ['÷', '×', '-', '+', '='].includes(btn) 
                  ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/10" 
                  : btn === 'C' || btn === 'DEL' ? "bg-red-900/15 text-red-500 border border-red-500/10" : "bg-gray-800/40 text-gray-200 hover:bg-gray-800 border border-gray-700/50"
              )}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 2. Converter Component
const ConverterTab = ({ onAddHistory }: { onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void }) => {
  const [type, setType] = useState<UnitType>('mass');
  const [value, setValue] = useState<string>('0');
  const [fromUnit, setFromUnit] = useState<string>('');
  const [toUnit, setToUnit] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const units = type === 'mass' ? MASS_UNITS : type === 'volume' ? VOLUME_UNITS : DISTANCE_UNITS;

  const convert = (val: string, from: string, to: string) => {
    const fromUnitObj = units.find(u => u.value === from);
    const toUnitObj = units.find(u => u.value === to);
    if (!fromUnitObj || !toUnitObj || !val) {
      setResult(null);
      return;
    }

    const res = (Number(val) * fromUnitObj.factor) / toUnitObj.factor;
    setResult(res);
  };

  useEffect(() => {
    const from = units[0].value;
    const to = units[1]?.value || units[0].value;
    setFromUnit(from);
    setToUnit(to);
    convert(value, from, to);
  }, [type]);

  useEffect(() => {
    convert(value, fromUnit, toUnit);
  }, [value, fromUnit, toUnit]);

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const handleSaveToHistory = () => {
    if (result === null) return;
    const from = units.find(u => u.value === fromUnit);
    const to = units.find(u => u.value === toUnit);
    
    onAddHistory({
      type: 'converter',
      title: `تحويل ${type === 'mass' ? 'كتلة' : type === 'volume' ? 'حجم' : 'مسافة'}`,
      details: `${value} ${from?.label} إلى ${to?.label}`,
      result: `${result < 0.0001 ? result.toExponential(4) : result.toLocaleString()} ${to?.label}`
    });
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 max-w-xl mx-auto w-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-center gap-2 sm:gap-4 overflow-x-auto pb-2 shrink-0">
        {[
          { id: 'mass', label: 'كتلة', icon: Scale },
          { id: 'volume', label: 'حجم', icon: FlaskConical },
          { id: 'distance', label: 'مسافة', icon: ArrowLeftRight },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id as UnitType)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl flex-1 min-w-[80px] border transition-all active:scale-95",
              type === t.id ? "bg-blue-600/15 border-blue-500 text-blue-400 shadow-lg shadow-blue-600/5" : "bg-[#1a1c1e] border-gray-800 text-gray-500"
            )}
          >
            <t.icon size={20} />
            <span className="text-[10px] sm:text-xs font-bold">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#1a1c1e] rounded-2xl p-6 border border-gray-800 shadow-xl flex flex-col gap-5">
        <div className="space-y-1">
          <div className="flex justify-between items-center px-1">
             <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">القيمة</label>
             <button type="button" onClick={() => setValue('0')} className="text-[10px] text-red-500 font-bold hover:underline">تصفير</button>
          </div>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-black/30 border border-gray-800 rounded-xl p-3 text-xl font-mono text-white focus:border-blue-500 outline-none transition-colors"
            placeholder="0.00"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1">من وحدة</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full bg-black/30 border border-gray-800 rounded-xl p-3 appearance-none focus:border-blue-500 outline-none text-sm text-gray-200 cursor-pointer"
            >
              {units.map(u => <option key={u.value} value={u.value} className="bg-[#1a1c1e] text-white">{u.label}</option>)}
            </select>
          </div>

          <div className="flex justify-center -my-3 z-10">
             <button 
               type="button"
               onClick={handleSwap}
               className="bg-gray-800 p-2.5 rounded-full border border-gray-700 hover:border-blue-500 text-blue-500 transition-all active:rotate-180 shadow-md"
             >
               <ArrowLeftRight size={18} className="rotate-90" />
             </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1">إلى وحدة</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full bg-black/30 border border-gray-800 rounded-xl p-3 appearance-none focus:border-blue-500 outline-none text-sm text-gray-200 cursor-pointer"
            >
              {units.map(u => <option key={u.value} value={u.value} className="bg-[#1a1c1e] text-white">{u.label}</option>)}
            </select>
          </div>
        </div>

        {result !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-xl flex flex-col items-center gap-2"
          >
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">تحويل تلقائي</span>
            <div className="text-2xl sm:text-3xl font-mono text-white text-center break-all font-bold">
              {result < 0.0001 && result !== 0 ? result.toExponential(4) : result.toLocaleString()}
            </div>
            <button 
              type="button"
              onClick={handleSaveToHistory}
              className="text-[10px] bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
            >
              حفظ النتيجة في السجل
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// 3. Health Component (Ideal Weight)
const HealthTab = ({ onAddHistory }: { onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<{ bmi: number; status: string; ideal: string } | null>(null);

  const calculate = () => {
    if (!weight || !height) return;
    const hM = Number(height) / 100;
    const bmi = Number(weight) / (hM * hM);
    
    let status = '';
    if (bmi < 18.5) status = 'نقص في الوزن';
    else if (bmi < 25) status = 'وزن مثالي';
    else if (bmi < 30) status = 'زيادة في الوزن';
    else status = 'سمنة مفرطة';

    const ideal = gender === 'male' ? 50 + 2.3 * ((Number(height) / 2.54) - 60) : 45.5 + 2.3 * ((Number(height) / 2.54) - 60);

    const res = { 
      bmi: Number(bmi.toFixed(1)), 
      status, 
      ideal: ideal.toFixed(1) + ' كجم'
    };
    
    setResult(res);
    onAddHistory({
      type: 'health',
      title: 'حساب الوزن المثالي',
      details: `الطول: ${height} سم، الوزن: ${weight} كجم`,
      result: `BMI: ${res.bmi} (${res.status})، المثالي: ${res.ideal}`
    });
  };

  return (
    <div className="flex flex-col h-full gap-6 p-4 max-w-xl mx-auto w-full overflow-y-auto custom-scrollbar">
      <div className="bg-[#1a1c1e] rounded-2xl p-6 border border-gray-800 shadow-xl flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={cn(
              "p-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-sm",
              gender === 'male' ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-black/20 border-gray-800 text-gray-500"
            )}
          >
            ذكر
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={cn(
              "p-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-sm",
              gender === 'female' ? "bg-pink-600/20 border-pink-500 text-pink-400" : "bg-black/20 border-gray-800 text-gray-500"
            )}
          >
            أنثى
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold px-1">الطول (سم)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-xl p-3 focus:border-blue-500 outline-none transition-colors" placeholder="مثال: 175" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold px-1">الوزن الحالي (كجم)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-xl p-3 focus:border-blue-500 outline-none transition-colors" placeholder="مثال: 70" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold px-1">العمر</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-xl p-3 focus:border-blue-500 outline-none transition-colors" placeholder="مثال: 25" />
          </div>
        </div>

        <button 
          type="button"
          onClick={calculate} 
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          تحليل الحالة الصحية
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-500/10 flex flex-col items-center">
              <span className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">مؤشر الكتلة</span>
              <span className="text-2xl font-black text-blue-400">{result.bmi}</span>
              <span className={cn(
                "text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full",
                result.status === 'وزن مثالي' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              )}>{result.status}</span>
            </div>
            <div className="p-4 bg-emerald-600/5 rounded-xl border border-emerald-500/10 flex flex-col items-center">
              <span className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">الوزن المثالي</span>
              <span className="text-2xl font-black text-emerald-400">{result.ideal}</span>
              <span className="text-[10px] text-gray-400 mt-1 italic font-medium">بناءً على الصيغة العلمية</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// 4. AI Solver Component
const AISolverTab = ({ onAddHistory }: { onAddHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void }) => {
  const [isPersistent, setIsPersistent] = useState(() => localStorage.getItem('rouh_ai_persistent') === 'true');
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    if (localStorage.getItem('rouh_ai_persistent') === 'true') {
      const saved = localStorage.getItem('rouh_ai_messages');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [input, setInput] = useState(() => localStorage.getItem('rouh_ai_input') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('rouh_ai_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('rouh_ai_persistent', String(isPersistent));
    if (isPersistent) {
      localStorage.setItem('rouh_ai_messages', JSON.stringify(messages));
    } else {
      localStorage.removeItem('rouh_ai_messages');
    }
  }, [messages, isPersistent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // محاولة طلب الإذن عند النقر/الاختيار كما طلب المستخدم
      try {
        // نكتفي فقط بالتحميل العادي دون طلب إذن مسبق تجنباً لمشاكل المتصفحات في الإطارات (iframes)
      } catch (err) {
        console.warn("Camera check skipped:", err);
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachedImage(base64);
        // عرض الصورة مؤقتاً في الدردشة والبدء بالحل تلقائياً لتجربة أسرع
        handleSend(undefined, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCameraClick = async (e: React.MouseEvent) => {
    // We try to request camera permission just before useDropzone opens the file dialog
    // This satisfies the user's request to have permission when clicking the button
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
      }
    } catch (err) {
      console.warn("Camera permission error or denied:", err);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false
  });

  const dropzoneProps = getRootProps();
  const originalOnDropzoneClick = dropzoneProps.onClick;
  dropzoneProps.onClick = (e) => {
    onCameraClick(e);
    if (originalOnDropzoneClick) originalOnDropzoneClick(e);
  };

  const handleSend = async (e?: React.FormEvent | React.MouseEvent, autoImage?: string) => {
    if (e) e.preventDefault();
    
    // استخدام الصورة الممررة تلقائياً أو الصورة المرفقة سابقاً
    const currentImage = autoImage || attachedImage;
    if (!input.trim() && !currentImage) return;

    const userMsg: AIMessage = { role: 'user', content: input, image: currentImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    
    const currentInput = input;
    setInput('');
    setAttachedImage(null);
    console.log("AI Request started", { hasImage: !!currentImage, input: currentInput });
    setIsLoading(true);

    try {
      // الوصول للمفتاح البرمجي من بيئة النظام
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "undefined") {
        setMessages(prev => [...prev, { 
          role: 'model', 
          content: "عذراً، لم يتم العثور على مفتاح API الخاص بـ Gemini. يرجى ضبطه في إعدادات المنصة." 
        }]);
        setIsLoading(false);
        return;
      }

      // تهيئة المحرك بشكل صحيح باستخدام كائن الإعدادات للمكتبة الحديثة @google/genai
      const ai = new GoogleGenAI({ apiKey });
      
      const promptText = currentInput || "حل المسألة الموضحة في الصورة بالتفصيل.";
      const parts: any[] = [{ text: promptText }];
      
      if (currentImage && currentImage.includes(',')) {
        try {
          const [header, data] = currentImage.split(',');
          const mimeType = header.split(';')[0].split(':')[1] || "image/jpeg";
          parts.push({ 
            inlineData: { 
              mimeType, 
              data 
            } 
          });
        } catch (imgErr) {
          console.error("Image error:", imgErr);
        }
      }

      // Add user message placeholder
      setMessages(prev => [
        ...prev, 
        { role: 'model', content: "جاري التحليل..." }
      ]);

      // Check if user is online before sending
      if (!navigator.onLine) {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { role: 'model', content: "عذراً، محرك الذكاء الاصطناعي يتطلب اتصالاً بالإنترنت للحل. يرجى التأكد من اتصالك والمحاولة مرة أخرى." };
          }
          return updated;
        });
        setIsLoading(false);
        return;
      }
      
      const result = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: "أنت خبير فوري في الرياضيات والعلوم والبرمجة. حل المسائل بدقة وبسرعة فائقة باللغة العربية. استخدم Markdown للتنسيق الواضح. هام: لا تستخدم علامات الدولار ($) حول الأرقام العادية أو المعادلات الرياضية البسيطة، اكتب الأرقام بشكل طبيعي وواضح إلا إذا كان الحديث عن عملة الدولار بالفعل."
        }
      });

      let cumulativeText = "";
      
      for await (const chunk of result) {
        try {
          const text = chunk.text;
          if (text) {
            cumulativeText += text;
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = { role: 'model', content: cumulativeText };
              }
              return newMessages;
            });
          }
        } catch (chunkErr: any) {
          console.warn("Chunk error:", chunkErr);
          if (chunkErr?.message?.includes("SAFETY")) {
             cumulativeText += "\n\n(تنبيه: تم حجب جزء من الرد لأسباب تتعلق بخصوصية المحتوى وفقاً لمعايير الأمان)";
             setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0) updated[updated.length-1].content = cumulativeText;
                return updated;
             });
             break;
          }
        }
      }

      if (!cumulativeText) {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length-1].content === "جاري التحليل...") {
            updated[updated.length-1].content = "لم أتمكن من العثور على حل دقيق، يرجى إعادة المحاولة بصورة أوضح.";
          }
          return updated;
        });
      }
      
      onAddHistory({
        type: 'ai',
        title: 'سؤال للذكاء الاصطناعي',
        details: promptText.slice(0, 50) + (promptText.length > 50 ? '...' : ''),
        result: 'تم الاستجابة فورياً'
      });
      setIsLoading(false);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      let errorMsg = "عذراً، حدثت مشكلة تقنية في معالجة طلبك. يرجى المحاولة مرة أخرى.";
      
      if (error.message?.includes("403")) {
        errorMsg = "عذراً، لا نملك صلاحية لاستخدام هذا النموذج حالياً (403). قد يكون المفتاح غير صالح لهذا الموديل.";
      } else if (error.message?.includes("404")) {
        errorMsg = "عذراً، لم يتم العثور على النموذج المطلوب (404). يرجى التأكد من توفر الموديل في حسابك.";
      } else if (error.message?.includes("PERMISSION_DENIED")) {
        errorMsg = "عذراً، تم رفض الوصول للخدمة (Permission Denied). يرجى التأكد من تفعيل Gemini API.";
      }
      
      if (error?.message?.includes("API key")) {
        errorMsg = "المفتاح البرمجي غير صالح أو مفقود. يرجى التأكد من صلاحية الخدمة.";
      } else if (error?.status === 429) {
        errorMsg = "الضغط كبير على النظام حالياً، يرجى الانتظار دقيقة والمحاولة مجدداً.";
      }
      
      setMessages(prev => {
        const updated = [...prev];
        // Replace "Analysis..." if it failed immediately
        if (updated.length > 0 && updated[updated.length - 1].content === "جاري التحليل...") {
          updated[updated.length - 1] = { role: 'model', content: errorMsg };
          return updated;
        }
        return [...prev, { role: 'model', content: errorMsg }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 p-3 sm:p-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center gap-4 px-6">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center">
               <BrainCircuit size={40} className="text-blue-500" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-black mb-2 text-white">حل المسائل بالذكاء الاصطناعي</h3>
              <p className="text-xs font-medium leading-relaxed">
                اكتب سؤالك، أو <span className="text-blue-400">ارفع صورة لمسألتك</span> (رياضيات، كيمياء، برمجة) وسأقوم بحلها لك خطوة بخطوة.
              </p>
              <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-start gap-2 text-right rtl">
                <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-300 leading-normal">
                  نطلب إذن استخدام الكاميرا فقط لتمكينك من التقاط صور للمسائل مباشرة ليقوم "حساب روح" بتحليلها وحلها لك.
                </p>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-start" : "items-end")}>
            <div className={cn(
              "max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 shadow-xl border",
              msg.role === 'user' ? "bg-blue-600 border-blue-500 text-white rounded-tr-none" : "bg-gray-800/80 text-gray-200 rounded-tl-none border-gray-700"
            )}>
              {msg.image && (
                <div className="mb-3">
                  <img 
                    src={msg.image} 
                    alt="User upload" 
                    className="rounded-lg max-h-80 w-full object-contain bg-black/40 border border-white/10" 
                  />
                  {!msg.content && <p className="text-[10px] text-blue-200 mt-1 italic">مسألة مرفوعة:</p>}
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none text-[13px] sm:text-sm leading-relaxed overflow-x-auto">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 animate-pulse px-2">
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">جاري التحليل والحل...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-[#1a1c1e] rounded-2xl border border-gray-800 p-2 sm:p-3 shadow-2xl shrink-0">
        <div className="flex items-center justify-between px-2 mb-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div 
              className={cn(
                "w-8 h-4 rounded-full transition-colors relative border border-gray-700",
                isPersistent ? "bg-blue-600 border-blue-500" : "bg-gray-800"
              )}
              onClick={() => setIsPersistent(!isPersistent)}
            >
              <div className={cn(
                "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all",
                isPersistent ? "left-4.5" : "left-1"
              )} />
            </div>
            <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-400 transition-colors">
              حفظ المحادثة دائماً
            </span>
          </label>
          {messages.length > 0 && (
            <button 
              onClick={() => { if(confirm('حذف المحادثة الحالية؟')) setMessages([]) }}
              className="text-[10px] text-gray-600 hover:text-red-400 font-bold flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} /> مسح المحادثة
            </button>
          )}
        </div>
        <form onSubmit={handleSend} className="space-y-3">
          {attachedImage && (
            <div className="relative w-20 h-20 group">
              <img src={attachedImage} className="w-full h-full object-cover rounded-xl border border-blue-500/50" />
              <button 
                type="button"
                onClick={() => setAttachedImage(null)} 
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div 
              {...dropzoneProps} 
              className="flex-shrink-0 cursor-pointer text-gray-500 hover:text-blue-400 transition-colors p-2 bg-gray-800/50 rounded-xl border border-gray-700/50" 
              title="ارفع صورة مسألة للحصول على حل فوري"
            >
              <input {...getInputProps()} />
              <Camera size={20} />
            </div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك أو ارفع صورة مسألة..."
              className="flex-1 bg-transparent border-none outline-none text-white px-2 py-2 text-sm placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !attachedImage)}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale text-white rounded-xl p-2.5 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('rouh_active_tab') || 'calc');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLanding, setIsLanding] = useState(() => {
    return !sessionStorage.getItem('rouh_splash_shown');
  }); 
  const [imageReady, setImageReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Hide the initial static loader
    const loader = document.getElementById('initial-loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }, 500);
    }

    if (!isLanding) return;

    // محاكاة أو انتظار تحميل الصورة لضمان ظهورها فجأة وليس تدريجياً
    const img = new Image();
    img.src = "https://lh3.googleusercontent.com/d/1p79NP1wGo5nAmDpGLV3xHvWbC1DJfZdZ";
    
    const handleImageLoad = () => {
      setImageReady(true);
    };
    img.onload = handleImageLoad;
    img.onerror = handleImageLoad;
    
    // مؤقت احتياطي لضمان العرض حتى لو فشل التحميل
    const loadTimeout = setTimeout(() => setImageReady(true), 2500);

    const timer = setTimeout(() => {
      setIsLanding(false);
      sessionStorage.setItem('rouh_splash_shown', 'true');
    }, 4000); // 4 ثوانٍ كما طلب المستخدم لجعلها أسرع قليلاً

    return () => {
      clearTimeout(timer);
      clearTimeout(loadTimeout);
    };
  }, [isLanding]);

  useEffect(() => {
    localStorage.setItem('rouh_active_tab', activeTab);
  }, [activeTab]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hissab_rouh_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('hissab_rouh_history', JSON.stringify(history));
  }, [history]);

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50)); 
  };

  const clearHistory = () => {
    if (window.confirm('هل تريد مسح السجل؟')) {
      setHistory([]);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'calc': return <CalculatorTab onAddHistory={addHistoryItem} />;
      case 'convert': return <ConverterTab onAddHistory={addHistoryItem} />;
      case 'health': return <HealthTab onAddHistory={addHistoryItem} />;
      case 'ai': return <AISolverTab onAddHistory={addHistoryItem} />;
      case 'history': return (
        <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar max-w-lg mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black">السجل</h2>
            <button 
              type="button"
              onClick={clearHistory} 
              className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 bg-red-500/10 px-3 py-1 rounded-full"
            >
              <Trash2 size={14} /> مسح
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {history.length === 0 ? (
              <div className="text-center py-20 text-gray-600 italic text-sm">لا توجد عمليات سابقة</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-[#1a1c1e] border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-gray-500 font-mono">{new Date(item.timestamp).toLocaleTimeString('ar-EG')}</span>
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                      item.type === 'calculator' ? "bg-blue-900/20 text-blue-400" : 
                      item.type === 'converter' ? "bg-orange-900/20 text-orange-400" :
                      item.type === 'health' ? "bg-emerald-900/20 text-emerald-400" :
                      "bg-purple-900/20 text-purple-400"
                    )}>
                      {item.title}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1 leading-relaxed">{item.details}</div>
                  <div className="text-lg font-mono text-white text-left break-all font-bold">{item.result}</div>
                </div>
              ))
            )}
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="relative h-[100dvh] w-screen bg-[#0c0d0f]">
      <AnimatePresence>
        {isLanding && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setIsLanding(false)}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0c0d0f] select-none cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={imageReady ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-8"
            >
              <img 
                src="https://lh3.googleusercontent.com/d/1p79NP1wGo5nAmDpGLV3xHvWbC1DJfZdZ" 
                alt="Splash" 
                className={cn(
                  "w-72 h-72 sm:w-96 sm:h-96 object-contain drop-shadow-[0_0_50px_rgba(37,99,235,0.3)] rounded-3xl transition-all duration-700",
                  imageReady ? "scale-100 opacity-100" : "scale-90 opacity-0"
                )}
                referrerPolicy="no-referrer"
                onLoad={() => setImageReady(true)}
              />
              
              <div className="flex flex-col items-center gap-2">
                <h1 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md">روح الحاسبة الذكية</h1>
                <div className="flex gap-1.5 mt-2">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={imageReady ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1, duration: 0.5 }}
                className="mt-8 max-w-xs text-center px-6 py-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
              >
                <div className="flex items-center justify-center gap-2 text-blue-400 font-bold mb-2">
                  <Camera size={18} />
                  <span className="text-sm">استخدام الكاميرا للمسائل</span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                  سنطلب منك السماح بالوصول للكاميرا فقط عند رغبتك بتصوير أي مسألة ليقوم "روح" بتحليلها وحلّها فوراً.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row h-full w-full bg-[#0c0d0f] text-gray-200 overflow-hidden font-sans select-none">
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col w-72 bg-[#121417] border-l lg:border-l-0 lg:border-r border-gray-800 h-full p-6">
        <a 
          href="https://www.instagram.com/roohyosif?igsh=a3d6ZG91YzlyN2hr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <BrainCircuit className="text-white" size={24} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black italic tracking-tighter text-white">حساب روح</h1>
            <Instagram size={20} className="text-white" />
          </div>
        </a>

        <div className="flex flex-col gap-2 flex-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-xl transition-all relative group overflow-hidden",
                  activeTab === tab.id 
                    ? "text-blue-400 bg-blue-600/10 font-bold" 
                    : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabIndicator" className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
                )}
                <Icon size={20} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-6 border-t border-gray-800">
           <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center">Smart Math Engine 2.0</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Offline Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-yellow-600/20 border-b border-yellow-500/30 px-4 py-1.5 flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-yellow-500">أنت تعمل الآن في وضع الأوفلاين (بدون إنترنت)</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[#121417] border-b border-gray-800">
           <a 
              href="https://www.instagram.com/roohyosif?igsh=a3d6ZG91YzlyN2hr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
           >
              <BrainCircuit className="text-blue-500" size={24} />
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white italic">حساب روح</h1>
                <Instagram size={16} className="text-white" />
              </div>
           </a>
            <div className="flex items-center gap-2">
               <button 
                 type="button"
                 onClick={() => setActiveTab('history')} 
                 className={cn("p-2 rounded-lg transition-colors", activeTab === 'history' ? "text-blue-400 bg-blue-600/10" : "text-gray-500")}
               >
                  <History size={20} />
               </button>
            </div>
        </header>

        <div className="flex-1 relative overflow-hidden bg-[#0c0d0f]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-10"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Navbar */}
        <nav className="lg:hidden flex items-center justify-around bg-[#121417] border-t border-gray-800 pb-safe px-4 h-16 sm:h-20 shrink-0">
          {TABS.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 transition-all relative",
                  isActive ? "text-blue-400" : "text-gray-500"
                )}
              >
                {isActive && (
                  <motion.div layoutId="mobileTabActive" className="absolute -top-1 w-8 h-1 bg-blue-500 rounded-full" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
    </div>
  );
}
