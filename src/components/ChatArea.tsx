import React, { useRef, useEffect } from "react";
import { Message, VisualExplanation } from "../types.js";
import { MessageItem } from "./MessageItem.js";
import { Logo } from "./Logo.js";
import { Newspaper, Code2, Coins, Lightbulb, Image } from "lucide-react";

interface ChatAreaProps {
  messages: Message[];
  onSelectPrompt: (promptText: string) => void;
  onRegenerate: (index: number) => void;
  onOpenImageViewer: (imageUrl: string, message: Message) => void;
  onOpenVisualViewer?: (visual: VisualExplanation) => void;
  onFeedback: (messageId: string, liked: boolean) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSelectPrompt,
  onRegenerate,
  onOpenImageViewer,
  onOpenVisualViewer,
  onFeedback,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    messages,
    messages[messages.length - 1]?.content,
    messages[messages.length - 1]?.visualExplanation,
  ]);

  const quickPrompts = [
    {
      icon: Image,
      color: "text-[#00F2FE] bg-[#00F2FE]/10 border-[#00F2FE]/20",
      title: "បង្កើតរូបភាព AI (Image Gen)",
      subtitle: "បង្កើតរូបអង្គរវត្តពេលថ្ងៃរះស្អាតៗ",
      prompt: "បង្កើតរូបអង្គរវត្តពេលថ្ងៃរះ ជាមួយស្រះទឹកឆ្លុះបញ្ចាំង",
    },
    {
      icon: Newspaper,
      color: "text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20",
      title: "ព័ត៌មានទាន់ហេតុការណ៍",
      subtitle: "ព័ត៌មានអន្តរជាតិ & កម្ពុជាថ្ងៃនេះ",
      prompt: "តើមានព័ត៌មានទាន់ហេតុការណ៍អន្តរជាតិអ្វីខ្លះថ្ងៃនេះ?",
    },
    {
      icon: Code2,
      color: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20",
      title: "សរសេរកូដ & ដោះស្រាយ Bugs",
      subtitle: "ជំនួយបច្ចេកទេស និង Programming",
      prompt: "សូមជួយពន្យល់ និងសរសេរកូដ React Component សម្រាប់ Dark Mode",
    },
    {
      icon: Lightbulb,
      color: "text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/20",
      title: "ដោះស្រាយបញ្ហាទូទៅ",
      subtitle: "គណិត អាជីវកម្ម ឬការបកប្រែ",
      prompt: "សូមជួយណែនាំយុទ្ធសាស្ត្រចាប់ផ្តើមអាជីវកម្មខ្នាតតូច",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 w-full">
      {messages.length === 0 ? (
        /* Clean Minimalist Welcome Screen */
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full text-center animate-fadeIn select-none">
          <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8">
            <Logo size="lg" showText={false} />
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
                CHAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FE] via-[#818CF8] to-[#C084FC]">GPR</span>
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] font-khmer">
                តើខ្ញុំអាចជួយអ្វីអ្នកនៅថ្ងៃនេះបានដែរ?
              </p>
            </div>
          </div>

          {/* Quick Interactive Prompt Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
            {quickPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt(item.prompt)}
                  className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#14171E] hover:bg-[#1C2028] border border-[#242933] hover:border-[#6366F1]/50 active:scale-[0.98] transition-all group shadow-sm"
                >
                  <div className={`p-2 rounded-xl border ${item.color} flex-shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-semibold text-white font-khmer group-hover:text-[#818CF8] transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#64748B] font-khmer truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Messages Stream */
        <div className="flex-1 w-full pb-4">
          {messages.map((msg, index) => (
            <MessageItem
              key={msg.id || index}
              message={msg}
              onRegenerate={msg.role === "assistant" ? () => onRegenerate(index) : undefined}
              onOpenImageViewer={(url) => onOpenImageViewer(url, msg)}
              onOpenVisualViewer={onOpenVisualViewer}
              onFeedback={onFeedback}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
