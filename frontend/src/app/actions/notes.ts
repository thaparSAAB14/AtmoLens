"use server";

import { revalidatePath } from "next/cache";
import { saveNote, getNotes } from "@/lib/storage";

export async function addNote(formData: FormData) {
  const note = formData.get("note") as string;
  if (!note || note.trim().length === 0) return;

  await saveNote(note.trim());
  revalidatePath("/maps");
}

export async function fetchNotes() {
  return await getNotes();
}
