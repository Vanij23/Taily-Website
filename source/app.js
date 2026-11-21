/* =====================================================================
   TAILY DEMO v4 · APP
   Month loop: scenarios → summary → savings track → eligibility → Bazaar (closed/open)
   → market month → outcome explained → book idea → next month.
   ===================================================================== */

/* ---------- State (kept on this phone) ---------- */
const KEY = 'taily-demo-v4';
let S, splashHas = false;
function fresh(){ return { screen:'splash', life:'college', name:'', goal:null, goalPick:1, setAside:true, needsPlan:LIVES.college.needs, hist:[],
  month:1, save:0, carry:0, happy:START_HAPPY, payLater:[], track:[], port:null, books:[], m:null, mk:null, snap:null, bill:0, book:null, goalSet:false }; }
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || null; }catch(e){ return null; } }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
try{ localStorage.removeItem(KEY); }catch(e){}
S = fresh();   // every visit starts a new game from the loading screen
const L = () => LIVES[S.life], D = () => DECKS[S.life];
const goalOf = () => S.goal || L().goals[L().pick];
const target = () => Math.round(goalOf().amount / 12);
const rs = n => (n < 0 ? '−' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cap = s => s[0].toUpperCase() + s.slice(1);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const pct = v => Math.round(v * 100) + '%';
const JARNAME = { needs:'Needs', wants:'Wants', save:'Save', happy:'Happiness' };

/* ---------- Bills, plan, eligibility ---------- */
function bills(){
  const b = L().fixed.slice();
  (S.payLater || []).forEach(p => b.push([`Pay later: ${p.label}`, p.each, 'rupee', 'Last month follows you.', p.count > 1 ? `${p.count} payments left, including this one.` : 'The last payment.']));
  return b;
}
const billsTotal = () => bills().reduce((a, f) => a + f[1], 0);
const incomeAll = () => L().income + S.carry;
const toPlan = () => Math.max(0, incomeAll() - billsTotal());
function billLeft(i){ return incomeAll() - bills().slice(0, i + 1).reduce((a, f) => a + f[1], 0); }
const unlockAt = () => target();                       // savings must not be running low: at least one month’s target in Save
const cushion = () => Math.ceil(S.save * BZ.keepShare / 50) * 50;   // part of Save always stays put
const plCount = () => (S.payLater || []).reduce((a, p) => a + p.count, 0);
const lastTrack = () => S.track[S.track.length - 1];
function elig(){
  const lt = lastTrack();
  const c = { habit:!!(lt && lt.added >= target()), cushion:S.save >= unlockAt(), added:lt ? lt.added : 0 };
  c.open = c.habit && c.cushion; c.available = Math.max(0, S.save - cushion()); return c;
}
const streak = () => { let n = 0; for (let i = S.track.length - 1; i >= 0 && S.track[i].hit; i--) n++; return n; };
const portTotal = () => S.port ? S.port.h.steady + S.port.h.market + S.port.h.hot : 0;

/* ---------- Month engine ---------- */
function startMonth(){
  const plan = toPlan(), sv = S.setAside ? Math.min(target(), plan) : 0, rest = plan - sv, needs = clamp(S.needsPlan, 0, rest);
  const deck = D().slots.map(week => week.map(pool => pool[Math.floor(Math.random() * pool.length)]));
  const happy = S.month === 1 ? START_HAPPY : Math.min(100, S.happy + 10);   // a small lift when money arrives
  let paidLater = 0;
  (S.payLater || []).forEach(p => { paidLater += p.each; p.count--; }); S.payLater = (S.payLater || []).filter(p => p.count > 0);
  S.m = { deck, prevSave:S.save, jars:{ needs, wants:rest - needs, save:S.save + sv }, start:{ needs, wants:rest - needs }, setAside:sv, happy, week:0, step:0, queue:[], later:[],
    spent:{ needs:0, wants:0, lost:0 }, needsSpill:0, wantsSpill:0, wantsLog:[], skippedNeeds:0, skippedFriends:0, plNew:null, wish:false, extraIncome:0, done:false,
    saveHist:[S.save + sv], lastLine:'', paidLater, scamCard:null };
}
const added = () => S.m.jars.save - S.m.prevSave;
function pay(kind, amount){
  const j = S.m.jars, order = kind === 'need' ? ['needs','wants','save'] : kind === 'scam' ? ['save','wants','needs'] : ['wants','save'];
  const total = order.reduce((a, k) => a + j[k], 0);
  if (amount > total) return { broke:true, short:amount - total };
  let left = amount; const from = {};
  for (const k of order){ const take = Math.min(j[k], left); if (take > 0){ j[k] -= take; from[k] = take; left -= take; } }
  if (kind === 'need') S.m.needsSpill += (from.wants || 0) + (from.save || 0);
  if (kind === 'want') S.m.wantsSpill += from.save || 0;
  S.m.spent[kind === 'need' ? 'needs' : kind === 'scam' ? 'lost' : 'wants'] += amount;
  return { from };
}
function currentCardId(){ const m = S.m; if (!m) return null; if (m.queue.length) return m.queue[0]; const w = m.deck[m.week]; return w ? w[m.step] : null; }
function applyChoice(cardId, idx){
  const card = D()[cardId], c = card.choices[idx], m = S.m, res = { deltas:[], line:c.line };
  if (c.income){
    m.extraIncome += c.income.amount;
    if (c.income.split){ const h = c.income.amount / 2; m.jars.save += h; m.jars.wants += h; res.deltas.push(['gain', '+' + rs(h) + ' Save'], ['gain', '+' + rs(h) + ' Wants']); }
    else { m.jars[c.income.to] += c.income.amount; if (!c.cost) res.deltas.push(['gain', '+' + rs(c.income.amount) + ' ' + cap(c.income.to)]); }
  }
  if (c.move){ const a = Math.min(c.move.amount, m.jars[c.move.from]); m.jars[c.move.from] -= a; m.jars[c.move.to] += a; res.deltas.push(['gain', rs(a) + ' moved to Save']); }
  const cost = c.payLater ? c.payLater.now : (c.cost || 0);
  if (cost){
    const p = pay(c.kind, cost);
    if (p.broke){ res.broke = p.short; res.need = cost; res.label = c.t; return res; }
    res.from = p.from; Object.entries(p.from).forEach(([k, v]) => res.deltas.push(['loss', '−' + rs(v) + ' ' + cap(k)]));
    if (c.kind === 'scam') m.scamCard = cardId;
  }
  if (c.kind === 'want' && card.jar !== 'save' && (cost || c.payLater)) m.wantsLog.push(wantVerdict(card, c, cost, res));
  if (c.payLater){ const cnt = c.payLater.count - (c.payLater.now ? 1 : 0); m.plNew = { each:c.payLater.each, count:cnt, label:card.short || c.t }; res.deltas.push(['loss', cnt + ' × ' + rs(c.payLater.each) + ' next month']); }
  if (c.happy){ m.happy = clamp(m.happy + c.happy, 0, 100); res.deltas.push([c.happy > 0 ? 'gain' : 'loss', (c.happy > 0 ? '+' : '−') + Math.abs(c.happy) + ' Happiness']); }
  if (c.skipNeed) m.skippedNeeds++;
  if (c.skipFriends) m.skippedFriends++;
  if (c.wish) m.wish = true;
  if (c.later) m.later.push(c.later);
  if (m.queue.length) m.queue.shift(); else m.step++;
  const weekEnded = !m.queue.length && m.step >= 2;
  if (!weekEnded && m.week >= m.deck.length && !m.queue.length) m.done = true;
  res.weekEnded = weekEnded; m.saveHist.push(m.jars.save);
  if (m.happy <= BURNOUT) res.burnout = true;
  return res;
}
// Taily judges each want: pay-later, eating into Save, a much cheaper option with nearly the same fun, or one impulse buy eating most of Wants = regret
function wantVerdict(card, c, cost, res){
  const amount = c.payLater ? c.payLater.each * c.payLater.count : cost, h = c.happy || 0, fromSave = (res.from && res.from.save) || 0, m = S.m;
  const alt = card.choices.filter(o => o !== c && !o.payLater && o.kind !== 'scam' && (o.cost || 0) <= amount * .6 && (o.happy || 0) >= h - 3 && (o.happy || 0) > 0).sort((a, b) => (a.cost || 0) - (b.cost || 0))[0];
  let ok = true, why;
  if (c.payLater){ ok = false; why = `You’re still paying for it: ${c.payLater.count} × ${rs(c.payLater.each)}. Fun now, smaller months later.`; }
  else if (fromSave){ ok = false; why = `Wants had run out, so ${rs(fromSave)} of it came out of your savings.`; }
  else if (alt){ ok = false; why = `“${alt.t}” would have been almost as much fun for ${rs(alt.cost || 0)}.`; }
  else if (card.jar === 'wants' && amount >= m.start.wants * .4){ ok = false; why = `One buy took ${Math.round(amount / Math.max(m.start.wants, 1) * 100)}% of your Wants for the month.`; }
  else why = h >= 10 ? `+${h} Happiness, and it stayed inside your Wants budget. Money well spent.` : `It stayed inside your Wants budget and kept the month fun.`;
  return { label:card.short || c.t, amount, ok, why };
}
function endWeek(){
  const m = S.m; m.week++; m.step = 0; m.happy = clamp(m.happy - WEEK_STRESS, 0, 100);
  if (m.later.length){ m.queue = m.later.slice(); m.later = []; }
  if (m.week >= m.deck.length && !m.queue.length) m.done = true;
}
function status(){
  const m = S.m, saveOK = added() >= target(), happyOK = m.happy >= ON_TRACK_HAPPY, noPL = !m.plNew && !plCount();
  const met = [saveOK, happyOK, noPL].filter(Boolean).length;
  return { saveOK, happyOK, noPL, onTrack: met === 3, stars: met === 3 ? 3 : met === 2 ? 2 : 1 };
}
function endMonth(){   // month-end: write the savings track and carry things over
  const m = S.m, a = added();
  S.save = m.jars.save; S.carry = m.jars.needs + m.jars.wants; S.happy = m.happy;
  if (m.plNew && m.plNew.count > 0) S.payLater = (S.payLater || []).concat([{ ...m.plNew }]);
  S.track.push({ month:S.month, save:S.save, added:a, hit:a >= target() });
  S.mk = null; save();
}
function frown(){ const m = S.m; if (!m) return false; return m.happy < ON_TRACK_HAPPY || added() < target() || m.jars.wants <= 0; }
function hintFor(card){
  const m = S.m, j = m.jars;
  if (card.choices.some(c => c.kind === 'scam')) return '<b>Pause before you tap.</b> Real banks and real prizes never ask for a PIN, a fee or your details through a link.';
  if (m.happy < ON_TRACK_HAPPY) return card.jar === 'happy' || card.jar === 'wants' ? '<b>Happiness is low.</b> Only wants refill it. The cheaper fun option lifts your mood without wrecking the plan.'
    : '<b>Happiness is low.</b> Skipping things costs mood. Handle this cheaply, then treat yourself a little later.';
  if (added() < target()) return '<b>Save is under this month’s target.</b> Free or cheap choices protect it. Anything Wants can’t cover spills into Save.';
  if (j.wants <= 0) return '<b>Wants is empty.</b> Any spend now comes straight out of Save.';
  if (card.jar === 'needs' && j.needs < L().needs * .35) return '<b>Needs is nearly empty.</b> This will spill into Wants, then Save.';
  return null;
}

/* ---------- Market engine ---------- */
function act(h, a){
  const n = { ...h };
  if (a === 'tipIn'){ const x = n.steady * .2; n.steady -= x; n.hot += x; }
  if (a === 'tipOut'){ n.steady += n.hot; n.hot = 0; }
  if (a === 'sellMarket'){ n.steady += n.market; n.market = 0; }
  if (a === 'addMarket'){ const x = n.steady * .2; n.steady -= x; n.market += x; }
  if (a === 'allSteady'){ n.steady += n.market + n.hot; n.market = 0; n.hot = 0; }
  if (a === 'allMarket'){ n.market += n.steady; n.steady = 0; }
  if (a === 'halfOut'){ const x = n.market / 2; n.market -= x; n.steady += x; }
  if (a === 'quarterOut'){ const x = n.market / 4; n.market -= x; n.steady += x; }
  return n;
}
function move(h, ev, dice){
  return { steady:h.steady * (1 + BZ.steadyRate + (ev.after.steady || 0)), market:h.market * (1 + (ev.after.market || 0)), hot:h.hot * (h.hot > 0 ? BZ.dice[dice] : 1) };
}
const tot = h => h.steady + h.market + h.hot;
function startMarketMonth(){
  const p = S.port; let key;
  if (p.nextEv){ key = p.nextEv; p.nextEv = null; }
  else if (p.seq < BZ.sequence.length){ key = BZ.sequence[p.seq]; p.seq++; }
  else key = BZ.random[Math.floor(Math.random() * BZ.random.length)];
  const ev = BZ.events[key], start = { ...p.h };
  if (ev.drop) p.h.market *= 1 + ev.drop;
  S.mk = { key, start, dice:1 + Math.floor(Math.random() * 6), pick:null };
  save();
}
function resolveMarket(i){
  const mk = S.mk, ev = BZ.events[mk.key], o = ev.options[i], p = S.port;
  const acted = act(p.h, o.act), after = move(acted, ev, mk.dice);
  const startT = tot(mk.start);
  const delta = tot(after) - startT, T = Math.max(tot(acted), 1);
  const sh = { steady:acted.steady / T, market:acted.market / T, hot:acted.hot / T };
  const mv = { steady:after.steady - acted.steady, market:after.market - acted.market + mk.start.market * (ev.drop || 0), hot:after.hot - acted.hot };   // what each stall earned or lost; moves between stalls aren't gains
  let cause;
  if (delta < 0){
    if (o.q === 'panic') cause = 'panic';
    else if (mk.key === 'rebound' && sh.market < .1 && p.sold) cause = 'missed';
    else if (mv.hot < 0 && (sh.hot >= .2 || o.q === 'risky')) cause = 'risk';
    else if (sh.market >= .75 && (ev.drop || ev.after.market < 0)) cause = 'concentration';
    else if (mv.hot < 0 && mv.hot <= delta * .6) cause = 'smallbet';
    else cause = 'market';
  } else {
    if (mk.key === 'rebound' && sh.market < .1 && p.sold) cause = 'missed';
    else if (mv.hot > 0 && mv.hot >= delta * .6) cause = 'luck';
    else if (Math.max(sh.steady, sh.market, sh.hot) <= .7) cause = (mk.key === 'rebound' && o.act === 'none') ? 'patience' : 'spread';
    else if (mk.key === 'rebound' && o.act === 'none') cause = 'patience';
    else cause = 'market';
  }
  p.h = after; if (ev.next) p.nextEv = ev.next;
  p.sold = acted.market < 1 && (p.sold || (mk.start.market > 0 && ev.drop < 0));
  p.history.push({ month:S.month, key:mk.key, delta, value:tot(after) });
  Object.assign(mk, { pick:i, q:o.q, delta, d:mv, sh, cause, before:startT, after:tot(after), act:o.act });
  const tr = lastTrack(); if (tr) tr.bz = true;
  save();
}
const WHY = {
  panic:'You sold the Market stall right after it fell, so the drop became a real loss. Anyone who held was still invested for the bounce back.',
  risk:'Most of the loss came from the Hot tip, which was {hot} of your money. High-risk stalls swing the hardest.',
  concentration:'Almost everything sat in the Market stall, so the fall hit you fully. More in Steady would have cushioned it.',
  missed:'Prices bounced back this month, but your Market stall was already sold, so you missed the recovery.',
  smallbet:'The Hot tip rolled low and lost most of what was in it. Because it was only {hot} of your money, the damage stayed small.',
  market:'The whole market moved. That’s normal, and it isn’t something you caused.',
  luck:'Most of the gain came from the Hot tip’s dice roll. That’s luck, not a plan.',
  spread:'You spread your money across stalls, so the market lifted you without too much risk.',
  patience:'You held through the drop, so you were still invested when prices bounced back.',
};
const NEXT = {
  panic:'When prices fall, try doing nothing for a month first.', risk:'Keep the Hot tip small: 10% or less.', concentration:'Spread across stalls so one fall doesn’t hit everything.',
  market:'Stay patient. Ups and downs are part of investing.', missed:'Selling after a fall and missing the bounce is the most common investing mistake. Next time, hold.', smallbet:'Keeping risky bets small is exactly what protected you. Keep doing that.', luck:'Don’t count on the dice twice. Keep risky bets small.', spread:'Keep the spread. It’s doing its job.', patience:'Keep holding through the wobbles.',
};
function callLine(q, gain, cause){
  if (cause === 'smallbet' && q === 'sound') return 'Your plan was sound. The dice rolled low, and that part is out of anyone’s control.';
  if (q === 'panic') return 'Selling in a panic usually locks in the loss. That’s the part to change, not the market.';
  if (q === 'risky') return gain ? 'It worked this time, but it was a risky call. A gain doesn’t make it a good decision.' : 'A risky call, and this time it cost you. That’s what risk feels like. It’s part of learning.';
  if (q === 'cautious') return gain ? 'A careful move. You gave up a little growth for less risk.' : 'A careful move. Safer, though it can mean missing the recovery.';
  return gain ? 'A sound decision, and the market helped this month.' : 'Your decision was sound. The market just moved against you this month. That happens.';
}

/* ---------- Book idea: picked from how the player actually played ---------- */
function pickBook(){
  const m = S.m, life = S.life, sch = life === 'school', lt = lastTrack(), a = lt ? lt.added : 0, mk = S.mk, last = S.books[S.books.length - 1], C = [];
  const add = (key, why, link) => C.push({ key, why, link });
  if (m && m.spent.lost) add(m.scamCard === 'upi' || sch ? 'myfirst_pin' : 'babylon_guard', `Because a scam card cost you ${rs(m.spent.lost)} this month.`, 'The message looked real and asked you to pay or share details. That’s the pattern to spot.');
  if (mk && mk.cause === 'missed') add(sch ? 'rupee_share' : 'psych_patience', 'Because the market recovered after you sold.', 'You sold in the crash, so the bounce back passed you by.');
  if (mk && mk.cause === 'panic') add(sch ? 'rupee_share' : 'psych_patience', 'Because you sold right after the market fell.', `Your investments ended ${rs(Math.abs(mk.delta))} lower. Anyone who held kept their stall for the bounce back.`);
  if (mk && (mk.cause === 'risk' || mk.cause === 'concentration' || mk.cause === 'luck' || mk.q === 'risky'))
    add(sch ? 'piggy_spread' : 'psych_luck', mk.delta < 0 ? 'Because a risky part of your investments swung against you.' : 'Because a risky part of your investments paid off, and that can mislead.', `This month ${pct(mk.sh.hot)} of your money sat in the Hot tip and ${pct(mk.sh.market)} in Market.`);
  if (m && m.plNew) add(sch ? 'piggy_budget' : 'auto_debt', `Because you used pay later for ${m.plNew.label}.`, `${m.plNew.count} × ${rs(m.plNew.each)} will come out of next month before you can plan it.`);
  if (m && a < target()) {
    const why = `Because you saved ${rs(Math.max(0, a))} this month, ${rs(target() - a)} under your target.`, link = m.setAside ? 'You set money aside, but spending later spilled back into Save.' : 'You skipped the set-aside, so saving depended on what was left over.';
    (sch ? ['rupee_save', 'piggy_budget'] : life === 'college' ? ['babylon_save', 'auto_first'] : ['auto_first', 'halan_three']).forEach(k => add(k, why, link)); }
  if (m && (m.skippedNeeds || m.needsSpill >= 100)) add(sch ? 'piggy_budget' : 'halan_emergency', 'Because Needs ran short this month.',
    m.skippedNeeds ? `You put off ${m.skippedNeeds} need${m.skippedNeeds > 1 ? 's' : ''}, and ${m.skippedNeeds > 1 ? 'they' : 'it'} came back costing more.` : `Needs ran out, and ${rs(m.needsSpill)} came from Wants and Save.`);
  if (m && m.wantsSpill >= 100) (sch ? ['piggy_budget'] : ['psych_enough', 'auto_latte']).forEach(k => add(k, 'Because Wants ran past its budget.', `${rs(m.wantsSpill)} of your wants came out of Save.`));
  const nm = C.length;
  const sk = streak(), goodWhy = mk && mk.delta >= 0 && mk.q === 'sound' ? 'You made a sound call in the Bazaar. Here’s the next idea.' : `You hit your target ${sk} month${sk === 1 ? '' : 's'} in a row. Here’s the next idea.`;
  const goodLink = S.port ? `Cushion kept at ${rs(S.save)} and ${rs(portTotal())} invested and spread across stalls.` : `You set aside first and kept Save growing: ${rs(S.save)} now.`;
  const good = sch ? ['rupee_share', 'piggy_spread', 'myfirst_pin', 'rupee_save'] : mk ? ['psych_patience', 'richdad_assets', 'halan_three', 'auto_first'] : ['auto_first', 'halan_three', 'richdad_assets', 'psych_enough'];
  const fresh = good.filter(k => !S.books.includes(k)), pool = fresh.length ? fresh : good;
  pool.forEach(k => add(k, goodWhy, goodLink));
  const bad = C.slice(0, nm), good2 = C.slice(nm);
  if (bad.length) return bad.find(c => c.key !== last) || bad[0];
  return good2.find(c => c.key !== last) || good2[0];
}

/* ---------- Art ---------- */
function face(who, w = 96, cls = ''){
  const h = Math.round(w * .866);
  const b = {
    a:`<circle cx="34" cy="20" r="9" fill="#E6DDF5" stroke="#5A3E8A" stroke-width="2.5"/><circle cx="86" cy="20" r="9" fill="#E6DDF5" stroke="#5A3E8A" stroke-width="2.5"/><rect x="10" y="22" width="100" height="74" rx="24" fill="#E6DDF5" stroke="#5A3E8A" stroke-width="2.5"/><path d="M38 54q7-8 14 0M68 54q7-8 14 0" stroke="#5A3E8A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M50 70q10 8 20 0" stroke="#5A3E8A" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    b:`<path d="M56 22q0-12 8-12q6 0 6 6" stroke="#1F1F1F" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="10" y="22" width="100" height="74" rx="24" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="44" cy="54" r="6" fill="#1F1F1F"/><circle cx="76" cy="54" r="6" fill="#1F1F1F"/><path d="M50 70q10 8 20 0" stroke="#1F1F1F" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    c:`<rect x="10" y="22" width="100" height="74" rx="24" fill="#1F1F1F"/><path d="M10 44v-2a20 20 0 0 1 20-20h60a20 20 0 0 1 20 20v2z" fill="#8BD042"/><circle cx="44" cy="60" r="5" fill="#F7F7F2"/><circle cx="76" cy="60" r="5" fill="#F7F7F2"/><path d="M50 74q10 8 20 0" stroke="#F7F7F2" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    sad:`<rect x="10" y="22" width="100" height="74" rx="24" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="44" cy="56" r="6" fill="#1F1F1F"/><circle cx="76" cy="56" r="6" fill="#1F1F1F"/><path d="M50 78q10 -8 20 0" stroke="#1F1F1F" stroke-width="3" fill="none" stroke-linecap="round"/>`
  }[who];
  return `<svg class="face ${cls}" width="${w}" height="${h}" viewBox="0 0 120 104" aria-hidden="true">${b}</svg>`;
}
function taily(w = 40, sad){
  const mouth = sad ? '<path d="M15 28q5 -4 10 0" stroke="#1F1F1F" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M11 14l5 2M29 14l-5 2" stroke="#1F1F1F" stroke-width="1.8" stroke-linecap="round"/>' : '<path d="M15 26q5 4 10 0" stroke="#1F1F1F" stroke-width="2" fill="none" stroke-linecap="round"/>';
  return `<svg width="${w}" height="${w}" viewBox="0 0 40 40" style="flex:none" aria-label="${sad ? 'Taily, frowning' : 'Taily'}" role="img"><rect x="2" y="4" width="36" height="32" rx="12" fill="${sad ? '#F2B3D2' : '#8BD042'}"/><circle cx="14" cy="19" r="2.6" fill="#1F1F1F"/><circle cx="26" cy="19" r="2.6" fill="#1F1F1F"/>${mouth}</svg>`;
}
const IC = {
  rupee:'<path d="M7 5h10M7 9h10M8 5c5 0 7 1.5 7 4s-2 4-7 4l7 6"/>', layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  shield:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  back:'<path d="M15 6l-6 6 6 6"/>', check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', lock:'<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
  star:'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>', home:'<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>', undo:'<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-2"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>', bookI:'<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M5 16a4 4 0 0 1 4-4h10"/>',
  house:'<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>', food:'<path d="M4 12h16"/><path d="M5 12a7 7 0 0 0 14 0"/><path d="M9 4c0 2 2 2 2 4M13 4c0 2 2 2 2 4"/>',
  bus:'<rect x="5" y="4" width="14" height="13" rx="3"/><path d="M5 11h14M8 20v-3M16 20v-3"/>', phone:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  basket:'<path d="M4 10h16l-2 9H6z"/><path d="M8 10l4-6 4 6"/>', bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  stall:'<path d="M3 9l2-5h14l2 5"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
};
const icon = (n, s = 24, c = '#1F1F1F', sw = 1.8, fill = 'none') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || IC.rupee}</svg>`;
const T = (x, y, s, c, t) => `<text x="${x}" y="${y}" font-family="Urbanist, Arial, sans-serif" font-weight="700" font-size="${s}" fill="${c}">${t}</text>`;
const ART = {
  book:`<rect x="38" y="20" width="64" height="78" rx="8" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><rect x="38" y="20" width="12" height="78" rx="4" fill="#8BD042"/><path d="M60 40h30M60 50h30M60 60h20" stroke="#1F1F1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="112" cy="30" r="8" fill="#D8D860"/>`,
  compass:`<circle cx="70" cy="34" r="8" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M70 42L50 96M70 42l20 54" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/><path d="M40 92a40 40 0 0 1 60 0" fill="none" stroke="#8BD042" stroke-width="3" stroke-dasharray="4 6"/><rect x="100" y="60" width="34" height="10" rx="3" fill="#D8D860" transform="rotate(-20 117 65)"/>`,
  ticket:`<g transform="rotate(-8 70 60)"><path d="M28 36h84v16a8 8 0 0 0 0 16v16H28V68a8 8 0 0 0 0-16z" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M80 38v44" stroke="#1F1F1F" stroke-width="2" stroke-dasharray="4 4"/><circle cx="54" cy="60" r="10" fill="#8BD042"/></g><circle cx="118" cy="28" r="6" fill="#F2B3D2"/>`,
  plate:`<ellipse cx="70" cy="74" rx="52" ry="14" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M38 70c4-22 60-22 64 0" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="58" cy="56" r="5" fill="#8BD042"/><circle cx="78" cy="58" r="4" fill="#F2B3D2"/><path d="M58 24q4 6 0 12M70 20q4 6 0 12M82 24q4 6 0 12" stroke="#636363" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  bag:`<path d="M40 44h60l-6 52H46z" fill="#fff" stroke="#1F1F1F" stroke-width="2.5" stroke-linejoin="round"/><path d="M56 44v-8a14 14 0 0 1 28 0v8" fill="none" stroke="#1F1F1F" stroke-width="2.5"/><rect x="58" y="60" width="24" height="16" rx="4" fill="#C4B0EC"/>${T(100, 38, 15, '#B03A24', 'SALE')}`,
  shoe:`<path d="M28 76c0-14 6-30 18-30 6 10 18 14 30 14 20 0 36 6 36 16v6H28z" fill="#fff" stroke="#1F1F1F" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 82h84" stroke="#1F1F1F" stroke-width="5" stroke-linecap="round"/><path d="M52 56l6 8M60 54l6 8" stroke="#8BD042" stroke-width="3" stroke-linecap="round"/>`,
  watch:`<rect x="56" y="18" width="28" height="22" rx="6" fill="#C4B0EC"/><rect x="56" y="80" width="28" height="22" rx="6" fill="#C4B0EC"/><rect x="44" y="36" width="52" height="48" rx="14" fill="#1F1F1F"/><path d="M60 62l8 6 14-14" stroke="#8BD042" stroke-width="3" fill="none" stroke-linecap="round"/>${T(102, 34, 14, '#B03A24', 'DEAL')}`,
  plug:`<rect x="40" y="38" width="44" height="34" rx="8" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M50 38V28M74 38V28" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/><path d="M84 56c20 0 18 30 40 30" fill="none" stroke="#1F1F1F" stroke-width="2.5"/><path d="M58 50l-4 10h8l-4 10" stroke="#B03A24" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`,
  id:`<rect x="34" y="30" width="72" height="54" rx="10" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="54" cy="54" r="10" fill="#E6DDF5"/><path d="M72 48h24M72 58h16" stroke="#1F1F1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="110" cy="84" r="12" fill="none" stroke="#1F1F1F" stroke-width="2.5"/><path d="M118 92l8 8" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/>`,
  gift:`<rect x="40" y="48" width="60" height="46" rx="6" fill="#8BD042" stroke="#1F1F1F" stroke-width="2.5"/><rect x="36" y="40" width="68" height="14" rx="4" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/><path d="M70 40v54" stroke="#1F1F1F" stroke-width="2.5"/><path d="M70 40c-10-14-26-6-14 0M70 40c10-14 26-6 14 0" fill="none" stroke="#1F1F1F" stroke-width="2.5"/>${T(104, 34, 18, '#3D6B12', '+₹')}`,
  jar:`<rect x="48" y="30" width="44" height="10" rx="3" fill="#1F1F1F"/><path d="M50 40h40v46a10 10 0 0 1-10 10H60a10 10 0 0 1-10-10z" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M52 66h36v20a8 8 0 0 1-8 8H60a8 8 0 0 1-8-8z" fill="#8BD042"/><circle cx="70" cy="18" r="8" fill="#D8D860" stroke="#1F1F1F" stroke-width="2"/>`,
  jars3:`<g stroke="#1F1F1F" stroke-width="2.5"><rect x="22" y="40" width="28" height="50" rx="8" fill="#fff"/><rect x="56" y="40" width="28" height="50" rx="8" fill="#fff"/><rect x="90" y="40" width="28" height="50" rx="8" fill="#fff"/></g><rect x="24" y="56" width="24" height="32" rx="6" fill="#D8D860"/><rect x="58" y="66" width="24" height="22" rx="6" fill="#C4B0EC"/><rect x="92" y="50" width="24" height="38" rx="6" fill="#8BD042"/>`,
  scroll:`<path d="M42 30h56v60H42z" fill="#F4F5D0" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="42" cy="30" r="8" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="98" cy="90" r="8" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/><path d="M54 48h32M54 58h32M54 68h20" stroke="#1F1F1F" stroke-width="2.5" stroke-linecap="round"/>`,
  thermo:`<rect x="62" y="20" width="16" height="60" rx="8" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="70" cy="86" r="14" fill="#B03A24" stroke="#1F1F1F" stroke-width="2.5"/><rect x="66" y="44" width="8" height="40" rx="4" fill="#B03A24"/><path d="M96 34q6-6 12 0M100 50q6-6 12 0" stroke="#636363" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  cake:`<rect x="40" y="58" width="60" height="34" rx="6" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M40 70q10 8 20 0t20 0t20 0" fill="none" stroke="#C4B0EC" stroke-width="4"/><path d="M60 58V44M80 58V44" stroke="#1F1F1F" stroke-width="2.5"/><path d="M60 40q-3-5 0-8q3 3 0 8M80 40q-3-5 0-8q3 3 0 8" fill="#D8D860" stroke="#1F1F1F" stroke-width="1.5"/><circle cx="114" cy="36" r="5" fill="#8BD042"/><circle cx="26" cy="48" r="4" fill="#F2B3D2"/>`,
  wrench:`<path d="M44 92l34-34" stroke="#1F1F1F" stroke-width="8" stroke-linecap="round"/><circle cx="86" cy="50" r="16" fill="none" stroke="#1F1F1F" stroke-width="6"/><path d="M98 24q4 10 0 14M108 30q4 10 0 14" stroke="#7FB4E0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="104" cy="72" r="5" fill="#7FB4E0"/>`,
  alert:`<rect x="48" y="16" width="44" height="80" rx="10" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M70 36l16 28H54z" fill="#FBE1DA" stroke="#B03A24" stroke-width="2.5" stroke-linejoin="round"/><path d="M70 46v8M70 58v1" stroke="#B03A24" stroke-width="3" stroke-linecap="round"/><path d="M60 84h20" stroke="#1F1F1F" stroke-width="2.5" stroke-linecap="round"/><circle cx="110" cy="30" r="12" fill="#B03A24"/>${T(106, 35, 14, '#fff', '!')}`,
  coins:`<ellipse cx="58" cy="84" rx="26" ry="8" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/><path d="M32 84v-10M84 84v-10" stroke="#1F1F1F" stroke-width="2.5"/><ellipse cx="58" cy="74" rx="26" ry="8" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/><ellipse cx="58" cy="64" rx="26" ry="8" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="100" cy="48" r="18" fill="#8BD042" stroke="#1F1F1F" stroke-width="2.5"/>${T(93, 55, 18, '#1F1F1F', '₹')}`,
  drawer:`<rect x="30" y="40" width="80" height="56" rx="6" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M30 68h80" stroke="#1F1F1F" stroke-width="2.5"/><path d="M62 54h16M62 82h16" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/><rect x="74" y="20" width="30" height="16" rx="3" fill="#8BD042" stroke="#1F1F1F" stroke-width="2" transform="rotate(-14 89 28)"/>${T(110, 26, 18, '#B03A24', '?')}`,
  phonecrack:`<rect x="48" y="16" width="44" height="82" rx="10" fill="#1F1F1F"/><rect x="52" y="24" width="36" height="62" rx="4" fill="#E6DDF5"/><path d="M60 26l8 14-6 8 10 10-4 12" stroke="#1F1F1F" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
  mountain:`<path d="M14 96l36-54 22 30 14-18 40 42z" fill="#8BD042" stroke="#1F1F1F" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 42l-8 12h16z" fill="#fff"/><circle cx="110" cy="28" r="12" fill="#D8D860" stroke="#1F1F1F" stroke-width="2"/>`,
  foodbag:`<path d="M42 40h56l-4 56H46z" fill="#F2B3D2" stroke="#1F1F1F" stroke-width="2.5" stroke-linejoin="round"/><path d="M56 40v-8a14 14 0 0 1 28 0v8" fill="none" stroke="#1F1F1F" stroke-width="2.5"/><circle cx="70" cy="66" r="10" fill="#fff" stroke="#1F1F1F" stroke-width="2"/><path d="M108 30a12 12 0 1 1-6 22" fill="none" stroke="#636363" stroke-width="2.5" stroke-linecap="round"/>`,
  tv:`<rect x="28" y="28" width="84" height="56" rx="8" fill="#1F1F1F"/><rect x="34" y="34" width="72" height="44" rx="4" fill="#C4B0EC"/><path d="M64 46v20l16-10z" fill="#fff"/><path d="M54 96h32M70 84v12" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/>`,
  hands:`<path d="M20 70l22-18 16 6 12-8 14 10" fill="none" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 70l-22-18-16 6" fill="none" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/><rect x="56" y="22" width="30" height="18" rx="3" fill="#8BD042" stroke="#1F1F1F" stroke-width="2"/>${T(64, 36, 13, '#1F1F1F', '₹')}`,
  card:`<rect x="26" y="34" width="88" height="56" rx="10" fill="#1F1F1F"/><rect x="26" y="46" width="88" height="10" fill="#8BD042"/><rect x="36" y="66" width="22" height="14" rx="3" fill="#D8D860"/><path d="M70 74h34" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  homeh:`<path d="M30 60l40-32 40 32" fill="none" stroke="#1F1F1F" stroke-width="3" stroke-linejoin="round"/><path d="M38 54v42h64V54" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><path d="M70 66c-6-8-16-2-10 6l10 10 10-10c6-8-4-14-10-6z" fill="#F2B3D2" stroke="#1F1F1F" stroke-width="2"/>`,
  tip:`<circle cx="52" cy="62" r="26" fill="#D8D860" stroke="#1F1F1F" stroke-width="2.5"/>${T(44, 70, 22, '#1F1F1F', '₹')}<path d="M86 84l14-20 10 8 16-30" fill="none" stroke="#B03A24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${T(98, 30, 16, '#B03A24', '2×?')}`,
  crash:`<path d="M16 34l22 10 18-6 16 14 14-4 16 40 22-10" fill="none" stroke="#B03A24" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 100h108" stroke="#1F1F1F" stroke-width="2.5"/>${T(86, 30, 18, '#B03A24', '−15%')}`,
  news:`<rect x="28" y="24" width="84" height="70" rx="6" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><rect x="38" y="34" width="40" height="22" rx="3" fill="#C4B0EC"/><path d="M86 38h16M86 48h16M38 66h64M38 76h48" stroke="#1F1F1F" stroke-width="2.5" stroke-linecap="round"/>`,
  shut:`<path d="M14 40l10-20h92l10 20z" fill="#C9C9C9" stroke="#1F1F1F" stroke-width="2.5" stroke-linejoin="round"/><rect x="20" y="40" width="100" height="58" rx="4" fill="#E4E4E4" stroke="#1F1F1F" stroke-width="2.5"/><path d="M20 52h100M20 64h100M20 76h100M20 88h100" stroke="#9A9A9A" stroke-width="2"/><rect x="58" y="62" width="24" height="20" rx="4" fill="#fff" stroke="#1F1F1F" stroke-width="2"/><path d="M64 62v-6a6 6 0 0 1 12 0v6" fill="none" stroke="#1F1F1F" stroke-width="2"/>`,
  open:`<path d="M14 40l10-20h92l10 20z" fill="#8BD042" stroke="#1F1F1F" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 40q8 10 16 0t16 0t16 0t16 0t16 0t16 0t16 0" fill="#F2B3D2" stroke="#1F1F1F" stroke-width="2"/><rect x="20" y="50" width="100" height="48" rx="4" fill="#fff" stroke="#1F1F1F" stroke-width="2.5"/><rect x="30" y="66" width="22" height="22" rx="4" fill="#E2F2CC"/><rect x="60" y="62" width="22" height="26" rx="4" fill="#C4B0EC"/><rect x="90" y="58" width="22" height="30" rx="4" fill="#F2B3D2"/>`,
};
const scene = k => `<svg width="140" height="112" viewBox="0 0 140 112" aria-hidden="true">${ART[k] || ART.gift}</svg>`;
const WASH = `<div class="wash" aria-hidden="true"><i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i><i class="blob b4"></i></div>`;
const segs = (n, done) => `<div class="segs" aria-hidden="true">${Array.from({ length:n }, (_, i) => `<i class="${i < done ? 'done' : i === done ? 'now' : ''}"></i>`).join('')}</div>`;
const WAVE = (c, flip) => `<svg ${flip ? 'class="w2"' : ''} viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0 5 Q12.5 ${flip ? 10 : 0} 25 5 T50 5 T75 5 T100 5 T125 5 T150 5 T175 5 T200 5 V10 H0z" fill="${c}"/></svg>`;

/* ---------- Water jars ---------- */
function jarLevels(){
  const m = S.m, st = m.start, lv = (v, max) => clamp(max > 0 ? v / max : 0, 0, 1);
  return { needs:lv(m.jars.needs, Math.max(st.needs, 1)), wants:lv(m.jars.wants, Math.max(st.wants, 1)), save:lv(m.jars.save, goalOf().amount), happy:m.happy / 100 };
}
const lvl = v => Math.max(v * 88, v > 0 ? 6 : 0);
function jarsHTML(){
  const m = S.m, lv = jarLevels(), vals = { needs:m.jars.needs, wants:m.jars.wants, save:m.jars.save, happy:m.happy };
  const col = { needs:'var(--w-needs)', wants:'var(--w-wants)', save:'var(--w-save)', happy:'var(--w-happy)' };
  return `<div class="jars" id="jars">${Object.keys(vals).map(k => `<div class="jar ${lv[k] <= .02 ? 'empty' : ''}" data-k="${k}">
    <div class="vessel" role="img" aria-label="${JARNAME[k]}: ${k === 'happy' ? vals[k] + ' out of 100' : rs(vals[k])}"><div class="water" style="--lvl:${lvl(lv[k])}%;--wc:${col[k]}"><div class="body"></div>${WAVE(col[k])}${WAVE(col[k], true)}</div>
    <span class="val num">${k === 'happy' ? vals[k] : rs(vals[k])}</span></div><span class="lab">${JARNAME[k]}</span></div>`).join('')}</div>`;
}
function updateJars(){
  const box = cur && cur.querySelector('#jars'); if (!box) return;
  const m = S.m, lv = jarLevels(), vals = { needs:m.jars.needs, wants:m.jars.wants, save:m.jars.save, happy:m.happy };
  Object.keys(vals).forEach(k => {
    const jar = box.querySelector(`[data-k="${k}"]`), v = jar.querySelector('.val'), ves = jar.querySelector('.vessel');
    jar.querySelector('.water').style.setProperty('--lvl', lvl(lv[k]) + '%'); jar.classList.toggle('empty', lv[k] <= .02);
    const from = parseNum(v.textContent);
    if (from !== Math.round(vals[k])){ ves.classList.remove('slosh'); void ves.offsetWidth; ves.classList.add('slosh'); countUp(v, from, vals[k], 900, k === 'happy');
      const d = vals[k] - from; drip(jar, (d > 0 ? '+' : '−') + (k === 'happy' ? Math.abs(d) : rs(Math.abs(d))), d > 0); }
  });
}
function parseNum(t){ const n = +(t.replace(/[^\d−-]/g, '').replace('−', '-')); return isNaN(n) ? 0 : n; }
const ROAD = 'M24 30 H270 C326 30 326 140 270 140 H72 C16 140 16 250 72 250 H270 C326 250 326 360 270 360 H36';

/* ---------- Savings track chart ---------- */
function trackChart(h = 150){
  const t = target(), un = unlockAt(), mx = Math.max(un * 1.25, goalOf().amount * .25, ...S.track.map(x => x.save), 1);
  const bars = Array.from({ length:12 }, (_, i) => { const e = S.track[i];
    const hgt = e ? Math.max(4, e.save / mx * (h - 22)) : 0;
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:${h}px">
      ${e ? `<i class="tbar" style="--h:${hgt}px;background:${e.hit ? 'var(--w-save)' : 'var(--w-wants)'}"></i>` : `<i style="height:6px;width:100%;border-radius:4px;border:1.5px dashed rgba(31,31,31,.2)"></i>`}
      <span style="font-size:10px;font-weight:600;color:${e ? 'var(--ink)' : 'var(--muted)'}">${MONTHS[i][0]}</span></div>`; }).join('');
  const ly = (h - 22) - un / mx * (h - 22);
  return `<div style="position:relative;display:flex;gap:5px;align-items:flex-end" role="img" aria-label="Savings at the end of each month">${bars}
</div>`;
}

/* ---------- Screens ---------- */
const NOBAR = ['splash', 'intro', 'choose', 'life', 'name', 'goal'];
const SCREENS = {
  splash:{ wash:true, html:() => { const has = splashHas = false;
    return `<div class="grow"></div><div style="display:flex;flex-direction:column;align-items:center;gap:14px">
      <div class="wordmark" aria-label="taily">${'taily'.split('').map((l, i) => `<span style="animation-delay:${.1 + i * .07}s">${l}</span>`).join('')}</div>
      <p style="font-size:18px;animation:rise .6s .6s both">Once upon a paycheque.</p></div><div class="grow"></div>
      <div style="display:flex;flex-direction:column;gap:10px"><p style="font-size:13px;font-weight:500;color:var(--muted)">Loading your first month…</p><div class="loadbar"><i></i></div></div>`; },
    mount:el => { if (!splashHas) setTimeout(() => { if (cur === el) go('intro'); }, 2200); } },

  intro:{ wash:true, html:() => { const sl = [
      ['rupee','Play money, real lessons.','Every rupee is pretend. Every choice works like real life.'],
      ['layers','Every choice adds up.','Cards show up one at a time. What you pick today shows up later.'],
      ['shield','Just between you and Taily.','No account, no ranking. Your progress stays on this phone.'] ];
    return `<button class="skip" data-act="go" data-to="choose">Skip</button>
      <div class="carousel" id="car">${sl.map(s => `<div class="slide"><div class="art glass"><div class="tiles">${[0,1,2].map(() => `<div class="tile">${icon(s[0], 34)}</div>`).join('')}</div>
        <div style="display:flex;gap:8px"><span class="pill lime">On track</span><span class="pill lilac">Planning</span></div></div>
        <div style="display:flex;flex-direction:column;gap:12px"><h1 class="h1">${s[1]}</h1><p class="lead ink">${s[2]}</p></div></div>`).join('')}</div>
      <div style="display:flex;flex-direction:column;gap:22px;padding-top:12px"><div class="dots" id="dots"><i class="on"></i><i></i><i></i></div><button class="btn" data-act="introNext" id="introBtn">Next</button></div>`; },
    mount:el => { const car = el.querySelector('#car'), dots = el.querySelectorAll('#dots i'), btn = el.querySelector('#introBtn');
      car.addEventListener('scroll', () => { const p = car.scrollLeft / car.clientWidth, i = Math.round(p);
        el.querySelectorAll('.art').forEach((a, k) => a.style.setProperty('--off', (k - p).toFixed(3)));
        el.style.setProperty('--px', (-p * 30) + 'px'); dots.forEach((d, k) => d.classList.toggle('on', k === i)); btn.textContent = i === 2 ? 'Choose a life' : 'Next'; }, { passive:true }); } },

  choose:{ wash:true, html:() => `<div class="grow"></div>
    <div class="card" style="display:flex;flex-direction:column;gap:14px;padding:26px"><p class="eyebrow">Step 1 of 2</p><h1 class="h1" style="font-size:42px">Choose a life.</h1>
      <p class="lead">You will live it for a year. Each one starts with a different income and a different problem.</p>
      <button class="icon-btn" data-act="go" data-to="life" aria-label="Next" style="align-self:flex-end;width:56px;height:56px;background:var(--lime)">${icon('arrow', 24)}</button></div>
    <div style="display:flex;justify-content:center;gap:14px;margin-top:26px;opacity:.4">${face('a', 76)}${face('b', 76)}${face('c', 76)}</div><div class="grow"></div>` },

  life:{ html:() => `<p class="eyebrow">Pick one</p><h1 class="h1" style="margin-top:8px">Who are you for a year?</h1>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:18px">${Object.entries(LIVES).map(([id, l]) => `
      <button class="opt ${id === S.life ? 'sel' : ''}" data-act="life" data-id="${id}">${face(l.face, 64)}
        <span style="flex:1;display:flex;flex-direction:column;gap:3px"><b style="font-size:18px;font-weight:600">${l.title}</b><span style="font-size:14px;color:var(--muted)">${l.home}</span></span>
        <span class="tick">${icon('check', 14, '#1F1F1F', 2.6)}</span></button>`).join('')}</div>
    <div class="grow"></div><button class="btn" data-act="pickLife">Play this life</button>` },

  name:{ html:() => `${segs(2,0)}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:22px"><p class="eyebrow">Step 2 of 2 · optional</p><h1 class="h1">What should Taily call you?</h1><p class="lead">Only used on this phone. Skip it if you like.</p></div>
    <label for="nm" class="sr">Your name</label><input id="nm" class="field" style="margin-top:20px" maxlength="20" autocomplete="off" placeholder="Your name" value="${esc(S.name)}">
    <div class="grow"></div><div class="row"><button class="btn secondary" data-act="skipName">Skip</button><button class="btn" data-act="saveName">Next</button></div>` },

  goal:{ html:() => { const gs = L().goals, p = S.goalPick, own = p === 3;
    return `<p class="eyebrow">Set a goal</p><h1 class="h1" style="margin-top:8px">What are you saving for?</h1>
    <p class="lead" style="margin-top:8px">Pick a year goal. Taily splits it across 12 months to get your monthly saving target.</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
      ${gs.map((g, i) => `<button class="opt ${p === i ? 'sel' : ''}" data-act="pickGoal" data-i="${i}"><span class="tick">${icon('check', 14, '#1F1F1F', 2.6)}</span>
        <b style="flex:1;font-size:16px;font-weight:600">${g.label}</b><span class="num" style="font-weight:600">${rs(g.amount)}</span></button>`).join('')}
      <div class="opt ${own ? 'sel' : ''}" style="flex-direction:column;align-items:stretch;gap:10px" id="ownBox" data-act="pickGoal" data-i="3"><label for="og" style="font-weight:600">Other</label>
        ${own ? `<input id="og" class="field" style="background:var(--ground);height:46px" maxlength="24" placeholder="Name your goal" value="${esc(S.goal && S.goal.custom ? S.goal.label : '')}">
        <div class="stepper"><button class="icon-btn" data-act="amt" data-d="-1" aria-label="Less">−</button><b class="num" id="ogAmt" style="flex:1;text-align:center;font-size:22px;font-weight:500">${rs(goalOf().amount)}</b><button class="icon-btn" data-act="amt" data-d="1" aria-label="More">+</button></div>` : `<span style="font-size:13px;color:var(--muted)">Name your own goal and amount</span>`}</div></div>
    <div class="card wash-c" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px">Monthly saving target</span><b class="num" id="tgt" style="font-size:22px;font-weight:500;color:var(--lime-text)">${rs(target())}</b></div>
    <div class="grow"></div><button class="btn" data-act="confirmGoal">Set this goal</button>`; },
    mount:el => { const og = el.querySelector('#og'); if (og) og.addEventListener('input', () => { S.goal.label = og.value.trim() || 'My goal'; save(); }); } },

  months:{ tab:'home', html:() => { const n = S.month;
    const cell = i => { const k = i + 1, e = S.track[i];
      if (e) return `<button class="mcell done" style="${e.hit ? '' : 'background:var(--w-wants);color:var(--ink)'}" aria-label="Month ${k}, ${e.hit ? 'target hit' : 'under target'}">${e.hit ? icon('check', 22, '#F7F7F2', 2.6) : k}${e.bz ? '<small>Bazaar</small>' : ''}</button>`;
      if (k === n) return `<button class="mcell now" data-act="startMonth" aria-label="Month ${k}, open">${k}</button>`;
      return `<button class="mcell" data-act="lockedMonth" aria-label="Month ${k}, locked">${k}</button>`; };
    return `<p class="eyebrow">${n === 1 ? 'Your first month' : 'Your year'}</p>
    <p class="num" style="font-size:96px;font-weight:300;letter-spacing:-.04em;line-height:1;margin-top:8px">${MONTHS[n - 1]}</p>
    <p style="font-size:22px;color:var(--muted);margin-top:4px">2026</p>
    <p class="lead" style="margin-top:12px">${n === 1 ? 'Pick a month to live. Month 1 is open. The rest unlock as you go.' : `Month ${n} is open. Saved so far: <b style="color:var(--ink)">${rs(S.save)}</b>${S.port ? ` · invested ${rs(portTotal())}` : ''}.`}</p>
    <div class="mgrid">${Array.from({ length:12 }, (_, i) => cell(i)).join('')}</div>
    <div class="grow" style="min-height:30px"></div><button class="btn" data-act="startMonth">Start month ${n}</button>`; } },

  arrive:{ wash:true, html:() => `<p class="eyebrow">Month ${S.month} of 12 · ${MONTHS[S.month - 1]} · ${L().title}</p>
    <h1 class="h1" style="margin-top:8px">${S.name ? esc(S.name) + ', money' : 'Money'} arrives.</h1>
    <div class="card glass" style="margin-top:18px;display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:var(--muted)">${L().from}</span><span class="big num" id="arrAmt">₹0</span>
      ${S.carry ? `<span class="pill gain" style="align-self:flex-start">+${rs(S.carry)} left over from last month</span>` : ''}</div>
    <div class="card" style="margin-top:12px;display:flex;gap:14px;align-items:center">${icon('calendar', 24)}<span style="font-size:15px;line-height:1.45">Your fixed bills come first: <b>${bills().length} bills, ${rs(billsTotal())}</b>.${plCount() ? ' That includes pay-later instalments.' : ''}</span></div>
    <div class="grow"></div><button class="btn" data-act="startBills">Pay the bills</button>`,
    mount:el => countUp(el.querySelector('#arrAmt'), 0, L().income, 900) },

  bill:{ wash:true, html:() => { const b = bills(), n = b.length, f = b[0];
    return `<div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;flex-direction:column;gap:10px;flex:1"><p style="font-size:13px;font-weight:500;color:var(--muted)" id="bcount">Bills · 1 of ${n}</p><div id="bsegs">${segs(n, 0)}</div></div>
      <button class="skip" style="position:static;margin-left:14px" data-act="skipBills" id="bskip">Skip</button></div>
    <div class="road" id="road"><svg class="track" viewBox="0 0 342 400" preserveAspectRatio="none" aria-hidden="true">
      <path d="${ROAD}" fill="none" stroke="rgba(31,31,31,.18)" stroke-width="14" stroke-linecap="round"/><path id="rp" d="${ROAD}" fill="none" stroke="#1F1F1F" stroke-width="2.5" stroke-dasharray="2 9" stroke-linecap="round"/><circle cx="24" cy="30" r="6" fill="#8BD042"/></svg>
      <div class="billbub" id="bub" role="img" aria-label="${f[0]}: ${rs(f[1])}">${icon(f[2], 28)}<span class="bl">${f[0]}</span><span class="ba num">−${rs(f[1])}</span></div></div>
    <div id="bcap" style="display:flex;flex-direction:column;gap:8px;margin-top:6px;transition:opacity .35s"><h1 class="h1" style="font-size:30px" id="bt">${f[3]}</h1><p class="lead ink" style="font-size:15px" id="bn">${f[4]}</p>
      <div style="display:flex;gap:8px;margin-top:4px"><span class="pill loss" id="ba">↓ −${rs(f[1])}</span><span class="pill num" id="bl">${rs(incomeAll())} left</span></div></div>
    <div id="bsum" style="display:none;flex-direction:column;gap:12px;margin-top:6px">
      <h1 class="h1" style="font-size:30px">Bills paid.</h1>
      <div class="card" style="display:flex;flex-direction:column;gap:12px">
        ${b.map(x => `<div style="display:flex;align-items:center;gap:12px;font-size:15px">${icon(x[2], 20)}<span style="flex:1">${x[0]}</span><b class="num">−${rs(x[1])}</b></div>`).join('')}
        <div style="border-top:1.5px solid var(--line);padding-top:12px;display:flex;justify-content:space-between;font-size:15px"><span>Total bills</span><b class="num" style="color:var(--loss)">−${rs(billsTotal())}</b></div></div>
      <div class="card wash-c" style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:15px">${rs(incomeAll())} in · left to plan</span><b class="num" style="font-size:26px;font-weight:500;color:var(--lime-text)">${rs(toPlan())}</b></div></div>
    <div class="grow" style="min-height:18px"></div><button class="btn" data-act="go" data-to="setaside" id="bgo" disabled>Paying the bills…</button>`; },
    mount:el => runRoad(el) },

  setaside:{ html:() => `${segs(3,0)}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:22px"><p class="eyebrow">Month ${S.month} · Save first</p><h1 class="h1">Set aside first?</h1><p class="lead">${rs(toPlan())} is left after bills. Savings go in before any spending.</p></div>
    <div class="card" style="margin-top:20px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="display:flex;flex-direction:column;gap:4px"><span class="eyebrow">Goes to Save</span><span class="big num">${rs(Math.min(target(), toPlan()))}</span></div>${face(L().face, 64)}</div>
      <div class="goalbar"><i style="width:${clamp((S.save + target()) / goalOf().amount * 100, 0, 100).toFixed(1)}%"></i></div>
      <span style="font-size:14px;color:var(--muted)">${rs(S.save + Math.min(target(), toPlan()))} of ${rs(goalOf().amount)} for <b style="color:var(--ink)">${esc(goalOf().label)}</b>${streak() ? ` · streak ${streak()}` : ''}</span></div>
    <div class="grow"></div><div style="display:flex;flex-direction:column;gap:10px"><button class="btn" data-act="setAside" data-v="1">Set aside ${rs(Math.min(target(), toPlan()))}</button><button class="btn secondary" data-act="setAside" data-v="0">Skip this month</button></div>` },

  split:{ html:() => { const rest = toPlan() - (S.setAside ? Math.min(target(), toPlan()) : 0), n = clamp(S.needsPlan, 0, rest), st = rest > 3000 ? 250 : 50;
    return `${segs(3,1)}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:22px"><p class="eyebrow">Month ${S.month} · Split the rest</p><h1 class="h1">Needs buffer and Wants</h1><p class="lead">Needs covers things that break or go wrong. Wants covers fun, food and friends.</p></div>
    <div class="card wash-c" style="margin-top:18px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end"><div><span class="eyebrow" style="color:#5f5f00">Needs buffer</span><div class="num" id="nv" style="font-size:34px;font-weight:300;letter-spacing:-.03em">${rs(n)}</div></div>
      <div style="text-align:right"><span class="eyebrow lilac">Wants</span><div class="num" id="wv" style="font-size:34px;font-weight:300;letter-spacing:-.03em">${rs(rest - n)}</div></div></div>
      <label for="sl" class="sr">Needs buffer amount</label><input type="range" id="sl" min="0" max="${rest}" step="${st}" value="${n}" style="--fill:${rest ? (n / rest * 100).toFixed(1) : 0}%">
      <span style="font-size:13px;color:var(--muted)">${rs(rest)} in total. Taily suggests ${rs(L().needs)} for Needs.</span></div>
    <div class="card" style="margin-top:10px;display:flex;gap:14px;align-items:center">${icon(S.port ? 'stall' : 'lock', 22, '#5A3E8A')}<div style="display:flex;flex-direction:column;gap:3px"><b style="font-size:17px;font-weight:600">Invest</b><span style="font-size:14px;color:var(--muted)">The Bazaar opens in any month you save your full ${rs(target())}.</span></div></div>
    <div class="grow"></div><button class="btn" data-act="lockPlan">Lock in my plan</button>`; },
    mount:el => { const sl = el.querySelector('#sl'), rest = +sl.max; sl.addEventListener('input', () => { const v = +sl.value; S.needsPlan = v;
      el.querySelector('#nv').textContent = rs(v); el.querySelector('#wv').textContent = rs(rest - v); sl.style.setProperty('--fill', (v / rest * 100) + '%'); }); } },

  hub:{ tab:'home', html:() => { const m = S.m, done = m.week * 2 + m.step, next = currentCardId(), sad = frown();
    const tl = m.lastLine || (m.paidLater ? `A ${rs(m.paidLater)} pay-later instalment left with the bills. Plan’s locked in.` : S.setAside ? 'Plan’s locked in. Real life starts now.' : 'No savings set aside yet. Let’s see how the month goes.');
    return `<div class="hubhead"><div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:13px;color:var(--muted)">${L().title}${S.name ? ' · ' + esc(S.name) : ''}</span><h1 class="h1">Month ${S.month}</h1></div>
      <span class="pill ${sad ? 'loss' : 'gain'}">${sad ? 'Off track' : 'On track'}</span></div>
    <div style="margin-top:14px">${jarsHTML()}</div>
    <div class="week" style="margin-top:16px" aria-label="${done} of 8 cards played">${Array.from({ length:8 }, (_, i) => `<i class="${i < done ? 'done' : i === done ? 'now' : ''}"></i>`).join('')}</div>
    <p style="font-size:13px;color:var(--muted);margin-top:6px">Week ${Math.min(m.week + 1, 4)} of 4 · ${done} of 8 cards</p>
    <button class="card wash-c" data-act="goals" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;border:none;text-align:left;width:100%">
      <div style="display:flex;justify-content:space-between;align-items:baseline;width:100%"><b style="font-size:16px;font-weight:600">${esc(goalOf().label)}</b><span class="num" style="font-size:14px"><b>${rs(m.jars.save)}</b> / ${rs(goalOf().amount)}</span></div>
      <div class="goalbar" style="width:100%"><i style="width:${clamp(m.jars.save / goalOf().amount * 100, 0, 100).toFixed(1)}%"></i></div>
      <span style="font-size:13px;color:var(--muted)">This month: ${rs(added())} of your ${rs(target())} target · tap for your savings track</span></button>
    <div class="taily-says" style="margin-top:12px">${taily(40, sad)}<div class="bubble">${esc(tl)}</div></div>
    <div class="grow"></div>
    <button class="btn" data-act="openCard">${next ? (m.queue.length ? 'Something came back' : done === 0 ? 'Draw the first card' : 'Next card') : 'See how the month went'}</button>`; } },

  card:{ html:() => { const id = currentCardId(), c = D()[id], m = S.m, h = frown() || c.choices.some(x => x.kind === 'scam') ? hintFor(c) : null;
    return `<div style="display:flex;justify-content:space-between;align-items:center"><button class="icon-btn" data-act="back" aria-label="Back to the month">${icon('back', 20)}</button>
      <span style="font-size:13px;color:var(--muted)">Month ${S.month} · ${m.queue.length ? 'Week ' + Math.min(m.week + 1, 4) + ' · It came back' : 'Week ' + (m.week + 1) + ' · Card ' + (m.week * 2 + m.step + 1) + ' of 8'}</span></div>
    <div style="margin-top:12px">${jarsHTML()}</div>
    <article class="event j-${c.jar}" style="margin-top:12px" id="ev">
      <div class="scene">${scene(c.art)}</div>
      <h2 class="h2">${c.title}</h2><p class="lead ink" style="font-size:15px">${c.body}</p>
      ${h ? `<div class="hint">${taily(32, true)}<span>${h}</span></div>` : ''}
      <div class="choices">${c.choices.map((ch, i) => { const a = ch.payLater ? (ch.payLater.now ? rs(ch.payLater.now) + ' now' : 'Pay later') : (ch.income && ch.cost) ? 'Spend it' : ch.cost ? '−' + rs(ch.cost) : ch.income ? '+' + rs(ch.income.amount) : ch.move ? rs(ch.move.amount) : '₹0';
        return `<button class="choice" data-act="choose" data-i="${i}"><span class="c-t">${ch.t}</span><span class="c-a num">${a}</span></button>`; }).join('')}</div>
    </article>`; } },

  lose:{ wash:true, html:() => { const Lz = S.lose || {}, broke = Lz.kind === 'broke';
    return `<div class="grow"></div><div style="display:flex;justify-content:center">${face('sad', 120, 'lose-face')}</div>
    <p class="eyebrow loss" style="text-align:center;margin-top:18px">${broke ? 'Out of money' : 'Burnout'}</p>
    <h1 class="h1" style="text-align:center;margin-top:8px">${broke ? 'You can’t pay for this one.' : 'You’ve run out of steam.'}</h1>
    <p class="lead ink" style="text-align:center;margin-top:12px">${broke ? `“${esc(Lz.label)}” costs ${rs(Lz.need)}. Your jars are short by ${rs(Lz.short)}.` : 'Happiness dropped to ' + (S.m ? S.m.happy : 0) + '. Skipping everything fun wears anyone down.'}</p>
    ${broke ? `<div class="card" style="margin-top:18px;display:flex;flex-direction:column;gap:10px;border:2px solid var(--loss-soft)"><span class="pill loss" style="align-self:flex-start">Offer · pay later</span>
      <b style="font-size:18px;font-weight:600">Borrow ${rs(Lz.short)} now at 3% a month</b>
      <span style="font-size:14px;color:var(--muted)">That’s about 36% a year. If it takes 6 months to clear, you pay back around ${rs(Math.round(Lz.short * Math.pow(1.03, 6)))}, all from future months.</span></div>` : ''}
    <div class="grow"></div><div style="display:flex;flex-direction:column;gap:10px"><button class="btn" data-act="replay">Replay Month ${S.month}</button><button class="btn text" data-act="rethinkLast">Go back and rethink that choice</button></div>`; } },

  recap:{ wash:true, html:() => { const m = S.m, st = status(), a = added(), total = incomeAll() + m.extraIncome;
    const rows = [['Bills', billsTotalAtStart(), 'var(--ink)'], ['Needs spent', m.spent.needs, 'var(--w-needs)'], ['Wants spent', m.spent.wants, 'var(--w-wants)'], ['Saved this month', Math.max(0, a), 'var(--w-save)']];
    if (m.spent.lost) rows.push(['Lost to scams', m.spent.lost, 'var(--loss)']);
    return `<p class="eyebrow">Month ${S.month} · done</p><h1 class="h1" style="margin-top:8px">${st.onTrack ? 'On track.' : 'Off track, for now.'}</h1>
    <p class="lead ink" style="margin-top:8px">${st.onTrack ? 'Target saved, mood held up, nothing borrowed.' : 'You can keep playing. Here’s what pulled you off.'}</p>
    <div class="card reveal" style="margin-top:18px;display:flex;flex-direction:column;gap:12px"><div class="stars">${[1,2,3].map(i => `<span class="star ${i <= st.stars ? 'on' : ''}">${icon('star', 44, '#3D6B12', 1.5, i <= st.stars ? '#8BD042' : 'none')}</span>`).join('')}</div>
      <div class="deltas"><span class="pill ${st.saveOK ? 'gain' : 'loss'}">${st.saveOK ? 'Target saved' : 'Saved under target'}</span><span class="pill ${st.happyOK ? 'gain' : 'loss'}">Happiness ${m.happy}</span><span class="pill ${st.noPL ? 'gain' : 'loss'}">${st.noPL ? 'No pay-later' : 'Pay-later used'}</span></div></div>
    <h2 class="h2 reveal" style="margin-top:26px">Where the money went</h2>
    <div class="card reveal" style="margin-top:12px"><div class="bars">${rows.map(r => `<div class="bar-row"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${r[0]}</span><b class="num">${rs(r[1])}</b></div><div class="track"><i style="--w:${(r[1] / total * 100).toFixed(1)}%;background:${r[2]}"></i></div></div>`).join('')}</div>
      <p style="font-size:13px;color:var(--muted);margin-top:12px">Out of ${rs(total)} this month${S.carry ? ', including ' + rs(S.carry) + ' left over from last month' : ''}${m.extraIncome ? ' and ' + rs(m.extraIncome) + ' you didn’t plan for' : ''}.</p></div>
    ${m.wantsLog.length ? (() => { const w = m.wantsLog, ok = w.filter(x => x.ok).length;
      return `<h2 class="h2 reveal" style="margin-top:26px">Your wants: worth it?</h2>
      <div class="taily-says reveal" style="margin-top:10px">${taily(36, ok < w.length / 2)}<div class="bubble">${ok === w.length ? 'All worth it. Nice choices.' : ok === 0 ? 'Mostly regrets this month. That’s how you learn what’s worth it.' : `${ok} worth it, ${w.length - ok} I’d call a regret.`}</div></div>
      <div class="card reveal" style="margin-top:10px;display:flex;flex-direction:column;gap:16px">${w.map(x => `<div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b style="font-size:15px;font-weight:600;min-width:0">${esc(x.label)} <span class="num" style="font-weight:500;color:var(--muted)">· ${rs(x.amount)}</span></b>
        <span class="pill ${x.ok ? 'gain' : 'loss'}">${x.ok ? 'Worth it' : 'Regret'}</span></div>
        <span style="font-size:14px;color:var(--muted);line-height:1.45">${x.why}</span></div>`).join('')}</div>`; })() : ''}
    <div class="card reveal" style="margin-top:18px;display:flex;flex-direction:column;gap:10px;font-size:15px">
      <div style="display:flex;justify-content:space-between"><span>Saved this month</span><b class="num" style="color:${a >= target() ? 'var(--gain)' : 'var(--loss)'}">${rs(a)} <span style="color:var(--muted);font-weight:500">/ ${rs(target())}</span></b></div>
      <div style="display:flex;justify-content:space-between"><span>Total in Save</span><b class="num">${rs(m.jars.save)}</b></div>
      <div style="display:flex;justify-content:space-between"><span>Carries into next month</span><b class="num">${rs(m.jars.needs + m.jars.wants)}</b></div>
      ${m.plNew || plCount() ? `<div style="display:flex;justify-content:space-between;color:var(--loss)"><span>Pay-later still to pay</span><b class="num">${(m.plNew ? m.plNew.count : 0) + plCount()} payment(s)</b></div>` : ''}</div>
    <div style="height:22px"></div><button class="btn" data-act="toTrack">Update your savings track</button>`; }, mount:el => revealOn(el) },

  track:{ tab:'goals', html:() => { const lt = lastTrack(), e = elig(), sk = streak();
    const row = (ok, txt) => `<div style="display:flex;gap:12px;align-items:flex-start;font-size:15px;line-height:1.4">${icon(ok ? 'check' : 'x', 20, ok ? '#22703A' : '#B03A24', 2.4)}<span>${txt}</span></div>`;
    return `<p class="eyebrow">Savings track · Month ${lt.month}</p><h1 class="h1" style="margin-top:8px">${lt.hit ? `+${rs(lt.added)} this month.` : `${rs(Math.max(0, lt.added))} saved this month.`}</h1>
    <p class="lead" style="margin-top:8px">${lt.hit ? (sk > 1 ? `${sk} months on target in a row.` : 'Target hit. That’s a streak started.') : `${rs(target() - lt.added)} under your ${rs(target())} target. Next month is a fresh start.`}</p>
    <div class="card" style="margin-top:18px;padding:18px 16px 12px">${trackChart()}</div>
    <div class="row" style="margin-top:10px"><div class="card" style="padding:14px"><span style="font-size:12px;color:var(--muted)">Total saved</span><div class="num" style="font-size:22px;font-weight:500">${rs(S.save)}</div></div>
      <div class="card" style="padding:14px"><span style="font-size:12px;color:var(--muted)">${S.port ? 'Invested' : 'Goal'}</span><div class="num" style="font-size:22px;font-weight:500">${S.port ? rs(portTotal()) : rs(goalOf().amount)}</div></div></div>
    <div class="card ${e.open ? 'wash-c' : ''}" style="margin-top:10px;display:flex;flex-direction:column;gap:10px"><b style="font-size:16px;font-weight:600">Ready to invest?</b>
      ${row(e.habit, `Saved your ${rs(target())} this month <span style="color:var(--muted)">(you saved ${rs(Math.max(0, e.added))})</span>`)}
      ${row(e.cushion, `Savings aren’t running low <span style="color:var(--muted)">(${rs(S.save)} in Save)</span>`)}</div>
    <div class="grow" style="min-height:18px"></div><button class="btn" data-act="go" data-to="bazaar">${e.open ? 'Enter the Bazaar' : 'See the Bazaar'}</button>`; },
    mount:el => setTimeout(() => el.querySelectorAll('.tbar').forEach((b, i) => setTimeout(() => b.classList.add('in'), i * 70)), 300) },

  bazaar:{ html:() => { const e = elig(), has = S.port && portTotal() > 0;
    if (!e.open){
      const low = !e.cushion, have = low ? S.save : Math.max(0, e.added), need = low ? unlockAt() : target(), gap = Math.max(0, need - have);
      const reason = low ? `Your savings are running low: ${rs(S.save)} in Save. Investing now would leave nothing to fall back on if your phone breaks or a bill surprises you.`
        : `You saved ${rs(Math.max(0, e.added))} this month, less than the ${rs(target())} you set. The Bazaar opens in any month you save your full amount.`;
      return `<div style="background:#E6E6E6;margin:-24px -20px 0;padding:24px 20px 26px;border-radius:0 0 32px 32px">
        <p class="eyebrow" style="color:var(--muted)">The Bazaar · Month ${S.month}</p><h1 class="h1" style="margin-top:8px">Closed this month.</h1>
        <div style="display:flex;justify-content:center;margin-top:12px">${scene('shut')}</div></div>
      <p style="font-size:18px;font-weight:500;line-height:1.4;margin-top:18px">You need a financial cushion before you start investing.</p>
      <p class="lead" style="margin-top:8px">${reason}</p>
      <div class="card" style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;font-size:15px"><span>${low ? 'Your savings' : 'Saved this month'}</span><b class="num">${rs(have)}</b></div>
        <div style="display:flex;justify-content:space-between;font-size:15px"><span>Needed to open</span><b class="num">${rs(need)}</b></div>
        <div class="goalbar"><i style="width:${clamp(have / need * 100, 0, 100).toFixed(1)}%"></i></div>
        <span style="font-size:14px;color:var(--muted)">${rs(gap)} short. Save your full ${rs(target())} next month and it opens.</span></div>
      ${has ? `<div class="card lilac-c" style="margin-top:10px;font-size:15px;line-height:1.45">Your ${rs(portTotal())} already invested still moves with the market this month. You just can’t add new money.</div>` : ''}
      <div class="grow" style="min-height:18px"></div><button class="btn" data-act="${has ? 'marketMonth' : 'toBook'}">${has ? 'See this month’s market' : 'Continue'}</button>`;
    }
    const first = !S.port;
    return `<div style="background:linear-gradient(180deg,#ECE4F8,#F4F5D0);margin:-24px -20px 0;padding:24px 20px 26px;border-radius:0 0 32px 32px">
      <p class="eyebrow lilac">The Bazaar · Month ${S.month}</p><h1 class="h1" style="margin-top:8px">${first ? 'The Bazaar is open.' : 'Open this month.'}</h1>
      <div style="display:flex;justify-content:center;margin-top:12px">${scene('open')}</div></div>
    <p class="lead ink" style="margin-top:18px">${first ? `You saved your full ${rs(target())} this month and have ${rs(S.save)} put away. That’s enough security to start exploring investing.` : `You saved your full amount again, so you can add more this month.`}</p>
    <div class="card" style="margin-top:14px;display:flex;flex-direction:column;gap:12px">
      <div class="cushion"><i style="flex:${cushion()};background:var(--w-save)"></i><i style="flex:${e.available};background:var(--w-wants)"></i></div>
      <div style="display:flex;justify-content:space-between;font-size:14px"><span>Kept safe <b class="num">${rs(cushion())}</b></span><span>Free to invest <b class="num">${rs(e.available)}</b></span></div>
      <span style="font-size:13px;color:var(--muted)">Half your savings always stays in Save, for emergencies and your goal.</span></div>
    ${has ? `<div class="card lilac-c" style="margin-top:10px;display:flex;justify-content:space-between;font-size:15px"><span>Already invested</span><b class="num">${rs(portTotal())}</b></div>` : ''}
    <div class="grow" style="min-height:18px"></div><div style="display:flex;flex-direction:column;gap:10px"><button class="btn" data-act="go" data-to="invest" ${e.available > 0 ? '' : 'disabled'}>Choose what to invest</button>
    <button class="btn secondary" data-act="${has ? 'marketMonth' : 'toBook'}">${has ? 'Don’t add money this month' : 'Not this month'}</button></div>`; } },

  invest:{ html:() => { const e = elig(), max = e.available, z = S.inv || (S.inv = { amt:max, alloc:S.port ? { ...S.port.alloc } : { steady:50, market:40, hot:10 } }), a = z.alloc, left = 100 - a.steady - a.market - a.hot;
    if (z.amt > max) z.amt = max;
    const stall = (k, name, like, risk, cls, pill) => `<div class="stall ${cls}"><div class="top"><div style="display:flex;flex-direction:column;gap:2px"><b style="font-size:17px;font-weight:600">${name}</b><span style="font-size:13px;color:var(--muted)">${like}</span></div><span class="pill ${pill}">${risk}</span></div>
      <div class="alloc"><button class="icon-btn" data-act="alloc" data-k="${k}" data-d="-10" aria-label="Less in ${name}">−</button><b class="num" data-pct="${k}">${a[k]}% · ${rs(z.amt * a[k] / 100)}</b><button class="icon-btn" data-act="alloc" data-k="${k}" data-d="10" aria-label="More in ${name}">+</button></div></div>`;
    return `<div style="display:flex;align-items:center;gap:12px"><button class="icon-btn" data-act="back" aria-label="Back">${icon('back', 20)}</button><p class="eyebrow lilac">The Bazaar · Safe → Spread</p></div>
    <div class="card" style="margin-top:14px;display:flex;flex-direction:column;gap:8px"><span class="eyebrow lilac">Take to the Bazaar</span><div class="num" id="iv" style="font-size:38px;font-weight:300;letter-spacing:-.03em">${rs(z.amt)}</div>
      <label for="isl" class="sr">Amount to invest</label><input type="range" id="isl" min="0" max="${max}" step="${Math.max(50, Math.round(max / 20 / 50) * 50)}" value="${z.amt}" style="--fill:${max ? (z.amt / max * 100).toFixed(1) : 0}%">
      <span style="font-size:13px;color:var(--muted)">Up to ${rs(max)}. Your ${rs(cushion())} cushion stays in Save.</span></div>
    <p style="font-size:15px;font-weight:600;margin:16px 0 8px">Spread it across three stalls</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${stall('steady', 'Steady', 'Like an RD or FD. Slow and steady.', 'Low risk', 'steady', 'gain')}
      ${stall('market', 'Market', 'Like an index fund SIP. Goes up and down.', 'Medium risk', 'market', 'lilac')}
      ${stall('hot', 'Hot tip', 'A dice roll every month. Could jump, could crash.', 'Very high risk', 'hot', 'loss')}</div>
    <p id="left" style="font-size:14px;color:${left ? 'var(--loss)' : 'var(--muted)'};margin-top:10px;text-align:center">${left ? left + '% still to place' : 'All placed.'}</p>
    <div class="grow" style="min-height:14px"></div><button class="btn" data-act="doInvest" id="spBtn" ${left || !z.amt ? 'disabled' : ''}>Invest ${rs(z.amt)}</button>`; },
    mount:el => { const sl = el.querySelector('#isl'), max = +sl.max; sl.addEventListener('input', () => { const v = +sl.value; S.inv.amt = v; el.querySelector('#iv').textContent = rs(v);
      sl.style.setProperty('--fill', (v / max * 100) + '%'); refreshAlloc(); save(); }); } },

  news:{ html:() => { const mk = S.mk, ev = BZ.events[mk.key], h = S.port.h, canAdd = elig().open;
    const tile = (k, name, bg) => `<div class="hold" style="background:${bg}"><span class="k">${name}</span><span class="v num">${rs(h[k])}</span></div>`;
    return `<div style="display:flex;justify-content:space-between;align-items:center"><p class="eyebrow lilac">The Bazaar · Month ${S.month} · ${MONTHS[S.month - 1]}</p></div>
    <div class="holdings" style="margin-top:12px">${tile('steady', 'Steady', '#E2F2CC')}${tile('market', 'Market', '#ECE4F8')}${tile('hot', 'Hot tip', '#FADDEB')}</div>
    <p style="font-size:14px;margin-top:8px">Now <b class="num">${rs(tot(h))}</b> <span style="color:var(--muted)">· at the start of the month ${rs(tot(mk.start))}</span></p>
    <article class="event j-wants" style="margin-top:12px" id="ev"><div class="scene">${scene(ev.art)}</div>
      <span class="eyebrow lilac">Market news</span><h2 class="h2">${ev.title}</h2><p class="lead ink" style="font-size:15px">${ev.body}</p>
      <div class="choices">${ev.options.map((o, i) => `<button class="choice" data-act="bzChoose" data-i="${i}"><span class="c-t">${o.t}</span><span class="c-a">${icon('arrow', 16)}</span></button>`).join('')}</div></article>`; } },

  outcome:{ wash:true, html:() => { const mk = S.mk, ev = BZ.events[mk.key], gain = mk.delta >= 0, h = S.port.h;
    const dl = (k, name) => { const v = mk.d[k]; return `<div class="vrow"><span style="flex:1">${name}</span><b class="num">${rs(h[k])}</b><span class="pill ${v >= 0 ? 'gain' : 'loss'}" style="height:24px;font-size:12px">${v >= 0 ? '+' : '−'}${rs(Math.abs(v))}</span></div>`; };
    const diceTxt = (mk.sh.hot > 0) ? ` The Hot tip rolled a ${mk.dice}: ×${BZ.dice[mk.dice]}.` : '';
    return `<p class="eyebrow lilac">Month ${S.month} · what happened</p>
    <h1 class="h1" style="margin-top:8px">${gain ? `Your investments grew ${rs(mk.delta)}.` : `Your investments dropped ${rs(Math.abs(mk.delta))}.`}</h1>
    <div class="card glass" style="margin-top:14px;display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;color:var(--muted)">${rs(mk.before)} → </span><span class="big num" style="font-size:44px">${rs(mk.after)}</span>
      <span class="pill ${gain ? 'gain' : 'loss'}" style="align-self:flex-start">${gain ? '+' : '−'}${(Math.abs(mk.delta) / Math.max(mk.before, 1) * 100).toFixed(1)}% this month</span></div>
    <div class="vtable reveal" style="margin-top:12px">${dl('steady', 'Steady')}${dl('market', 'Market')}${dl('hot', 'Hot tip')}</div>
    <div class="card reveal" style="margin-top:12px;display:flex;flex-direction:column;gap:12px;font-size:15px;line-height:1.5">
      <div><span class="eyebrow" style="color:var(--muted)">The market</span><p style="margin-top:4px">${ev.what}${diceTxt}</p></div>
      <div><span class="eyebrow" style="color:var(--muted)">${mk.cause === 'missed' ? 'What you missed' : 'Why you ' + (gain ? 'gained' : 'lost')}</span><p style="margin-top:4px">${WHY[mk.cause].replace('{hot}', pct(mk.sh.hot))}</p></div>
      <div><span class="eyebrow" style="color:var(--muted)">Your call</span><p style="margin-top:4px">${callLine(mk.q, gain, mk.cause)}</p></div></div>
    <div class="taily-says reveal" style="margin-top:12px">${taily(40, !gain)}<div class="bubble">${gain ? '' : 'It’s okay. Understanding risk is part of learning to invest. '}${NEXT[mk.cause]}</div></div>
    <div style="height:20px"></div><button class="btn" data-act="toBook">Continue</button>`; }, mount:el => revealOn(el) },

  book:{ wash:true, html:() => { const b = S.book, c = BOOKC[b.key];
    return `<p class="eyebrow">From Taily’s Bookshelf · optional</p><h1 class="h1" style="margin-top:8px">One idea for next month</h1>
    <div class="card glass" style="margin-top:16px;display:flex;gap:16px;align-items:center">
      <div style="width:64px;height:88px;border-radius:4px 10px 10px 4px;background:var(--ink);flex:none;box-shadow:inset 6px 0 0 rgba(255,255,255,.1);display:grid;place-items:center">${icon('bookI', 26, '#8BD042', 2)}</div>
      <div style="display:flex;flex-direction:column;gap:4px"><b style="font-size:18px;font-weight:600;line-height:1.2">${c.book}</b><span style="font-size:13px;color:var(--muted)">${c.author}</span><span class="pill lime" style="align-self:flex-start;margin-top:4px;white-space:normal;height:auto;padding:4px 10px">${c.concept}</span></div></div>
    <p style="font-size:15px;line-height:1.5;margin-top:14px"><b>Why now:</b> ${b.why}</p>
    <div id="more" style="display:none;flex-direction:column;gap:10px;margin-top:12px">
      <div class="card" style="font-size:15px;line-height:1.55">${c.summary}</div>
      <div class="card lilac-c" style="font-size:15px;line-height:1.5"><b>In your game:</b> ${b.link}</div>
      <div class="card wash-c" style="font-size:15px;line-height:1.5"><b>Try next month:</b> ${c.takeaway}</div>
      <p style="font-size:12px;color:var(--muted);line-height:1.5">Summary written by Taily in its own words. Credit: ${c.book}, ${c.author}.</p></div>
    <div class="grow" style="min-height:18px"></div><div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn secondary" data-act="readMore" id="rm">${icon('bookI', 20)} Read the idea</button>
      <button class="btn" data-act="nextMonth">${S.month >= 12 ? 'See your year' : `Start Month ${S.month + 1}`}</button></div>`; } },

  yearEnd:{ wash:true, html:() => { const hits = S.track.filter(t => t.hit).length, g = goalOf(), reached = S.save + portTotal() >= g.amount;
    return `<p class="eyebrow">Your year · ${L().title}</p><h1 class="h1" style="margin-top:8px">${reached ? `${esc(g.label)}: done.` : 'A full year, lived.'}</h1>
    <div class="card" style="margin-top:16px;padding:18px 16px 12px">${trackChart()}</div>
    <div class="row" style="margin-top:10px"><div class="card" style="padding:14px"><span style="font-size:12px;color:var(--muted)">Saved</span><div class="num" style="font-size:22px;font-weight:500">${rs(S.save)}</div></div>
      <div class="card" style="padding:14px"><span style="font-size:12px;color:var(--muted)">Invested</span><div class="num" style="font-size:22px;font-weight:500">${rs(portTotal())}</div></div></div>
    <div class="card" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;font-size:15px"><span>${hits} of 12 months on target</span><span>${S.books.length} book ideas collected</span><span>Goal: ${rs(g.amount)} · ${reached ? 'reached' : rs(g.amount - S.save - portTotal()) + ' to go'}</span></div>
    <div class="grow"></div><div style="display:flex;flex-direction:column;gap:10px"><button class="btn" data-act="tab_home">Play another life</button></div>`; },
    mount:el => setTimeout(() => el.querySelectorAll('.tbar').forEach((b, i) => setTimeout(() => b.classList.add('in'), i * 70)), 300) },
};
function billsTotalAtStart(){ return L().fixed.reduce((a, f) => a + f[1], 0) + (S.m ? S.m.paidLater : 0); }

/* ---------- Navigation, history, bottom bar ---------- */
const $app = document.getElementById('app');
let cur = null;
const NOHIST = ['splash', 'intro', 'lose', 'bill', 'news', 'outcome'];
const bar = document.createElement('nav');
bar.className = 'tabbar'; bar.setAttribute('aria-label', 'Game menu'); bar.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr))';
bar.innerHTML = [['home', 'home', 'Home'], ['goals', 'target', 'Goals'], ['back', 'back', 'Back']].map(t => `<button class="tab" data-tab="${t[0]}" data-act="tab_${t[0]}">${icon(t[1], 22)}<span>${t[2]}</span></button>`).join('');
$app.appendChild(bar);
function go(name, dir = 'fwd', opts = {}){
  const def = SCREENS[name];
  if (dir !== 'back' && !opts.noHist && S.screen && S.screen !== name && !NOHIST.includes(S.screen)) { S.hist.push(S.screen); if (S.hist.length > 30) S.hist.shift(); }
  const el = document.createElement('section');
  el.className = 'screen ' + (dir === 'back' ? 'enter-back' : dir === 'up' ? 'enter-up' : 'enter');
  el.innerHTML = (def.wash ? WASH : '') + `<div class="scroller">${def.html()}</div>`;
  $app.insertBefore(el, bar);
  const old = cur; cur = el; void el.offsetWidth;
  requestAnimationFrame(() => { el.classList.remove('enter', 'enter-back', 'enter-up'); if (old){ old.classList.add(dir === 'back' ? 'leave-back' : dir === 'up' ? 'leave-up' : 'leave'); setTimeout(() => old.remove(), 600); } });
  $app.classList.toggle('with-bar', !NOBAR.includes(name) && S.goalSet);
  bar.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === def.tab));
  parallax(el); if (def.mount) def.mount(el);
  S.screen = name; save();
  setTimeout(() => { const h = el.querySelector('h1,h2'); if (h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll:true }); } }, 560);
}
function goBack(){
  if (S.screen === 'card'){ go('hub', 'back'); return; }
  if (S.screen === 'invest'){ go('bazaar', 'back'); return; }
  let prev = S.hist.pop();
  const blocked = ['card', 'arrive', 'bill', 'news', 'outcome', 'invest', 'recap', 'track', 'bazaar', 'book', 'setaside', 'split'];
  while (prev && (prev === S.screen || (blocked.includes(prev) && S.screen !== 'book'))) prev = S.hist.pop();
  if (!prev) prev = S.m && !S.m.done ? 'hub' : 'months';
  go(prev, 'back');
}
function inProgress(){ return !!(S.goalSet && (S.m || S.track.length)); }
function resetLife(){ Object.assign(S, { m:null, mk:null, port:null, track:[], books:[], month:1, save:0, carry:0, happy:START_HAPPY, payLater:[], undo:null, lose:null, snap:null, hist:[], goalSet:false, inv:null, book:null }); }

