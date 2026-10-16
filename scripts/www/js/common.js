/* 共享工具函数 */
async function apiGet(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('请求失败 ' + url);
  return r.json();
}
async function apiPost(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('提交失败 ' + url);
  return r.json();
}
let toastTimer = null;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* 综合层级：A/B/C（根据答题正确率） */
function levelByAccuracy(acc) {
  if (acc == null) return 'C';
  if (acc >= 0.8) return 'A';
  if (acc >= 0.5) return 'B';
  return 'C';
}

/* 从提交记录计算某学生正确率（pre + pra，媒体题除外）
   口径：每题只取第一次提交（记录按时间 ASC，首个即第一次；pra 重试本就不入库，此处防御旧数据），
   重试改对不提升正确率，保证 A/B/C 作业分层只由第一次作答表现决定。 */
function accuracyOf(submissions, sid) {
  const first = {};
  submissions.forEach((s) => {
    if (!s || s.sid !== sid || (s.type !== 'pre' && s.type !== 'pra')) return;
    const key = s.type + ':' + s.qid;
    if (!(key in first)) first[key] = s;
  });
  const scored = Object.keys(first).map((k) => first[k]).filter((s) => s.correct !== null);
  if (scored.length === 0) return null;
  const ok = scored.filter((s) => s.correct === true).length;
  return ok / scored.length;
}

/* 小正方体俯视图渲染（作业 cubes 题型） */
function renderCubes(container, cubes) {
  // 根据 (x,y) 平面 + z 高度生成俯视图平面映射（简单示意）
  const map = {};
  let maxX = 0, maxY = 0;
  cubes.forEach(([x, y, z]) => {
    map[x + ',' + y] = (map[x + ',' + y] || 0) + 1;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });
  for (let row = maxY; row >= 0; row--) {
    const r = document.createElement('div');
    r.className = 'cube-row';
    for (let col = 0; col <= maxX; col++) {
      const c = document.createElement('span');
      c.className = 'cube';
      c.style.cssText = 'display:inline-block;border:2px solid var(--blue);border-radius:4px;background:' +
        (map[col + ',' + row] ? 'var(--blue-light)' : '#fff') + ';';
      c.textContent = map[col + ',' + row] || '';
      r.appendChild(c);
    }
    container.appendChild(r);
  }
}

/* 作业选项（cubes 题型：从给定 grid 渲染俯视图平面） */
function renderCubeOpt(optionGrid) {
  // option 是形如 [[1,1],[1,0]] 的 2D 网格
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:inline-flex;flex-direction:column;gap:3px;';
  for (let r = 0; r < optionGrid.length; r++) {
    const row = document.createElement('div');
    row.className = 'cube-row';
    for (let c = 0; c < optionGrid[r].length; c++) {
      const cell = document.createElement('span');
      cell.style.cssText = 'width:18px;height:18px;border:2px solid var(--blue);border-radius:3px;background:' +
        (optionGrid[r][c] ? 'var(--blue-light)' : '#fff') + ';display:inline-block;';
      row.appendChild(cell);
    }
    wrap.appendChild(row);
  }
  return wrap;
}