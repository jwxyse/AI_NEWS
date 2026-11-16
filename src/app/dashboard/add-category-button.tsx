"use client";

import { useActionState, useEffect, useRef } from "react";

import { focusRing, primaryButton, secondaryButton } from "@/components/ui/button-styles";

import { addCategory, type AddCategoryState } from "./actions";

const initialState: AddCategoryState = { ok: false };

const inputClass = `w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle ${focusRing}`;

// 카테고리 바 맨 끝의 "+ 카테고리 추가" 버튼과 입력 다이얼로그 (ui.md 4.3)
export function AddCategoryButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addCategory, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      dialogRef.current?.close();
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-border-strong px-4 text-sm font-medium text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg ${focusRing}`}
      >
        <span aria-hidden>+</span> 카테고리 추가
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="add-category-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-surface p-0 text-fg shadow-md backdrop:bg-black/40"
      >
        <form ref={formRef} action={formAction} className="flex flex-col gap-4 p-6">
          <h2 id="add-category-title" className="text-lg font-semibold">
            카테고리 추가
          </h2>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            이름
            <input
              name="name"
              required
              maxLength={30}
              autoComplete="off"
              placeholder="예: 로보틱스"
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? "add-category-error" : undefined}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            <span>
              설명 <span className="font-normal text-fg-subtle">(선택, 분류 기준 힌트)</span>
            </span>
            <textarea
              name="description"
              rows={3}
              maxLength={200}
              placeholder="예: 로봇, 자율주행, 물리 세계와 상호작용하는 AI"
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </label>

          {state.error && (
            <p id="add-category-error" role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}

          <p className="text-xs leading-relaxed text-fg-subtle break-keep">
            이미 가져온 기사를 새 카테고리 기준으로 나누려면 추가한 뒤 &apos;재분류&apos;를 눌러 주세요.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={secondaryButton}
            >
              취소
            </button>
            <button type="submit" disabled={pending} className={primaryButton}>
              {pending ? "추가하는 중…" : "추가"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
