import type { Role } from "./types";

const SVG: Record<Role, string> = {
  head: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M272 303q-4 1-10 10c-9 13-8 14 41 67l37 39v71c0 75 0 75-21 75q-6 1-7 3 1 3 14 2l14-2v35l-24 11s-22 11-22 17c-2 12 47-17 47-16v22c0 4-30 12-24 21 3 5 26-9 26-4v5h321v-6c1-4 11 1 11-1q-1-4-6-6c-7-2-9-33-3-33l18 6q14 6 20 5 2-2-19-11l-22-9v-35h15q23 1-4-5l-11-3V408l36-38c37-41 43-54 27-63-6-3-20 0-67 14l-59 18H392l-58-18z" style="fill:#171210;stroke-width:15.0386"/><path d="m304 346 18 9 53 29c40 22 47 24 47 8l2-20c3-9 4-9 72-9h69l2 20c2 11 4 21 6 22s26-12 56-28c29-17 54-29 54-29 1 1-12 16-28 33-29 32-35 42-24 42 5 0 6 10 6 68v68l-23-3c-26-3-21 3 6 8 16 2 17 4 17 14q1 20-24 6-12-6-17-5c-3 1 6 6 18 12 19 9 23 12 23 20 0 13-2 13-21 0-22-15-23-9-1 7q16 12 18 16c0 2-59 3-131 3q-130 0-132-4 1-4 16-15l16-13c0-4-23 7-26 12-5 8-14 5-14-6 0-8 4-11 23-20q21-10 18-12-5-1-17 5-26 14-24-6c0-10 2-12 15-14 27-5 33-10 8-8l-23 3v-74l1-74-21-23-30-32zm116 157-9 1c-18 2-19 4-12 16 8 12 27 14 37 4q17-19-16-21m148 4c-5 2-14 1-4 14 7 11 26 12 35 3 8-8 8-17 0-17zm-69 15q-35-1-15 21 13 15-14 26-15 6-16 9c0 10 38-4 42-14q1-9 13 4c12 10 36 18 36 10q-1-4-9-6c-5-2-14-7-19-12l-8-10 8-10q8-10 6-14-4-5-24-4" style="fill-opacity:1;stroke-width:15.0386"/><path d="M424 509q9 0 10 3c0 5-9 8-15 6-9-3-6-9 5-9m169 4q-2 4-8 5c-14 1-9-8-3-8 4 0 11 0 11 3" style="fill:#fff;stroke-width:15.0386"/></svg>`,
  body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M350 350h300v300H350z" style="fill:none;fill-opacity:.30322;stroke:red;stroke-width:.984427;stroke-dasharray:none;stroke-opacity:1"/><rect width="300" height="300" x="350" y="350" ry="18" style="fill-opacity:1;stroke:#171210;stroke-width:30;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"/></svg>`,
  tail: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M350 350h300v300H350z" style="fill:none;fill-opacity:.30322;stroke:red;stroke-width:.984427;stroke-dasharray:none;stroke-opacity:1"/><path d="M744 318q-16-2-26 11c-20 22 2 44-10 92-7 24-27 42-48 53-6 2-12 0-10 8l-1 76c23-6 47-12 67-26 39-24 66-66 72-112q6-38-6-75c-5-15-19-27-35-27h-1z" style="fill:#171210;stroke-width:12.526"/><path d="M650 497c31-10 61-32 73-63q10-31 6-64c-4-11-5-25 5-32 9-7 22-4 27 6q12 26 11 54c-2 55-37 108-88 129-9 3-19 9-29 8l-6-2m0 0v-1zm1-36q-1 0 0 0" style="stroke-width:12.526"/><path d="M350 350h300v300H350z" style="fill:none;fill-opacity:.30322;stroke:red;stroke-width:.984427;stroke-dasharray:none;stroke-opacity:1"/><rect width="300" height="300" x="350" y="350" ry="18" style="fill-opacity:1;stroke:#171210;stroke-width:30;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"/></svg>`,
  legs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M342 342c-10 20-4 42-5 64 0 57 4 114 3 171-5 15-32 11-38 28-6 13-14 38 0 47q53 4 105 4l253 3-1-230 1-70-24-24c-91 1-184-3-275 1-7 1-16 0-19 6" style="fill:#171210;stroke-width:15.3751"/><path d="M365 362h273v202c1 10-2 29-10 11-21-28-52-51-87-54-8-4-36-1-18 8 16 4 32 3 46 12 36 17 65 51 69 92q5 11-7 9H309c-1-15 0-33 15-40 34-15 73-4 108-12 7-5-10-12 0-20 5-19-16 4-22 7-16 6-32 3-48 4l3-216z" style="stroke-width:15.3751"/></svg>`,
};

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 300 300"><path d="M46 253q-10-2-17-9-9-9-10-24 0-9 5-17 4-6 9-10l2-1v-52l2-55c3-2 2-2 17-2h15l1-20c0-9 0-9 2-11s0-2 25-2h22v-8c1-9 1-10 3-12 3-2 1-2 30-2h28l4 4 1 1 1 9v8h19l21 1q3 1 3 4l1 14v13h1l15 1 15 1 4 3v105l2 1q4 2 6 7 3 3 0 7l-2 5-2 2 2 2q5 6 5 14 1 6-2 10-5 9-16 12l-3 1zm13-9q5 0 9-5l3-2-1-2-7-5-2 1-8 2q-7 0-10-7l-1-5 1-6q2-6 9-6 4-1 8 2l3 2c1 0 8-6 8-8q0-2-5-4-9-6-22-3-13 5-15 20-1 7 2 15 5 10 18 12zm197 0q11-3 11-14 0-6-4-9l-10-5q-10-4-8-6l4-2q3-1 8 2h4l4-6q1-1-3-3-8-6-20-3l-7 4q-6 9-1 17 2 4 12 6 9 3 9 6l-2 2q-2 3-11-1l-5-2-6 7q-2 1 3 4l12 4zm-169 0 1-4 1-3h16l1 3 1 4h6l7-1a267 267 0 0 0-16-45H90l-2 4-14 42zm6-18 2-7 2-7 1 2 3 10q3 4-4 3zm50 18v-17l1-17h6q7 1 7-3l-1-8-1-1h-36l-1 1-1 5 1 5 1 1h5l6 1 1 32 6 1zm31 0 1-7v-6h5l4 6 5 6 6 1 7-1-2-4-6-10 2-3q6-4 6-12 0-6-4-10-3-5-11-6h-25v46zm2-24q-2 1-1-6-1-6 4-5 8-1 10 4 0 4-4 7zm47 23 1-22-1-23h-12l-1 23 1 23zM91 189l5-14 2-3-1-1-11-12-2 1-4 2-2-3q-1-1 4-3l2-2-1-9q2-3-6 0h-5q-2-1-1-3l6-3q6-1 6-3v-1H63c-21 0-20 0-21 2v53h1l24 1h23zm111-1q-4-9-9-15l-1-1 2-2 10-8q5-4 4-6l-3-1-12-4c0-2 1-2 13 0h5l1-6 1-2h-5l-14 1v-3l2-1 12-2 4-1c1-1-2-9-5-16l-1-5a85 85 0 0 0 0-38l-2-4q-2-3-9 2l-19 15q-2 3-5 1l-15-2q-12-1-24 2-4 2-7-1c-6-6-22-17-24-17q-4-2-5 4c-2 5-2 8-2 19l1 16 1 5-1 3-5 16 2 1 16 2v3H91q-3-1-2 2l2 6 6-1 11-1v2q2 1-10 4l-4 1q0 2 7 9l9 6-2 2-5 8-3 9-1 1h104zm-61-32q-6-2-8-6l1-3 4 2q3 5 8 2l3-4v-2h-2q-3-2-3-6v-2l1-1h12q2 1 1 4 0 3-4 5l-1 2q1 4 6 5l6-3 2-2 2 1q2 6-9 8-4 0-7-2l-2-1-1 1zm-20-16q-4-1-6-6l-1-5 1-5q3-6 10-5 6 0 8 5l1 6-1 5-4 4q-3 2-8 1m8-12q3-3-2-4-3 1-1 4zm46 12q-8-2-7-11 0-7 5-9l5-1q6 0 9 6v10q-4 6-12 5m6-12q2-3-1-5-4 0-3 4 2 3 4 1m77 62v-53l-1-1-1-1-18-1h-19v2l1 2 5 1 6 2v3h-11l-1 3-1 5v2l4 2 4 2q1 4-2 4l-5-2-4-1-11 13-1 1 1 2 7 16h46zM86 125l2-6 1-2-1-6-1-14q0-23 6-29l4-2q7 0 18 8l5 3V67l-1-10-20-1-21 1-1 1-1 16v14l-1 1-1 1H43l-1 2 1 36h41zm171 3 1-2v-17l-1-19h-16l-18-2V73l-1-15c0-2-1-2-19-2l-17 1v17l3-2q12-7 17-6 4 0 7 8 2 4 2 13v24l-1 8 2 6 1 3zm-84-44 3-3 2-2V37c-1-3-1-2-25-2-25 0-24-1-25 2l-1 23v22l1 1c2 2 2 2 8 1l14-1 15 1z" style="fill:#000;stroke-width:1.24053"/><path d="m100 190 1-4 7-12 2-3-4-2-12-11q-2-1 7-3l7-3v-3l-9 1-8 1v-2q-3-5-1-6h18q2-4-12-5l-6-1 4-14 2-5-1-6c-1-9-1-28 1-33q1-5 4-5c2 0 14 8 24 16 4 3 4 3 12 2a103 103 0 0 1 36 0l3 1 4-4 20-15 3-1 1 1c5 3 7 22 4 38l-1 6 2 5 4 14-6 1-8 1q-6 1-4 4l9 1 9-1v2l-1 6-18-1v2l11 4 4 1c0 1-7 8-12 11l-5 4 1 1 10 16v2h-51zm48-35 3-2 2 2q8 3 15-3l2-3q0-2-3-2l-3 2q-4 4-7 2l-4-4 2-2q5-4 3-8l-6-2-6 1q-3-1-3 2 1 5 4 7t-1 6q-4 2-8-2-3-4-4-2-3 3 3 7 5 4 11 1zm-19-15q5-3 5-10 0-9-7-11-8-1-12 5v11q2 4 6 5l2 1zm52 0q5-2 6-7v-5q0-9-9-9-5-1-9 4-3 5 0 12 4 8 12 5z" style="fill:#fea622;fill-opacity:1;stroke:#171210;stroke-width:1.57268;stroke-linejoin:round"/><path d="M166 84c-5-1-25-2-31-1h-7l-1-1V60l1-24 2-1h46l2 3v41l-3 2-4 3zM43 127l-1-18 1-18 16-1 17-1 1-15 1-17 41 1 1 18-7-4q-10-6-16-6-5 0-9 11c-1 6-2 27-1 34l1 5-2 6-2 6H64zm0 63-1-27 1-27 20-1h19v1q1 2-4 3-9 2-7 5 0 2 6 1l5-1v2l1 5 1 3-2 1-3 2q-3 1-1 4h5l3-1 3 3 5 6 4 3-2 5q-3 4-4 9l-2 5H67zm168-2-6-12-2-3 3-3 7-7q3-4 4-3l8 2 1-2q1-3-5-5l-3-1 2-10 3 1 8-1v-3l-6-2q-6-1-5-3v-1h36l1 1 1 26v27l-1 1-23 1h-22zm5-65c-2-5-2-7-1-14V84q-1-12-7-17-3-3-12 1l-7 4-3 2V57h35l2 16 1 16 16 1h16l1 2v35l-20 1h-19zm28 121c-6-1-13-5-13-6l6-8c11 5 13 5 16 3q5-2-1-5l-7-3-10-5q-6-7 0-16 8-9 23-5l7 5-5 6-4-1-6-1q-5 0-5 3-1 2 8 5l11 6c6 7 3 17-6 21q-7 3-14 1zm-33-5 1-41h10l1 22v22q1 2-6 2h-6zm-48 1v-40l4-2h13c10 1 13 2 17 5q5 4 5 11c0 7-2 8-5 12l-3 3 4 7 4 7-7 1c-6 0-5 0-12-9q-3-6-5-5l-3 1-1 6v6h-5l-6 1zm23-20c4-2 4-8 0-10-3-2-10-2-11-1l-1 10 6 1zm-55 7-1-17-6-1-6-1v-9l19-1c21 0 19 0 19 6q2 6-6 5l-6 1-1 17v16h-6l-6 1zm-57 16 17-45 13 1 15 44h-12l-1-3-1-3H89l-1 3-1 4h-6zm27-17-3-13-1-1-1 1-3 13zm-53 19q-18-4-19-23c0-16 12-27 27-25q10 2 14 7 1 2-3 5l-4 3-3-1q-2-2-8-2t-9 4l-2 7c0 12 10 17 21 11l1-1 4 3 3 4-8 6z" style="fill:#fea622;fill-opacity:1;stroke:#171210;stroke-width:1.57268;stroke-linejoin:round"/><path d="m166 83-20-1h-17V37h47l1 21v20l-3 3c-3 2-3 2-8 2zm52 42c-2-5-3-8-2-17 1-10 1-25-1-30l-3-7q-3-11-19-3l-7 4 1-7 1-6h32l1 13c1 16 1 17 3 18l16 1 15 1 1 17v17h-2l-19 1h-16zm-7 60-4-8-2-4 3-3 6-6 3-3 3 1q7 3 7-1 2-4-4-6-4-1-3-4l1-4v-1h5l6-1q3-4-5-7l-6-2h35v53h-22l-21 1z" style="fill:#e8443c;fill-opacity:1;stroke:#171210;stroke-width:1.84682;stroke-linejoin:round"/><path d="M165 81h-35V38h45l1 20v19l-1 2-6 3z" style="fill:#25a5d2;fill-opacity:1;stroke:#171210;stroke-width:1.84682;stroke-linejoin:round"/><path d="m45 126-2-1v-16l1-17 16-1 16-1q2-1 2-18l1-13 20-1h19l1 8-1 8-5-3q-15-9-20-4-5 4-6 14l-1 32q2 3-1 8l-2 6H65z" style="fill:#4bbe55;fill-opacity:1;stroke:#171210;stroke-width:1.84682;stroke-linejoin:round"/><path d="M53 189h-9v-52l19-1h18l-5 2q-6 2-7 4 1 4 3 4h5q6-2 5 2v3q2 2-2 4-5 3-3 6 1 3 7 1 2-2 3 1l5 5 4 4-2 4-3 9-2 5H76zm-7 54-4-1c-10-5-15-19-10-30q4-9 13-12c7-3 18-1 22 4l2 1-3 3-3 3-3-2q-7-3-13 0-7 3-7 11c0 11 10 18 20 13l3-2 3 3q4 2 2 4c-5 4-15 7-22 5zm30-1 15-42h12l15 41v1h-10l-1-3-1-3h-7c-10-1-11-1-12 3l-1 3zm25-15q3 1 0-7-2-8-4-9l-4 9q-3 8 0 7zm31 0-1-17-7-2h-5l-1-2 2-7h32l3 1v8h-6l-6 1-1 2v28l-1 3h-9zm32 13-1-22 1-18 3-1 25 2q8 5 8 14 0 4-4 10l-3 4 3 7 4 6h-5c-5 0-5 0-10-6q-4-7-7-7-5-1-4 8l-1 5h-9zm24-21 2-4q0-5-3-6c-4-2-12-2-13 0l-1 6c0 6 0 6 8 6q6 1 7-2zm24 3v-22l5-1h5v43h-10zm28 20-7-5 2-3c3-2 2-2 8 0q12 3 13-3 1-3-9-7l-8-3-6-6 2-10q9-9 23-5l5 3q2 1-1 4l-2 2-4-1q-11-3-12 3-1 4 7 6 12 4 14 9 3 7-3 13-9 8-22 3z" style="fill:#fff4d4;fill-opacity:1;stroke:#171210;stroke-width:1.84682;stroke-linejoin:round"/></svg>`;

