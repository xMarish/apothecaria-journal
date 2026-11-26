const groups = { entries: 'Journal Entries', characters: 'Characters', familiars: 'Familiars', places: 'Places', potions: 'Potions & Reagents' };
const page = typeof document !== 'undefined' && document.querySelector('#page');
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
const wiki = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const plain = value => value.replace(wiki, (_, target, label) => label || target).trim();
const key = name => {
  const normalized = name.trim().toLowerCase();
  return normalized === 'shadow the wild cat - owned familiar' ? 'shadow the wild cat' : normalized;
};
const route = note => '#' + note.group + '/' + encodeURIComponent(note.name);
const notes = new Map();
const entryOrder = note => {
  const match = note.name.match(/^Y(\d+)\s+(Spring|Summer|Autumn|Fall|Winter)\s+Week\s+(\d+)$/i);
  return match ? +match[1] * 10000 + ({spring:1, summer:2, autumn:3, fall:3, winter:4})[key(match[2])] * 100 + +match[3] : 0;
};

const reagentImages = new Map();
const reagentKey = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');

function loadReagentImages() {
  const paths = JSON.parse(document.querySelector('#reagent-images').textContent);
  for (const path of paths) {
    const filename = path.split('/').at(-1);
    const name = filename.replace(/^Reagent - [^-]+ - /i, '')
      .replace(/\.[^.]+$/, '').replace(/^Angient Bubble$/i, 'Ancient Bubble');
    reagentImages.set(reagentKey(name), path);
  }
}

function reagentThumbnail(name) {
  const path = reagentImages.get(reagentKey(name));
  if (!path) return '';
  const src = '.' + path.split('/').map(encodeURIComponent).join('/');
  return '<img class="reagent-thumbnail" src="' + src + '" alt="" loading="lazy" decoding="async"> ';
}

function renderIngredients(line) {
  const heading = '**Ingredients:**';
  const ingredients = line.slice(heading.length).trim().split(/,\s*/);
  return '<strong>Ingredients:</strong> ' + ingredients.map(ingredient => {
    const name = ingredient.replace(/^(?:and\s+)?optional\s+/i, '').replace(/\s*×\s*\d+\s*$/, '');
    return '<span class="recipe-ingredient">' + reagentThumbnail(name) + inline(ingredient) + '</span>';
  }).join(', ');
}

function inline(text, illustrate = false) {
  let result = '', end = 0;
  for (const match of text.matchAll(/(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
    result += emphasis(text.slice(end, match.index));
    const note = notes.get(key(match[2]));
    const label = escape(match[3] || match[2]);
    if (!match[1]) {
      if (illustrate) result += reagentThumbnail(match[2]);
      result += note ? '<a href="' + route(note) + '">' + label + '</a>' : label;
    }
    end = match.index + match[0].length;
  }
  return result + emphasis(text.slice(end));
}

function emphasis(text) {
  return escape(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function formatPatientRecord(line) {
  const fields = /\[(npc|ailment|outcome)::[ \t]*(\[\[[^\r\n]+?\]\]|\[[^\]\r\n]+\]\([^\r\n)]+\)|[^\]\r\n]+)\]/gi;
  const matches = [...line.matchAll(fields)];
  if (!matches.some(match => match[1].toLowerCase() === 'npc')) return line;

  let end = matches[0].index;
  if (!/^(?:[-*]\s+)?$/.test(line.slice(0, end))) return line;
  const values = [];
  for (const match of matches) {
    if (line.slice(end, match.index).trim()) return line;
    end = match.index + match[0].length;
    let value = match[2].trim();
    if (match[1].toLowerCase() === 'npc') {
      const markdownLink = value.match(/^\[([^\]]+)\]\([^)]+\)$/);
      if (markdownLink) value = markdownLink[1];
      if (!value.startsWith('[[')) value = '[[' + value + ']]';
    }
    values.push(value);
  }
  return line.slice(0, matches[0].index) + values.join(' · ') + line.slice(end);
}

