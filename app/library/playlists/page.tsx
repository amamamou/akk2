import LibraryPlaylistsClient from "./PlaylistsClient";

export const metadata = {
  title: "Playlists | Akoustic Arts",
  description: "Manage playback programs and playlists",
};

export default function PlaylistsPage() {
  return <LibraryPlaylistsClient />;
}
