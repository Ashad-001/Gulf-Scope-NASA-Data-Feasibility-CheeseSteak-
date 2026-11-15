'use client';

import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';


export function LivingEarth({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const paused = useRef(false);
  const orientation = useRef({ yaw: 0, pitch: 0 });
  const gesture = useRef<{ id: number; x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const redraw = useRef<() => void>(() => {});
  const sync = useRef<() => void>(() => {});
  const [isPaused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);


  useEffect(() => {
    const host = stage.current;
    const surface = canvas.current;
    if (!host || !surface) return;

    const controller = new AbortController();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 570px)');
    let scene: Awaited<ReturnType<typeof import('./earth-scene').createEarth>> | undefined;
    let attempted = false;
    let visible = false;
    let terminal = false;
    let frame = 0;
    let previous: number | undefined;
    let samples = 0;
    let frameMs = 0;
    let submitMs = 0;

    const draw = () => scene?.render(orientation.current.yaw, orientation.current.pitch);


    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = undefined;
    };


    const fail = () => {
      terminal = true;
      controller.abort();
      stop();
      scene?.dispose();
      scene = undefined;
      setReady(false);
    };


    const render = (time: number) => {
      frame = 0;
      if (!scene) return;
      const interval = previous === undefined ? 0 : time - previous;
      if (interval) {
        const delta = Math.min(interval, 100) / 1000;
        orientation.current.yaw = (orientation.current.yaw + delta * 2 * Math.PI / 150) % (2 * Math.PI);
      }
      previous = time;
      try {
        const start = performance.now();
        draw();
        if (interval) {
          frameMs += interval;
          submitMs += performance.now() - start;
          if (++samples === 120 && host) {
            host.dataset.earthFrameMs = (frameMs / samples).toFixed(1);
            host.dataset.earthSubmitMs = (submitMs / samples).toFixed(2);
            samples = frameMs = submitMs = 0;
          }
        }
        frame = requestAnimationFrame(render);
      } catch {
        fail();
      }
    };


    function resize() {
      if (!scene || !host) return;
      const size = Math.round(host.getBoundingClientRect().width);
      if (!size) return;
      scene.resize(size, Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.25 : 1.5));
      draw();
    }


    async function start() {
      // Give the reserved poster a chance to paint before requesting WebGL.
      if (host) await host.querySelector('img')?.decode().catch(() => {});
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (controller.signal.aborted) return;
      if (!visible || document.hidden || reduced.matches) {
        attempted = false;
        return;
      }
      const started = performance.now();
      try {
        if (!surface?.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })) {
          fail();
          return;
        }
        const { createEarth } = await import('./earth-scene');
        controller.signal.throwIfAborted();
        scene = await createEarth(surface, controller.signal);
        resize();
        const timing = performance.measure('Living Earth: request to first frame', { start: started, end: performance.now() });
        if (host) host.dataset.earthInitMs = timing.duration.toFixed(1);
        setReady(!reduced.matches);
        update();
      } catch {
        if (!controller.signal.aborted) fail();
      }
    }


    function update() {
      if (terminal) return;
      if (!visible || document.hidden || reduced.matches) {
        stop();
        return;
      }
      if (!attempted) {
        attempted = true;
        void start();
      }
      if (paused.current) stop();
      else if (scene && !frame) frame = requestAnimationFrame(render);
    }


    const onVisibility = () => {
      if (visible && !document.hidden && !reduced.matches) {
        try { resize(); } catch { fail(); }
      }
      update();
    };
    const onPreference = () => {
      setReady(!!scene && !reduced.matches);
      update();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.05;
      update();
    }, { threshold: 0.05 });
    const dimensions = new ResizeObserver(() => {
      if (!visible || document.hidden || reduced.matches) return;
      try { resize(); } catch { fail(); }
    });
    intersection.observe(host);
    dimensions.observe(host);
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', onPreference);
    surface.addEventListener('webglcontextlost', onContextLost);
    sync.current = update;
    redraw.current = () => {
      if (!visible || document.hidden || reduced.matches || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        try { draw(); } catch { fail(); }
        update();
      });
    };


    return () => {
      terminal = true;
      controller.abort();
      stop();
      scene?.dispose();
      intersection.disconnect();
      dimensions.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', onPreference);
      surface.removeEventListener('webglcontextlost', onContextLost);
      sync.current = () => {};
      redraw.current = () => {};
    };
  }, []);


  function setPlayback(nextPaused: boolean) {
    paused.current = nextPaused;
    setPaused(nextPaused);
    sync.current();
  }


  function beginDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }


  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const pointer = gesture.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.dragging) {
      if (Math.hypot(dx, dy) < 7) return;
      // Let the browser claim vertical touch gestures for page scrolling.
      if (event.pointerType === 'touch' && Math.abs(dy) >= Math.abs(dx)) return;
      pointer.dragging = true;
      suppressClick.current = true;
      setPlayback(true);
    }
    const sensitivity = 2.7 / event.currentTarget.getBoundingClientRect().width;
    orientation.current.yaw = (orientation.current.yaw + dx * sensitivity) % (2 * Math.PI);
    orientation.current.pitch = Math.max(-1.45, Math.min(1.45, orientation.current.pitch + dy * sensitivity));
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    redraw.current();
  }


  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.id === event.pointerId) gesture.current = null;
  }


  return <div className="earth-region">
    <div className="earth-scene" ref={stage} data-earth-ready={ready}>
      {children}
      <canvas ref={canvas} className="earth-canvas" aria-hidden="true" />
      {ready && <button
        className="earth-interaction"
        type="button"
        aria-label="Automatic globe rotation"
        aria-pressed={!isPaused}
        aria-describedby="earth-instructions earth-keyboard"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onClick={event => {
          if (event.detail !== 0 && suppressClick.current) return;
          setPlayback(!paused.current);
        }}
        onKeyDown={event => {
          const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
          if (!direction) return;
          event.preventDefault();
          setPlayback(true);
          orientation.current.yaw += direction[0] * 0.1;
          orientation.current.pitch = Math.max(-1.45, Math.min(1.45, orientation.current.pitch + direction[1] * 0.1));
          redraw.current();
        }}
      />}
    </div>
    <div className="earth-motion-slot">{ready && <>
      <p id="earth-instructions">Tap to {isPaused ? 'resume' : 'pause'} · Drag to explore</p>
      <span className="sr-only" id="earth-keyboard">Use Enter or Space to toggle rotation, or arrow keys to explore.</span>
    </>}</div>
  </div>;
}
