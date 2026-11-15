"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError, errorMessage } from "../api/client";
import { validate, validateField, type FieldErrors, type Schema } from "../validation/rules";

export function useForm<V extends Record<string, string>>(initial: V, schema: Schema<V>) {
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const baseline = useRef(initial);
  const formRef = useRef<HTMLFormElement | null>(null);

  const dirty = (Object.keys(baseline.current) as (keyof V)[]).some((k) => baseline.current[k] !== values[k]);

  const set = useCallback((name: keyof V, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name as string]) return e;
      const { [name as string]: _drop, ...rest } = e; // koreksi menghapus pesan lama
      return rest;
    });
  }, []);

  const blur = useCallback(
    (name: keyof V) => {
      const e = validateField(schema, name, values);
      setErrors((prev) => ({ ...prev, [name as string]: e }));
    },
    [schema, values],
  );

  const reset = useCallback((next?: V) => {
    if (next) baseline.current = next;
    setValues(next ?? baseline.current);
    setErrors({});
    setFormError(null);
  }, []);

  /** Pasang sebagai onSubmit. Memvalidasi, memfokuskan field salah pertama, memetakan error server. */
  const handleSubmit = (onValid: (values: V) => Promise<void>) => async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    const found = validate(schema, values);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onValid(values);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.errors).length) {
        setErrors(e.errors);
        const first = Object.keys(e.errors)[0];
        formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        setFormError(null);
      } else {
        setFormError(errorMessage(e));
      }
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  /** Versi aman: error sudah ditampilkan di form, jangan lempar ke atas. */
  const submit = (onValid: (values: V) => Promise<void>) => {
    const run = handleSubmit(onValid);
    return (event: { preventDefault(): void }) => run(event).catch(() => undefined);
  };

  const field = (name: keyof V) => ({
    name: name as string,
    value: values[name],
    error: errors[name as string]?.[0],
    onChange: (v: string) => set(name, v),
    onBlur: () => blur(name),
  });

  return { values, errors, formError, setFormError, submitting, dirty, field, submit, reset, set, formRef };
}
