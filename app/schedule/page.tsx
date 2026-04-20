import { Suspense } from "react";
import ScheduleClient from "./ScheduleClient";

export const metadata = {
  title: "Schedule",
};

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleClient />
    </Suspense>
  );
}