const cache = new Map<string, HTMLImageElement>();
let ready = false;

function tint(svg: string, color: string) {
  return svg.replace("<svg", `<svg fill="${color}"`);
}

function toSrc(svg: string) {
  if (typeof URL !== "undefined" && typeof Blob !== "undefined") {
    return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  }
  return `data:image/svg+xml;charset=utf-8;base64,${btoa(svg)}`;
}

export function preloadCats(colors: string[]) {
  if (typeof Image === "undefined") return Promise.resolve();
  const roles: Role[] = ["head", "body", "tail", "legs"];
  const jobs: Promise<void>[] = [];
  for (const color of colors) {
    for (const role of roles) {
      const key = `${color}-${role}`;
      if (cache.has(key)) continue;
      jobs.push(
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            cache.set(key, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = toSrc(tint(SVG[role], color));
        }),
      );
    }
  }
  return Promise.all(jobs).then(() => {
    ready = true;
  });
}

export function catSprite(color: string, role: Role) {
  return cache.get(`${color}-${role}`) ?? null;
}

export function catsReady() {
  return ready;
}

/** Original Catris overflow: 100 view / 30 inner so ears and tails spill the cell. */
export function drawCatSprite(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  cell: number,
  color: string,
  role: Role,
  ghost: boolean,
) {
  const img = catSprite(color, role);
  const overflow = 35 / 30;
  const size = cell * (100 / 30);
  const x = col * cell - overflow * cell;
  const y = row * cell - overflow * cell;
  ctx.save();
  ctx.globalAlpha = ghost ? 0.28 : 1;
  if (img) {
    ctx.drawImage(img, x, y, size, size);
  } else {
    ctx.fillStyle = color;
    const pad = cell * 0.08;
    ctx.fillRect(col * cell + pad, row * cell + pad, cell - pad * 2, cell - pad * 2);
  }
  ctx.restore();
}

export function logoDataUrl() {
  return `data:image/svg+xml;charset=utf-8;base64,${btoa(LOGO_SVG)}`;
}

