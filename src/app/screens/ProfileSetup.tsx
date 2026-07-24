import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, X } from "lucide-react";

import { SchoolCombobox } from "../components/SchoolCombobox";

export function ProfileSetup() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<string[]>(["Intro to Economics"]);
  const [courseInput, setCourseInput] = useState("");
  const [school, setSchool] = useState("");
  
  const [styleTags, setStyleTags] = useState<string[]>(["Quiet Study", "Afternoon Person"]);
  const allStyleTags = ["Quiet Study", "Active Discussion", "Morning Person", "Afternoon Person", "Evening/Night", "Group Study (3+)", "1-on-1 Study"];

  const handleAddCourse = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && courseInput.trim() && courses.length < 3) {
      e.preventDefault();
      setCourses([...courses, courseInput.trim()]);
      setCourseInput("");
    }
  };

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  const toggleStyleTag = (tag: string) => {
    if (styleTags.includes(tag)) {
      setStyleTags(styleTags.filter(t => t !== tag));
    } else {
      setStyleTags([...styleTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="rounded-xl gradient-waseda p-6 text-white shadow-waseda text-center">
        <h1 className="text-2xl font-bold">Set up Your Academic Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-waseda p-8 border border-[var(--color-waseda-border)] space-y-8">
        
        {/* Basic Info Block */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name / Nickname</label>
              <input type="text" placeholder="e.g., Kenta" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 bg-white" required>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="grad">Graduate</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Major / Faculty</label>
              <SchoolCombobox 
                value={school} 
                onChange={setSchool} 
                placeholder="Find your school..."
              />
            </div>
          </div>
        </section>

        {/* Academic Focus Block */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Academic Focus</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Courses (Max 3)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {courses.map((course, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-sm px-3 py-1 rounded-full border border-gray-200">
                    {course}
                    <button type="button" onClick={() => removeCourse(i)} className="text-gray-500 hover:text-red-500 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input 
                type="text" 
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={handleAddCourse}
                disabled={courses.length >= 3}
                placeholder={courses.length >= 3 ? "Maximum courses added" : "Type course name and press Enter..."} 
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Study Focus</label>
              <input type="text" placeholder="(Homework / Exam prep / Projects / Review)" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400" />
            </div>
          </div>
        </section>

        {/* Study Style Badges */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Study Style & Preferences</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select your study styles</label>
              <div className="flex flex-wrap gap-2">
                {allStyleTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleStyleTag(tag)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      styleTags.includes(tag) 
                        ? "bg-[var(--color-waseda-text)] text-white border-transparent" 
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Study Language</label>
              <select multiple className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400 h-24 bg-white" required>
                <option value="en">English</option>
                <option value="jp">Japanese</option>
                <option value="bi">Bilingual</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Cmd/Ctrl to select multiple</p>
            </div>
          </div>
        </section>

        {/* Social Handle Block (Privacy First) */}
        <section>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Contact & Privacy</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Handle (Instagram, Discord, LINE ID)</label>
              <input type="text" placeholder="@username or ID" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-gray-400" />
            </div>
            
            <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="relative flex items-center pt-0.5">
                <input type="checkbox" className="w-4 h-4 text-[var(--color-waseda-text)] rounded border-gray-300 focus:ring-[var(--color-waseda-text)]" defaultChecked />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Privacy First Sharing</p>
                <p className="text-xs text-gray-500">Only share with peers after I explicitly accept their study request.</p>
              </div>
            </label>
          </div>
        </section>

        <div className="pt-4 flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-[var(--color-waseda-text)] text-white font-medium rounded-xl hover:bg-black/90 transition-colors w-full sm:w-auto min-w-[250px]"
          >
            Save and Create Profile
          </button>
        </div>
      </form>
    </div>
  );
}
