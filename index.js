/*--------------------
Register Plugins
--------------------*/
gsap.registerPlugin(Flip, ScrollTrigger, SplitText)

/*--------------------
Page Load
--------------------*/

function initPageLoad() {
  const pageLoadWrapper = document.querySelector("[data-page-load-wrapper]");
  const pageLoadOverlay = document.querySelector("[data-page-load-overlay]");

  let tl;
  let splits = []; // Store split instances for cleanup/reuse

  if (!pageLoadWrapper) return; // Safety check

  const pageLoadBlurs = pageLoadWrapper.querySelectorAll("[data-page-load-blur]");

  // Loop through each blur element inside the wrapper
  pageLoadBlurs.forEach((blur) => {
    const split = new SplitText(blur, {
      type: "lines",
      linesClass: "pageBlurLine"
    });
    splits.push(split);

    const tl = gsap.timeline(); // Initialize timeline here

    tl.set(split.lines, {
      filter: "blur(1rem)",
      opacity: 0,
      autoAlpha: 0,
    });

    tl.set(pageLoadOverlay, {
      autoAlpha: 1
    });

    tl.to(pageLoadOverlay, {
      autoAlpha: 0,
      duration: .8,
    });

    tl.to(split.lines, {
      filter: "blur(0rem)",
      autoAlpha: 1,
      duration: 1.2,
      stagger: 0.5
    }, 0);
  });
}

/*--------------------
Image Parallax
--------------------*/

function initImageParallax() {
  const imageWrapper = document.querySelectorAll("[data-parallax-wrapper]");
  let tl;

  imageWrapper.forEach((wrapper) => {
    const image = wrapper.querySelector("[data-parallax-img]");

    if (!image) return;

    // Read custom values from data attributes
    const startPosition = wrapper.dataset.parallaxStart || "top bottom";
    const endPosition = wrapper.dataset.parallaxEnd || "bottom top";

    gsap.set(image, { scale: 1.05 });

    tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: startPosition,
        end: endPosition,
        scrub: 1
      }
    });

    tl.from(image, {
      yPercent: -5

    });

    tl.to(image, {
      yPercent: 5
    });
  });

  ScrollTrigger.refresh();
}

/*--------------------
Blurry Text Scroll
--------------------*/

function initTextBlurScroll() {
  const textBlurWrappers = document.querySelectorAll("[data-text-blur-wrapper]");
  let tl;
  let splits = []; // Store split instances for cleanup/reuse

  // Loop through each wrapper
  textBlurWrappers.forEach((wrapper) => {
    // Find the text element inside THIS wrapper
    const textBlurs = wrapper.querySelectorAll("[data-text-blur]");

    // Loop through each text element
    textBlurs.forEach((textBlur) => {

      // Split text into lines
      const split = new SplitText(textBlur, {
        type: "lines",
        linesClass: "blurLine"
      });
      splits.push(split); // Store reference

      // Read custom values from data attributes
      const startPosition = textBlur.dataset.blurStart || "top 70%";
      const endPosition = textBlur.dataset.blurEnd || "center center";
      const delay = parseFloat(textBlur.dataset.blurDelay) || 0;
      const duration = parseFloat(textBlur.dataset.blurDuration) || 1;
      const lineStagger = parseFloat(textBlur.dataset.blurLineStagger) || 0.05;

      // Create scroll-linked timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: startPosition,
          end: endPosition,
          scrub: 1
        }
      });

      tl.from(split.lines, {
        filter: "blur(1rem)",
        autoAlpha: 0,
        duration: duration,
        stagger: lineStagger
      }, 0);
    });
  });
}

/*--------------------
Testimonial ScrollTrigger
--------------------*/