/* ---------- Actions ---------- */
const ACT = {
  go:a => go(a.dataset.to),
  back:() => goBack(),
  tab_home:() => {
    if (!inProgress()){ resetLife(); go('life', 'back'); return; }
    sheetBox(`<p class="eyebrow">Home</p><h2 class="h2">Choose a new life?</h2><p class="lead ink">Your progress in this life will be gone: your months, savings and investments.</p>
      <div style="display:flex;flex-direction:column;gap:10px"><button class="btn" data-x="yes">Choose a life</button><button class="btn secondary" data-x="no">Keep playing</button></div>`,
      x => { if (x === 'yes'){ resetLife(); go('life', 'back'); } });
  },
  tab_goals:() => goalsSheet(), tab_back:() => goBack(), goals:() => goalsSheet(),
  resume:() => go(S.m && !S.m.done ? 'hub' : 'months'),
  restart:() => { try{ localStorage.removeItem(KEY); }catch(e){} S = fresh(); go('intro', 'back'); },
  introNext:() => { const car = cur.querySelector('#car'), i = Math.round(car.scrollLeft / car.clientWidth); if (i >= 2) go('choose'); else car.scrollTo({ left:(i + 1) * car.clientWidth, behavior:'smooth' }); },
  life:a => { S.life = a.dataset.id; cur.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o === a)); buzz(); save(); },
  pickLife:() => { resetLife(); S.goalPick = L().pick; S.goal = { ...L().goals[L().pick] }; S.needsPlan = L().needs; S.setAside = true; go('name'); },
  skipName:() => { S.name = ''; go('goal'); },
  saveName:() => { S.name = cur.querySelector('#nm').value.trim().slice(0, 20); go('goal'); },
  pickGoal:(a, e) => { const i = +a.dataset.i; if (i === S.goalPick) return; if (e && e.target.closest('input,.stepper')) return;
    S.goalPick = i; S.goal = i < 3 ? { ...L().goals[i] } : { label:'My goal', amount:L().goals[L().pick].amount, custom:true }; buzz(); save(); go('goal', 'fwd', { noHist:true }); },
  amt:a => { S.goal.amount = clamp(S.goal.amount + (+a.dataset.d) * L().step, L().step, L().step * 100); cur.querySelector('#ogAmt').textContent = rs(S.goal.amount); updTarget(); buzz(); save(); },
  confirmGoal:() => { S.goalSet = true; go('months'); },
  startMonth:() => { S.m = null; S.mk = null; S.lose = null; S.undo = null; S.snap = JSON.stringify({ save:S.save, carry:S.carry, happy:S.happy, payLater:S.payLater, port:S.port, books:S.books, track:S.track }); go('arrive'); },
  lockedMonth:a => { buzz(); a.animate([{ transform:'translateX(0)' }, { transform:'translateX(-5px)' }, { transform:'translateX(5px)' }, { transform:'none' }], { duration:300 }); toastAt(a, 'Unlocks as you go'); },
  startBills:() => go('bill'),
  skipBills:() => { cur._finish && cur._finish(); },
  setAside:a => { S.setAside = a.dataset.v === '1'; const rest = toPlan() - (S.setAside ? Math.min(target(), toPlan()) : 0); S.needsPlan = clamp(L().needs + (S.setAside ? 0 : Math.round(target() * .4 / 50) * 50), 0, rest); go('split'); },
  lockPlan:() => { startMonth(); go('hub'); },
  openCard:() => { if (!currentCardId()){ go('recap'); return; } go('card', 'up'); },
  choose:a => {
    const id = currentCardId(); S.undo = JSON.stringify(S.m);
    const res = applyChoice(id, +a.dataset.i);
    if (res.broke !== undefined){ S.lose = { kind:'broke', short:res.broke, need:res.need, label:res.label }; save(); setTimeout(() => go('lose'), 200); return; }
    buzz(); cur.querySelectorAll('.choice').forEach(c => c.disabled = true); a.style.borderColor = 'var(--ink)';
    updateJars(); S.m.lastLine = res.line; save();
    setTimeout(() => resultSheet(res), 450);
  },
  rethinkLast:() => { if (S.undo){ S.m = JSON.parse(S.undo); S.undo = null; S.lose = null; save(); go('card', 'back'); } else ACT.replay(); },
  replay:() => { if (S.snap) Object.assign(S, JSON.parse(S.snap)); S.lose = null; S.m = null; S.undo = null; go('arrive', 'back'); },
  toTrack:() => { endMonth(); go('track'); },
  alloc:a => { const z = S.inv.alloc, k = a.dataset.k, d = +a.dataset.d, left = 100 - z.steady - z.market - z.hot;
    if (d > 0 && left <= 0){ toastAt(a, 'Take some from another stall'); return; }
    z[k] = clamp(z[k] + d, 0, 100); buzz(); save(); refreshAlloc(); },
  doInvest:() => { const z = S.inv, A = z.amt;
    if (!S.port) S.port = { h:{ steady:0, market:0, hot:0 }, invested:0, alloc:{ ...z.alloc }, seq:0, nextEv:null, history:[] };
    ['steady', 'market', 'hot'].forEach(k => S.port.h[k] += A * z.alloc[k] / 100);
    S.port.invested += A; S.port.alloc = { ...z.alloc }; S.save -= A; const tr = lastTrack(); if (tr) tr.save = S.save;
    S.inv = null; ACT.marketMonth(); },
  marketMonth:() => { startMarketMonth(); go('news'); },
  bzChoose:a => { cur.querySelectorAll('.choice').forEach(c => c.disabled = true); a.style.borderColor = 'var(--ink)'; buzz(); resolveMarket(+a.dataset.i); setTimeout(() => go('outcome'), 350); },
  toBook:() => { S.book = pickBook(); S.books.push(S.book.key); save(); go('book'); },
  readMore:() => { const m = cur.querySelector('#more'), b = cur.querySelector('#rm'); const open = m.style.display !== 'flex';
    m.style.display = open ? 'flex' : 'none'; b.innerHTML = open ? 'Hide the idea' : icon('bookI', 20) + ' Read the idea'; if (open){ m.animate([{ opacity:0, transform:'translateY(12px)' }, { opacity:1, transform:'none' }], { duration:400, easing:'cubic-bezier(.2,.8,.2,1)' }); setTimeout(() => m.scrollIntoView({ behavior:'smooth', block:'nearest' }), 50); } },
  nextMonth:() => { S.m = null; S.mk = null; S.book = null; S.month++; save(); if (S.month > 12){ S.month = 12; go('yearEnd'); } else go('months'); },
};
function refreshAlloc(){ const z = S.inv, a = z.alloc, l2 = 100 - a.steady - a.market - a.hot;
  cur.querySelectorAll('[data-pct]').forEach(b => { const k = b.dataset.pct; b.textContent = a[k] + '% · ' + rs(z.amt * a[k] / 100); });
  const lp = cur.querySelector('#left'); lp.textContent = l2 ? l2 + '% still to place' : 'All placed.'; lp.style.color = l2 ? 'var(--loss)' : 'var(--muted)';
  const b = cur.querySelector('#spBtn'); b.disabled = l2 !== 0 || !z.amt; b.textContent = 'Invest ' + rs(z.amt); }
