// Gidi Hustle — original illustrations, drawn in code as SVG.
// placeArt(id, hour)  → a picture of home or a place, lit for the time of day.
// vehicleArt(mode)    → the side view of a ride (or the Sim on foot) for the
//                       travel cutscene, facing right.
// No image files: every shape here is written by hand for this game.

let seq = 0;
const uid = (p) => `${p}${++seq}`;

/** Sky colours for the hour: night, dawn/dusk or day. */
export function skyFor(hour) {
  if (hour < 5.5 || hour >= 20) return { top: '#0e1836', bottom: '#2b3c70', night: true, sun: null };
  if (hour < 7.5) return { top: '#f29a6b', bottom: '#fde3c3', night: false, sun: '#ffd27a' };
  if (hour >= 17.5) return { top: '#6a5aa8', bottom: '#f6b38a', night: false, sun: '#ffb46b' };
  return { top: '#6fb7ea', bottom: '#d6efff', night: false, sun: '#fff1b0' };
}

function sky(sk, w = 320, h = 140, sunX = 262, sunY = 30) {
  const g = uid('sky');
  const stars = sk.night
    ? Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 47) % w}" cy="${8 + ((i * 29) % 46)}" r="${i % 3 ? 0.8 : 1.3}" fill="#fff" opacity="${0.5 + (i % 4) * 0.12}"/>`).join('')
    : '';
  const orb = sk.night
    ? `<circle cx="${sunX}" cy="${sunY}" r="11" fill="#f4f1de"/><circle cx="${sunX + 5}" cy="${sunY - 3}" r="10" fill="${sk.top}"/>`
    : `<circle cx="${sunX}" cy="${sunY}" r="13" fill="${sk.sun}" opacity="0.95"/>`;
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk.top}"/><stop offset="1" stop-color="${sk.bottom}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#${g})"/>${stars}${orb}`;
}

const ground = (y, c1, c2 = c1, w = 320, h = 140) => `<rect y="${y}" width="${w}" height="${h - y}" fill="${c1}"/><rect y="${y}" width="${w}" height="3" fill="${c2}"/>`;

function person(x, y, shirt = '#2ecc71', s = 1, skin = '#7b4a2d') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-3" y="-8" width="2.6" height="9" fill="#34495e"/><rect x="0.4" y="-8" width="2.6" height="9" fill="#34495e"/>
    <rect x="-4" y="-19" width="8" height="12" rx="2" fill="${shirt}"/>
    <circle cx="0" cy="-23" r="3.6" fill="${skin}"/><path d="M-3.7 -24 a3.7 3.7 0 0 1 7.4 0z" fill="#1e1e1e"/></g>`;
}

const plasticChair = (x, y, c = '#e74c3c') => `<g fill="${c}"><rect x="${x}" y="${y - 10}" width="9" height="2"/><rect x="${x + 7}" y="${y - 19}" width="2" height="11"/><rect x="${x}" y="${y - 8}" width="1.6" height="8"/><rect x="${x + 7.4}" y="${y - 8}" width="1.6" height="8"/></g>`;

function tree(x, y, s = 1, leaf = '#2f9e44') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2" y="-18" width="4" height="18" fill="#7a4b2a"/>
    <circle cx="0" cy="-26" r="13" fill="${leaf}"/><circle cx="-9" cy="-20" r="8" fill="${leaf}"/><circle cx="9" cy="-21" r="9" fill="${leaf}"/></g>`;
}

