import { pgTable, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';
import type { ResumeData } from '@/lib/resume';
export const resumes = pgTable('resumes', {
 id: text('id').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(), data: jsonb('data').$type<ResumeData>().notNull(), template: text('template').notNull().default('classic'), tex: text('tex'), originalTex: text('original_tex'), updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const subscriptions = pgTable('subscriptions', {
 owner:text('owner').primaryKey(),customerId:text('customer_id').notNull(),subscriptionId:text('subscription_id').notNull(),status:text('status').notNull(),usage:integer('usage').notNull().default(0),usageMonth:text('usage_month').notNull().default(''),updatedAt:timestamp('updated_at').notNull().defaultNow(),
});
export const resumeVersions = pgTable('resume_versions', {
 id: text('id').primaryKey(), resumeId: text('resume_id').notNull().references(()=>resumes.id,{onDelete:'cascade'}), name: text('name').notNull(), data: jsonb('data').$type<ResumeData>().notNull(), template:text('template').notNull(), tex:text('tex'), originalTex:text('original_tex'), createdAt:timestamp('created_at').defaultNow().notNull(),
});
