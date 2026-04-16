(() => {
  const VORTI_KEY = "indexVortexPlayed";

  const random = {
    sampleUniform: (min, max) => min + Math.random() * (max - min),
    sampleUniformInt: (min, max) => Math.floor(min + Math.random() * (max - min + 1)),
  };

  function dedent(text) {
    const lines = text.split('\n');
    const nonEmpty = lines.filter(line => line.trim());
    if (!nonEmpty.length) return text;
    const indent = Math.min(...nonEmpty.map(line => line.match(/^ */)[0].length));
    return lines.map(line => line.slice(indent)).join('\n');
  }

  function createVortifyApp(options) {
    const container = document.getElementById(options.containerId || "container");
    if (!container) return null;

    const config = {
      fontSize: options.fontSize ?? 15,
      charWidth: (options.fontSize ?? 15) * 0.6,
      charHeight: (options.fontSize ?? 15) * 1.35,
      maxFrame: options.maxFrame ?? 500,
      intervalMs: options.intervalMs ?? 15,
      content: dedent(options.content || "")
    };

    const state = {
      chars: [],
      numRows: 0,
      numColumns: 0,
      frame: 0,
      nextFrameTime: 0
    };

    function getCharsFromText(text) {
      const chars = [];
      const activeTags = [];
      const cps = [...text];

      for (let i = 0; i < cps.length; i++) {
        if (cps[i] === '[' && cps.includes(']', i)) {
          const j = cps.indexOf(']', i);
          const tag = cps.slice(i + 1, j).join('');
          if (tag[0] === '/') {
            const name = tag.slice(1);
            const idx = activeTags.findIndex(t => t.name === name);
            if (idx !== -1) activeTags.splice(idx, 1);
          } else {
            const [name, ...args] = tag.split(/\s+/);
            activeTags.push({ name, args });
          }
          i = j;
          continue;
        }
        chars.push({ id: `text-${i}`, char: cps[i], tags: [...activeTags] });
      }
      return chars;
    }

    function wrapText(chars, width) {
      const lines = [];
      let line = [];

      for (const ch of chars) {
        if (ch.char === '\n') {
          lines.push(line);
          line = [];
          continue;
        }
        line.push(ch);
        if (line.length > width) {
          const cut = line.findLastIndex(c => c.char === ' ');
          if (cut >= 0) {
            lines.push(line.slice(0, cut));
            line = line.slice(cut + 1);
          } else {
            lines.push(line);
            line = [];
          }
        }
      }
      if (line.length) lines.push(line);
      return lines;
    }

    function generateChars() {
      const minRows = Math.floor(window.innerHeight / config.charHeight);
      let numColumns = Math.floor((window.innerWidth - 1) / config.charWidth);
      if (numColumns < 25) numColumns = 30;

      let chars = getCharsFromText(config.content);

      const sizeWeight = Math.min(1, Math.max(0, (window.innerWidth - 600) / 1000));
      const numWrapColumns = Math.ceil(numColumns * (0.6 * sizeWeight + 0.8 * (1 - sizeWeight)));

      const lines = wrapText(chars, numWrapColumns);
      const numRows = Math.max(minRows, lines.length + 8);
      const startY = Math.max(5, Math.floor((numRows - lines.length) * 0.4));
      const startX = Math.floor((numColumns - numWrapColumns) * 0.5);

      chars = [];
      for (let y = 0; y < lines.length; y++) {
        for (let x = 0; x < lines[y].length; x++) {
          const c = lines[y][x];
          c.weight = random.sampleUniform(0, 1);
          c.position = {
            x: random.sampleUniformInt(0, numColumns),
            y: random.sampleUniformInt(0, numRows)
          };
          c.finalPosition = { x: startX + x, y: startY + y };
          chars.push(c);
        }
      }

      chars = chars.filter(c => (c.char !== ' ' && c.char !== '\n') || c.tags.length > 0);

      state.chars = chars;
      state.numRows = numRows;
      state.numColumns = numColumns;
    }

    function settleCharsImmediately() {
      state.chars.forEach(ch => {
        ch.position = { ...ch.finalPosition };
      });
    }

    function createCharElement({ position: { x, y }, id, tags, char }) {
      const el = document.createElement('a');
      el.style.position = 'absolute';
      el.style.top = `${y * config.charHeight}px`;
      el.style.left = `${x * config.charWidth}px`;
      el.style.minWidth = `${config.charWidth}px`;
      el.style.minHeight = `${config.charHeight}px`;
      el.textContent = char;
      el.id = `char-${id}`;

      for (const { name, args } of tags) {
        if (name === 'link') {
          el.href = args[0] || '#';
          if (/^https?:\/\//i.test(args[0])) el.target = '_blank';
        } else if (name === 'b') {
          el.style.fontWeight = '700';
        } else if (name === 'i') {
          el.style.fontStyle = 'italic';
        }
      }

      return el;
    }

    function createCornerElement() {
      const corner = document.createElement('a');
      corner.style.position = 'absolute';
      corner.style.top = `${(state.numRows - 1) * config.charHeight}px`;
      corner.style.left = `${(state.numColumns - 1) * config.charWidth}px`;
      corner.textContent = ' ';
      return corner;
    }

    function updateCharElementPosition({ position: { x, y }, id }) {
      const el = document.getElementById(`char-${id}`);
      if (!el) return;
      el.style.top = `${y * config.charHeight}px`;
      el.style.left = `${x * config.charWidth}px`;
    }

    function mountChars() {
      const elements = [...state.chars.map(createCharElement), createCornerElement()];
      elements.forEach(el => container.appendChild(el));
    }

    function evolveChars() {
      const { frame, chars, numRows, numColumns } = state;
      const t = Math.min(frame / config.maxFrame, 1);
      const heightWidthRatio = config.charHeight / config.charWidth;

      const positionMap = {};
      chars.forEach(ch => {
        positionMap[`${ch.position.y},${ch.position.x}`] = ch;
      });
      const frozen = new Set();

      const moveChar = (ch, { x, y }) => {
        positionMap[`${ch.position.y},${ch.position.x}`] = null;
        positionMap[`${y},${x}`] = ch;
        frozen.add(`${y},${x}`);
        ch.position = { x, y };
      };

      const sorted = [...chars].sort((a, b) => {
        const distA = Math.abs(a.finalPosition.y - a.position.y) + Math.abs(a.finalPosition.x - a.position.x);
        const distB = Math.abs(b.finalPosition.y - b.position.y) + Math.abs(b.finalPosition.x - b.position.x);
        return (distB - distA) + Math.random() * 6 - 3;
      });

      for (const ch of sorted) {
        const { x, y } = ch.position;
        if (frozen.has(`${y},${x}`)) continue;

        const move = { x: 0, y: 0 };

        const toFinal = { x: ch.finalPosition.x - x, y: ch.finalPosition.y - y };
        const dFinal = Math.hypot(toFinal.x, toFinal.y);
        if (dFinal > 0) {
          const w = Math.max(0, t - 0.8 + ch.weight);
          move.x += w * toFinal.x / dFinal;
          move.y += w * toFinal.y / dFinal;
        }

        const centerX = (window.scrollX + window.innerWidth / 2) / config.charWidth;
        const centerY = (window.scrollY + window.innerHeight / 2) / config.charHeight;
        const toCenter = {
          x: centerX - x + random.sampleUniform(-0.1, 0.1),
          y: heightWidthRatio * (centerY - y + random.sampleUniform(-0.1, 0.1))
        };
        const dCenter = Math.hypot(toCenter.x, toCenter.y);
        if (dCenter > 0) {
          const w = Math.max(0, 1 - t);
          move.x += w * toCenter.y / dCenter;
          move.y += w * -toCenter.x / dCenter;
        }

        if (Math.hypot(move.x, move.y) < 0.001) {
          frozen.add(`${y},${x}`);
          continue;
        }

        const theta = Math.atan2(move.y, move.x) + random.sampleUniform(-Math.PI / 4, Math.PI / 4);
        const step = Math.PI / 4;
        const dir = Math.round(theta / step) * step;

        const nx = (x + Math.round(Math.cos(dir)) + numColumns) % numColumns;
        const ny = (y + Math.round(Math.sin(dir)) + numRows) % numRows;
        const key = `${ny},${nx}`;
        if (frozen.has(key)) continue;

        const target = positionMap[key];
        if (target) moveChar(target, ch.position);
        moveChar(ch, { x: nx, y: ny });
      }
    }

    function animateGrid(t) {
      if (t > state.nextFrameTime) {
        evolveChars();
        state.chars.forEach(updateCharElementPosition);
        state.nextFrameTime = t + config.intervalMs;
        state.frame++;
      }

      const done =
        state.frame >= config.maxFrame &&
        state.chars.every(ch =>
          Math.abs(ch.position.x - ch.finalPosition.x) <= 1 &&
          Math.abs(ch.position.y - ch.finalPosition.y) <= 1
        );

      if (done) {
        state.chars.forEach(ch => {
          ch.position = { ...ch.finalPosition };
        });
        state.chars.forEach(updateCharElementPosition);
        return;
      }

      requestAnimationFrame(animateGrid);
    }

    function renderStatic() {
      container.classList.add('hidden');
      container.innerHTML = '';
      generateChars();
      settleCharsImmediately();
      mountChars();
      state.frame = config.maxFrame;
      state.nextFrameTime = 0;
      requestAnimationFrame(() => container.classList.remove('hidden'));
    }

    function vortiFy() {
      container.classList.add('hidden');
      container.innerHTML = '';
      generateChars();
      mountChars();
      state.frame = 0;
      state.nextFrameTime = 0;
      requestAnimationFrame(() => {
        container.classList.remove('hidden');
        requestAnimationFrame(animateGrid);
      });
    }

    function firstLoadBehavior() {
      const alreadyPlayed = localStorage.getItem(VORTI_KEY) === "true";
      if (alreadyPlayed) {
        renderStatic();
      } else {
        vortiFy();
        localStorage.setItem(VORTI_KEY, "true");
      }
    }

    return {
      renderStatic,
      vortiFy,
      firstLoadBehavior
    };
  }

  window.SiteVortify = {
    createVortifyApp
  };
})();
