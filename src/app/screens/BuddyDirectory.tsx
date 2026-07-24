import { useState } from "react";
import { Search, Filter, X, Tag } from "lucide-react";
import { SchoolCombobox } from "../components/SchoolCombobox";
import { RequestStudyModal } from "../components/RequestStudyModal";

export function BuddyDirectory() {
  const [selectedBuddy, setSelectedBuddy] = useState<{name: string, course: string} | null>(null);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("");

  const buddies = [
    { name: "Nick", major: "CS", year: "1st Year", courses: ["Discrete Math", "Java", "Intro to Economics"], tags: ["Quiet", "Afternoon", "Library"] },
    { name: "Mei", major: "SILS", year: "3rd Year", courses: ["Macroeconomics", "Global Studies"], tags: ["Active Discussion", "Morning", "Cafe"] },
    { name: "Hiroto", major: "Engineering", year: "2nd Year", courses: ["Physics II", "Calculus"], tags: ["Group Study", "Evening", "Library"] },
    { name: "Sarah", major: "Business", year: "4th Year", courses: ["Marketing", "Finance"], tags: ["1-on-1", "Morning", "Quiet"] },
    { name: "Kenji", major: "Political Science", year: "1st Year", courses: ["Intro to Politics"], tags: ["Active Discussion", "Afternoon"] },
    { name: "Yui", major: "Literature", year: "Graduate", courses: ["Modern Fiction"], tags: ["Quiet", "Evening"] },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold text-[var(--color-waseda-text)]">Explore classmates and find your study group.</h1>
      </div>

      {/* Filter & Search Row */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-waseda-border)] flex flex-wrap gap-4 items-center">
        <div className="flex-grow min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search keywords, courses, tags..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-colors text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div className="w-full md:w-[250px]">
            <SchoolCombobox 
              value={selectedSchoolFilter} 
              onChange={setSelectedSchoolFilter} 
              placeholder="Major/Faculty"
              className="py-2 px-3 border border-gray-200"
            />
          </div>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
            <option>Year</option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5">
            <option>Study Style</option>
            <option>Quiet</option>
            <option>Active Discussion</option>
            <option>Group</option>
          </select>
          
          <button className="text-sm text-gray-500 hover:text-gray-800 underline decoration-gray-300 underline-offset-2">
            Clear all
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {buddies.map((buddy, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-waseda border border-[var(--color-waseda-border)] flex flex-col h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full gradient-waseda flex items-center justify-center text-white font-bold text-xl shrink-0">
                {buddy.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{buddy.name}</h3>
                <p className="text-sm text-gray-500">{buddy.major} • {buddy.year}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Courses</p>
              <div className="flex flex-wrap gap-1.5">
                {buddy.courses.map(course => (
                  <span key={course} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                    {course}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6 flex-grow">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Preferences</p>
              <div className="flex flex-wrap gap-1.5">
                {buddy.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setSelectedBuddy({ name: buddy.name, course: buddy.courses[0] })}
              className="w-full bg-[var(--color-waseda-text)] text-white font-medium py-2.5 rounded-xl hover:bg-black/90 transition-colors mt-auto"
            >
              Request Study
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 pt-8">
        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-waseda-text)] text-white font-medium text-sm">1</button>
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">2</button>
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">3</button>
        <span className="px-1 text-gray-400 tracking-widest">• • •</span>
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">6</button>
      </div>

      {selectedBuddy && (
        <RequestStudyModal 
          recipientName={selectedBuddy.name} 
          courseName={selectedBuddy.course}
          onClose={() => setSelectedBuddy(null)} 
        />
      )}
    </div>
  );
}
