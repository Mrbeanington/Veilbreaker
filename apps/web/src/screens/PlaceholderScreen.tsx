// RANKED, MISSIONS and PROFILE exist in the navigation (spec/05) but their
// systems belong to later phases. Say so plainly rather than hiding them.
export function PlaceholderScreen({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="title small">{title}</h2>
      <div className="panel">
        <p>{text}</p>
        <p className="hp-text">This part of the game is not built yet.</p>
      </div>
    </div>
  );
}