function updTarget(){ const t = cur.querySelector('#tgt'); if (t){ t.textContent = rs(target()); t.animate([{ transform:'scale(1.15)' }, { transform:'none' }], { duration:300 }); } }
$app.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'pickGoal' && e.target.closest('input,.stepper')) return; const f = ACT[a.dataset.act]; if (f){ e.preventDefault(); f(a, e); } });

/* ---------- Bill road ---------- */
function runRoad(el){
  const road = el.querySelector('#road'), p = el.querySelector('#rp'), b = bills(), n = b.length, len = p.getTotalLength(), bub = el.querySelector('#bub'), W = road.clientWidth;
  const ptAt = L => { const pt = p.getPointAtLength(L); return { x:pt.x / 342 * 100, y:pt.y / 400 * 100 }; }, stopL = k => len * (k + 1) / (n + 1);
  const dots = b.map((f, k) => { const q = ptAt(stopL(k)), d = document.createElement('span'); d.className = 'stopdot'; d.style.left = q.x + '%'; d.style.top = q.y + '%'; road.appendChild(d); return d; });
  const tr = document.createElement('span'); tr.className = 'traveller'; road.appendChild(tr);
  const $ = id => el.querySelector('#' + id); let left = incomeAll(), stopped = false;
  bub.style.opacity = '0';
  const travel = (from, to, dur) => new Promise(res => { const t0 = performance.now(); (function step(t){ if (stopped) return res();
    const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, q = ptAt(from + (to - from) * e);
    tr.style.left = q.x + '%'; tr.style.top = q.y + '%'; if (k < 1) requestAnimationFrame(step); else res(); })(t0); });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const show = k => { const f = b[k], q = ptAt(stopL(k));
    bub.innerHTML = `${icon(f[2], 28)}<span class="bl">${f[0]}</span><span class="ba num">−${rs(f[1])}</span>`; bub.setAttribute('aria-label', `${f[0]}: ${rs(f[1])}`);
    bub.classList.remove('in'); bub.style.opacity = '1'; bub.style.left = clamp(q.x / 100 * W, 62, W - 62) + 'px'; bub.style.top = q.y + '%'; void bub.offsetWidth; bub.classList.add('in');
    const cap = $('bcap'); cap.style.opacity = '0';
    setTimeout(() => { $('bt').textContent = f[3]; $('bn').textContent = f[4]; $('ba').textContent = '↓ −' + rs(f[1]); cap.style.opacity = '1'; }, 200);
    const from = left; left -= f[1]; const lp = $('bl'); (function c(t0){ const tick = t => { const k = Math.min(1, (t - t0) / 700); lp.textContent = rs(from - (from - left) * (1 - Math.pow(1 - k, 3))) + ' left'; if (k < 1 && !stopped) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })(performance.now());
    $('bcount').textContent = `Bills · ${k + 1} of ${n}`; $('bsegs').innerHTML = segs(n, k); buzz(); };
  const finish = () => { if (cur !== el || el.dataset.done) return; el.dataset.done = 1; stopped = true;
    dots.forEach(d => d.classList.add('done')); tr.remove(); bub.style.opacity = '0'; $('bsegs').innerHTML = segs(n, n); $('bcount').textContent = `Bills · all ${n} paid`; $('bskip').style.visibility = 'hidden';
    $('bcap').style.display = 'none'; const sm = $('bsum'); sm.style.display = 'flex';
    sm.animate([{ opacity:0, transform:'translateY(24px)' }, { opacity:1, transform:'none' }], { duration:520, easing:'cubic-bezier(.2,.8,.2,1)' });
    const g = $('bgo'); g.disabled = false; g.textContent = 'Plan the month';
    setTimeout(() => el.querySelector('.scroller').scrollTo({ top:sm.offsetTop - 80, behavior:'smooth' }), 120); };
  el._finish = finish;
  (async () => { await wait(500); let at = 0;
    for (let k = 0; k < n; k++){ if (stopped || cur !== el) return; await travel(at, stopL(k), 1300); at = stopL(k); if (stopped) return; show(k); await wait(1500); dots[k].classList.add('done'); }
    if (!stopped){ bub.style.opacity = '0'; await travel(at, len, 900); await wait(300); finish(); } })();
}

/* ---------- Sheets ---------- */
let openSheet = null;
function sheetBox(html, onPick, opts = {}){
  if (openSheet) closeSheet(true);
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog');
  sh.innerHTML = `<div class="grab"></div>` + html;
  $app.append(scrim, sh); openSheet = { scrim, sh };
  requestAnimationFrame(() => { scrim.classList.add('on'); sh.classList.add('on'); });
  if (!opts.lock) scrim.addEventListener('click', () => closeSheet());
  sh.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; closeSheet(); onPick && onPick(b.dataset.x); });
  setTimeout(() => { const f = sh.querySelector('button'); f && f.focus({ preventScroll:true }); }, 450);
  return sh;
}
function closeSheet(now){ if (!openSheet) return; const { scrim, sh } = openSheet; openSheet = null; scrim.classList.remove('on'); sh.classList.remove('on'); setTimeout(() => { scrim.remove(); sh.remove(); }, now ? 0 : 450); }

