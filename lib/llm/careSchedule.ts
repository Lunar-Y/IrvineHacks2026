import { z } from 'zod';

export const CareTaskSchema = z.object({
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    task: z.string(),
    reason: z.string(),
    duration_minutes: z.number(),
    skip_if: z.string().nullable().optional(),
});

export const CareScheduleSchema = z.object({
    this_week_tasks: z.array(CareTaskSchema),
    monthly_recurring: z.array(z.string()),
    seasonal_notes: z.object({
        spring: z.string().optional(),
        summer: z.string().optional(),
        fall: z.string().optional(),
        winter: z.string().optional(),
    }),
    warning_signs: z.array(z.string()),
});

export type CareTask = z.infer<typeof CareTaskSchema>;
export type CareSchedule = z.infer<typeof CareScheduleSchema>;

export type MergedCareTask = CareTask & {
    plantId: string;
    plantName: string;
};
