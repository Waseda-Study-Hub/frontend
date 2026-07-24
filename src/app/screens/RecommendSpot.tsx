import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, BatteryCharging, Users, Utensils, Droplets } from "lucide-react";

export function RecommendSpot() {
  const navigate = useNavigate();
  const [noiseLevel, setNoiseLevel] = useState("Quiet");
  const [visibility, setVisibility] = useState("Public");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/spots");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-[var(--color-waseda-text)]">Recommend a New Study Spot</h1>
        <p className="text-gray-500 mt-2">Help your fellow students find the best places to study on campus.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-waseda p-6 sm:p-8 border border-[var(--color-waseda-border)] space-y-8">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spot Name</label>
            <input type="text" placeholder="e.g., Building 3 Lounge - 2nd Floor" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campus Area</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <select className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 bg-white" required>
                <option value="">Select Campus</option>
                <option value="waseda">Waseda Campus</option>
                <option value="toyama">Toyama Campus</option>
                <option value="nishi">Nishi-Waseda Campus</option>
                <option value="tokorozawa">Tokorozawa Campus</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              placeholder="Tell us about the atmosphere, proximity to convenience stores, etc..." 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 min-h-[120px] resize-none" 
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Key Amenities</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black" />
              <BatteryCharging className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Electrical Outlets</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black" />
              <Droplets className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Nearby Restroom</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black" />
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Private study room</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black" />
              <Utensils className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Food allowed</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Noise Level</label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['Quiet', 'Casual', 'Group-Friendly'].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setNoiseLevel(level)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  noiseLevel === level 
                    ? 'bg-white text-[var(--color-waseda-text)] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Spot Visibility</label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="visibility" 
                checked={visibility === 'Public'}
                onChange={() => setVisibility('Public')}
                className="mt-1 w-4 h-4 text-[var(--color-waseda-text)] focus:ring-[var(--color-waseda-text)] border-gray-300" 
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Public</p>
                <p className="text-xs text-gray-500">Share with all Waseda students</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="visibility" 
                checked={visibility === 'Private'}
                onChange={() => setVisibility('Private')}
                className="mt-1 w-4 h-4 text-[var(--color-waseda-text)] focus:ring-[var(--color-waseda-text)] border-gray-300" 
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Private</p>
                <p className="text-xs text-gray-500">Save for my eyes/my study buddies only</p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-[var(--color-waseda-text)] text-white font-medium rounded-xl hover:bg-black/90 transition-colors w-full sm:w-auto min-w-[250px]"
          >
            Submit Spot for Approval
          </button>
        </div>
      </form>
    </div>
  );
}
