export default function EvidenceLoading() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((item) => <div key={item} className="skeleton h-28 rounded-2xl" />)}
    </div>
  );
}