function palm(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke-linecap="round">
    <path d="M0 0 C 2 -18, 4 -30, 8 -44" stroke="#8b5a2b" stroke-width="4"/>
    <g stroke="#2b9348" stroke-width="3.5"><path d="M8 -44 C 0 -50, -12 -48, -18 -40"/><path d="M8 -44 C 16 -52, 28 -50, 32 -42"/>
    <path d="M8 -44 C 4 -56, -4 -60, -10 -60"/><path d="M8 -44 C 14 -58, 24 -60, 28 -56"/></g></g>`;
}

const windowGlow = (night) => (night ? '#ffd27a' : '#bfe3ff');

// ------------------------------------------------------------------ places

/** A fast-food shop front: sign, glass, a menu board and a queue. Original drawing. */
function fastFood(sk, { sign, wall, band, accent }) {
  return `${sky(sk)}${ground(108, '#a7a19a', '#8e8881')}
    <rect x="56" y="40" width="208" height="70" fill="${wall}"/>
    <rect x="56" y="40" width="208" height="20" fill="${band}"/>
    <text x="160" y="55" font-size="12" font-weight="800" fill="#fff" text-anchor="middle" font-family="Sora,system-ui,sans-serif">${sign}</text>
    <rect x="70" y="66" width="70" height="44" fill="${windowGlow(sk.night)}" opacity="0.9"/>
    <rect x="70" y="66" width="70" height="3" fill="${accent}"/>
    <rect x="150" y="66" width="30" height="44" fill="#2d3436"/><rect x="152" y="68" width="26" height="40" fill="#bfe3ff" opacity="0.7"/>
    <rect x="190" y="66" width="62" height="28" rx="2" fill="#2d3436"/>
    ${[0, 1, 2].map((i) => `<rect x="196" y="${71 + i * 7}" width="34" height="3" fill="${accent}"/><rect x="236" y="${71 + i * 7}" width="10" height="3" fill="#fff"/>`).join('')}
    <circle cx="96" cy="88" r="7" fill="${accent}"/><rect x="108" y="84" width="16" height="10" rx="2" fill="#f39c12"/>
    <path d="M56 60 L44 72 L56 72z M264 60 L276 72 L264 72z" fill="${band}"/>
    ${person(200, 110, '#2ecc71')}${person(216, 110, '#e84393')}${person(232, 110, '#2980b9')}${person(110, 110, accent)}`;
}

const PLACE_ART = {
  home: (sk) => `${sky(sk)}${ground(108, '#8fae5a', '#7a9a4a')}
    ${tree(36, 110, 0.9)}
    <rect x="96" y="58" width="130" height="52" fill="#efe4d0"/><rect x="96" y="58" width="130" height="5" fill="#d8c9ad"/>
    <polygon points="88,60 161,30 234,60" fill="#b5523b"/>
    <rect x="196" y="22" width="18" height="16" rx="2" fill="#222"/><rect x="194" y="36" width="22" height="4" fill="#555"/>
    <rect x="112" y="72" width="26" height="18" fill="${windowGlow(sk.night)}"/>${[0, 1, 2, 3].map((i) => `<rect x="112" y="${73 + i * 4.4}" width="26" height="1.4" fill="#93a4b1"/>`).join('')}
    <rect x="186" y="72" width="26" height="18" fill="${windowGlow(sk.night)}"/>${[0, 1, 2, 3].map((i) => `<rect x="186" y="${73 + i * 4.4}" width="26" height="1.4" fill="#93a4b1"/>`).join('')}
    <rect x="152" y="78" width="18" height="32" fill="#6d4c41"/><circle cx="166" cy="95" r="1.4" fill="#f1c40f"/>
    <rect x="240" y="96" width="14" height="14" fill="#f1c40f"/><rect x="243" y="99" width="8" height="5" fill="#2d3436"/>
    ${person(146, 110)}`,

  buka: (sk) => `${sky(sk)}${ground(108, '#c9a06a', '#b58b55')}
    <rect x="60" y="56" width="200" height="54" fill="#d9c7a3"/>
    <polygon points="48,58 160,40 272,58 272,62 48,62" fill="#9aa5ae"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${52 + i * 28}" y="${48 - (i < 4 ? i * 2.2 : (7 - i) * 2.2)}" width="1.5" height="14" fill="#7f8c8d"/>`).join('')}
    <rect x="96" y="64" width="128" height="16" rx="2" fill="#c0392b"/>
    <text x="160" y="76" font-size="10" font-weight="800" fill="#fff" text-anchor="middle" font-family="Sora,system-ui,sans-serif">MAMA RONKE BUKA</text>
    <rect x="76" y="84" width="60" height="26" fill="#6d4c41"/><rect x="76" y="82" width="60" height="4" fill="#8d6e63"/>
    <ellipse cx="94" cy="80" rx="10" ry="4" fill="#555"/><rect x="84" y="74" width="20" height="7" fill="#636e72"/>
    <path d="M90 72 q3 -6 0 -12 M97 72 q3 -6 0 -12" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.7"/>
    <rect x="186" y="86" width="2" height="24" fill="#555"/><path d="M168 88 Q187 72 206 88z" fill="#27ae60"/>
    ${plasticChair(152, 110)}${plasticChair(166, 110, '#2980b9')}${plasticChair(212, 110)}
    <rect x="232" y="96" width="16" height="14" fill="#f39c12"/><rect x="232" y="96" width="16" height="3" fill="#d35400"/>
    ${person(124, 110, '#8e44ad')}${person(196, 110)}`,

  market: (sk) => {
    const stall = (x, c1, c2) => `<g transform="translate(${x} 0)">
      <path d="M0 70 Q24 50 48 70z" fill="${c1}"/><path d="M12 70 Q24 54 36 70z" fill="${c2}"/><rect x="23" y="66" width="2" height="30" fill="#555"/>
      <rect x="2" y="92" width="44" height="5" fill="#8d6e63"/><rect x="5" y="97" width="3" height="13" fill="#6d4c41"/><rect x="40" y="97" width="3" height="13" fill="#6d4c41"/>
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${8 + i * 8}" cy="89" r="3.6" fill="${['#e74c3c', '#27ae60', '#f39c12', '#e74c3c', '#c0392b'][i]}"/>`).join('')}</g>`;
    return `${sky(sk)}${ground(108, '#b9a27d', '#a38c67')}
      <rect x="0" y="62" width="320" height="10" fill="#cdbb98" opacity="0.6"/>
      ${stall(18, '#e67e22', '#f1c40f')}${stall(86, '#2980b9', '#ecf0f1')}${stall(154, '#c0392b', '#f1c40f')}${stall(222, '#16a085', '#ecf0f1')}
      ${person(78, 110, '#d35400')}${person(146, 112, '#2c3e50')}${person(214, 110, '#e84393')}${person(284, 112, '#2ecc71')}
      <ellipse cx="300" cy="102" rx="10" ry="4" fill="#d35400"/><rect x="291" y="92" width="18" height="10" fill="#e67e22"/>`;
  },

  mamaput: (sk) => fastFood(sk, { sign: 'MAMA PUT EXPRESS', wall: '#f5e6c8', band: '#27ae60', accent: '#f1c40f' }),
  jollof: (sk) => fastFood(sk, { sign: 'JOLLOF JUNCTION', wall: '#fdebd0', band: '#e74c3c', accent: '#f39c12' }),
  bigbite: (sk) => fastFood(sk, { sign: 'BIG BITE BURGERS', wall: '#fef9e7', band: '#2c3e50', accent: '#e67e22' }),
  crunchy: (sk) => fastFood(sk, { sign: 'CRUNCHY CHICKEN', wall: '#fdedec', band: '#c0392b', accent: '#f1c40f' }),

  hub: (sk) => `${sky(sk)}${ground(108, '#9aa5ae', '#7f8c8d')}
    ${tree(40, 110, 1)}${tree(286, 110, 0.85)}
    <rect x="92" y="22" width="136" height="88" fill="#34495e"/>
    ${Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, c) => `<rect x="${99 + c * 18}" y="${30 + r * 12}" width="14" height="8" fill="${sk.night ? ((r + c) % 3 ? '#ffd27a' : '#2c3e50') : '#8ec5ea'}" opacity="0.9"/>`).join('')).join('')}
    <rect x="118" y="94" width="84" height="16" fill="#2c3e50"/><rect x="146" y="96" width="28" height="14" fill="#5dade2" opacity="0.8"/>
    <rect x="106" y="8" width="108" height="16" rx="3" fill="#00b894"/>
    <text x="160" y="20" font-size="10" font-weight="800" fill="#fff" text-anchor="middle" font-family="Sora,system-ui,sans-serif">BRAINBOX HUB</text>
    ${person(86, 112, '#0984e3')}${person(236, 112, '#fdcb6e')}`,

  gym: (sk) => `${sky(sk)}${ground(108, '#8a8f94', '#6d7378')}
    <rect x="70" y="44" width="180" height="66" fill="#57606f"/><rect x="70" y="44" width="180" height="6" fill="#2f3542"/>
    <rect x="96" y="54" width="128" height="18" rx="2" fill="#ff6b35"/>
    <text x="160" y="67" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle" font-family="Sora,system-ui,sans-serif">IRON GATE GYM</text>
    <g transform="translate(160 86)"><rect x="-16" y="-1.5" width="32" height="3" fill="#dfe6e9"/><rect x="-20" y="-7" width="5" height="14" rx="1" fill="#dfe6e9"/><rect x="15" y="-7" width="5" height="14" rx="1" fill="#dfe6e9"/></g>
    <rect x="86" y="76" width="34" height="34" fill="${windowGlow(sk.night)}" opacity="0.85"/><rect x="200" y="76" width="34" height="34" fill="${windowGlow(sk.night)}" opacity="0.85"/>
    ${Array.from({ length: 13 }, (_, i) => `<rect x="${18 + i * 4}" y="78" width="1.6" height="32" fill="#2d3436"/>`).join('')}
    ${Array.from({ length: 13 }, (_, i) => `<rect x="${252 + i * 4}" y="78" width="1.6" height="32" fill="#2d3436"/>`).join('')}
    <rect x="16" y="76" width="54" height="3" fill="#2d3436"/><rect x="250" y="76" width="56" height="3" fill="#2d3436"/>
    ${person(140, 112, '#e17055', 1.05)}${person(182, 112, '#00cec9')}`,

  park: (sk) => `${sky(sk)}${ground(96, '#7fb35a', '#6ea04c')}
    <path d="M0 124 Q120 100 320 118 L320 140 L0 140z" fill="#d8c3a0"/>
    ${tree(36, 100, 1.2)}${tree(110, 96, 0.9, '#40a85a')}${tree(270, 100, 1.3, '#2b8a3e')}${tree(214, 94, 0.8)}
    <rect x="140" y="100" width="44" height="4" fill="#8d6e63"/><rect x="140" y="92" width="44" height="3" fill="#8d6e63"/>
    <rect x="143" y="104" width="3" height="8" fill="#5d4037"/><rect x="178" y="104" width="3" height="8" fill="#5d4037"/>
    <rect x="198" y="102" width="26" height="3" fill="#8d6e63"/><rect x="209" y="105" width="4" height="9" fill="#5d4037"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${201 + i * 5.5}" y="99" width="5" height="3" fill="${i % 2 ? '#2d3436' : '#f5f6fa'}"/>`).join('')}
    ${person(194, 116, '#636e72', 0.9, '#5a3825')}${person(230, 116, '#b2bec3', 0.9, '#6b4423')}${person(80, 122, '#e84393', 0.95)}`,

  beach: (sk) => {
    const g = uid('sea');
    return `${sky(sk, 320, 140, 230, 40)}
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk.night ? '#1d3557' : '#1e90c8'}"/><stop offset="1" stop-color="${sk.night ? '#14213d' : '#5ec4e8'}"/></linearGradient></defs>
      <rect y="70" width="320" height="34" fill="url(#${g})"/>
      ${[0, 1, 2].map((i) => `<path d="M${-20 + i * 30} ${80 + i * 8} q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="1.4" fill="none" opacity="0.6"/>`).join('')}
      <path d="M0 100 Q160 92 320 104 L320 140 L0 140z" fill="#f1d9a7"/>
      ${palm(40, 128, 1.1)}${palm(286, 130, 0.95)}
      <rect x="196" y="96" width="2" height="30" fill="#555"/><path d="M174 100 Q197 82 220 100z" fill="#e84393"/><path d="M186 100 Q197 88 208 100z" fill="#fff"/>
      <g transform="translate(118 120)"><rect x="-14" y="-12" width="28" height="9" rx="4" fill="#8d5524"/><rect x="10" y="-22" width="6" height="12" rx="2" fill="#8d5524"/>
      <rect x="-12" y="-4" width="2.5" height="10" fill="#6d3f1a"/><rect x="-5" y="-4" width="2.5" height="10" fill="#6d3f1a"/><rect x="4" y="-4" width="2.5" height="10" fill="#6d3f1a"/><rect x="10" y="-4" width="2.5" height="10" fill="#6d3f1a"/></g>
      ${person(150, 124, '#fdcb6e')}${person(232, 126, '#0984e3')}`;
  },

  club: (sk) => {
    const s = { ...sk, top: '#0b0b1f', bottom: '#2d1b4e', night: true };
    const g = uid('neon');
    return `${sky(s)}${ground(108, '#2d2d3a', '#1e1e28')}
      <defs><filter id="${g}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
      <polygon points="120,110 60,0 92,0" fill="#ff4fd8" opacity="0.14"/><polygon points="200,110 260,0 228,0" fill="#4fd1ff" opacity="0.14"/>
      <rect x="70" y="40" width="180" height="70" fill="#1c1c2e"/><rect x="70" y="40" width="180" height="5" fill="#ff4fd8"/>
      <text x="160" y="72" font-size="20" font-weight="800" fill="#ff4fd8" text-anchor="middle" filter="url(#${g})" font-family="Sora,system-ui,sans-serif">THE PULSE</text>
      <text x="160" y="72" font-size="20" font-weight="800" fill="#ffe6fa" text-anchor="middle" font-family="Sora,system-ui,sans-serif">THE PULSE</text>
      <rect x="148" y="82" width="24" height="28" fill="#4fd1ff" opacity="0.5"/>
      <rect x="120" y="100" width="2" height="10" fill="#d4af37"/><rect x="198" y="100" width="2" height="10" fill="#d4af37"/><path d="M121 102 Q160 108 199 102" stroke="#c0392b" stroke-width="2" fill="none"/>
      ${person(210, 112, '#8e44ad')}${person(222, 112, '#e84393')}${person(234, 112, '#00cec9')}${person(246, 112, '#fdcb6e')}${person(136, 112, '#111', 1.15)}`;
  },

  // ----- story places (original drawings) -----
  family: (sk) => `${sky(sk)}${ground(104, '#a3b86c', '#8fa65a')}
    ${tree(262, 106, 1.4, '#3d8b37')}
    <circle cx="250" cy="72" r="2.5" fill="#f39c12"/><circle cx="266" cy="66" r="2.5" fill="#f39c12"/><circle cx="276" cy="78" r="2.5" fill="#f39c12"/>
    <rect x="58" y="56" width="150" height="50" fill="#f3e2c7"/><polygon points="50,58 133,22 216,58" fill="#9c4a2f"/>
    <rect x="120" y="76" width="26" height="30" fill="#6d4c41"/><circle cx="141" cy="92" r="1.6" fill="#f1c40f"/>
    <rect x="72" y="70" width="30" height="20" fill="${windowGlow(sk.night)}"/><rect x="164" y="70" width="30" height="20" fill="${windowGlow(sk.night)}"/>
    <rect x="72" y="79" width="30" height="2" fill="#6d4c41"/><rect x="164" y="79" width="30" height="2" fill="#6d4c41"/>
    <rect x="30" y="112" width="70" height="4" fill="#8d6e63"/><rect x="34" y="116" width="3" height="10" fill="#5d4037"/><rect x="93" y="116" width="3" height="10" fill="#5d4037"/>
    ${plasticChair(26, 126, '#2980b9')}${plasticChair(104, 126, '#e74c3c')}
    ${person(60, 124, '#8e44ad', 0.95)}${person(78, 124, '#16a085', 0.85)}${person(226, 122, '#d35400')}`,

  campus: (sk) => `${sky(sk)}${ground(106, '#86b25c', '#76a04e')}
    <path d="M0 126 L320 118 L320 140 L0 140z" fill="#c8b48e"/>
    <rect x="70" y="40" width="180" height="68" fill="#e8dcc4"/><polygon points="62,42 160,14 258,42" fill="#7f8c8d"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${86 + i * 28}" y="46" width="8" height="62" fill="#fdfaf2"/>`).join('')}
    <rect x="70" y="40" width="180" height="6" fill="#bdae92"/>
    <rect x="136" y="84" width="48" height="24" fill="#5d4037"/>
    <rect x="112" y="26" width="96" height="12" rx="2" fill="#1a5276"/>
    <text x="160" y="35" font-size="8.5" font-weight="800" fill="#fff" text-anchor="middle" font-family="Sora,system-ui,sans-serif">LAGOON UNIVERSITY</text>
    ${tree(30, 110, 1.1)}${tree(292, 112, 1)}
    ${person(104, 124, '#2e86de')}${person(118, 126, '#f6b93b', 0.9)}${person(214, 124, '#e55039')}`,

  hospital: (sk) => `${sky(sk)}${ground(108, '#a4abb2', '#8a9198')}
    <rect x="60" y="30" width="200" height="80" fill="#f4f6f7"/><rect x="60" y="30" width="200" height="8" fill="#16a085"/>
    ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 8 }, (_, c) => (c === 3 || c === 4) && r === 3 ? '' : `<rect x="${70 + c * 23}" y="${44 + r * 15}" width="14" height="9" fill="${sk.night ? ((r * 3 + c) % 4 ? '#ffe9a8' : '#34495e') : '#aed6f1'}"/>`).join('')).join('')}
    <rect x="136" y="88" width="48" height="22" fill="#5dade2" opacity="0.85"/><rect x="159" y="88" width="2" height="22" fill="#ecf0f1"/>
    <rect x="148" y="10" width="24" height="24" rx="3" fill="#e74c3c"/><rect x="157" y="14" width="6" height="16" fill="#fff"/><rect x="152" y="19" width="16" height="6" fill="#fff"/>
    <text x="160" y="84" font-size="7" font-weight="800" fill="#16a085" text-anchor="middle" font-family="Sora,system-ui,sans-serif">MAINLAND GENERAL</text>
    <g transform="translate(250 116)"><rect x="-26" y="-14" width="40" height="14" rx="2" fill="#fff"/><rect x="-26" y="-14" width="40" height="3" fill="#e74c3c"/><rect x="8" y="-11" width="10" height="11" rx="1" fill="#fff"/><circle cx="-16" cy="1" r="3.4" fill="#2d3436"/><circle cx="8" cy="1" r="3.4" fill="#2d3436"/><rect x="-10" y="-10" width="8" height="2.5" fill="#e74c3c"/><rect x="-7" y="-13" width="2.5" height="8" fill="#e74c3c"/></g>
    ${person(110, 122, '#ecf0f1')}${person(206, 122, '#2980b9', 0.95)}`,

  tower: (sk) => `${sky(sk)}${ground(110, '#9aa1a8', '#7f868d')}
    <rect x="30" y="56" width="50" height="54" fill="#5d6d7e"/><rect x="246" y="48" width="56" height="62" fill="#566573"/>
    <rect x="112" y="6" width="96" height="104" fill="#2e4053"/>
    ${Array.from({ length: 11 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<rect x="${118 + c * 15}" y="${12 + r * 8.5}" width="11" height="5.5" fill="${sk.night ? ((r + c * 2) % 3 ? '#ffd27a' : '#1b2631') : '#85c1e9'}" opacity="0.92"/>`).join('')).join('')}
    ${Array.from({ length: 5 }, (_, r) => `<rect x="36" y="${62 + r * 9}" width="38" height="4" fill="${windowGlow(sk.night)}" opacity="0.8"/>`).join('')}
    ${Array.from({ length: 6 }, (_, r) => `<rect x="252" y="${54 + r * 9}" width="44" height="4" fill="${windowGlow(sk.night)}" opacity="0.8"/>`).join('')}
    <rect x="140" y="98" width="40" height="12" fill="#1b2631"/><rect x="146" y="100" width="28" height="10" fill="#5dade2" opacity="0.7"/>
    <text x="160" y="96" font-size="6.5" font-weight="800" fill="#f8c471" text-anchor="middle" font-family="Sora,system-ui,sans-serif">MARINA POINT</text>
    ${palm(96, 124, 0.8)}${palm(228, 124, 0.8)}
    ${person(130, 124, '#1f2d3d')}${person(194, 124, '#7d3c98', 0.95)}`,

  chambers: (sk) => `${sky(sk)}${ground(108, '#b0a999', '#958e7f')}
    <rect x="72" y="40" width="176" height="70" fill="#f2ead8"/><rect x="72" y="40" width="176" height="7" fill="#7b5e3b"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${86 + i * 44}" y="56" width="22" height="30" fill="${windowGlow(sk.night)}"/><rect x="${86 + i * 44}" y="70" width="22" height="2" fill="#7b5e3b"/>`).join('')}
    <rect x="144" y="90" width="32" height="20" fill="#4e342e"/>
    <rect x="100" y="24" width="120" height="14" rx="2" fill="#1c2833"/>
    <text x="160" y="34" font-size="8" font-weight="800" fill="#f5cba7" text-anchor="middle" font-family="Georgia,serif">NWOSU &amp; PARTNERS</text>
    <g transform="translate(160 18)" stroke="#d4ac0d" stroke-width="1.6" fill="none"><path d="M-12 0 H12 M0 -6 V8 M-12 0 l-4 8 h8z M12 0 l-4 8 h8z"/></g>
    ${person(120, 124, '#1c2833')}${person(206, 124, '#922b21', 0.95)}${tree(34, 112, 0.9)}${tree(290, 112, 0.95)}`,

  court: (sk) => `${sky(sk)}${ground(110, '#c2bba9', '#a69f8d')}
    <rect x="48" y="96" width="224" height="6" fill="#d5ccb5"/><rect x="40" y="102" width="240" height="8" fill="#cbc2aa"/>
    <rect x="64" y="46" width="192" height="50" fill="#efe8d6"/><polygon points="56,48 160,16 264,48" fill="#e4dcc6"/><polygon points="72,46 160,22 248,46" fill="#d8cfb6"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${74 + i * 27}" y="50" width="9" height="46" fill="#fbf8f0"/><rect x="${72 + i * 27}" y="48" width="13" height="3" fill="#cfc6ad"/>`).join('')}
    <circle cx="160" cy="36" r="6" fill="#d4ac0d"/>
    <text x="160" y="58" font-size="6" font-weight="800" fill="#7b6a43" text-anchor="middle" font-family="Georgia,serif">STATE HIGH COURT</text>
    ${person(110, 124, '#212f3d')}${person(124, 124, '#212f3d', 0.95)}${person(214, 124, '#a04000')}`,

  residences: (sk) => {
    const g = uid('pool');
    return `${sky(sk)}${ground(104, '#d9d3c7', '#c4bdaf')}
      <rect x="168" y="8" width="96" height="98" fill="#f7f9f9"/>
      ${Array.from({ length: 9 }, (_, r) => `<rect x="168" y="${14 + r * 10}" width="96" height="2" fill="#aab7b8"/><rect x="174" y="${16 + r * 10}" width="84" height="6" fill="${sk.night ? (r % 2 ? '#ffd27a' : '#f8c471') : '#a9cce3'}" opacity="0.85"/>`).join('')}
      <rect x="60" y="54" width="92" height="52" fill="#ecf0f1"/>
      ${Array.from({ length: 4 }, (_, r) => `<rect x="66" y="${60 + r * 11}" width="80" height="6" fill="${windowGlow(sk.night)}" opacity="0.85"/>`).join('')}
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#48c9b0"/><stop offset="1" stop-color="#5dade2"/></linearGradient></defs>
      <rect x="40" y="114" width="150" height="14" rx="6" fill="url(#${g})"/>
      ${palm(22, 128, 0.9)}${palm(296, 128, 1)}
      <text x="216" y="104" font-size="6.5" font-weight="800" fill="#7f8c8d" text-anchor="middle" font-family="Sora,system-ui,sans-serif">OCEAN CREST</text>
      ${person(212, 126, '#f1948a')}${person(238, 126, '#2874a6', 0.95)}`;
  },

  studio: (sk) => {
    const s = { ...sk, top: sk.night ? '#120d24' : sk.top, bottom: sk.night ? '#2a1e4a' : sk.bottom };
    return `${sky(s)}${ground(108, '#5b5d6b', '#454756')}
      <rect x="66" y="40" width="188" height="70" fill="#22222e"/><rect x="66" y="40" width="188" height="5" fill="#f39c12"/>
      <text x="160" y="64" font-size="13" font-weight="800" fill="#f39c12" text-anchor="middle" font-family="Sora,system-ui,sans-serif">AFROWAVE</text>
      <text x="160" y="74" font-size="6" font-weight="700" fill="#f8c471" text-anchor="middle" letter-spacing="2" font-family="Sora,system-ui,sans-serif">STUDIOS</text>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${86 + i * 6}" y="${88 - (i * 7) % 11}" width="3" height="${4 + (i * 7) % 11}" fill="#e74c3c"/>`).join('')}
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${180 + i * 6}" y="${88 - (i * 5) % 9}" width="3" height="${4 + (i * 5) % 9}" fill="#3498db"/>`).join('')}
      <rect x="146" y="84" width="28" height="26" fill="#6c3483" opacity="0.8"/>
      <g transform="translate(270 112)"><rect x="-1" y="-40" width="2" height="40" fill="#bdc3c7"/><circle cx="0" cy="-44" r="7" fill="none" stroke="#fdebd0" stroke-width="2.5"/></g>
      ${person(120, 124, '#e74c3c')}${person(206, 124, '#f1c40f', 1.05)}`;
  },

  pavilion: (sk) => `${sky(sk)}${ground(108, '#b8a98f', '#9e8f76')}
    <rect x="50" y="52" width="220" height="58" fill="#fdf2e9"/><path d="M42 54 Q160 4 278 54z" fill="#c0392b"/><path d="M60 54 Q160 16 260 54z" fill="#e74c3c"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${58 + i * 28}" y="56" width="6" height="54" fill="#f5cba7"/>`).join('')}
    <rect x="132" y="80" width="56" height="30" fill="${sk.night ? '#ffd27a' : '#fad7a0'}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<circle cx="${64 + i * 21}" cy="${60 + (i % 2) * 3}" r="2.2" fill="${['#f1c40f', '#e67e22', '#9b59b6', '#1abc9c'][i % 4]}"/>`).join('')}
    <text x="160" y="76" font-size="7" font-weight="800" fill="#922b21" text-anchor="middle" font-family="Sora,system-ui,sans-serif">ROYAL PAVILION</text>
    ${person(104, 124, '#d4ac0d')}${person(116, 124, '#d4ac0d', 0.92)}${person(212, 124, '#8e44ad')}${person(226, 124, '#8e44ad', 0.92)}`,
};

/** A picture of home or a place as an SVG string. */
export function placeArt(id, hour = 12, cls = 'art') {
  const draw = PLACE_ART[id] ?? PLACE_ART.home;
  return `<svg class="${cls}" viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${draw(skyFor(hour))}</svg>`;
}

export const ART_IDS = Object.keys(PLACE_ART);

// ---------------------------------------------------------------- vehicles

const wheel = (x, y, r = 7) => `<g transform="translate(${x} ${y})"><g class="wheel"><circle r="${r}" fill="#1e1e1e"/><circle r="${r * 0.45}" fill="#b2bec3"/><rect x="-0.8" y="${-r * 0.45}" width="1.6" height="${r * 0.9}" fill="#636e72"/></g></g>`;


/** A passenger seen through a window: head and shoulders only. */
const rider = (x, y, shirt, skin = '#7b4a2d') => `<rect x="${x - 3.2}" y="${y}" width="6.4" height="4" rx="1.5" fill="${shirt}"/><circle cx="${x}" cy="${y - 2.6}" r="2.7" fill="${skin}"/><path d="M${x - 2.8} ${y - 3} a2.8 2.8 0 0 1 5.6 0z" fill="#1e1e1e"/>`;

/** Someone sitting astride a bike, facing right. */
function seated(x, y, shirt, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-2" y="-2" width="9" height="3.2" rx="1.4" fill="#34495e"/><rect x="5" y="-1" width="3" height="9" rx="1.2" fill="#34495e"/>
    <rect x="-4" y="-15" width="7.5" height="13" rx="2.5" fill="${shirt}"/><rect x="2" y="-13" width="9" height="2.6" rx="1.2" fill="${shirt}"/>
    <circle cx="0" cy="-19" r="3.8" fill="#7b4a2d"/><path d="M-3.8 -20 a3.8 3.8 0 0 1 7.6 0z" fill="#1e1e1e"/></g>`;
}

