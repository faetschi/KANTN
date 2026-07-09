# IXD Feature Requirements

# Roadmap / Meilensteinplan

Projekt Beginn: 15.04

Projekt Deadline: offen

## Milestones

Milestone 1: Scope & UX Flow abgeschlossen
- Finaler Scope für beide Epics ist festgelegt.
- Kern-User-Flows sind als einfache Wireframes oder Screens skizziert.
- Offene Datenschutz- und Sichtbarkeitsregeln für Social Features sind geklärt.

Milestone 2: Technische Basis implementiert
- Datenmodell und Services für Firmen, Leaderboards, Workout-Pläne und Smart Defaults sind vorbereitet.
- Bestehende Workout-Logging-Flows bleiben weiterhin nutzbar.
- Erste UI-Platzhalter für Leaderboard, Social Feedback und geplante Workouts sind eingebaut.

Milestone 3: Epic 2 - Frictionless Logging & Smart Defaults umgesetzt
- Nutzer können Workouts vorplanen und direkt aus dem Plan starten.
- Beim Logging werden sinnvolle Standardwerte vorgeschlagen.
- Während des Workouts sind nur noch die wichtigsten Eingaben notwendig.

Milestone 4: Epic 1 - Persuasive Design & Gamification umgesetzt
- Firmen-Leaderboards, Team-/Firmenkontext und motivierende Feedback-Elemente sind implementiert.
- Nutzer können ihren Fortschritt im Firmenkontext sehen.
- Datenschutz- und Opt-out-Regeln sind im UI abgebildet.

Milestone 5: Feedback & UX Testing abgeschlossen
- 1. Feedbacktermin mit Johannes Robier durchgeführt und Feedback eingearbeitet.
- 2. Feedbacktermin mit Johannes Robier durchgeführt und Feedback eingearbeitet.
- Real-User UX Tests durchgeführt.
- Testfeedback priorisiert und umgesetzt.

```mermaid
flowchart LR
  M1["M1 Scope & UX Flow"] --> M2["M2 Technische Basis"]
  M2 --> M3["M4 Frictionless Logging"]
  M2 --> M4["M3 Gamification"]
  M3 --> M5["M5 Feedback & UX Tests"]
  M4 --> M5
```

## Implementation Status Overview

> **Note:** Epic 1 pivoted from a *company/team* model to a *friends* model. Users add
> friends by @username; feed, ranking and streaks are scoped to accepted friends (+ self).

### Epic 1: Persuasive Design & Gamification
- [ ] Company/team context: **to discuss first** — deliberately open. The friends model currently stands in for a social context; whether/how to add a real company/team grouping still needs a decision (see Story 1 note).
- [x] Company leaderboard: implemented as a **friends-scoped ranking** (`get_leaderboard` RPC + Ranking tab; own row highlighted, empty/loading/error states)
- [x] Motivational feedback after workouts: implemented — supportive completion modal after finishing a workout (`workout-motivation.ts` + streak/duration summary)
- [x] Privacy and leaderboard visibility controls: implemented — `leaderboard_visible` opt-out toggle in Profile, respected by `get_leaderboard`, with explanatory copy on the Ranking tab
- [x] Social feature UI/placeholders: implemented — full social page (Feed / Friends / Ranking) with infinite scroll and animations, not placeholders

### Epic 2: Frictionless Logging & Smart Defaults
- [x] Planned workout start from calendar/plan: implemented
- [x] Workout start opens the existing workout flow with plan prefill: implemented
- [x] Smart exercise defaults using plan targets and last workout values: implemented
- [x] Users can override suggested values during workout: implemented
- [x] Manual logging / freestyle mode remains available: implemented
- [x] Calendar-aware reminders and planned workout status: implemented
- [x] Date-status logic for today/upcoming/missed workouts: implemented

### Notes
- Epic 2 has strong coverage in the current codebase.
- Epic 1 is now implemented via a **friends** model (feed, friend requests, friends-scoped ranking, streaks), plus a leaderboard opt-out and a post-workout motivational message. Still to decide: whether to add a real company/team grouping (Story 1).
- Existing `visibility` fields are currently used for plan/exercise sharing, not social leaderboard privacy.

