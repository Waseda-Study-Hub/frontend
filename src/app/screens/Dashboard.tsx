import { useNavigate } from "react-router";
import { Users, MapPin, Zap, ArrowRight, Battery, BatteryCharging, UserPlus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Card */}
      <div className="rounded-2xl gradient-waseda p-8 text-white shadow-waseda">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Kenta</h1>
        <p className="text-white/90 text-lg">What are we focusing on today? Find peers or secure a study spot.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Study Buddy Quick-Access */}
        <div className="bg-white rounded-2xl p-6 shadow-waseda border border-[var(--color-waseda-border)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Your Study Buddies
            </h2>
          </div>

          <div className="space-y-4 flex-grow">
            {[
              { name: "Yuki S.", major: "CS • 2nd Year", course: "Data Structures", status: "Active Request" },
              { name: "Aoi M.", major: "SILS • 3rd Year", course: "Macroeconomics", status: "Connected" }
            ].map((buddy, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {buddy.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{buddy.name}</p>
                    <p className="text-xs text-gray-500">{buddy.major} • {buddy.course}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${buddy.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {buddy.status}
                </span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate("/buddies")}
            className="w-full mt-6 bg-[var(--color-waseda-text)] text-white font-medium py-3 rounded-xl hover:bg-black/90 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Find New Buddies
          </button>
        </div>

        {/* Study Spot Quick-Access */}
        <div className="bg-white rounded-2xl p-6 shadow-waseda border border-[var(--color-waseda-border)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              Today's Study Spots
            </h2>
          </div>

          <div className="space-y-4 flex-grow">
            {[
              { 
                name: "Central Library - 3rd Floor (Quiet)", 
                tags: ["Outlets Available", "Peaceful"],
                image: "https://images.unsplash.com/photo-1741707596397-efaae09503b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGludGVyaW9yfGVufDF8fHx8MTc4MjI3MjI4NXww&ixlib=rb-4.1.0&q=80&w=1080"
              },
              { 
                name: "Building 3 Lounge (Casual)", 
                tags: ["No Outlets", "Moderately Crowded"],
                image: "https://images.unsplash.com/photo-1763890763377-abd05301034d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbG91bmdlfGVufDF8fHx8MTc4MjI3MjI4N3ww&ixlib=rb-4.1.0&q=80&w=1080"
              }
            ].map((spot, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate("/spots")}>
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <ImageWithFallback src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-sm mb-1">{spot.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {spot.tags.map(tag => (
                      <span key={tag} className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1
                        ${tag.includes('Outlets Available') ? 'bg-green-50 text-green-700 border border-green-100' : ''}
                        ${tag.includes('No Outlets') ? 'bg-red-50 text-red-700 border border-red-100' : ''}
                        ${tag.includes('Peaceful') ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                        ${tag.includes('Crowded') ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : ''}
                        ${!tag.includes('Outlets') && !tag.includes('Peaceful') && !tag.includes('Crowded') ? 'bg-gray-100 text-gray-600' : ''}
                      `}>
                        {tag.includes('Outlet') && (tag.includes('No') ? <Battery className="w-3 h-3" /> : <BatteryCharging className="w-3 h-3" />)}
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate("/spots")}
            className="w-full mt-6 bg-white border-2 border-[var(--color-waseda-text)] text-[var(--color-waseda-text)] font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            Explore Spots
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
