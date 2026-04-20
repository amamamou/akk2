import PlaylistDetailClient from "./PlaylistDetailClient";

export const metadata = {
  title: "Playlist",
};

export default function Page({ params }: { params: { id: string } }) {
  return <PlaylistDetailClient playlistId={params.id} />;
}
