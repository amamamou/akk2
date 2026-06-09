import { redirect } from "next/navigation";

export default function MisspelledPlaylistsRedirect() {
  // Common typo: playlisits -> playlists
  redirect("/library/playlists");
}
