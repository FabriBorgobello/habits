# Implementation Plan

## Scope

- US-1 through US-5, US-7, US-8 (month view US-6 deferred)
- Categories (predefined + custom + filter + badges)
- Week navigation with URL search params
- Historical completion editing
- Icon expansion

## Decisions

- **Category storage**: New `categories` table (name, colorHex, icon, userId, sortOrder)
- **Week nav**: `?week=2026-01-27` search param via TanStack Router
- **Month view**: Deferred to next batch
- **Category badge**: Small pill below habit name in HabitRow

---

## Phase 1: Categories Table + Constants

### 1.1 DB Schema (`src/db/schema.ts`)
- Add `categories` table: id, userId, name, colorHex, isDefault, sortOrder, timestamps
- Add relations (user -> categories, category -> habits)
- Generate + run migration

### 1.2 Constants (`src/lib/habit-constants.ts`)
- Add `DEFAULT_CATEGORIES` array with 6 predefined: Self Care, Sleep, Food, Exercise, Pets, Cleaning
- Assign default colors from existing `HABIT_COLORS`

### 1.3 Seed Logic (`src/server/categories.ts`)
- Server fn: `getCategoriesFn` — returns user's categories
- Server fn: `createCategoryFn` — creates custom category
- On first fetch, if user has no categories, seed with `DEFAULT_CATEGORIES`

### 1.4 Hook (`src/hooks/use-categories.ts`)
- `useCategories()` — query for user's categories
- `useCreateCategory()` — mutation to add custom

---

## Phase 2: Category UI in HabitModal

### 2.1 Category Picker in HabitModal
- Add category field to form (after name, before frequency)
- Dropdown/select showing user's categories
- "Add custom category" option at bottom opens inline text input
- Max 50 chars validation
- Selected category saved to `habits.category` (store category name as text)

---

## Phase 3: Category Display + Filtering

### 3.1 Category Badge (`src/components/habits/CategoryBadge.tsx`)
- Small pill component: category name with subtle bg color
- Truncate long names (ellipsis)
- Used in HabitRow below habit name

### 3.2 HabitRow Update (`HabitGrid.tsx`)
- Show CategoryBadge below habit name
- Responsive: smaller text on mobile

### 3.3 Category Filter in Dashboard
- Filter dropdown in dashboard header/controls area
- "All Categories" default + each category with habit count
- Filter applied client-side to habit list
- Filter state in React state (no URL param needed)

---

## Phase 4: Week Navigation

### 4.1 Date Utils (`src/lib/date-utils.ts`)
- `getWeekFromDate(date)` — returns {startDate, endDate} for week containing date
- `getPreviousWeek(startDate)` / `getNextWeek(startDate)`
- `formatWeekParam(date)` — "YYYY-MM-DD" for URL

### 4.2 Route Search Params (`dashboard.tsx`)
- Add `validateSearch` to route: `{ week?: string }`
- Derive startDate/endDate from `?week=` param (default: current week)
- Update `useHabits` call with derived dates

### 4.3 WeekNavigation Controls
- Extend WeekHeader with Prev/Next buttons + "Today" button
- Prev/Next use `router.navigate` to update `?week=` param
- "Today" clears param (returns to current week)
- Disable "Next" if already on current week (or allow future?)

### 4.4 Historical Completion Editing (US-7)
- Already works: `toggleHabitCompletionFn` accepts any date
- Ensure completion squares are clickable for past weeks (not just current)
- Verify optimistic updates work across week boundaries

---

## Phase 5: Icon Expansion

### 5.1 Expand Icons (`src/lib/habit-constants.ts`)
- Grow `HABIT_ICONS` from 15 to ~40 emojis
- Add: health, fitness, mind, nature, productivity, social categories
- Keep flat array (no grouping UI)

### 5.2 Scrollable Grid in HabitModal
- Make icon picker scrollable (max-height with overflow-y-auto)
- Keep existing grid layout, just more items

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add categories table + relations |
| `src/lib/habit-constants.ts` | Add DEFAULT_CATEGORIES, expand HABIT_ICONS |
| `src/server/categories.ts` | New: category CRUD server functions |
| `src/hooks/use-categories.ts` | New: useCategories, useCreateCategory |
| `src/components/habits/HabitModal.tsx` | Add category picker, scrollable icon grid |
| `src/components/habits/CategoryBadge.tsx` | New: category pill component |
| `src/components/habits/HabitGrid.tsx` | Show CategoryBadge in HabitRow |
| `src/components/habits/WeekHeader.tsx` | Add prev/next/today navigation |
| `src/routes/_authenticated/dashboard.tsx` | URL search param, category filter, week nav |
| `src/lib/date-utils.ts` | Add week navigation helpers |
| `src/hooks/use-habits.ts` | No changes (already parameterized by date range) |
| `src/server/habits.ts` | No changes expected |
| Migration file | Auto-generated via `pnpm db:generate` |
