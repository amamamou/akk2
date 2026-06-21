"use client";

import React, { useEffect, useMemo } from "react";
import { Pencil, Repeat, Save } from "lucide-react";
import type { ClientInfo } from "@/types/api";
import ClientFormFields from "./ClientFormFields";
import ClientFormModalShell from "./ClientFormModalShell";
import { clientToFormState, useClientForm } from "../hooks/useClientForm";
import type { ClientFormFieldKey } from "../lib/client-form-validation";

export type ClientUpdatePayload = {
  name: string;
  businessType: string;
  subscriptionTier: ClientInfo["subscriptionTier"];
  contactPerson: string;
  email: string;
  phone: string;
  maxPlayers: number;
  maxStorageGb: number;
};

export default function EditClientModal({
  open,
  client,
  onClose,
  onSubmit,
  isSubmitting = false,
}: {
  open: boolean;
  client: ClientInfo | null;
  onClose: () => void;
  onSubmit: (clientId: string, payload: ClientUpdatePayload) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const initialForm = useMemo(
    () => (client ? clientToFormState(client) : null),
    [client]
  );

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
  } = useClientForm(open, initialForm);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, isSubmitting]);

  const handleSubmit = async () => {
    if (!client) return;
    const errors = runValidation();
    if (Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0] as ClientFormFieldKey;
      document.getElementById(`edit-${firstKey}`)?.focus();
      return;
    }

    setSubmitError(null);
    try {
      await onSubmit(client.id, toPayload());
      onClose();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(
        ax?.response?.data?.error ||
          (err instanceof Error ? err.message : "Could not save changes. Check the details and try again.")
      );
    }
  };

  if (!client) return null;

  return (
    <ClientFormModalShell
      open={open}
      onClose={onClose}
      titleId="edit-client-title"
      sectionLabel="Workspace"
      title="Edit client"
      subtitle={`Update details for ${client.name}. Changes apply immediately.`}
      icon={<Pencil size={15} className="text-[#8B5CF6]" strokeWidth={2} />}
      footerHint={
        <>
          <Repeat size={12} />
          Plan changes update player and storage limits
        </>
      }
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      submitLabel="Save changes"
      submittingLabel="Saving…"
      submitIcon={<Save size={16} strokeWidth={2} />}
      onSubmit={() => void handleSubmit()}
    >
      <ClientFormFields
        form={form}
        touched={touched}
        fieldErrors={fieldErrors}
        idPrefix="edit"
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
          All fields must be valid before you can save changes.
        </p>
      ) : null}
    </ClientFormModalShell>
  );
}
