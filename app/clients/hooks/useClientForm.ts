"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clientFormToPayload,
  clientToFormState,
  initialClientFormState,
  isClientFormValid,
  tierLocks,
  validateClientField,
  validateClientForm,
  type ClientFormFieldKey,
  type ClientFormState,
  type SubscriptionTier,
} from "../lib/client-form-validation";

export function useClientForm(open: boolean, initial?: ClientFormState | null) {
  const [form, setForm] = useState<ClientFormState>(initial ?? initialClientFormState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ClientFormFieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<ClientFormFieldKey, boolean>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setForm(initial ?? initialClientFormState);
      setFieldErrors({});
      setTouched({});
      setSubmitError(null);
      return;
    }
    if (initial) {
      setForm(initial);
    }
  }, [open, initial]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => nameRef.current?.focus(), 50);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (form.subscriptionTier === "ENTERPRISE") return;
    const lock = tierLocks[form.subscriptionTier];
    setForm((prev) => ({
      ...prev,
      maxPlayers: String(lock.maxPlayers),
      maxStorageGb: String(lock.maxStorageGb),
    }));
  }, [form.subscriptionTier]);

  const setField = useCallback(<K extends ClientFormFieldKey>(key: K, value: ClientFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      setFieldErrors((errs) => {
        const updated = { ...errs };
        const err = validateClientField(key, next);
        if (err) updated[key] = err;
        else delete updated[key];
        return updated;
      });
      return next;
    });
    setSubmitError(null);
  }, []);

  const markTouched = useCallback((key: ClientFormFieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setForm((current) => {
      setFieldErrors((errs) => {
        const updated = { ...errs };
        const err = validateClientField(key, current);
        if (err) updated[key] = err;
        else delete updated[key];
        return updated;
      });
      return current;
    });
  }, []);

  const selectTier = useCallback((tier: SubscriptionTier) => {
    setForm((prev) => {
      if (tier === "ENTERPRISE") return { ...prev, subscriptionTier: tier };
      const lock = tierLocks[tier];
      return {
        ...prev,
        subscriptionTier: tier,
        maxPlayers: String(lock.maxPlayers),
        maxStorageGb: String(lock.maxStorageGb),
      };
    });
    setFieldErrors((errs) => {
      const next = { ...errs };
      delete next.maxPlayers;
      delete next.maxStorageGb;
      return next;
    });
    setSubmitError(null);
  }, []);

  const canSubmit = useMemo(() => isClientFormValid(form), [form]);

  const validateAll = useCallback(() => validateClientForm(form), [form]);

  const markAllTouched = useCallback(() => {
    setTouched({
      name: true,
      businessType: true,
      contactPerson: true,
      email: true,
      phone: true,
      maxPlayers: true,
      maxStorageGb: true,
    });
  }, []);

  const runValidation = useCallback(() => {
    const errors = validateClientForm(form);
    setFieldErrors(errors);
    markAllTouched();
    return errors;
  }, [form, markAllTouched]);

  return {
    form,
    fieldErrors,
    touched,
    submitError,
    setSubmitError,
    nameRef,
    setField,
    markTouched,
    selectTier,
    canSubmit,
    validateAll,
    markAllTouched,
    runValidation,
    toPayload: () => clientFormToPayload(form),
  };
}

export { clientToFormState };