function initFlipOnScroll() {
  let wrapperElements = document.querySelectorAll("[data-flip-element='wrapper']");
  let targetEl = document.querySelector("[data-flip-element='target']");

  let tl;

  function flipTimeline() {
    if (tl) {
      tl.kill();
      gsap.set(targetEl, { clearProps: "all" });
    }

    // Use the first and last wrapper elements for the scroll trigger.
    tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapperElements[0],
        start: "center center",
        endTrigger: wrapperElements[wrapperElements.length - 1],
        end: "center center",
        scrub: 0.25
      }
    });

    // Loop through each wrapper element.
    wrapperElements.forEach(function (element, index) {
      let nextIndex = index + 1;
      if (nextIndex < wrapperElements.length) {
        let nextWrapperEl = wrapperElements[nextIndex];
        // Calculate vertical center positions relative to the document.
        let nextRect = nextWrapperEl.getBoundingClientRect();
        let thisRect = element.getBoundingClientRect();
        let nextDistance = nextRect.top + window.pageYOffset + nextWrapperEl.offsetHeight /
          2;
        let thisDistance = thisRect.top + window.pageYOffset + element.offsetHeight / 2;
        let offset = nextDistance - thisDistance;
        // Add the Flip.fit tween to the timeline.
        tl.add(
          Flip.fit(targetEl, nextWrapperEl, {
            duration: offset,
            ease: "none"
          })
        );
      }
    });
  }
  flipTimeline();

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      flipTimeline();
    }, 100);
  });
}

/*--------------------
Horizontal Scroll Section
--------------------*/
function initHorizontalScrolling() {
  const mm = gsap.matchMedia();
  mm.add(
    {
      isMobile: "(max-width:479px)",
      isMobileLandscape: "(max-width:767px)",
      isTablet: "(max-width:991px)",
      isDesktop: "(min-width:992px)"
    },
    (context) => {
      const { isMobile, isMobileLandscape, isTablet } = context.conditions;
      const ctx = gsap.context(() => {
        const wrappers = document.querySelectorAll("[data-horizontal-scroll-wrap]");
        if (!wrappers.length) return;
        wrappers.forEach((wrap) => {
          const panels = gsap.utils.toArray("[data-horizontal-scroll-panel]", wrap);
          if (panels.length < 2) return;

          const bgContainer = wrap.querySelector("[data-horizontal-scroll-bg]");
          const images = bgContainer ? gsap.utils.toArray("[data-horizontal-img]",
            bgContainer) : [];

          // Set initial image opacity (first image visible)
          if (images.length > 0) {
            gsap.set(images, { opacity: 0 });
            gsap.set(images[0], { opacity: 1 });
          }

          // Check if horizontal scroll is disabled at this breakpoint
          const disable = wrap.getAttribute("data-horizontal-scroll-disable");
          const isHorizontalDisabled =
            (disable === "mobile" && isMobile) ||
            (disable === "mobileLandscape" && isMobileLandscape) ||
            (disable === "tablet" && isTablet);

          if (isHorizontalDisabled) {
            // Mobile layout: fade images based on which panel is in view
            if (images.length > 0 && panels.length > 0) {
              const imageObserver = new IntersectionObserver(
                (entries) => {
                  entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                      const panelIndex = panels.indexOf(entry.target);
                      if (panelIndex !== -1 && panelIndex < images.length) {
                        images.forEach((img, idx) => {
                          gsap.to(img, {
                            opacity: idx === panelIndex ? 1 : 0,
                            duration: 1.2,
                            overwrite: "auto"
                          });
                        });
                      }
                    }
                  });
                },
                {
                  root: null,
                  threshold: 0.3 // adjust if needed (0–1, how much of panel must be visible)
                }
              );

              panels.forEach((panel) => {
                imageObserver.observe(panel);
              });
            }
          } else {
            // Desktop/tablet: horizontal scroll with image fade
            const scrollDistance = wrap.scrollWidth - window.innerWidth;

            gsap.to(panels, {
              x: () => -scrollDistance,
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: "top top",
                end: () => "+=" + scrollDistance,
                scrub: true,
                pin: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  const progress = self.progress;
                  const imageIndex = Math.round(progress * (images.length - 1));

                  images.forEach((img, idx) => {
                    gsap.to(img, {
                      opacity: idx === imageIndex ? 1 : 0,
                      duration: 1.2,
                      overwrite: "auto"
                    });
                  });
                }
              },
            });
          }
        });
      });
      return () => ctx.revert(); // cleanup
    }
  );
  ScrollTrigger.refresh();
}

initPageLoad();
initFlipOnScroll();
initTextBlurScroll();
initHorizontalScrolling();
initImageParallax();