function resultSheet(res){
  const m = S.m, weekEnd = res.weekEnded, burnout = res.burnout;
  const label = burnout ? 'Continue' : m.done ? 'Finish the month' : weekEnd ? 'Next week' : 'Next card';
  sheetBox(`<div class="deltas">${res.deltas.length ? res.deltas.map(d => `<span class="pill ${d[0]}">${d[1]}</span>`).join('') : '<span class="pill">Nothing spent</span>'}</div>
    <div class="taily-says">${taily(44, frown())}<div class="bubble">${esc(res.line)}</div></div>
    ${weekEnd && !burnout ? `<div class="card wash-c" style="display:flex;flex-direction:column;gap:4px"><b style="font-size:16px;font-weight:600">End of week ${m.week + 1}</b><span style="font-size:14px">Stress takes ${WEEK_STRESS} Happiness points. Only wants refill it.</span></div>` : ''}
    <div class="row"><button class="btn secondary" data-x="undo">${icon('undo', 18)} Rethink</button><button class="btn" data-x="next">${label}</button></div>`, x => {
    if (x === 'undo'){ S.m = JSON.parse(S.undo); S.undo = null; save(); go('card', 'back', { noHist:true }); return; }
    if (burnout){ S.lose = { kind:'burnout' }; save(); go('lose'); return; }
    const ev = cur.querySelector('#ev'); if (ev) ev.classList.add('gone');
    if (weekEnd){ endWeek(); if (S.m.happy <= BURNOUT){ S.lose = { kind:'burnout' }; save(); go('lose'); return; } }
    S.undo = null; save();
    setTimeout(() => { if (S.m.done) go('recap'); else if (weekEnd) go('hub', 'back', { noHist:true }); else go('card', 'fwd', { noHist:true }); }, 300);
  }, { lock:true });
}

