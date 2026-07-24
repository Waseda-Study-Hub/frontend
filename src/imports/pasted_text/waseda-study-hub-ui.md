You are an expert UI/UX designer. Design a complete, high-fidelity, and fully responsive web application prototype for "Waseda Study Hub," an academic matchmaking and campus-study-resource platform for Waseda University students. 

### 1. Global Visual Identity & Design System
- **Tone:** Academic, minimalist, clean, warm, and highly functional. Not a social network—this is a productivity platform.
- **Color Palette:** 
  - Backgrounds: Warm, clean off-white (#FDFBF7) and pure white (#FFFFFF).
  - Main Text: Rich charcoal black (#111111).
  - Accent / Primary Gradient: A soft, organic gradient transitioning from warm mauve/rose (#C59B9B) to a calm, muted sky blue (#A5C3D1). This gradient should be used sparingly for header backgrounds, primary visual elements, and highlight cards.
  - Badges/Status: Soft, pastel-tinted backgrounds with high-contrast text.
- **Typography:** Modern, geometric sans-serif (e.g., Inter, Plus Jakarta Sans). High-contrast weights for headings, clean medium/regular for UI labels and body copy.
- **Components Styling:** 12px to 16px border-radius on all cards, buttons, and inputs. Flat elements with very subtle borders (#E6E6E6) or gentle dropshadows (0px 4px 12px rgba(0,0,0,0.03)).

Generate the following 7 high-fidelity screens, modals, and interactive UI components to complete the entire frontend flow:

---

### Screen 1: Login & Student Verification (Firebase Auth Integration)
- **Layout:** Centered split-screen or minimalist card.
- **Header:** Waseda Study Hub brand logo (geometric pinwheel) and name.
- **UI Elements:**
  - Headline: "Study Smarter, Together."
  - Form Fields: "Waseda Student Email (@fuji.waseda.jp or @suou.waseda.jp)" input, and "Password" input.
  - Buttons: Solid black "Sign In" button, and an outlined "Sign Up with Waseda ID" button.
  - Footer note: "Securely authenticated via Firebase. Restricted to verified Waseda University students."

---

### Screen 2: Logged-In Student Dashboard (Home)
- **Top Navigation Bar:** Waseda Study Hub logo (left), Navigation links: "Study Buddy", "Study Spot" (center), and User Profile circular avatar dropdown displaying initials or profile pic (right).
- **Hero Card:** Mauve-to-blue gradient banner. Title: "Welcome back, [Name]". Subtitle: "What are we focusing on today? Find peers or secure a study spot."
- **Dashboard Grid (2 Columns):**
  - **Left Card (Study Buddy Quick-Access):** Title "Your Study Buddies". Shows a list of active requests or connected peers with their major/courses, and a prominent black CTA button: "Find New Buddies".
  - **Right Card (Study Spot Quick-Access):** Title "Today's Study Spots". Highlights 2 recommended campus spots (e.g., "Central Library - 3rd Floor (Quiet)" and "Building 3 Lounge (Casual)") with real-time tags (Outlets available, crowdedness level), and a CTA button: "Explore Spots".

---

### Screen 3: Academic Profile Setup & Preferences Form
- **Header Banner:** Slim gradient header reading: "Set up Your Academic Profile".
- **Form Columns (Organized, clean grid):**
  - **Basic Info Block:** Input fields for "Name/Nickname", "Year" (Dropdown selection: 1st Year, 2nd Year, 3rd Year, 4th Year, Graduate), and "Major / Faculty" text field.
  - **Academic Focus Block:** "Current Courses" input field (supports adding tags for up to 3 active courses) and "Main Study Focus" input field with placeholder: "(Homework / Exam prep / Projects / Review)".
  - **Study Style Badges:** Clickable multi-select pill tags for: "Quiet Study", "Active Discussion", "Morning Person", "Afternoon Person", "Evening/Night", "Group Study (3+)", "1-on-1 Study".
  - **Language Preference:** Dropdown multi-select for "Preferred Study Language" (options: English, Japanese, Bilingual).
  - **Social Handle Block (Privacy First):** "Instagram Handle", "Discord", or "LINE ID" input with a toggle switch: "Only share with peers after I accept their study request".
- **Action Footer:** A centered solid black "Save and Create Profile" button.

---

### Screen 4: Study Buddy Discovery Directory (Search & Filter)
- **Header:** Clean title "Explore classmates and find your study group."
- **Filter & Search Row (Highly functional):**
  - Search bar inputting keywords/courses/tags.
  - Dropdown select components for "Major/Faculty", "Year", and "Study Style".
  - Clear all filters link.
- **Results Grid (3-column layout):**
  - Profile Cards displaying:
    - Bold Name (e.g., "Nick").
    - Subtext "CS • 1st Year" or "SILS • 3rd Year".
    - "Courses:" followed by highlighted course labels (e.g., "Discrete Math", "Java", "Intro to Economics").
    - Preferences section displaying rounded icon-led badges for study style tags (e.g., 🏷️ "Quiet", 🏷️ "Afternoon", 🏷️ "Library").
    - Primary CTA at the bottom of the card: Solid black button reading "Request Study".
  - **Pagination component:** Centered at the bottom "1 2 3 • • • 6" with active page highlight.

---

### Screen 5: "Request Study" Privacy-First Connection Flow (Modal/Popup)
- **Overlay:** Muted transparent dark backdrop centering a minimalist dialog box.
- **Header:** "Send a Study Request to [Name]" with a close (X) icon on top right.
- **UI Elements:**
  - Brief introductory text explaining that contact info will only be shared if the recipient accepts.
  - **Message Box:** A text area with a default placeholder: "Hi! I saw you are taking [Course Name] too. Would you like to study together?"
  - **Contact Method Selector:** A checkbox selection labeled "Choose what contact info to share upon approval:" with options [ ] Waseda Email, [ ] Instagram handle, [ ] LINE ID.
  - **Action Buttons:** Flex row at the bottom with a gray cancel button and a solid black "Send Request" button.

---

### Screen 6: Study Spot Directory & campus discovery
- **Header:** Title "Find Your Ideal Study Spot" with subtitle "Browse and discover cafes, campus libraries, and quiet corners."
- **Filter Row:** Filters for "Noise Level" (Quiet, Casual, Group-Friendly), "Outlets" (Required, Optional), "Private Rooms" (Yes/No), and "Crowdedness" (Low, Medium, High).
- **Study Spot Grid (2-column cards):**
  - Spot Cards featuring:
    - Large placeholder image container for the study spot (e.g., Central Library, Building 11 Lounge, S-Cafe).
    - Left text: Spot Name (e.g., "Haruki Murakami Library (B1F)") and building location.
    - Right text: Noise level indicator label (e.g., "Quiet").
    - Feature Icons/Metadata Row: Small clean icons displaying "🔌 Outlets Available", "🚶 2 min to Lawson", "🚽 Nearby Restrooms", "👥 Private Rooms Available".
    - Active status label: "Currently: Moderately Crowded" (colored yellow) or "Currently: Peaceful" (colored green).

---

### Screen 7: "Recommend a New Study Spot" Form (Crowdsourcing)
- **Layout:** Standard single-column card layout to allow students to contribute spots.
- **Form Fields:**
  - **Spot Name** input (e.g., "Building 3 Lounge - 2nd Floor").
  - **Campus Area** dropdown select (e.g., Waseda Campus, Toyama Campus, Nishi-Waseda Campus, Tokorozawa Campus).
  - **Description** text area for details (e.g., proximity to convenience stores, atmosphere).
  - **Key Amenities Checks:** Row of checkable boxes: [ ] Electrical Outlets, [ ] Nearby Restroom, [ ] Private study room, [ ] Food allowed.
  - **Noise Level Selector:** Segmented control button group: [ Quiet ] [ Casual ] [ Group-Friendly ].
  - **Spot Visibility:** Radio buttons [ ] Public (Share with all Waseda students), [ ] Private (Save for my eyes/my study buddies only).
- **Action Buttons:** Center-aligned "Submit Spot for Approval".