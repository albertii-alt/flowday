# FlowDay — AI Collaboration Guide

## 1. Purpose
This document defines how AI tools should be used while building FlowDay.

The goal is to keep development:
- consistent
- organized
- scalable
- aligned with the official product vision

---

## 2. AI Roles
### ChatGPT Role
ChatGPT should be used for:
- product planning
- app architecture
- UI/UX strategy
- feature breakdown
- debugging support
- technical explanation
- code review
- implementation guidance

### Code Generator AI Role (e.g. DeepSeek / Gemini / Copilot)
Code generation AI should be used for:
- generating components
- generating screens
- generating store logic
- generating SQLite integration
- generating utility functions
- speeding up repetitive coding

---

## 3. Golden Rule
AI must follow the official FlowDay documentation files.

These files are the source of truth:
- 01_PRODUCT_OVERVIEW.md
- 02_UI_UX_SYSTEM.md
- 03_TECH_ARCHITECTURE.md
- 04_DEVELOPMENT_ROADMAP.md

AI should not invent features outside the current phase unless explicitly asked.

---

## 4. Prompting Rules
When asking AI to generate code:
- be specific
- mention the exact file
- mention the exact feature
- mention the exact tech stack
- mention that code must align with FlowDay docs

---

## 5. Required Prompt Context
When generating code, always include:
- app name: FlowDay
- tech stack: React Native, Expo, TypeScript, NativeWind, Zustand, Expo SQLite, Expo Router
- architecture: modular and scalable
- product style: modern, clean, user-friendly, premium
- app type: offline-first task management app

---

## 6. AI Coding Rules
Generated code should:
- be TypeScript-safe
- be modular
- be readable
- be production-minded
- avoid unnecessary complexity
- match the current roadmap phase

---

## 7. Recommended Workflow
### Step 1
Ask ChatGPT what should be built next.

### Step 2
Ask code generator AI to generate the exact code for that feature.

### Step 3
Paste the generated code into the correct files.

### Step 4
Return to ChatGPT for:
- debugging
- review
- refinement
- next steps

---

## 8. Prompt Template
Use this template when asking AI to generate code:

```text
I am building an app called FlowDay.

FlowDay is an offline-first modern productivity/task management mobile app.

Tech stack:
- React Native
- Expo
- TypeScript
- NativeWind
- Zustand
- Expo SQLite
- Expo Router

Please generate code for:
[INSERT FEATURE HERE]

Requirements:
- keep the code modular
- keep the code scalable
- use TypeScript properly
- follow modern React Native best practices
- align with a clean modern premium app style
- do not add unnecessary complexity