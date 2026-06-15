Screen 1: Weekly Habits Tracker (Image 1)
This screen focuses on a highly granular, actionable weekly view where users can quickly log or view quantified habits day by day.

1. Global Header & Navigation
Top Bar: Displays the app branding (loggd.life on the top left) alongside standard iOS status bar items (Time: 20:24, Wi-Fi, Cellular, Battery at 68%). Below this sit a notification bell icon and a small circular user avatar.

Screen Title: A large, bold section heading titled "Habits".

View Switcher (Segmented Control): A subtle pill-shaped toggle container with three options: Single, Weekly (currently selected with a soft blue background highlighting white text), and Yearly.

Date Pagination: A center-aligned date indicator (Mar 30 - Apr 5, 2026) flanked by left (<) and right (>) chevron arrows to navigate between weeks.

2. Weekly Habit Cards (The Core Content)
The screen features a vertical stack of rounded-corner cards. Each card represents a distinct habit or metric type:

Card Layout Structure:

Top Left: An icon mapped to a specific brand or activity color scheme, followed by the habit name (e.g., "Post on Threads", "SaaS Work").

Top Right: A flame streak icon accompanied by a number indicating the active streak (e.g., 🔥 50, 🔥 104).

The 7-Day Grid: A horizontal row of 7 rounded square boxes corresponding to the days of the week (MO, TU, WE, TH, FR, SA, SU).

Data Representation Across Cards:

Quantified Counter (Threads - Blue): The days show numeric entries (e.g., 3, 5, 3, 2, 2). Filled squares match the category color, while inactive days are empty grey wireframe boxes.

Time Duration (SaaS Work - Purple): Active days show precise time durations (e.g., 1h18m, 45m, 27m, 1h5m) using a purple color block.

GitHub API Sync (GitHub Activity - Green): Mimics standard GitHub commit volumes with numbers (1, 2, 8, 3) mapped to varying shades of green blocks.

Simple Checkbox (Reddit - Orange): A simple checkmark indicator (✓) inside a filled orange block for completed single-action habits.

Inactive/Zero State (Cycling - Pink theme): Shows empty grey wireframe blocks for a week with no logged data yet.

3. Sticky & Floating Elements
Contextual Helper Text: A small, muted prompt reading "Tap to check · Long-press for more" sits just above the navigation.

Floating Action Button (FAB): A prominent, circular blue button with a white plus sign (+) positioned in the bottom-right area for adding new habits or logs.

Bottom Navigation Bar: A dark translucent bar containing 5 icons with text labels: Home, Habits (Active, highlighted with a capsule background pill shape), Tasks, Timer, and More.

Screen 2: User Profile & Gamified Analytics (Image 2)
This screen serves as a personal dashboard combining user identity, gamification mechanics (XP/Levels), and an aggregate activity grid.

1. Profile Header & Gamification Card
Avatar: A large, centered circular profile picture with a glowing blue border.

User Handle & Bio: Displays the username @beusebiu with a triple-dot (...) action menu next to it. Below is a brief, center-aligned bio text: "The guy behind Loggd. Dad, dev, doing the work."

Gamification Badges: A row of three pill badges centered under the bio:

⭐ Lvl 26 (Purple/Blue text and icon)

⚡ 4,388 XP (Yellow text and icon)

🔥 116d (Orange text and icon representing an overall daily streak)

Achieved Badges Carousel: A horizontally scrollable row of circular, illuminated icons representing unlocked achievements, labeled below each icon (e.g., Founding Member, Centurion, Night Master, Zero Inbox, Visionary).

2. Combined Activity Heatmap
Section Title: Labeled "Activity" with an inline dropdown selector on the right set to Today.

The Grid: A dense horizontal grid of rounded squares (similar to a GitHub contribution graph), categorized by months across the top (Oct, Nov, Dec, Jan, Feb, Mar).

Data Aggregation: The grid uses shades of blue to indicate daily activity intensity.

Summary Footer: A small text bar directly under the grid reading: 1,042 contributions and 116 active days.

3. Habits Sub-Section (Preview)
Section Title: Labeled "Habits" with a numeric badge (5) indicating total monitored habits.

Habit Detail Card: A preview of individual habit performance graphs (e.g., "Post on Threads" showing a continuous string of blue history dots alongside statistics like 50 streak, 116 best, and ✓ 116 days).

Bottom Navigation Bar: Identical to Screen 1.

Screen 3: Yearly History Heatmaps (Image 3)
This screen acts as a macro-view archive, providing a long-term bird's-eye view of all habits using GitHub-style contribution grids.

1. Header Configurations
Top Elements: Standard iOS header information (Time: 20:25).

Title & Segmented Control: Matches Screen 1's header structure, but the view switcher pill now has Yearly selected, highlighting it with a soft blue background.

2. Yearly Habit Grids (The Core Content)
Instead of day-by-day blocks, each habit card now expands vertically to hold a rolling multi-month heatmap grid, mapping past consistency over half a year or more.

Card Layout Structure:

Top Row Metrics: Shows the habit icon, name, current streak (🔥 50, 🔥 104, etc.), total active days (116d, 252d, 14d), and a status indicator button on the far right (e.g., a blue circle with a count, a checkmark, or a refresh symbol).

The Heatmap Canvas: Below the text metrics sits a massive grid of micro-squares. The columns are grouped and labeled by month timelines horizontally across the top (Sep, Oct, Nov, Dec, Jan, Feb, Mar).

Color Coding Systems:

Threads (Blue): A solid wall of uniform blue blocks representing near-perfect daily completion.

SaaS Work (Purple/Yellow/Orange): Uses color multi-mapping. Base completions are purple, but specific milestone days or intensive periods break out into distinct orange and yellow squares.

GitHub Activity (Green): Standard classic multi-shade green matrix indicating varying daily productivity loads.

Post on Reddit (Orange): Shows empty grey blocks for late autumn, with a burst of orange activity blocks starting around February and March.

Cycling (Pink): Minimalist entries, showing blank grey blocks except for a few scattered pink squares in late February and March.

3. Floating and Navigation Elements
Floating Action Button (FAB): The blue + button is visible in the lower right area.

Bottom Navigation Bar: Persistent navigation options matching screens 1 and 2.

UX Design Cheat-Sheet for Reverse Engineering
If you are writing the code or designing components for this app, structure your design system around these reusable tokens:

Color Palette: Dark Mode Native. Charcoal/Deep Blue-Grey backgrounds (#121620 approx.), with cards utilizing a slightly lighter elevation shade. Accent colors are highly saturated pastels (Threads Blue, SaaS Purple, GitHub Green, Reddit Orange, Cycling Pink).

Typography: San Francisco (iOS default Sans-Serif). Clean hierarchy utilizing heavy font-weights for titles and micro-shrunk, bold text for day labels (MO, TU) and month indicators.

Component Architecture:

HabitCardContainer: A master wrapper UI component that dynamically changes its inner content based on the global state (Weekly vs Yearly).

ContributionGrid: A reusable matrix component that takes an array of values (0 to Max intensity) and maps them to opacity steps or color tokens.