const suits = [['Clubs', '♣'], ['Diamonds', '♦'], ['Hearts', '♥'], ['Spades', '♠']];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const rankNames = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };

export function drawCards(deck, count, replacement, random = Math.random) {
  return Array.from({ length: count }, () => {
    const index = Math.floor(random() * deck.length);
    return replacement ? deck[index] : deck.splice(index, 1)[0];
  });
}

export function renderCardGenerator(container) {
  const deck = suits.flatMap(([suit, symbol]) => ranks.map(rank => ({
    rank, symbol, name: (rankNames[rank] || rank) + ' of ' + suit,
    red: suit === 'Hearts' || suit === 'Diamonds'
  })));
  deck.push({ rank: '★', symbol: '★', name: 'Black Joker' },
            { rank: '★', symbol: '★', name: 'Red Joker', red: true });

  container.innerHTML = `
    <h2 id="card-generator-title">Random card generator</h2>
    <form class="card-controls">
      <label>Cards to draw <input name="count" type="number" min="1" max="54" value="1" required></label>
      <label>Draw mode <select name="mode"><option value="without">Without replacement</option><option value="with">With replacement</option></select></label>
      <button type="submit">Draw cards</button>
      <button type="button" data-reset>Reset deck</button>
    </form>
    <details><summary>Customize deck</summary>
      <fieldset class="card-options"><legend>Cards to include</legend>
        ${deck.map((card, index) => '<label><input type="checkbox" value="' + index + '"' +
          (index < 52 ? ' checked' : '') + '> ' + (index < 52 ? card.rank + card.symbol : card.name) +
          '<span class="card-sr-only">' + (index < 52 ? ' ' + card.name : '') + '</span></label>').join('')}
      </fieldset>
    </details>
    <p role="status"></p>
    <ol class="drawn-cards" aria-label="Drawn cards"></ol>`;

  const form = container.querySelector('form');
  const mode = form.elements.mode;
  const count = form.elements.count;
  const status = container.querySelector('[role="status"]');
  const results = container.querySelector('.drawn-cards');
  const options = container.querySelector('fieldset');
  let remaining;

  function reset() {
    remaining = [...options.querySelectorAll('input:checked')].map(input => deck[Number(input.value)]);
    results.replaceChildren();
    status.textContent = remaining.length + ' cards in the deck.';
  }

  function display(card) {
    const item = document.createElement('li');
    if (card.red) item.classList.add('card-red');
    const face = document.createElement('span');
    face.className = 'card-face';
    face.setAttribute('aria-hidden', 'true');
    face.textContent = card.rank + ' ' + card.symbol;
    item.append(face, card.name);
    return item;
  }

  container.querySelector('[data-reset]').addEventListener('click', reset);
  mode.addEventListener('change', reset);
  options.addEventListener('change', reset);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const quantity = count.valueAsNumber;
    const replacement = mode.value === 'with';
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 54) return;
    if (!remaining.length || (!replacement && quantity > remaining.length)) {
      status.textContent = remaining.length
        ? 'Only ' + remaining.length + ' cards remain. Draw fewer or reset the deck.'
        : 'The deck is empty. Reset it or add cards under Customize deck.';
      return;
    }
    const hand = drawCards(remaining, quantity, replacement);
    results.replaceChildren(...hand.map(display));
    status.textContent = 'Drew ' + hand.map(card => card.name).join(', ') + '. ' + remaining.length + ' cards remain.';
  });
  reset();
}