function goalsSheet(){
  const g = goalOf(), t = target(), m = S.m, cash = m ? m.jars.save : S.save, inv = portTotal(), have = cash + inv;
  const prev = S.track.length > 1 ? S.track[S.track.length - 2].save : 0, lastS = S.track.length ? lastTrack().save : 0;
  const trend = m ? (added() >= t ? 'up' : added() > 0 ? 'flat' : 'down') : (S.track.length ? (lastS > prev ? 'up' : lastS < prev ? 'down' : 'flat') : 'flat');
  const monthsLeft = have >= g.amount ? 0 : Math.ceil((g.amount - have) / Math.max(t, 1));
  sheetBox(`<p class="eyebrow">Your goal</p><h2 class="h2">${esc(g.label)}</h2>
    <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="big num" style="font-size:40px">${rs(have)}</span><span class="num" style="color:var(--muted)">of ${rs(g.amount)}</span></div>
    <div class="goalbar"><i style="width:0" id="gbar"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px;font-weight:600">Savings track</b>
      <span class="pill ${trend === 'up' ? 'gain' : trend === 'down' ? 'loss' : ''}">${icon(trend === 'down' ? 'down' : 'up', 14, trend === 'down' ? '#B03A24' : '#22703A', 2.4)} ${trend === 'up' ? 'Going up' : trend === 'down' ? 'Going down' : 'Holding steady'}</span></div>
    <div class="card" style="padding:16px 14px 10px">${trackChart(120)}</div>
    <div class="row"><div class="card" style="padding:14px"><span style="font-size:12px;color:var(--muted)">In Save</span><div class="num" style="font-size:20px;font-weight:500">${rs(cash)}</div></div>
      <div class="card" style="padding:14px"><span style="font-size:12px;color:var(--muted)">${inv ? 'Invested' : 'Monthly target'}</span><div class="num" style="font-size:20px;font-weight:500">${rs(inv || t)}</div></div>
      <div class="card" style="padding:14px"><span style="font-size:12px;color:var(--muted)">Months to go</span><div class="num" style="font-size:20px;font-weight:500">${monthsLeft}</div></div></div>
    ${m ? `<p style="font-size:13px;color:var(--muted)">This month so far: ${rs(added())} of your ${rs(t)} target.</p>` : ''}
    <button class="btn" data-x="close">Close</button>`);
  setTimeout(() => { const b = document.getElementById('gbar'); if (b) b.style.width = clamp(have / g.amount * 100, 0, 100) + '%'; document.querySelectorAll('.sheet .tbar').forEach((x, i) => setTimeout(() => x.classList.add('in'), i * 60)); }, 350);
}

