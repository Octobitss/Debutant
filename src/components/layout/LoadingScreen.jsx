import "./LoadingScreen.scss";

export default function LoadingScreen({ visible }) {
  return (
    <div className={`loading-screen${visible ? "" : " loading-screen--hidden"}`} aria-hidden={!visible}>
      <div className="loading-screen__backdrop" />
      <div className="loading-screen__content">
        <div className="loading-screen__ring" />
        <p className="loading-screen__title">Where Eighteen Blooms</p>
        <p className="loading-screen__subtitle">Opening the garden gate…</p>
      </div>
    </div>
  );
}
