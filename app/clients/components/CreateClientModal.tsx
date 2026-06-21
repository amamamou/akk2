"use client";

import React, { useEffect } from "react";
import { Building2, Plus, Repeat } from "lucide-react";
import type { ClientCreateInput } from "@/types/api";
import ClientFormFields from "./ClientFormFields";
import ClientFormModalShell from "./ClientFormModalShell";
import { useClientForm } from "../hooks/useClientForm";
import type { ClientFormFieldKey } from "../lib/client-form-validation";

export default function CreateClientModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ClientCreateInput) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const {
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
    runValidation,
    toPayload,
  } = useClientForm(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, isSubmitting]);

  const handleSubmit = async () => {
    const errors = runValidation();
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0] as ClientFormFieldKey;
      document.getElementById(`create-${firstKey}`)?.focus();
      return;
    }

    setSubmitError(null);
    try {
      await onSubmit(toPayload());
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(
        ax?.response?.data?.error ||
          (err instanceof Error ? err.message : "Could not create client. Check the details and try again.")
      );
    }
  };

  return (
    <ClientFormModalShell
      open={open}
      onClose={onClose}
      titleId="create-client-title"
      sectionLabel="New workspace"
      title="Create client"
      subtitle="Set up a tenant workspace with a subscription plan and primary contact."
      icon={<Building2 size={15} className="text-[#8B5CF6]" strokeWidth={2} />}
      footerHint={
        <>
          <Repeat size={12} />
          Billing and invoices available after creation
        </>
      }
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      submitLabel="Create client"
      submittingLabel="Creating…"
      submitIcon={<Plus size={16} strokeWidth={2} />}
      onSubmit={() => void handleSubmit()}
    >
      <ClientFormFields
        form={form}
        touched={touched}
        fieldErrors={fieldErrors}
        idPrefix="create"
        nameRef={nameRef}
        onFieldChange={setField}
        onFieldBlur={markTouched}
        onSelectTier={selectTier}
      />
      {submitError ? (
        <p className="mt-5 text-xs font-medium text-rose-600 dark:text-rose-400">{submitError}</p>
      ) : null}
      {!canSubmit ? (
        <p className="mt-4 text-xs text-gray-400">
          All fields must be valid before you can create this client.
        </p>
      ) : null}
    </ClientFormModalShell>
  );
}
