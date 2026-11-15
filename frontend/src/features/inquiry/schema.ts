import { z } from 'zod';

// Batas 1.000 karakter mengikuti backend/src/models/Inquiry.js dan kontrak v1.2 bagian 7.
export const balasanSchema = z.object({
  balasan: z.string().trim().min(2, 'Balasan minimal 2 karakter').max(1000, 'Balasan maksimal 1.000 karakter'),
});

export type BalasanValues = z.infer<typeof balasanSchema>;