# Epics

## Persuasive Design & Gamification (B2B-Ansatz)

Wir implementieren Social-Features und Firmen-Leaderboards. Hierbei steht das „Emotional Design“ im Vordergrund, um durch soziale Dynamiken eine langfristige Verhaltensänderung und Motivation zu fördern.

### Requirements

- Nutzer können einer Firma oder einem Teamkontext zugeordnet werden.
- Nutzer sehen ein Firmen-Leaderboard mit relevanten, verständlichen Metriken.
- Leaderboards sollen motivieren, aber keinen negativen Druck erzeugen.
- Persönliche Trainingsdaten werden nur in aggregierter oder bewusst freigegebener Form angezeigt.
- Nutzer können Social-/Leaderboard-Sichtbarkeit nachvollziehen und bei Bedarf deaktivieren.
- Das Feature soll zunächst einfach bleiben: eine Firmenansicht, ein Leaderboard, ein motivierendes Feedback-Element.

### User Stories

#### Story 1: Company Context

As a company user, I want to be associated with my company or team, so that my progress can contribute to a shared company experience.

**Acceptance Criteria**
- A user can be assigned to one company.
- The app can identify the user's company when showing social features.
- Users without a company can still use the app normally.

**Implementation Tasks** — _⚠️ TO DISCUSS FIRST: how to solve the company/team dimension._
_The friends model currently covers the "social context" need. Before building this,_
_decide the approach: (a) lightweight `profiles.company` text field + optional company_
_filter on the ranking, (b) full companies table with user assignment + company-wide_
_leaderboard, or (c) drop it and keep friends as the only context. No code until decided._
- [ ] Add or confirm company/team fields in the user profile model.
- [ ] Add repository/service methods to read the current user's company context. (friend context exists via `get_friends`, but no company)
- [ ] Add fallback handling for users without a company.
- [ ] Add basic test coverage for company lookup and missing-company behavior.

#### Story 2: Company Leaderboard

As a company user, I want to see a simple leaderboard, so that I can understand how my company or team is progressing.

**Acceptance Criteria**
- The leaderboard shows ranked users or aggregated team entries for the current company.
- Ranking uses one simple metric for the first version, for example completed workouts or training points.
- The current user's own position is easy to identify.

**Implementation Tasks**
- [x] Define the first leaderboard metric. (workouts / calories / streak)
- [x] Add backend query or repository method for leaderboard data. (`get_leaderboard` RPC, friends-scoped)
- [x] Build a simple leaderboard UI for the company context. (Ranking tab on the social page)
- [x] Highlight the current user's row. (`isMe` → blue row + "(you)")
- [x] Add empty, loading, and error states. (empty message, skeleton loader, and a retryable error state on the Ranking tab)

#### Story 3: Motivational Feedback

As a company user, I want positive feedback after completing workouts, so that progress feels rewarding and visible.

**Acceptance Criteria**
- After finishing a workout, the app shows a short motivational message.
- The message references personal or company progress when data is available.
- Feedback stays supportive and avoids shaming language.

**Implementation Tasks**
- [x] Add a small set of motivational message templates. (`workout-motivation.ts` — generic + streak-based)
- [x] Connect workout completion to the feedback display. (completion modal after finishing a workout, incl. freestyle)
- [x] Include personal streak or company progress when available. (streak + session duration shown in the modal)
- [x] Add UI copy review for tone and clarity. (copy is deliberately supportive, no shaming; see file header note)

#### Story 4: Privacy & Visibility Control

As a company user, I want to understand what is visible to others, so that I can trust the social features.

**Acceptance Criteria**
- The app explains what leaderboard data is shown.
- Users can opt out of being shown by name.
- Opted-out users are hidden or anonymized without breaking leaderboard totals.

