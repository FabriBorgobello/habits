import { boolean, date, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// Better Auth Tables
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Zod Schemas (defined before tables for type references)
// ============================================================================

// Frequency config schemas
const weeklyCountConfigSchema = z.object({
  type: z.literal("weekly_count"),
  count: z.number().int().min(1).max(7),
});

const specificDaysConfigSchema = z.object({
  type: z.literal("specific_days"),
  days: z.array(z.number().int().min(0).max(6)).min(1, "At least one day must be selected"),
});

const frequencyConfigSchema = z.union([weeklyCountConfigSchema, specificDaysConfigSchema]);

type FrequencyConfigType = z.infer<typeof frequencyConfigSchema>;

// ============================================================================
// Habit Tracker Tables
// ============================================================================

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default(""),
  colorHex: text("color_hex"),
  icon: text("icon"),
  frequency: text("frequency", { enum: ["daily", "custom"] })
    .notNull()
    .default("daily"),
  frequencyConfig: jsonb("frequency_config").$type<FrequencyConfigType>(),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    completedDate: date("completed_date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: one completion per habit per date
    uniqueHabitDate: unique().on(table.habitId, table.completedDate),
  }),
);

// ============================================================================
// Exported Zod Schemas for External Use
// ============================================================================

export { weeklyCountConfigSchema, specificDaysConfigSchema, frequencyConfigSchema };

// User schemas
export const insertUserSchema = createInsertSchema(user);
export const selectUserSchema = createSelectSchema(user);

// Habit schemas
export const insertHabitSchema = createInsertSchema(habits).omit({
  userId: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
});

export const selectHabitSchema = createSelectSchema(habits);

// Habit completion schemas
export const insertHabitCompletionSchema = createInsertSchema(habitCompletions);
export const selectHabitCompletionSchema = createSelectSchema(habitCompletions);

// ============================================================================
// TypeScript Types
// ============================================================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type NewHabitCompletion = typeof habitCompletions.$inferInsert;

export type WeeklyCountConfig = z.infer<typeof weeklyCountConfigSchema>;
export type SpecificDaysConfig = z.infer<typeof specificDaysConfigSchema>;
export type FrequencyConfig = z.infer<typeof frequencyConfigSchema>;
