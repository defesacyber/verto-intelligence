import { z } from 'zod';

export const projectInputsSchema = z.object({
  land_acquisition_type: z.enum(['compra', 'permuta', 'usufruto']).nullable(),
  land_cost: z.number().min(0),
  permuta_units: z.number().min(0),
  usufruto_years: z.number().min(0),
  approval_costs: z.number().min(0),
  infrastructure_costs: z.number().min(0),
  project_costs: z.number().min(0),
  contingency_percent: z.number().min(0).max(100),
  sales_velocity: z.number().min(1).max(100),
  launch_date: z.string().nullable(),
  construction_months: z.number().min(6).max(120),
  financing_rate: z.number().min(0).max(50),
  discount_rate: z.number().min(0).max(50),
  certifications: z.array(z.string()),
  sustainability_initiatives: z.array(z.string()),
  unit_distribution: z.object({
    studio: z.number().min(0),
    '1q': z.number().min(0),
    '2q': z.number().min(0),
    '3q': z.number().min(0),
    '4q': z.number().min(0),
  }),
});

export type ProjectInputsFormData = z.infer<typeof projectInputsSchema>;
