import type { UseFormReturn } from 'react-hook-form';
import type { KosFormOutput, KosFormValues } from '../../schema';

export type KosForm = UseFormReturn<KosFormValues, unknown, KosFormOutput>;
