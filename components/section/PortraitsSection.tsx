"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const PortraitsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scalerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Scaler animation (centerpiece scaling)
    const scalerTl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top -10%",
        end: "bottom 100%",
        scrub: true,
      },
    });
    const scalerImage = scalerRef.current?.querySelector("img");
    if (scalerImage) {
      scalerTl.fromTo(
        scalerImage,
        { height: "calc(100vh - 32px)", width: "calc(200vw - 32px)" },
        {
          height: "100%",
          width: "500%",
          ease: "power2.inOut",
        }
      );
    }

    // Layers animation (fade and reveal)
    const layersTl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top -40%",
        end: "bottom bottom",
        scrub: true,
      },
    });
    layerRefs.current.forEach((layer, index) => {
      if (layer) {
        const ease = index === 0 ? "sine.out" : "power3.inOut";
        layersTl.fromTo(
          layer,
          { opacity: 0, scale: 0, transformOrigin: "center" },
          {
            opacity: 1,
            scale: 1,
            ease,
            stagger: 0.2,
            onComplete: () => {
              if (gridRef.current) {
                gsap.set(gridRef.current, {
                  transform: "translate(-50%, -50%)",
                });
              }
            },
          },
          0
        );
      }
    });

    return () => {
      scalerTl.kill();
      layersTl.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const imagesLayer1 = ["/images/portrait3.png", "/images/portrait1.jpg"];
  const imagesLayer2 = ["/images/portrait2.png", "/images/portrait4.jpg"];
  const scalerImage = "/images/portrait5.jpg";

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-screen min-h-[220vh] bg-background hidden lg:block"
    >
      <header className="min-h-screen flex items-center px-10 max-w-[calc(100%-2*2rem)] mx-auto">
        <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-bold leading-[0.6]">
          Portraits
        </h1>
      </header>
      <main>
        <section className="content-wrap relative w-full h-screen overflow-hidden">
          <div className="content flex justify-center items-center w-full h-full">
            <div
              ref={gridRef}
              className="grid max-w-[1600px] mx-auto grid-cols-5 grid-rows-3 gap-[clamp(10px,7.35vw,80px)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-4rem)]"
            >
              {/* Layer 1 - Outer images */}
              <div
                ref={(el) => {
                  layerRefs.current[0] = el;
                }}
                className="layer col-span-full row-span-full grid grid-cols-subgrid grid-rows-subgrid z-10"
              >
                {imagesLayer1.map((src, i) => (
                  <div
                    key={i}
                    className={`relative block ${
                      i % 2 === 0
                        ? "col-start-1 row-start-2"
                        : "col-start-5 row-start-2"
                    }`}
                  >
                    <div className="w-full h-full">
                      <Image
                        src={src}
                        alt={`Portrait ${i + 1}`}
                        width={800}
                        height={1000}
                        className="block w-full aspect-[4/5] object-cover rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Layer 2 - Middle images */}
              <div
                ref={(el) => {
                  layerRefs.current[1] = el;
                }}
                className="layer col-span-full row-span-full grid grid-cols-subgrid grid-rows-subgrid z-20"
              >
                {imagesLayer2.map((src, i) => (
                  <div
                    key={i}
                    className={`relative block ${
                      i % 2 === 0
                        ? "col-start-2 row-start-2"
                        : "col-start-4 row-start-2"
                    }`}
                  >
                    <div className="w-full h-full">
                      <Image
                        src={src}
                        alt={`Portrait ${i + 5}`}
                        width={800}
                        height={1000}
                        className="block w-full aspect-[4/5] object-cover rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Center image - Always on top */}
              <div
                ref={(el) => {
                  scalerRef.current = el;
                }}
                className="scaler col-start-3 row-start-2 relative z-30"
              >
                <div className="w-full h-full">
                  <Image
                    src={scalerImage}
                    alt="Scaler Portrait"
                    width={3000}
                    height={3000}
                    className="block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover rounded-lg w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PortraitsSection;