/* ---------- Motion helpers ---------- */
function buzz(){ try{ navigator.vibrate && navigator.vibrate(8); }catch(e){} }
function countUp(el, a, b, d, plain){ const t0 = performance.now(); (function f(t){ const p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3), v = a + (b - a) * e; el.textContent = plain ? Math.round(v) : rs(v); if (p < 1) requestAnimationFrame(f); })(t0); }
function drip(jar, text, up){ const d = document.createElement('span'); d.className = 'drip'; d.textContent = text; d.style.color = up ? 'var(--gain)' : 'var(--loss)';
  const r = jar.getBoundingClientRect(), ar = $app.getBoundingClientRect(); d.style.left = (r.left - ar.left + r.width / 2 - 18) + 'px'; d.style.top = (r.top - ar.top - 10) + 'px'; $app.appendChild(d); setTimeout(() => d.remove(), 1300); }
function toastAt(node, text){ const r = node.getBoundingClientRect(), ar = $app.getBoundingClientRect(), t = document.createElement('span');
  t.className = 'drip'; t.textContent = text; t.style.color = 'var(--loss)'; t.style.left = clamp(r.left - ar.left - 20, 8, ar.width - 160) + 'px'; t.style.top = (r.top - ar.top - 12) + 'px'; $app.appendChild(t); setTimeout(() => t.remove(), 1300); }
function revealOn(el){ const sc = el.querySelector('.scroller'); if (!('IntersectionObserver' in window)){ el.querySelectorAll('.reveal').forEach(n => n.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } }), { root:sc, threshold:.12 });
  el.querySelectorAll('.reveal').forEach(n => io.observe(n)); }
function parallax(el){ const sc = el.querySelector('.scroller'), wash = el.querySelector('.wash'); if (!wash) return;
  sc.addEventListener('scroll', () => wash.style.setProperty('--sy', (-sc.scrollTop * .35) + 'px'), { passive:true });
  el.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = el.getBoundingClientRect();
    wash.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5) * -40 + 'px'); wash.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5) * -40 + 'px'); }); }

/* ---------- Boot ---------- */
if (!S.hist) S.hist = [];
if (!Array.isArray(S.payLater)) S.payLater = [];
go('splash', 'up', { noHist:true });
