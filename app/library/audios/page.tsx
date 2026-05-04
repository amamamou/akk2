import { redirect } from "next/navigation";

export default function MisspelledAudioRedirect() {
  // Common pluralization: audios -> audio
  redirect("/library/audio");
}
