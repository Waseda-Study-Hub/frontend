import { useNavigate } from "react-router";
import { Plus, Battery, BatteryCharging, Users, MapPin, Coffee, VolumeX } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function SpotDirectory() {
  const navigate = useNavigate();

  const spots = [
    {
      name: "Central Library (3rd Floor)",
      location: "Waseda Campus • Bldg 18",
      image: "https://images.unsplash.com/photo-1741707596397-efaae09503b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGludGVyaW9yfGVufDF8fHx8MTc4MjI3MjI4NXww&ixlib=rb-4.1.0&q=80&w=1080",
      noise: "Quiet",
      features: ["Outlets Available", "Nearby Restrooms"],
      status: "Currently: Peaceful",
      statusColor: "green"
    },
    {
      name: "Building 11 Lounge",
      location: "Waseda Campus • Bldg 11",
      image: "https://images.unsplash.com/photo-1763890763377-abd05301034d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbG91bmdlfGVufDF8fHx8MTc4MjI3MjI4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      noise: "Group-Friendly",
      features: ["Private Rooms", "2 min to Lawson"],
      status: "Currently: Moderately Crowded",
      statusColor: "yellow"
    },
    {
      name: "S-Cafe",
      location: "Nishi-Waseda Campus • Bldg 63",
      image: "https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWZlJTIwc3R1ZHl8ZW58MXx8fHwxNzgyMjcyMjkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      noise: "Casual",
      features: ["Coffee Shop", "Outlets Available"],
      status: "Currently: Moderately Crowded",
      statusColor: "yellow"
    },
    {
      name: "Haruki Murakami Library (B1F)",
      location: "Waseda Campus • Bldg 4",
      image: "https://images.unsplash.com/photo-1741707596397-efaae09503b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGludGVyaW9yfGVufDF8fHx8MTc4MjI3MjI4NXww&ixlib=rb-4.1.0&q=80&w=1080",
      noise: "Quiet",
      features: ["Cafe Inside", "No Outlets"],
      status: "Currently: Peaceful",
      statusColor: "green"
    }
  ];

  const renderIcon = (feature: string) => {
    if (feature.includes('Outlet') && !feature.includes('No')) return <BatteryCharging className="w-3.5 h-3.5" />;
    if (feature.includes('No Outlet')) return <Battery className="w-3.5 h-3.5" />;
    if (feature.includes('Private')) return <Users className="w-3.5 h-3.5" />;
    if (feature.includes('Coffee') || feature.includes('Cafe')) return <Coffee className="w-3.5 h-3.5" />;
    return <MapPin className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-waseda-text)]">Find Your Ideal Study Spot</h1>
          <p className="text-gray-500 mt-2">Browse and discover cafes, campus libraries, and quiet corners.</p>
        </div>
        <button 
          onClick={() => navigate("/spots/recommend")}
          className="bg-white border-2 border-[var(--color-waseda-text)] text-[var(--color-waseda-text)] font-medium py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Recommend Spot
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-waseda-border)] flex flex-wrap gap-4 items-center">
        <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 flex-grow sm:flex-grow-0">
          <option>Noise Level</option>
          <option>Quiet</option>
          <option>Casual</option>
          <option>Group-Friendly</option>
        </select>
        <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 flex-grow sm:flex-grow-0">
          <option>Outlets</option>
          <option>Required</option>
          <option>Optional</option>
        </select>
        <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 flex-grow sm:flex-grow-0">
          <option>Private Rooms</option>
          <option>Yes</option>
          <option>No</option>
        </select>
        <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 flex-grow sm:flex-grow-0">
          <option>Crowdedness</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      {/* Study Spot Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {spots.map((spot, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-waseda border border-[var(--color-waseda-border)] flex flex-col sm:flex-row hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-full sm:w-2/5 h-48 sm:h-auto shrink-0 relative">
              <ImageWithFallback src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md backdrop-blur-md flex items-center gap-1.5 shadow-sm
                  ${spot.noise === 'Quiet' ? 'bg-blue-500/90 text-white' : ''}
                  ${spot.noise === 'Casual' ? 'bg-indigo-500/90 text-white' : ''}
                  ${spot.noise === 'Group-Friendly' ? 'bg-purple-500/90 text-white' : ''}
                `}>
                  {spot.noise === 'Quiet' && <VolumeX className="w-3 h-3" />}
                  {spot.noise === 'Group-Friendly' && <Users className="w-3 h-3" />}
                  {spot.noise}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex flex-col justify-between flex-grow">
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">{spot.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{spot.location}</p>
                
                <div className="space-y-2 mb-4">
                  {spot.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      {renderIcon(feature)}
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`text-xs font-medium px-3 py-2 rounded-lg border flex justify-center
                ${spot.statusColor === 'green' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                ${spot.statusColor === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
              `}>
                {spot.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
