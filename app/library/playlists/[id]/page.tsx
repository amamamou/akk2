import PlaylistDetailClient from "./PlaylistDetailClient";

export const metadata = {
  title: "Playlist",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlaylistDetailClient playlistId={id} />;
}
