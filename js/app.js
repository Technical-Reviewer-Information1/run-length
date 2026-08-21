(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ===== 共通：ランレングス法 ===== */
  function runsOf(cells) {                       // cells: 0/1 の配列（行優先）
    const out = [];
    let i = 0;
    while (i < cells.length) {
      let j = i; while (j < cells.length && cells[j] === cells[i]) j++;
      out.push({ v: cells[i], n: j - i }); i = j;
    }
    return out;
  }
  const bitsFor = max => Math.max(1, Math.ceil(Math.log2(max + 1)));
  function fromRuns(list, start) {               // [6,4,5,4,6] → 0/1 配列
    const out = []; let v = start;
    list.forEach(n => { for (let k = 0; k < n; k++) out.push(v); v = 1 - v; });
    return out;
  }
  const FIG1 = fromRuns([6, 4, 5, 4, 6], 1);     // 本文 図1
  const FIG2 = fromRuns([6, 3, 6, 4, 6], 1);     // 本文 図2
  function gridHTML(cells, N, cur, small) {
    let h = '';
    for (let y = 0; y < N; y++) {
      h += '<tr>';
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        h += '<td class="' + (cells[i] ? 'on' : 'off') + (cur === i ? ' cur' : '') + '" data-i="' + i + '"></td>';
      }
      h += '</tr>';
    }
    return h;
  }

  /* ===== STEP 1 ===== */
  let dPos = 0;
  function drawDemo() {
    $('demoGrid').innerHTML = gridHTML(FIG1, 5, dPos < 25 ? dPos : -1);
    const seen = FIG1.slice(0, dPos + 1);
    const rs = dPos < 0 ? [] : runsOf(seen);
    $('demoRuns').innerHTML = rs.length
      ? rs.map((r, i) => '<span class="r ' + (r.v ? 'b' : 'w') + (i === rs.length - 1 && dPos < 24 ? ' cur' : '') + '">' + r.n + '</span>').join('')
      : '<span class="small" style="color:var(--muted)">「1マス進む」を押してください</span>';
    const done = dPos >= 24;
    const full = runsOf(FIG1);
    if (done) {
      const max = Math.max(...full.map(r => r.n)), b = bitsFor(max);
      $('demoEq').innerHTML = 'データは <strong>' + full.map(r => r.n).join('，') + '</strong><br>' +
        '最大値は ' + max + ' → 表すには <strong>' + b + 'ビット</strong>必要<br>' +
        b + '（ビット） × ' + full.length + '（個） ＝ <strong>' + (b * full.length) + '（ビット）</strong>';
      const before = 25, after = b * full.length;
      $('demoNote').className = 'note ok';
      $('demoNote').innerHTML = '圧縮前は 25画素 × 1ビット ＝ <strong>25ビット</strong>。圧縮後は <strong>' + after + 'ビット</strong>。' +
        '圧縮率は ' + after + ' ÷ ' + before + ' × 100 ＝ <strong>' + Math.round(after / before * 100) + '％</strong> です。';
    } else {
      $('demoEq').innerHTML = (dPos + 1) + ' マス目まで読み取りました（全25マス）。';
      $('demoNote').className = 'note info';
      $('demoNote').innerHTML = '色が変わるたびに新しいかたまりが始まります。' +
        '<span class="small">読む順序は「左から右へ、右端まで行ったら次の行の左端へ」。</span>';
    }
    $('dPrev').disabled = dPos <= 0; $('dNext').disabled = done;
  }

  /* ===== STEP 2 ===== */
  let N = 5, cells = FIG1.slice();
  function pattern(name, n) {
    const a = new Array(n * n).fill(0);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (name === 'stripe') a[i] = y % 2 === 0 ? 1 : 0;
      else if (name === 'vstripe') a[i] = x % 2 === 0 ? 1 : 0;
      else if (name === 'check') a[i] = (x + y) % 2 === 0 ? 1 : 0;
      else a[i] = 0;
    }
    return a;
  }
  function drawEdit() {
    $('sizeV').textContent = N; $('sizeV2').textContent = N;
    $('editGrid').innerHTML = gridHTML(cells, N, -1);
    $('editGrid').querySelectorAll('td').forEach(td => td.addEventListener('click', () => {
      const i = +td.dataset.i; cells[i] = cells[i] ? 0 : 1; drawEdit();
    }));
    const rs = runsOf(cells);
    $('editRuns').innerHTML = rs.map(r => '<span class="r ' + (r.v ? 'b' : 'w') + '">' + r.n + '</span>').join('');
    const max = Math.max(...rs.map(r => r.n)), b = bitsFor(max);
    const before = N * N, after = b * rs.length, ratio = after / before * 100;
    $('mRuns').textContent = rs.length + ' 個';
    $('mBits').textContent = max + ' ／ ' + b + ' ビット';
    $('mBefore').textContent = before + ' ビット';
    $('mAfter').textContent = after + ' ビット';
    $('mRatio').textContent = (Math.round(ratio * 10) / 10) + '％';
    const n = $('editNote');
    n.className = 'note ' + (ratio < 100 ? 'ok' : 'ng');
    n.innerHTML = '計算：' + b + '（ビット） × ' + rs.length + '（個） ＝ ' + after + '（ビット）。' +
      after + ' ÷ ' + before + ' × 100 ＝ <strong>' + (Math.round(ratio * 10) / 10) + '％</strong><br>' +
      (ratio < 60 ? '同じ色が長く続いているので、よく縮んでいます。'
        : ratio < 100 ? '縮んではいますが、まだかたまりの数が多めです。'
          : '<strong>圧縮したのに大きくなっています。</strong>色がひんぱんに変わる絵では、ランレングス法は効きません。') +
      '　<span class="small">横しま模様は行ごとに色がそろうのでよく縮み、縦しま・市松模様は1マスごとに色が変わるので縮みません。</span>';
  }

  /* ===== STEP 3 ===== */
  const CANDS = [
    { k: '⓪', runs: [6, 3, 2, 3, 2, 3, 6], start: 1 },
    { k: '①', runs: [2, 3, 2, 5, 1, 5, 2, 3, 2], start: 1 },
    { k: '②', runs: [5, 5, 5, 5, 5], start: 1 },
    { k: '③', runs: new Array(25).fill(1), start: 1 }
  ];
  let candShown = false;
  function drawCands() {
    $('candBox').innerHTML = CANDS.map((c, i) => {
      const cells = fromRuns(c.runs, c.start);
      const rs = runsOf(cells), max = Math.max(...rs.map(r => r.n)), b = bitsFor(max);
      return '<div class="c' + (candShown && b * rs.length === 15 ? ' sel' : '') + '"><h4>' + c.k + '</h4>' +
        '<table class="rlgrid small">' + gridHTML(cells, 5, -1) + '</table>' +
        (candShown ? '<div class="d">' + rs.map(r => r.n).join('，') + '<br>' + b + '×' + rs.length + '＝<strong>' + (b * rs.length) + 'ビット</strong></div>' : '') +
        '</div>';
    }).join('');
    if (candShown) {
      $('candTable').innerHTML = '<thead><tr><th></th><th>手順2のデータ</th><th>必要なビット数</th><th>圧縮後</th><th>圧縮率</th></tr></thead><tbody>' +
        CANDS.map(c => {
          const cells = fromRuns(c.runs, c.start), rs = runsOf(cells);
          const max = Math.max(...rs.map(r => r.n)), b = bitsFor(max), after = b * rs.length;
          return '<tr' + (after === 15 ? ' style="background:var(--warn-bg);font-weight:700"' : '') + '><td>' + c.k + '</td>' +
            '<td class="mono">' + rs.map(r => r.n).join('，') + '</td><td class="mono">' + b + ' ビット</td>' +
            '<td class="mono">' + b + '×' + rs.length + '＝' + after + ' ビット</td>' +
            '<td class="mono">' + Math.round(after / 25 * 100) + '％</td></tr>';
        }).join('') + '</tbody>';
      $('candNote').className = 'note ok';
      $('candNote').innerHTML = '圧縮後のデータ量が最も小さいのは <strong>②（15ビット・60％）</strong>。よって【カ】の答えは②です。' +
        '②は<strong>1行ごとに色がそろった横しま模様</strong>なので、かたまりが5個しかできません。' +
        '③は1マスごとに色が変わるので25個のかたまりになり、1ビットで表せてもデータ量は25ビット（100％）＝まったく縮みません。';
    } else {
      $('candTable').innerHTML = '';
      $('candNote').className = 'note info';
      $('candNote').textContent = 'まず自分で数えてみましょう。読む順序は左上から1行ずつです。';
    }
  }

  /* ===== STEP 4 ===== */
  const BLANKS = [
    { k: 'ア', q: '【A】と【B】に入る語の組合せは', ch: ['A：ハフマン符号化　B：可逆圧縮', 'A：ハフマン符号化　B：非可逆圧縮', 'A：ランレングス法　B：可逆圧縮', 'A：ランレングス法　B：非可逆圧縮'],
      a: 'A：ランレングス法　B：可逆圧縮',
      why: '同じデータの連続を「データ＋連続する回数」で表すのがランレングス法。完全にもとに戻せるので可逆圧縮です。' },
    { k: 'イウ', q: '図2の画像を圧縮したときのデータ量は', ch: ['12ビット', '15ビット', '18ビット', '25ビット'], a: '15ビット',
      why: '図2のデータは 6，3，6，4，6 の5個。最大値6は3ビットで表せるので 3×5＝15ビットです。' },
    { k: 'エオ', q: '図2の圧縮率は', ch: ['40％', '50％', '60％', '75％'], a: '60％',
      why: '圧縮前は25画素×1ビット＝25ビット。15÷25×100＝60％です。' },
    { k: 'カ', q: '4つの画像のうち、圧縮率が最も小さくなるものは', ch: ['⓪', '①', '②', '③'], a: '②',
      why: '②は横しま模様でかたまりが5個。3×5＝15ビットで最小です（STEP 3 の表）。' },
    { k: 'キ', q: 'ランレングス法の欠点として最も適当なものは',
      ch: ['連続して出現するデータが多いと、圧縮効率が下がる', '連続して出現するデータが少ないと、圧縮効率が下がる', 'もとのデータに復元するためには、もう一度圧縮を行う必要がある', '圧縮されたデータは完全にもとに戻すことができなくなる'],
      a: '連続して出現するデータが少ないと、圧縮効率が下がる',
      why: '「ABCDE」は「A1B1C1D1E1」となり、かえって増えてしまいます。STEP 2 で市松模様を試すと確かめられます。なお可逆圧縮なので、完全にもとに戻せます。' }
  ];
  let bAns = {};
  function drawBlanks() {
    $('blankBox').innerHTML = BLANKS.map((b, i) => {
      const long = b.ch.some(c => c.length > 12);
      return '<div' + (i ? ' style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"' : '') + '>' +
        '<p class="pq">【' + b.k + '】　' + b.q + '</p>' +
        '<div class="choice4' + (long ? ' v' : '') + '" data-i="' + i + '">' + b.ch.map((c, j) =>
          '<button class="btn" data-i="' + i + '" data-c="' + c + '" style="text-align:' + (long ? 'left' : 'center') + '">' +
          '⓪①②③'[j] + '　' + c + '</button>').join('') +
        '</div><div class="note" id="bfb' + i + '" hidden></div></div>';
    }).join('');
    $('blankBox').querySelectorAll('button[data-c]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, b = BLANKS[i], ok = btn.dataset.c === b.a;
      const row = $('blankBox').querySelector('.choice4[data-i="' + i + '"]');
      row.classList.add('locked');
      [...row.children].forEach(x => { if (x.dataset.c === b.a) x.classList.add('correct'); else if (x === btn) x.classList.add('wrong'); });
      const fb = $('bfb' + i);
      fb.hidden = false; fb.className = 'note ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = (ok ? '正解。' : '正解は <strong>' + b.a + '</strong>。') + b.why;
      bAns[i] = ok;
      const done = Object.keys(bAns).length, right = Object.values(bAns).filter(Boolean).length;
      const n = $('blankNote');
      n.className = 'note ' + (done === BLANKS.length ? (right === done ? 'ok' : 'warn') : 'info');
      n.innerHTML = done + ' / ' + BLANKS.length + ' 問解答（正解 ' + right + ' 問）' +
        (done === BLANKS.length ? '<br>本文の答えは【ア】②　【イウ】15　【エオ】60　【カ】②　【キ】① です。' : '');
    }));
    $('blankNote').className = 'note info';
    $('blankNote').textContent = '0 / ' + BLANKS.length + ' 問解答';
  }

  function init() {
    $('dNext').addEventListener('click', () => { if (dPos < 24) { dPos++; drawDemo(); } });
    $('dPrev').addEventListener('click', () => { if (dPos > 0) { dPos--; drawDemo(); } });
    $('dAll').addEventListener('click', () => { dPos = 24; drawDemo(); });
    $('dReset').addEventListener('click', () => { dPos = 0; drawDemo(); });
    $('size').addEventListener('input', () => {
      N = +$('size').value;
      cells = N === 5 ? FIG1.slice() : pattern('clear', N);
      drawEdit();
    });
    document.querySelectorAll('button[data-pat]').forEach(b => b.addEventListener('click', () => {
      const p = b.dataset.pat;
      if (p === 'fig1' || p === 'fig2') { N = 5; $('size').value = 5; cells = (p === 'fig1' ? FIG1 : FIG2).slice(); }
      else cells = pattern(p, N);
      drawEdit();
    }));
    $('showCand').addEventListener('click', () => { candShown = true; drawCands(); });
    window.Terms.glossary($('glossBox'), ['ランレングス法', '可逆圧縮', '非可逆圧縮', '圧縮率', 'ハフマン符号化', '画素', 'ビット']);
    drawDemo(); drawEdit(); drawCands(); drawBlanks();
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
