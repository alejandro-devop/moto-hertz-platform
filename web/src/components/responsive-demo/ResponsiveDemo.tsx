import "./ResponsiveDemo.scss";

export default function ResponsiveDemo() {
  return (
    <div className="responsive-demo">
      <div className="demo-title">
        SASS Breakpoint System
        <div className="breakpoint-indicator"></div>
      </div>

      <div className="demo-content">
        This component automatically adapts to different screen sizes using our
        custom breakpoint system. Resize your window to see the changes in real
        time.
      </div>

      <div className="mobile-only-demo"></div>
      <div className="tablet-only-demo"></div>
      <div className="desktop-only-demo"></div>

      <div className="grid-demo">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="grid-item">
            Item {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
