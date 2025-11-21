type Props = {
  status: "idle" | "loading" | "success" | "error";
  onClick: () => void;
};

export function SyncButton({ status, onClick }: Props) {
  const label =
    status === "loading"
      ? "Syncing..."
      : status === "success"
        ? "Synced"
        : status === "error"
          ? "Retry Sync"
          : "Sync from AXIS";

  return (
    <button className="button" disabled={status === "loading"} onClick={onClick}>
      {label}
    </button>
  );
}