function formatTrackingFields(line) {
  line = formatPatientRecord(line);
  const item = line.match(/\[item::\s*(\[\[[^\n]+?\]\]|[^\]]+)\]\s*\[qty:{1,2}\s*([+-]?\d+(?:\.\d+)?)\s*\]/i);
  if (!item) return line;
  const [, name, quantity] = item;
  const rest = line.slice(item.index + item[0].length).trim();
  return line.slice(0, item.index) + name.trim() + ' × ' + quantity + (rest ? ' — ' + rest : '');
}

const potionArtwork = new Map([
  ['Roseveil Remedy', 'roseveil'],
  ['Guppy Spark Draught', 'guppy'],
  ['Moonbaker’s Balm', 'moonbaker'],
  ['Starlight Snuffer', 'starlight'],
  ["Apnea Ointment", 'set-1 potion-art--top-left'],
  ["Braveheart Milk", 'set-1 potion-art--top-right'],
  ["Catnap Cordial", 'set-1 potion-art--bottom-left'],
  ["Crow’s Morning Tonic", 'set-1 potion-art--bottom-right'],
  ["Floodwater Pick-Me-Up", 'set-2 potion-art--top-left'],
  ["Frostwash Tonic", 'set-2 potion-art--top-right'],
  ["Grounded Glaze", 'set-2 potion-art--bottom-left'],
  ["Princess’s Songberry Syrup", 'set-2 potion-art--bottom-right'],
  ["Rose & Tide Elixir", 'set-3 potion-art--top-left'],
  ["Rust Coffee", 'set-3 potion-art--top-right'],
  ["Silverleaf Bristle Wash", 'set-3 potion-art--bottom-left'],
  ["Silvermend Salve", 'set-3 potion-art--bottom-right'],
  ["Songberry Dream Tea", 'set-4 potion-art--top-left'],
  ["Stillbreeze Cordial", 'set-4 potion-art--top-right'],
]);

function renderPotionArtwork(note) {
  const artwork = note.group === 'potions' && potionArtwork.get(note.name);
  return artwork ? '<div class="potion-art potion-art--' + artwork +
    '" role="img" aria-label="Illustration of ' + escape(note.name) + '"></div>' : '';
}

const portraits = new Map();
const portraitKey = name => name.normalize('NFKC').toLowerCase().replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}]/gu, '');

function loadPortraits() {
  const paths = JSON.parse(document.querySelector('#portrait-images').textContent);
  for (const path of paths) portraits.set(portraitKey(path.split('/').at(-1)), path);
}

function portraitPath(note) {
  const named = portraits.get(portraitKey(note.name));
  if (named) return named;
  const embed = note.text.match(/!\[\[([^|\]\r\n]+\.(?:png|jpe?g|webp|gif|avif))(?:\|[^\]]*)?\]\]/i);
  return embed ? portraits.get(portraitKey(embed[1].split('/').at(-1))) : undefined;
}

const colourPortraits = new Map([
  ["Albart Underwood", 'portrait-set-1 portrait-cell-0'],
  ["Aloinur Balow", 'portrait-set-1 portrait-cell-1'],
  ["Aurelius the Argent", 'portrait-set-1 portrait-cell-2'],
  ["Ballia Gamgee", 'portrait-set-1 portrait-cell-3'],
  ["Clatch Grimwart", 'portrait-set-2 portrait-cell-0'],
  ["Dachsbun", 'portrait-set-2 portrait-cell-1'],
  ["Elowen Vance", 'portrait-set-2 portrait-cell-2'],
  ["Erli Woodard", 'portrait-set-2 portrait-cell-3'],
  ["Falke of the Road", 'portrait-set-3 portrait-cell-0'],
  ["Felux Dawncrest", 'portrait-set-3 portrait-cell-1'],
  ["Iluver Bassett", 'portrait-set-3 portrait-cell-2'],
  ["Malakor the Blightgargoyle", 'portrait-set-3 portrait-cell-3'],
  ["Nereon the Naiad", 'portrait-set-4 portrait-cell-0'],
  ["Olax Mintz", 'portrait-set-4 portrait-cell-1'],
  ["Stone Golem", 'portrait-set-4 portrait-cell-2'],
  ["Tamsin Rushmore", 'portrait-set-4 portrait-cell-3'],
  ["Bumble The Bee-Chinchilla", 'portrait-set-5 portrait-cell-0'],
  ["Ribs the Frog Familiar", 'portrait-set-5 portrait-cell-1'],
  ["Sophie the Night Gryphon", 'portrait-set-5 portrait-cell-2'],
  ["Spider the Spider", 'portrait-set-5 portrait-cell-3'],
  ["Vesper the Raven Familiar", 'portrait-set-5 portrait-cell-4'],
]);