const VEHICLES = {
  danfo: `<g>
    <rect x="-46" y="-34" width="92" height="30" rx="6" fill="#f7c600"/>
    <rect x="-46" y="-16" width="92" height="3" fill="#111"/><rect x="-46" y="-10" width="92" height="3" fill="#111"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${-40 + i * 18}" y="-30" width="14" height="10" rx="1.5" fill="#bfe3ff"/>`).join('')}
    <path d="M34 -30 L44 -30 L46 -18 L34 -18z" fill="#bfe3ff"/>
    ${rider(-33, -23.5, '#e74c3c')}${rider(-15, -23.5, '#2ecc71')}${rider(3, -23.5, '#8e44ad')}${rider(39, -22, '#f39c12')}
    <rect x="-50" y="-6" width="8" height="4" fill="#555"/><rect x="42" y="-6" width="8" height="4" fill="#555"/>
    ${wheel(-28, -2)}${wheel(28, -2)}</g>`,
  keke: `<g>
    <path d="M-30 -36 L18 -36 L26 -22 L26 -6 L-30 -6z" fill="#27ae60"/>
    <path d="M-34 -40 L22 -40 L22 -36 L-34 -36z" fill="#1e8449"/>
    <rect x="-24" y="-31" width="20" height="14" fill="#bfe3ff" opacity="0.6"/>
    ${rider(-17, -22, '#2ecc71')}${rider(-9, -22, '#e84393')}${rider(23, -24, '#f39c12')}
    <rect x="18" y="-30" width="10" height="10" fill="#bfe3ff"/>
    ${wheel(-22, -2, 6)}${wheel(24, -2, 6)}</g>`,
  okada: `<g>
    <path d="M-22 -12 L8 -12 L18 -20 L26 -20 L22 -10 L-10 -6z" fill="#c0392b"/>
    <rect x="-8" y="-18" width="16" height="6" rx="3" fill="#2d3436"/>
    <path d="M18 -20 L22 -30" stroke="#636e72" stroke-width="2.5"/>
    ${seated(-12, -18, '#2ecc71', 0.9)}${seated(2, -18, '#f39c12', 0.9)}
    ${wheel(-18, -2, 7)}${wheel(22, -2, 7)}</g>`,
  cab: `<g>
    <path d="M-42 -16 L-34 -30 L20 -30 L32 -16 L44 -14 L44 -4 L-44 -4 L-44 -14z" fill="#f4f6f7"/>
    <path d="M-30 -27 L-6 -27 L-6 -17 L-36 -17z" fill="#bfe3ff"/><path d="M-2 -27 L18 -27 L27 -17 L-2 -17z" fill="#bfe3ff"/>
    <rect x="-10" y="-36" width="16" height="6" rx="1.5" fill="#f1c40f"/><text x="-2" y="-31.4" font-size="4.6" font-weight="800" text-anchor="middle" fill="#111" font-family="Sora,system-ui,sans-serif">TAXI</text>
    <rect x="-44" y="-12" width="88" height="2.5" fill="#27ae60"/>
    ${rider(-18, -20, '#f39c12')}${rider(10, -20, '#2ecc71')}
    ${wheel(-26, -2)}${wheel(28, -2)}</g>`,
  walk: `<g class="walker" transform="scale(0.8)">
    <g class="leg-a"><rect x="-3" y="-16" width="5" height="16" rx="2" fill="#34495e"/></g>
    <g class="leg-b"><rect x="-1" y="-16" width="5" height="16" rx="2" fill="#2c3e50"/></g>
    <rect x="-7" y="-38" width="15" height="23" rx="4" fill="#2ecc71"/>
    <circle cx="1" cy="-45" r="7" fill="#7b4a2d"/><path d="M-6 -46 a7 7 0 0 1 14 0z" fill="#1e1e1e"/></g>`,
};

/** The ride for a transport mode, as SVG markup (no <svg> wrapper). */
export function vehicleArt(mode) {
  return VEHICLES[mode] ?? VEHICLES.walk;
}

/** The moving city for the cutscene: two copies side by side so it can loop. */
export function skylineStrip(night, width = 400) {
  const block = (x, i) => {
    const h = 30 + ((i * 37) % 48);
    const w = 22 + ((i * 13) % 20);
    const c = ['#c8b7a6', '#e0c9a6', '#a9b8c9', '#d9a77f', '#b9c7a5', '#e6d3c0'][i % 6];
    const wins = Array.from({ length: Math.floor(h / 12) }, (_, r) => `<rect x="${x + 4}" y="${150 - h + 6 + r * 12}" width="${w - 8}" height="4" fill="${night ? (r % 2 ? '#ffd27a' : '#3b4a6b') : '#8fb8d8'}" opacity="0.8"/>`).join('');
    return `<rect x="${x}" y="${150 - h}" width="${w}" height="${h}" fill="${night ? '#2e3a5c' : c}"/>${wins}<rect x="${x + w / 2 - 4}" y="${150 - h - 6}" width="8" height="6" fill="#222"/>`;
  };
  let x = 0;
  let out = '';
  for (let i = 0; x < width; i++) {
    out += block(x, i);
    x += 24 + ((i * 13) % 20);
  }
  return `<g>${out}</g><g transform="translate(${width} 0)">${out}</g>`;
}

export function roadsideStrip(width = 400) {
  let out = '';
  for (let x = 10; x < width; x += 80) {
    out += `<rect x="${x}" y="118" width="3" height="40" fill="#5d4e3c"/><path d="M${x - 8} 122 L${x + 11} 122" stroke="#5d4e3c" stroke-width="2"/>`;
    out += `<path d="M${x + 1} 122 Q${x + 41} 132 ${x + 81} 122" stroke="#333" stroke-width="0.8" fill="none"/>`;
    if ((x / 80) % 2 === 0) out += `<rect x="${x + 30}" y="130" width="30" height="14" rx="1.5" fill="#e74c3c"/><rect x="${x + 44}" y="144" width="2" height="14" fill="#555"/>`;
    else out += palm(x + 46, 164, 0.55);
  }
  return `<g>${out}</g><g transform="translate(${width} 0)">${out}</g>`;
}