**Implementation Tasks**
- [x] Add a profile setting for leaderboard visibility. (`leaderboard_visible` toggle in Profile → Privacy)
- [x] Respect the visibility setting in leaderboard queries. (`get_leaderboard` hides opted-out others; the user always still sees themselves)
- [x] Add short explanatory copy near the leaderboard or setting. (note on the Ranking tab + helper text under the toggle)
- [x] Test anonymized and hidden-user leaderboard behavior. (`social-service.spec.ts` — hidden friend excluded, opted-out self still visible, ranking error/loading states)

## Frictionless Logging & Smart Defaults

Ein zentrales Problem bestehender Apps ist die hohe Interaktionshürde bei der Dateneingabe. Wir konzipieren einen Workflow für „reibungslose“ Protokollierung, der durch Vorplanung im Kalender und intelligente Standardwerte (Smart Defaults) die manuelle Eingabe während des Workouts auf ein Minimum reduziert.

### Requirements

- Nutzer können geplante Workouts aus einem Kalender oder einer Planansicht starten.
- Beim Start eines geplanten Workouts werden Übungen, Reihenfolge und Zielwerte vorausgefüllt.
- Während des Workouts müssen Nutzer nur Abweichungen oder Abschlusswerte anpassen.
- Smart Defaults basieren zunächst auf dem Plan und zuletzt gespeicherten Werten.
- Nutzer können Default-Werte jederzeit überschreiben.
- Der bestehende manuelle Logging-Flow bleibt verfügbar.

### User Stories

#### Story 1: Planned Workout Start

As a user, I want to start a workout from my plan or calendar, so that I do not need to rebuild the workout manually.

**Acceptance Criteria**
- Planned workouts are visible in a simple upcoming-workouts view.
- A planned workout can be started directly.
- Starting a planned workout opens the existing workout flow with prefilled exercises.

**Implementation Tasks**
- [x] Add or reuse a planned-workouts data source.
- [x] Build a simple upcoming-workouts list or calendar entry point.
- [x] Add a "start workout" action for planned workouts.
- [x] Map planned workout exercises into the active workout state.
- [x] Add tests for starting a workout from a plan. (`workout-start-from-plan.spec.ts` — plan→active mapping + smart-default prefill)

#### Story 2: Smart Exercise Defaults

As a user, I want exercise values to be prefilled, so that I only need to edit what changed today.

**Acceptance Criteria**
- Planned target values are used first when available.
- If no plan value exists, the app can suggest values from the user's latest matching workout.
- Users can edit all suggested values before saving.

**Implementation Tasks**
- [x] Define priority order for defaults: plan value, last workout value, empty value.
- [x] Add service logic for resolving default sets, reps, weight, duration, or distance.
- [x] Show suggested values in the workout UI.
- [x] Make edited values override suggestions for the current session.
- [x] Add unit tests for default priority rules.

#### Story 3: Low-Friction Workout Logging

As a user, I want to complete workout entries with minimal taps, so that logging does not interrupt my training.

**Acceptance Criteria**
- Users can confirm a prefilled set quickly.
- Users can adjust only the fields that changed.
- The UI clearly distinguishes suggested values from confirmed values.

**Implementation Tasks**
- [x] Add a quick-confirm action for prefilled workout entries.
- [x] Keep manual editing available for every logged value.
- [x] Add visual state for suggested, edited, and confirmed values.
- [ ] Ensure keyboard and mobile interactions stay efficient.
- [ ] Run a short manual UX pass on the logging flow.

#### Story 4: Calendar-Aware Reminders

As a user, I want the app to remind me about planned workouts, so that I can start logging at the right time.

**Acceptance Criteria**
- The app shows today's planned workout prominently.
- Missed or upcoming workouts are clearly labeled.
- Reminder behavior works without requiring external calendar integration in the first version.

**Implementation Tasks**
- [x] Add date status logic for today, upcoming, and missed workouts.
- [x] Surface today's workout on the main workout or dashboard screen.
- [x] Add simple labels for planned workout status.
- [x] Add tests for date status logic.
