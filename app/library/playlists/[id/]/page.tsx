"use client";

import React from "react";
import { useParams } from "next/navigation";
import PlaylistDetailClient from "./PlaylistDetailClient";

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = params?.id as string;

  return <PlaylistDetailClient playlistId={playlistId} />;
}
