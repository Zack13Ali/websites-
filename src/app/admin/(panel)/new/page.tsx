import { ActionForm, SubmitButton } from "@/components/admin/ui";
import { createSingle } from "./actions";

export const maxDuration = 60;

export default function NewBusinessPage() {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Add one business</h1>
      <p className="text-sm text-stone-600">Looks it up on Google, writes the copy and builds the preview.</p>
      <ActionForm action={createSingle} className="space-y-3 rounded-xl border border-stone-200 bg-white p-5">
        <label className="block text-sm">
          Business name
          <input name="name" required maxLength={200} className="input mt-1" />
        </label>
        <label className="block text-sm">
          City
          <input name="city" required maxLength={100} className="input mt-1" placeholder="Irving, TX" />
        </label>
        <label className="block text-sm">
          Phone
          <input name="phone" type="tel" className="input mt-1" placeholder="(214) 555-0101" />
        </label>
        <SubmitButton pendingText="Building preview… (up to a minute)">Build preview</SubmitButton>
      </ActionForm>
    </div>
  );
}
