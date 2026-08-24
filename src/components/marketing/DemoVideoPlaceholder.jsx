export default function DemoVideoPlaceholder() {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-xl">
      <div className="aspect-video">
        <iframe
          className="h-full w-full"
          src="https://www.youtube-nocookie.com/embed/XeBoT0V0GsA"
          title="Stack Sixth product demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}