function renderPortrait(note, thumbnail = false) {
  const artwork = colourPortraits.get(note.name);
  if (artwork) {
    const label = thumbnail ? 'aria-hidden="true"' : 'role="img" aria-label="Portrait of ' + escape(note.name) + '"';
    return '<div class="colour-portrait ' + (thumbnail ? 'portrait-thumbnail' : 'profile-portrait') +
      '"><div class="portrait-cell ' + artwork + '" ' + label + '></div></div>';
  }
  const path = portraitPath(note);
  if (!path) return '';
  const src = '.' + path.split('/').map(encodeURIComponent).join('/');
  return '<img class="' + (thumbnail ? 'portrait-thumbnail' : 'profile-portrait') +
    '" src="' + src + '" alt="' + (thumbnail ? '' : (note.group === 'places' ? 'Illustration of ' : 'Portrait of ') + escape(note.name)) + '" loading="lazy" decoding="async">';
}

function renderNote(text, group) {
  const lines = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').replace(/```dataview[\s\S]*?```/g, '').split(/\r?\n/);
  let html = '', list = false, table = false;
  for (let line of lines) {
    line = formatTrackingFields(line.replace(/^>\s?/, '').trim());
    const bullet = /^[-*]\s+/.test(line);
    const row = line.startsWith('|');
    if (list && !bullet) { html += '</ul>'; list = false; }
    if (table && !row) { html += '</tbody></table>'; table = false; }
    if (!line || /^\[!|^!\[\[|^#+ (Visits|Cures)$/.test(line)) continue;
    if (row) {
      if (/^\|[\s|:-]+$/.test(line)) continue;
      if (!table) { html += '<table><tbody>'; table = true; }
      html += '<tr>' + line.replace(/^\||\|$/g, '').split('|').map(cell => '<td>' + inline(cell.trim()) + '</td>').join('') + '</tr>';
    } else if (bullet) {
      if (!list) { html += '<ul>'; list = true; }
      html += '<li>' + inline(line.slice(2), group === 'entries') + '</li>';
    } else if (/^#+ /.test(line)) {
      const level = Math.min(6, Math.max(2, line.indexOf(' ')));
      html += '<h' + level + '>' + inline(line.slice(line.indexOf(' ') + 1)) + '</h' + level + '>';
    } else {
      const body = group === 'potions' && line.startsWith('**Ingredients:**')
        ? renderIngredients(line)
        : inline(line, group === 'entries');
      html += '<p>' + body + '</p>';
    }
  }
  return html + (list ? '</ul>' : '') + (table ? '</tbody></table>' : '');
}

export function extractVisits(text) {
  const starts = [...text.matchAll(/^(?:Patient|Name):[ \t]*([^\n]+)\n[ \t]*Ailment:[ \t]*([^\n]+)/gim)];
  return starts.map((start, index) => {
    const section = text.slice(start.index + start[0].length, starts[index + 1]?.index ?? text.length);
    const potion = section.match(/^#{2,6}\s+Potion[ \t]*\r?\n([\s\S]*?)(?=^#{1,6}\s|(?![\s\S]))/im)?.[1] || '';
    const recipe = plain(potion.trim().split(/\r?\n/)[0]?.trim() || '');
    const ingredients = [...potion.matchAll(/\[item::\s*\[\[([^\]]+)\]\]\]/gi)].map(match => plain(match[1]));
    const outcome = potion.match(/\[outcome::\s*([^\]]+)\]/i)?.[1].trim();
    const remark = section.match(/^.*(?:unable to make the treatment|passes out for the night).*$/im)?.[0].trim();
    return { name: plain(start[1]), ailment: plain(start[2]), recipe: /^[\w]/.test(recipe) ? recipe : '', ingredients, outcome, remark };
  });
}

const springArtwork = [
  "Mirabel meets Morrow at the Calling Ritual",
  "Mirabel rides Morrow out of Weaver’s Wood",
  "A star-scaled dragon offers Mirabel a Moonstone",
  "Mirabel examines the injured stone golem",
  "Mirabel discovers a silver compass in a dungeon",
  "A mountain giant offers Mirabel shelter from the rain",
  "Mirabel hides from the angry Glimmerwood Golem",
  "Mirabel finds an elf seated on a golden throne",
  "A siren offers Mirabel a Fossil Fish",
  "Mirabel spots a reagent among the rocks at Meltwater Loch",
  "Mirabel distracts carnivorous plants with a glowing wand",
  "A deer with amethyst antlers flees a woodland clearing",
];

function renderJournalArtwork(note, thumbnail = false) {
  if (note.group !== 'entries') return '';
  const match = /^Y1 Spring Week ([0-9]{2})$/.exec(note.name);
  const index = match ? Number(match[1]) - 1 : -1;
  if (!springArtwork[index]) return '';
  const sheet = Math.floor(index / 4) + 1;
  const panel = index % 4;
  const horseScene = index < 2 ? ' journal-art--morrow journal-art--morrow-' + index : '';
  const label = thumbnail ? 'aria-hidden="true"' : 'role="img" aria-label="' + escape(springArtwork[index]) + '"';
  return '<div class="journal-art journal-art--sheet-' + sheet + ' journal-art--panel-' + panel + horseScene + '" ' + label + '></div>';
}

function cards(items, showArtwork = false, showPortraits = false) {
  const showPortraitSlots = showPortraits && items.some(note => colourPortraits.has(note.name) || portraitPath(note));
  return '<ul class="cards">' + items.map(note => '<li><a href="' + route(note) + '">' + (showArtwork ? renderPotionArtwork(note) : '') + renderJournalArtwork(note, true) + (showPortraitSlots ? renderPortrait(note, true) || '<span class="portrait-thumbnail" aria-hidden="true"></span>' : '') + escape(note.name) + '</a></li>').join('') + '</ul>';
}

function renderPlaces(items) {
  const villages = new Map();
  for (const note of items) {
    const villageField = note.text.match(/^\*\*Village:\*\*[ \t]*([^\r\n]+)/m);
    const village = villageField ? plain(villageField[1]) : 'Rannoc Village';
    const locations = villages.get(village) || [];
    locations.push(note);
    villages.set(village, locations);
  }
  return [...villages].sort(([a], [b]) => a.localeCompare(b)).map(([village, locations]) =>
    '<section><h2>' + escape(village) + '</h2>' + cards(locations, false, true) + '</section>'
  ).join('');
}

function renderTools() {
  page.innerHTML = '<h1>Tools</h1><p><a href="./ailment-generator.html">Open the ailment generator on its own page</a></p>' +
    '<iframe title="Apothecaria Ailment Generator" src="./ailment-generator.html" sandbox="allow-scripts" style="width:100%;height:78vh;min-height:35rem;border:1px solid #ded5bf;border-radius:.45rem"></iframe>';
}

function render() {
  const [group, encoded] = location.hash.slice(1).split('/');
  const requestedName = encoded ? decodeURIComponent(encoded) : '';
  const name = group === 'places' && requestedName === 'Mirabel’s Cottage'
    ? 'The Open Eye Apothecary'
    : requestedName;
  const note = notes.get(key(name));
  const all = [...notes.values()];
  const entries = all.filter(item => item.group === 'entries').sort((a,b) => entryOrder(b) - entryOrder(a) || b.name.localeCompare(a.name));
  if (note && note.group === group) {
    const visits = entries.flatMap(entry => entry.visits.filter(visit => key(visit.name) === key(note.name)).map(visit => ({...visit, entry})));
    const mentions = entries.filter(entry => entry.links.has(key(note.name)));
    page.innerHTML = '<article><a href="#' + group + '">' + groups[group] + '</a><h1>' + escape(note.name) + '</h1>' + renderPotionArtwork(note) + renderJournalArtwork(note) + (group === 'characters' || group === 'familiars' || group === 'places' ? renderPortrait(note) : '') + renderNote(note.text, note.group)
      + (visits.length ? '<h2>Patient visits</h2>' + visits.map(visit => {
        const treatment = [visit.recipe, visit.ingredients.join(', ')].filter(Boolean).join(' — ');
        return '<section class="visit"><h3><a href="' + route(visit.entry) + '">' + escape(visit.entry.name) +
          '</a></h3><p><strong>Ailment</strong> ' + escape(visit.ailment) + '</p>' +
          (treatment ? '<p><strong>Treatment</strong> ' + inline(visit.recipe ? treatment.replace(visit.recipe, '[[' + visit.recipe + ']]') : treatment) + '</p>' : '') +
          (visit.outcome ? '<p><strong>Outcome</strong> ' + escape(visit.outcome) + '</p>' : '') +
          (visit.remark ? '<p>' + inline(visit.remark) + '</p>' : '') + '</section>';
      }).join('') : '') + (mentions.length ? '<h2>Journal appearances</h2>' + cards(mentions) : '') + '</article>';
  } else if (name) {
    page.innerHTML = '<h1>Page unavailable</h1><a href="#">Return to the journal</a>';
  } else if (group === 'tools') {
    renderTools();
  } else if (group === 'potions') {
    const recipes = all.filter(item => item.group === 'potions').sort((a,b) => a.name.localeCompare(b.name));
    page.innerHTML = '<h1>Potions &amp; Reagents</h1>' + cards(recipes, true);
  } else if (Object.hasOwn(groups, group)) {
    const items = group === 'entries' ? entries : all.filter(item => item.group === group).sort((a,b) => a.name.localeCompare(b.name));
    page.innerHTML = '<h1>' + groups[group] + '</h1>' + (group === 'places' ? renderPlaces(items) : cards(items, false, group === 'characters' || group === 'familiars'));
  } else {
    page.innerHTML = '<h1>Mirabel Hollow’s<br>Apothecary Journal</h1><p>Follow Mirabel and her familiars through the village, from foraging trips to the patients at her cottage door.</p><section aria-labelledby="about-apothecaria"><h2 id="about-apothecaria">About Apothecaria</h2><p><em>Apothecaria</em>, by Anna Blackwell, is a solo journalling role-playing game about life as a village witch. You forage for ingredients, brew remedies for villagers, adventurers, and monsters, and write down what happens along the way. This journal follows my own playthrough as Mirabel Hollow.</p><p><a href="https://blackwellwriter.itch.io/apothecaria">Buy Apothecaria from BlackwellWriter on itch.io</a></p></section><section aria-labelledby="artwork-disclosure"><h2 id="artwork-disclosure">AI artwork disclosure</h2><p>This fan journal uses AI-generated and AI-assisted illustrations, including portraits, potion artwork, and scenes from the journal. The illustrations were created for this site and are separate from the artwork in the published game.</p></section><section class="latest-journal" aria-labelledby="latest-journal-heading"><h2 id="latest-journal-heading">Latest journal entries</h2>' + cards(entries.slice(0, 12)) + '<p><a href="#entries">Browse all journal entries</a></p></section>';
  }
}

async function load() {
  loadReagentImages();
  loadPortraits();
  const files = JSON.parse(document.querySelector('#files').textContent).filter(path => /^\/data\/(entries|characters|familiars|places|potions)\//.test(path));
  if (!files.length) throw new Error('Journal files are missing.');
  await Promise.all(files.map(async path => {
    const [, , group, filename] = path.split('/');
    const name = filename.replace(/\.md$/, '');
    const noteUrl = './' + path.slice(1).split('/').map(encodeURIComponent).join('/');
    const response = await fetch(noteUrl + new URL(import.meta.url).search);
    if (!response.ok) throw new Error('Could not read ' + name);
    const text = await response.text();
    const visits = group === 'entries' ? extractVisits(text) : [];
    const links = new Set([...text.matchAll(wiki)].map(match => key(match[1])));
    notes.set(key(name), { name, group, text, visits, links });
  }));
  for (const note of notes.values()) {
    for (const visit of note.visits) {
      if (!notes.has(key(visit.name))) notes.set(key(visit.name), {name: visit.name, group:'characters', text:'', visits:[], links:new Set()});
    }
  }
  render();
  addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
}

if (page) load().catch(error => { page.textContent = error.message; });
