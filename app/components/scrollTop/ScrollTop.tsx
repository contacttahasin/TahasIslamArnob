"use client";

import { useEffect, useState } from "react";

export default function ScrollTop() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      const documentHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      const percent =
        documentHeight > 0
          ? Math.min((scrollTop / documentHeight) * 100, 100)
          : 0;

      setProgress(100 - percent);
      setShow(scrollTop > 200);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
        className={`scrollToTop ${show ? "active-progress" : ""}`}
        style={{
          position: "fixed",
          right: "1vw",
          bottom: "max(12vh, 100px)",

          width: "57px",
          height: "57px",
          borderRadius: "50%",
          background: "#151922",
          border: "1px solid rgba(var(--accent-rgb), 0.4)",
          cursor: "pointer",
          overflow: "hidden",
          zIndex: 99999,
          display: show ? "flex" : "none",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,.3), 0 0 20px rgba(var(--accent-rgb), 0.35)",
        }}
      >
        {/* Arrow */}
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            color: "#fff",
            fontSize: "28px",
            userSelect: "none",
          }}
        >
          ↑
        </div>

        {/* Water */}
        <div
          className="water"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            transform: `translateY(${progress}%)`,
            transition: "transform .2s linear",
          }}
        >
          {/* Fill */}
          <div
            style={{

                position: "absolute",
                top: "10px", // আগে 14 ছিল
                left: 0,
                right: 0,
                bottom: 0,
                background: "var(--accent)",

            }}
          />

<svg
  viewBox="0 0 560 20"
  style={{
    position: "absolute",
    top: 0,
    height: "18px",
    
    left: "-200%",
    width: "500%",
    display: "block",
    willChange: "transform",
  }}
>
  <defs>
    <symbol id="wave" viewBox="0 0 560 20">
      <path
        d="M420,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C514,6.5,518,4.7,528.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7V20H420z"
        fill="var(--accent)"
      />
      <path
        d="M420,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C326,6.5,322,4.7,311.5,2.7C304.3,1.4,293.6-0.1,280,0V20H420z"
        fill="var(--accent)"
      />
      <path
        d="M140,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C234,6.5,238,4.7,248.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7V20H140z"
        fill="var(--accent)"
      />
      <path
        d="M140,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C46,6.5,42,4.7,31.5,2.7C24.3,1.4,13.6-0.1,0,0V20H140z"
        fill="var(--accent)"
      />
    </symbol>
  </defs>

  {/* Back Wave */}
<use href="#wave" x="-1120" style={{ opacity: .45, animation: "waveBack 7s linear infinite" }} />
<use href="#wave" x="-560"  style={{ opacity: .45, animation: "waveBack 7s linear infinite" }} />
<use href="#wave" x="0"     style={{ opacity: .45, animation: "waveBack 7s linear infinite" }} />
<use href="#wave" x="560"   style={{ opacity: .45, animation: "waveBack 7s linear infinite" }} />
<use href="#wave" x="1120"  style={{ opacity: .45, animation: "waveBack 7s linear infinite" }} />

{/* Front Wave */}
<use href="#wave" x="-1120" style={{ animation: "waveFront 3.5s linear infinite" }} />
<use href="#wave" x="-560"  style={{ animation: "waveFront 3.5s linear infinite" }} />
<use href="#wave" x="0"     style={{ animation: "waveFront 3.5s linear infinite" }} />
<use href="#wave" x="560"   style={{ animation: "waveFront 3.5s linear infinite" }} />
<use href="#wave" x="1120"  style={{ animation: "waveFront 3.5s linear infinite" }} />
</svg>
          {/* Hidden Symbol */}
          <svg width="0" height="0">
            <symbol id="wave" viewBox="0 0 560 20">
              <path d="M0 10 C40 0 80 20 120 10 S200 0 240 10 S320 20 360 10 S440 0 480 10 S520 20 560 10 V20 H0 Z" />
            </symbol>
          </svg>
        </div>
      </div>
      <style jsx>{`
@keyframes waveFront {
  from {
    transform: translate3d(0,0,0);
  }
  to {
    transform: translate3d(-560px,0,0);
  }
}

@keyframes waveBack {
  from {
    transform: translate3d(-560px,0,0);
  }
  to {
    transform: translate3d(0,0,0);
  }
}
`}</style>
    </>
  );
}