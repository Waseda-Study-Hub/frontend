import { X, Mail, MessageCircle, Info } from "lucide-react";
import { useState } from "react";

interface RequestStudyModalProps {
  recipientName: string;
  courseName?: string;
  onClose: () => void;
}

export function RequestStudyModal({ recipientName, courseName, onClose }: RequestStudyModalProps) {
  const defaultMessage = courseName 
    ? `Hi! I saw you are taking ${courseName} too. Would you like to study together?`
    : `Hi! I saw your profile and we have similar study styles. Would you like to study together?`;
    
  const [message, setMessage] = useState(defaultMessage);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-lg">Send a Study Request to {recipientName}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p>Your contact information will only be shared with {recipientName} if they choose to accept your request.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 min-h-[100px] resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose what contact info to share upon approval:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black" defaultChecked />
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Waseda Email</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black" />
                <span className="font-medium text-gray-500 text-xs px-1">IG</span>
                <span className="text-sm">Instagram handle</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black" />
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm">LINE ID</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              // Handle send logic
              onClose();
            }}
            className="px-6 py-2 text-sm font-medium text-white bg-[var(--color-waseda-text)] hover:bg-black/90 rounded-xl transition-colors shadow-sm"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
