# FlowDay — Engineering Standard

## 1. Purpose
This document defines the official engineering standards for FlowDay.

Its purpose is to ensure that all generated and written code is:
- secure
- scalable
- clean
- maintainable
- optimized
- production-minded

This document must be followed by all human-written and AI-generated code.

---

## 2. Core Engineering Philosophy
FlowDay should be built like a real production-ready app, even as an MVP.

This means:
- no messy hacks
- no random shortcuts
- no giant files
- no unsafe code unless intentionally justified
- no unnecessary complexity

The codebase should stay simple, but professionally structured.

---

## 3. Official Code Quality Standards
All code must be:

### Clean
- readable
- understandable
- properly named
- easy to maintain

### Modular
- split by responsibility
- reusable where appropriate
- not tightly coupled

### Scalable
- easy to extend later
- easy to refactor
- organized for future features

### Stable
- avoids fragile logic
- avoids unnecessary side effects
- avoids inconsistent state

---

## 4. TypeScript Rules
All code must use TypeScript properly.

### Required:
- define types for props
- define types for function parameters
- define types for return values when useful
- define types for data models
- avoid ambiguous data structures

### Avoid:
- `any`
- unsafe casting unless truly necessary
- unclear object shapes

### Preferred:
- explicit interfaces or types
- readable type aliases
- strongly typed state

---

## 5. React Native / Expo Rules
### Component Rules
- keep components focused
- keep screens readable
- extract repeated UI into reusable components
- avoid giant screen files

### State Rules
- UI state stays local when appropriate
- shared app state goes to Zustand
- persistence logic stays separate from UI

### Navigation Rules
- routes must stay clean and predictable
- avoid confusing route structures

---

## 6. Styling Rules
FlowDay uses NativeWind.

### Styling must be:
- consistent
- readable
- modern
- mobile-friendly

### Avoid:
- chaotic spacing
- random class combinations
- inconsistent sizing
- poor tap targets

### Preferred:
- reusable visual patterns
- clean spacing system
- rounded modern UI
- strong visual hierarchy

---

## 7. File Architecture Rules
### Each file should have one clear responsibility.

Good examples:
- one screen per screen file
- one reusable UI block per component file
- one store per state domain
- one database helper per data concern

### Avoid:
- giant “do everything” files
- mixing UI, database, and business logic in one place

---

## 8. Security Rules
Even though FlowDay is an offline-first MVP, code must still be written securely.

### Required:
- sanitize user input where appropriate
- validate task input before saving
- avoid unsafe assumptions
- avoid exposing sensitive internals in UI
- avoid dangerous dependency usage

### Avoid:
- blindly trusting input
- hidden risky logic
- unsafe storage patterns
- unnecessary permissions

### Important:
Security is not only about hacking.
Security is also about preventing bad app behavior.

---

## 9. Performance Rules
The app should feel smooth and responsive.

### Required:
- avoid unnecessary re-renders
- avoid bloated components
- avoid expensive logic inside render
- keep lists efficient
- use lightweight state updates

### Preferred:
- memoization only when needed
- simple render trees
- efficient list rendering
- minimal wasted UI updates

### Avoid:
- premature over-optimization
- unreadable “clever” performance hacks

---

## 10. Database Rules
FlowDay uses Expo SQLite for local storage.

### Required:
- database logic should be separated from UI
- queries should stay simple and readable
- task data must remain consistent
- writes should be intentional and validated

### Avoid:
- raw SQL scattered everywhere
- duplicated database logic
- unsafe assumptions about records

---

## 11. Error Handling Rules
All important actions should fail gracefully.

### Required:
- handle database failures safely
- handle empty input safely
- avoid app crashes from common mistakes
- log errors during development when useful

### Avoid:
- silent broken behavior
- crash-prone code
- missing validation

---

## 12. Naming Rules
Names must be clear and meaningful.

### Good naming:
- `TaskCard`
- `ProgressRing`
- `addTask`
- `toggleTaskCompletion`
- `loadTasksFromDatabase`

### Avoid:
- `data`
- `item2`
- `thing`
- `handleStuff`
- unclear abbreviations

---

## 13. AI Code Generation Rules
When AI generates code for FlowDay, it must follow all of this document.

Generated code must be:
- readable
- typed
- modular
- clean
- maintainable
- consistent with project architecture

AI must not:
- invent random libraries
- add unnecessary abstraction
- over-engineer simple features
- create fragile code

---

## 14. Senior Rule for All Features
Before adding any code, ask:

1. Is this clean?
2. Is this scalable?
3. Is this safe?
4. Is this understandable?
5. Does this match FlowDay’s architecture?

If the answer is no, rewrite it.

---

## 15. Official Standard
This document is the official engineering standard for FlowDay.

All future code decisions should align with this standard.