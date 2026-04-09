# FlowDay — Technical Architecture

## 1. Technical Vision
FlowDay should be built as a clean, scalable, offline-first mobile app with a strong technical foundation.

The goal is to create an app that is:
- easy to maintain
- easy to scale
- stable
- modern
- cleanly structured

---

## 2. Platform
### Initial Platform
- Android (primary development target)

### Future Platform
- iOS support later through React Native / Expo

---

## 3. App Type
FlowDay is a:
- mobile app
- offline-first app
- local-storage-based productivity app

---

## 4. Core Tech Stack
### Frontend
- React Native
- Expo
- TypeScript

### Styling
- NativeWind (Tailwind for React Native)

### State Management
- Zustand

### Local Database / Storage
- Expo SQLite

### Navigation
- Expo Router

---

## 5. Why This Stack
### React Native + Expo
Allows fast and modern mobile app development.

### TypeScript
Improves code quality and maintainability.

### NativeWind
Speeds up modern UI development.

### Zustand
Simple and scalable app state management.

### SQLite
Reliable offline data storage.

### Expo Router
Modern file-based routing and navigation.

---

## 6. Architecture Style
Use a **feature-oriented modular architecture**.

This means the app should be organized by responsibility and feature, not by chaos.

---

## 7. Recommended Folder Structure
```text
flowday/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── today.tsx
│   ├── stats.tsx
│   ├── settings.tsx
│
├── components/
│   ├── ui/
│   ├── tasks/
│   ├── progress/
│
├── store/
│   └── taskStore.ts
│
├── db/
│   └── database.ts
│
├── utils/
│   └── helpers.ts
│
├── constants/
│   └── theme.ts
│
├── docs/
│   └── ...

8. Data Model (MVP)
Task Entity

Each task should contain:

id
title
completed
createdAt
updatedAt
Example

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

9. State Management Strategy
Zustand should manage:
current tasks
add task action
update task action
delete task action
toggle complete action
10. Database Strategy

SQLite should store:

all task records
completion state
timestamps

The database should be the source of persistence.

11. Development Rules
Rule 1

Keep components small and reusable.

Rule 2

Avoid giant files.

Rule 3

Separate UI, state, and data logic.

Rule 4

Write scalable code from the beginning.

Rule 5

Do not over-engineer MVP.

12. Future Scalability

The architecture should allow future support for:

categories
reminders
streaks
calendar mode
recurring tasks
cloud sync
user accounts


---

# **📄 FILE 4 — `04_DEVELOPMENT_ROADMAP.md`**

Copy this **exact full content**:

```md
# FlowDay — Development Roadmap

## 1. Goal
This roadmap defines the official build sequence for FlowDay.

The purpose is to avoid confusion and build the app in the correct order.

---

## 2. Development Philosophy
Build FlowDay in layers:

1. Foundation
2. Structure
3. Core Features
4. UI Polish
5. Stability

---

## 3. Phase 1 — Foundation Setup
### Objective
Set up the project and development environment.

### Tasks
- create Expo app
- configure TypeScript
- install NativeWind
- install Zustand
- install Expo SQLite
- install Expo Router
- verify app runs on phone

### Done When
The project runs successfully on the device.

---

## 4. Phase 2 — Project Structure
### Objective
Set up the proper file and folder architecture.

### Tasks
- create app screens
- create components folders
- create store folder
- create db folder
- create theme/constants folder
- create helper utils

### Done When
The project structure is clean and scalable.

---

## 5. Phase 3 — Core Task System
### Objective
Build the heart of FlowDay.

### Tasks
- create task data model
- create task store with Zustand
- create SQLite task table
- load tasks from local database
- add new task
- complete task
- delete task
- render task list

### Done When
Users can manage tasks offline successfully.

---

## 6. Phase 4 — UI/UX Polish
### Objective
Make the app feel premium and modern.

### Tasks
- improve spacing
- improve typography
- improve task cards
- improve button styling
- improve empty states
- improve completion feedback
- improve visual hierarchy

### Done When
The app feels modern and user-friendly.

---

## 7. Phase 5 — Progress Tracking
### Objective
Add motivation and tracking.

### Tasks
- count completed tasks
- calculate daily progress
- show progress indicator
- show completion percentage

### Done When
Users can visually track daily progress.

---

## 8. Phase 6 — Settings & App Refinement
### Objective
Add polish and stability.

### Tasks
- basic settings screen
- app branding
- app icon
- logo integration
- cleanup codebase
- bug fixes

### Done When
The MVP feels stable and complete.

---

## 9. MVP Completion Standard
FlowDay MVP is complete when:

- tasks can be added
- tasks can be completed
- tasks can be deleted
- tasks persist offline
- app UI feels modern
- app feels stable

---

## 10. Post-MVP Ideas
After MVP, future phases may include:
- streaks
- reminders
- categories
- calendar view
- recurring tasks
- dark mode
- analytics
- cloud sync

