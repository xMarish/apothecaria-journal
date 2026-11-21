const groups = { entries: 'Journal Entries', characters: 'Characters', familiars: 'Familiars', places: 'Places', potions: 'Potions & Reagents' };
const page = typeof document !== 'undefined' && document.querySelector('#page');
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
const wiki = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const plain = value => value.replace(wiki, (_, target, label) => label || target).trim();
const key = name => name.trim().toLowerCase();
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

function formatTrackingFields(line) {
  const item = line.match(/\[item::\s*(\[\[[^\n]+?\]\]|[^\]]+)\]\s*\[qty:{1,2}\s*([+-]?\d+(?:\.\d+)?)\s*\]/i);
  if (!item) return line;
  const [, name, quantity] = item;
  const rest = line.slice(item.index + item[0].length).trim();
  return line.slice(0, item.index) + name.trim() + ' × ' + quantity + (rest ? ' — ' + rest : '');
}

const potionArtwork = new Map([
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

function cards(items, showArtwork = false, showPortraits = false) {
  const showPortraitSlots = showPortraits && items.some(note => colourPortraits.has(note.name) || portraitPath(note));
  return '<ul class="cards">' + items.map(note => '<li><a href="' + route(note) + '">' + (showArtwork ? renderPotionArtwork(note) : '') + (showPortraitSlots ? renderPortrait(note, true) || '<span class="portrait-thumbnail" aria-hidden="true"></span>' : '') + escape(note.name) + '</a></li>').join('') + '</ul>';
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
    page.innerHTML = '<article><a href="#' + group + '">' + groups[group] + '</a><h1>' + escape(note.name) + '</h1>' + renderPotionArtwork(note) + (group === 'characters' || group === 'familiars' || group === 'places' ? renderPortrait(note) : '') + renderNote(note.text, note.group)
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
  } else if (group === 'potions') {
    const recipes = all.filter(item => item.group === 'potions').sort((a,b) => a.name.localeCompare(b.name));
    page.innerHTML = '<h1>Potions &amp; Reagents</h1>' + cards(recipes, true);
  } else if (Object.hasOwn(groups, group)) {
    const items = group === 'entries' ? entries : all.filter(item => item.group === group).sort((a,b) => a.name.localeCompare(b.name));
    page.innerHTML = '<h1>' + groups[group] + '</h1>' + cards(items, false, group === 'characters' || group === 'familiars' || group === 'places');
  } else {
    page.innerHTML = '<h1>Mirabel Hollow’s<br>Apothecary Journal</h1><p>Follow Mirabel and her familiars through the village, from foraging trips to the patients at her cottage door.</p><h2>Latest journal entries</h2>' + cards(entries.slice(0,4)) + '<p><a href="#entries">Browse all journal entries</a></p>';
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
    const response = await fetch('./' + path.slice(1).split('/').map(encodeURIComponent).join('/'));
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
