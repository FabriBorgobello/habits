# Habit Tracker MVP - Product Requirements Document

## Product Vision

**MVP Scope**: Single-user habit tracker focused on simplicity and core tracking functionality.

**Core Features**:
- Daily and frequency-based habit tracking (daily, X times per week, specific days of week)
- Visual calendar view with 7-day grid (Monday-Sunday)
- Streak tracking and completion history
- Create, edit, and archive habits
- Icon and color customization

**Out of Scope (Post-MVP)**:
- Notifications
- Advanced analytics
- Social features
- Mobile app
- Gamification
- Time-based or quantifiable tracking
- Multi-user support
- Categories/tags

## Design System

### Theme
- Pure black background (`bg-black`)
- White text (`text-white`)
- Clean, minimal iOS-style interface
- Rounded corners on all interactive elements
- No borders, relies on color fills and spacing

### Layout
- Habits stack vertically
- Each habit row: icon + name (left), 7 day squares (right)
- Floating "+" button (top right) for creating habits
- Full-screen modal for create/edit

### Colors
8 predefined colors for habit customization:
- Red (#ff6b6b)
- Blue (#4dabf7)
- Teal (#38d9a9)
- Orange (#ffa94d)
- Pink (#f783ac)
- Green (#51cf66)
- Yellow (#ffd43b)
- Purple (#b197fc)

### Icons
15 emoji icons for habits:
🧘 💊 ✏️ ☀️ 🏃 💧 🚶 🍽️ 📚 🛏️ 🏋️ ☕ 🧠 ❤️ 🍃

## Data Model

### Habits Table
```typescript
{
  id: uuid (PK)
  userId: uuid (FK -> users)
  name: string (required)
  description: string? (optional)
  category: string (default empty, post-MVP)
  colorHex: string? (hex color code)
  icon: string? (emoji)
  frequency: 'daily' | 'custom'
  frequencyConfig: json? // Type-specific config
  isArchived: boolean (default false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Frequency Configurations

**Daily Habits**:
```typescript
{ frequency: 'daily', frequencyConfig: null }
```

**Weekly Count** (e.g., "3 times per week"):
```typescript
{
  frequency: 'custom',
  frequencyConfig: { type: 'weekly_count', count: 3 }
}
```

**Specific Days** (e.g., "Monday, Wednesday, Friday"):
```typescript
{
  frequency: 'custom',
  frequencyConfig: { type: 'specific_days', days: [1, 3, 5] }
  // days: 0=Sunday, 1=Monday, ..., 6=Saturday
}
```

### Habit Completions Table
```typescript
{
  id: uuid (PK)
  habitId: uuid (FK -> habits)
  completedDate: date // YYYY-MM-DD format only
  createdAt: timestamp
}
```

**Indexes**:
- `userId` on habits table
- `habitId + completedDate` unique constraint on completions

## User Flows

### View Habits
1. Dashboard shows current week (Monday-Sunday)
2. Header displays month name and week range
3. Day abbreviations (M T W T F S S) shown above grid
4. Each habit row shows:
   - Icon + name (clickable to edit)
   - 7 completion squares
   - Completed: filled with habit color
   - Incomplete: dark/outlined
   - Not due: grayed out and disabled
   - Today: highlighted with ring
5. Optional filter: "Hide habits not due today"

### Create Habit
1. Tap "+" button
2. Modal opens with form:
   - Name field (required)
   - Color picker (8 circular swatches)
   - Icon picker (15 emoji grid)
   - Frequency selector:
     - "Every day"
     - "X times per week" (shows number input 1-7)
     - "Specific days" (shows 7 day toggles)
   - Preview section shows how habit will appear
3. Tap "Add" to create
4. Toast confirmation
5. Habit appears in list immediately

### Edit Habit
1. Tap habit name
2. Modal opens with current values pre-filled
3. Same form as create
4. Changes save on "Save" button
5. Toast confirmation
6. Updates reflected immediately

### Track Completion
1. Tap completion square for a day
2. Square toggles:
   - If empty → fills with habit color
   - If filled → empties to dark/outlined
3. Toast confirmation
4. Optimistic update (immediate UI change)

### Archive Habit
1. In edit modal, tap "Archive" button
2. Habit removed from list immediately (no confirmation)
3. Toast confirmation
4. Archived habits stay in database but hidden from view

## Technical Architecture

### Stack
- **Framework**: TanStack Start (SSR)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth (Google OAuth)
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn
- **Date Library**: date-fns
- **Notifications**: Sonner (toast)
- **State Management**: TanStack Query

### File Structure
```
src/
├── lib/
│   ├── habit-constants.ts     # Colors and icons
│   ├── date-utils.ts          # Date helpers
│   └── habit-logic.ts         # Due date calculation
├── server/
│   └── habits.ts              # All CRUD server functions
├── hooks/
│   └── use-habits.ts          # TanStack Query hooks
├── components/
│   ├── habits/
│   │   ├── WeekHeader.tsx     # Month and week range
│   │   ├── HabitGrid.tsx      # Main grid view
│   │   └── HabitModal.tsx     # Create/edit form
│   └── ui/
│       └── sonner.tsx         # Toast component
├── routes/
│   ├── _authenticated/
│   │   └── dashboard.tsx      # Main habit view
│   └── __root.tsx             # Root layout
└── db/
    └── schema.ts              # Database schema with Zod
```

### Server Functions
All in `src/server/habits.ts`:
- `getHabitsWithCompletionsFn`: Fetch habits + completions for date range
- `createHabitFn`: Create new habit
- `updateHabitFn`: Update existing habit
- `toggleHabitCompletionFn`: Toggle completion for a date
- `archiveHabitFn`: Soft delete habit

### API Design

**Authentication**: All endpoints require user session

**Get Habits**:
```typescript
GET /api/habits?startDate=2026-01-13&endDate=2026-01-19
Response: {
  habits: Habit[],
  completions: { [habitId]: string[] } // dates
}
```

**Create Habit**:
```typescript
POST /api/habits
Body: { name, colorHex?, icon?, frequency, frequencyConfig? }
Response: Habit
```

**Update Habit**:
```typescript
POST /api/habits/update
Body: { id, name?, colorHex?, icon?, frequency?, frequencyConfig? }
Response: Habit
```

**Toggle Completion**:
```typescript
POST /api/habits/toggle
Body: { habitId, date }
Response: { completed: boolean }
```

**Archive Habit**:
```typescript
POST /api/habits/archive
Body: { id }
Response: { success: boolean }
```

## Edge Cases

### Timezone Handling
- Store dates as date-only (YYYY-MM-DD) in database
- Use `startOfDay()` to normalize all dates
- No timestamp tracking to avoid timezone issues

### Disabled Squares
- Weekly count habits: all days enabled
- Specific days habits: only specified days enabled
- Apply `opacity-30 cursor-not-allowed` to disabled squares

### Today Highlight
- Ring border around today's square
- Works across all habit types

### Empty States
- No habits: Show message + prompt to create first habit
- No completions: Grid shows all empty squares

### Validation
- Habit name: required, min 1 character
- Weekly count: 1-7 range
- Specific days: at least 1 day selected
- Color: must be from predefined list
- Icon: must be from predefined list

## Success Metrics (Post-MVP)

- Daily active usage
- Completion rate per habit
- Habit streak length
- Time to first habit creation
- Average habits per user

## Future Enhancements (Post-MVP)

1. **Categories/Tags**: Group habits (Health, Productivity, etc.)
2. **Analytics**: Completion trends, best streaks, insights
3. **Notifications**: Daily reminders
4. **Habit Templates**: Quick-start common habits
5. **Export**: Download completion history
6. **Archive View**: See and restore archived habits
7. **Mobile App**: Native iOS/Android apps
8. **Quantifiable Tracking**: Track metrics (e.g., "8 glasses of water")
9. **Notes**: Add context to completions
10. **Social**: Share progress with friends
