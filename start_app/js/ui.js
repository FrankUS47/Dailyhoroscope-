const $ = id => document.getElementById(id);
const yearSelect = $('yearSelect');
const monthSelect = $('monthSelect');
const daySelect = $('daySelect');
const targetYearSelect = $('targetYearSelect');
const countrySelect = $('countrySelect');
const citySelect = $('citySelect');

const curY = new Date().getFullYear();
for (let y = curY; y >= 1930; y--) yearSelect.add(new Option(`${y} 年`, y));
for (let m = 1; m <= 12; m++) monthSelect.add(new Option(`${m} 月`, m));
for (let ty = curY; ty <= curY + 10; ty++) targetYearSelect.add(new Option(`${ty} 西元年`, ty));
Object.keys(COUNTRIES).forEach(c => countrySelect.add(new Option(c, c)));

function updateDays() {
    const keep = parseInt(daySelect.value) || 1;
    daySelect.innerHTML = '';
    const days = new Date(parseInt(yearSelect.value), parseInt(monthSelect.value), 0).getDate();
    for (let d = 1; d <= days; d++) daySelect.add(new Option(`${d} 日`, d));
    daySelect.value = Math.min(keep, days);
}

function updateManualPanel() {
    const info = COUNTRIES[countrySelect.value];
    const item = info.list[citySelect.selectedIndex];
    const manual = item && item[1] === null;
    $('manualPanel').style.display = manual ? 'block' : 'none';
    if (manual && $('manTz').value === '') $('manTz').value = info.tz === null ? -5 : info.tz;
}

function updateCities() {
    citySelect.innerHTML = '';
    COUNTRIES[countrySelect.value].list.forEach((c, i) => citySelect.add(new Option(c[0], i)));
    $('manTz').value = '';
    updateManualPanel();
}

yearSelect.addEventListener('change', updateDays);
monthSelect.addEventListener('change', updateDays);
countrySelect.addEventListener('change', updateCities);
citySelect.addEventListener('change', updateManualPanel);
updateDays();
updateCities();

function switchTab(tabKey, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $(`tab-${tabKey}`).classList.add('active');
    // 讓被點選的分頁在橫向滑動列中保持可見
    if (btn.scrollIntoView) { try { btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) {} }
}

function showError(msg) {
    const el = $('errorMsg');
    el.innerText = msg;
    el.style.display = msg ? 'block' : 'none';
}

function signOf(lon) { return SIGNS[Math.floor(lon / 30) % 12]; }
function fmtDeg(lon) {
    const inSign = lon % 30;
    const deg = Math.floor(inSign);
    const min = Math.floor((inSign - deg) * 60);
    return `${deg}°${String(min).padStart(2, '0')}′`;
}

function renderScoresHtml(s) {
    const row = (label, v) => `
        <div class="score-row">
            <div class="score-header"><span>${label}</span><b>${v}%</b></div>
            <div class="score-bar-bg"><div class="score-bar-fill" style="width:${v}%;"></div></div>
        </div>`;
    return row('整體運指數', s.overall) + row('愛情運指數', s.love) + row('事(學)業運指數', s.career) + row('財運指數', s.wealth);
}

// 讀取表單並換算出生時刻（UTC 毫秒）、緯度、經度
function readBirthInput() {
    const y = parseInt(yearSelect.value), m = parseInt(monthSelect.value), d = parseInt(daySelect.value);
    let hh, mm = 0;
    const exact = $('exactTime').value;
    if (exact) {
        [hh, mm] = exact.split(':').map(Number);
    } else {
        hh = parseInt($('hourSelect').value);
    }

    const country = countrySelect.value;
    const info = COUNTRIES[country];
    const item = info.list[citySelect.selectedIndex];
    let lat = item[1], lon = item[2];
    const zone = (typeof item[3] === 'string') ? item[3] : (info.zone || null);
    let tzMin = null, dst = false, utcMs;
    const assumeStd = $('stdCheck').checked;

    if (lat === null) {
        lat = parseFloat($('manLat').value);
        lon = parseFloat($('manLon').value);
        const tz = parseFloat($('manTz').value);
        if (isNaN(lat) || isNaN(lon) || isNaN(tz)) return { error: '請輸入出生地的緯度、經度與時區。' };
        if (lat < -66 || lat > 66) return { error: '緯度需介於 -66 到 66 之間（極圈附近上升點無法穩定計算）。' };
        if (lon < -180 || lon > 180) return { error: '經度需介於 -180 到 180 之間。' };
        dst = $('dstCheck').checked && !assumeStd;
        tzMin = Math.round((tz + (dst ? 1 : 0)) * 60);
        utcMs = Date.UTC(y, m - 1, d, hh, mm) - tzMin * 60000;
    } else if (zone && LocalTime.supported(zone)) {
        const r = LocalTime.toUtc(y, m, d, hh, mm, zone, assumeStd);
        utcMs = r.utcMs; tzMin = r.offsetMin; dst = r.dst;
    } else {
        tzMin = (info.tz || 0) * 60;
        utcMs = Date.UTC(y, m - 1, d, hh, mm) - tzMin * 60000;
    }
    return { ms: utcMs, lat, lon, y, m, d, hh, mm, country, city: item[0], tzMin, dst, assumeStd };
}

function generateAllAnalysis() {
    showError('');
    const inp = readBirthInput();
    if (inp.error) { showError(inp.error); return; }

    const tYear = parseInt(targetYearSelect.value);
    const pos = AstroCalc.positions(inp.ms, true);
    const ascLon = AstroCalc.ascendant(inp.ms, inp.lat, inp.lon);
    const sun = signOf(pos.Sun.lon), moon = signOf(pos.Moon.lon), asc = signOf(ascLon);
    const sunIdx = SIGNS.indexOf(sun), ascIdx = SIGNS.indexOf(asc);

    // 標頭
    $('dispSunSign').innerText = `${sun.sym} ${sun.name}（${sun.elem}）`;
    $('dispMoonSign').innerText = `${moon.sym} ${moon.name}（${moon.elem}）`;
    $('dispAscSign').innerText = `${asc.sym} ${asc.name}（${asc.elem}/${asc.qual}星座）`;
    $('dispSunDeg').innerText = fmtDeg(pos.Sun.lon) + (pos.Sun.lon % 30 < 0.5 || pos.Sun.lon % 30 > 29.5 ? '　接近星座交界，建議核對出生時間' : '');
    $('dispMoonDeg').innerText = fmtDeg(pos.Moon.lon);
    $('dispAscDeg').innerText = fmtDeg(ascLon);
    const timeStr = `${String(inp.hh).padStart(2, '0')}:${String(inp.mm).padStart(2, '0')}`;
    const tzSign = inp.tzMin < 0 ? '-' : '+';
    const tzAbs = Math.abs(inp.tzMin);
    const tzStr = `UTC${tzSign}${Math.floor(tzAbs / 60)}${tzAbs % 60 ? ':' + String(tzAbs % 60).padStart(2, '0') : ''}`;
    const dstNote = inp.dst ? '，當時實施夏令時間，已扣除一小時' : (inp.assumeStd ? '，輸入時間視為標準時間' : '');
    $('dispBirthPlace').innerText = `📍 出生地點：${inp.country} ${inp.city} ｜ 出生時間：${inp.y}年${inp.m}月${inp.d}日 ${timeStr}（${tzStr}${dstNote}）`;

    // 開運資訊（依太陽星座）
    const DIRS = { '火象': '正南方', '土象': '正北方', '風象': '正東方', '水象': '正西方' };
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    $('luckNum').innerText = sun.nums;
    $('luckColor').innerText = sun.colors;
    $('luckDir').innerText = DIRS[sun.elem];
    $('luckHour').innerText = SHICHEN[(sunIdx * 5 + dayOfYear) % 12];
    $('luckSign').innerText = SIGNS[(sunIdx + 4) % 12].name;

    // Tab 1：十大行星卡片
    $('planetCards').innerHTML = PLANET_INFO.map(p => {
        const lon = pos[p.key].lon;
        const sg = signOf(lon);
        const house = (SIGNS.indexOf(sg) - ascIdx + 12) % 12;
        const asp = Fortune.aspectBetween(lon, ascLon, 6);
        const aspText = asp ? `與上升點形成${asp.name}` : '與上升點無緊密相位';
        const retro = pos[p.key].retro ? ' ℞' : '';
        const sIdx = SIGNS.indexOf(sg);
        const dg = Interpret.dignity(p.key, sIdx);
        const ex = Interpret.SIGN_EXTRA[sIdx];
        const dgHtml = dg ? `<p style="margin-top:6px;"><b style="color:var(--accent-gold);">【${dg.label}】</b>${dg.text}</p>` : '';
        const retroHtml = pos[p.key].retro ? `<p style="margin-top:6px;"><b style="color:var(--accent-cyan);">℞ </b>${Interpret.RETRO_TEXT}</p>` : '';
        return `
        <div class="planet-card">
            <h4><span>${p.label}</span><span style="color:var(--accent-gold);">${sg.sym} ${sg.name} ${fmtDeg(lon)}${retro}</span></h4>
            <p>${p.desc}在${sg.name}，傾向以「${sg.style}」的方式運作。</p>
            <p style="margin-top:6px;">✅ 優勢：${ex.gift}　⚠️ 留意：${ex.shadow}</p>
            ${dgHtml}${retroHtml}
            <div class="planet-relation">💡 <b>落第 ${house + 1} 宮（${HOUSE_MEANING[house]}）</b>；${aspText}。</div>
        </div>`;
    }).join('') + `
        <div class="planet-card" style="border-left-color: var(--accent-gold);">
            <h4><span>🌅 上升點 (ASC)</span><span style="color:var(--accent-gold);">${asc.sym} ${asc.name} ${fmtDeg(ascLon)}</span></h4>
            <p>第 1 宮的起點，主宰第一印象、外貌氣質與面對世界的方式，在${asc.name}展現為「${asc.style}」。</p>
            <div class="planet-relation">💡 上升點是所有行星能量向外表達的入口，其他行星的宮位皆以它為基準。</div>
        </div>`;

    // 本命綜合解讀
    const lons = {};
    PLANET_INFO.forEach(p => { lons[p.key] = pos[p.key].lon; });
    $('natalRuler').innerHTML = Interpret.chartRuler(ascIdx, lons, ascLon, SIGNS, HOUSE_MEANING);
    const ph = Interpret.moonPhase(pos.Sun.lon, pos.Moon.lon);
    $('natalPhaseTitle').innerText = `🌗 出生月相：${ph.name}（太陽與月亮相距 ${Math.round(ph.angle)}°）`;
    $('natalPhase').innerHTML = `<p>${ph.text}</p>`;
    const bal = Interpret.balance(lons, ascLon);
    const bar = (label, v) => `<div class="score-row"><div class="score-header"><span>${label}</span><b>${v}</b></div><div class="score-bar-bg"><div class="score-bar-fill" style="width:${Math.round(v / bal.total * 100)}%;"></div></div></div>`;
    $('natalBars').innerHTML = Object.entries(bal.e).map(([k, v]) => bar(k, v)).join('') + Object.entries(bal.m).map(([k, v]) => bar(k + '星座', v)).join('');
    $('natalBalance').innerHTML = bal.notes.map(t => `<p>${t}</p>`).join('') + `<div class="hint">計分方式：太陽、月亮、上升點各 2 分，其餘八顆行星各 1 分，共 ${bal.total} 分。</div>`;
    const nasp = Interpret.natalAspects(lons, ascLon).slice(0, 12);
    $('natalAspects').innerHTML = nasp.length ? nasp.map(Interpret.aspectLine).join('') : '<li>沒有明顯的緊密相位。</li>';

    // Tab 2：模式、元素、陰陽
    $('ascModeTitle').innerText = `⚖️ 上升 ${asc.name} 的模式特質：【${asc.qual}星座】`;
    const MODE = {
        '基本': '<b>基本星座上升（白羊、巨蟹、天秤、摩羯）：</b>具備強烈的自發性與開創精神。習慣主動邁出第一步，面對環境變化能迅速採取行動，人生態度帶有明確的方向感與領導欲望。',
        '固定': '<b>固定星座上升（金牛、獅子、天蠍、水瓶）：</b>具備高度的專注力、堅毅度與穩定性。一旦認定目標就不輕易動搖，外在表現沉穩可靠，但需留意固執與抗拒改變的傾向。',
        '變動': '<b>變動星座上升（雙子、處女、射手、雙魚）：</b>具備極佳的環境適應力與多元靈活性。善於觀察局勢並快速調整姿態，多才多藝且具備優異的協調能力，需留意方向不夠堅定。'
    };
    $('ascModeDesc').innerHTML = MODE[asc.qual];

    $('ascElemTitle').innerText = `🔥 上升 ${asc.name} 的四元素特質：【${asc.elem}星座】`;
    const ELEM = {
        '火象': '<b>火象上升（白羊、獅子、射手）：</b>外在展現熱情、自信、直率與勇氣。第一印象充滿活力，習慣以直覺與意志引導行動，勇於接受挑戰並感染他人。',
        '土象': '<b>土象上升（金牛、處女、摩羯）：</b>外在展現務實、沉穩、謹慎與秩序感。給人安全感與專業信任感，習慣以實際經驗與結構化思維處理事務。',
        '風象': '<b>風象上升（雙子、天秤、水瓶）：</b>外在展現理性、友善與靈活的溝通能力。給人聰慧、易於接近的印象，重視資訊交流與客觀的多面向視角。',
        '水象': '<b>水象上升（巨蟹、天蠍、雙魚）：</b>外在展現敏銳、細膩與富同理心。給人溫和或帶神秘感的印象，對周遭氣氛有強烈直覺，習慣以情感連結世界。'
    };
    $('ascElemDesc').innerHTML = ELEM[asc.elem];

    $('ascPolTitle').innerText = `☯️ 上升 ${asc.name} 的陰陽性：【${asc.pol}】`;
    $('ascPolDesc').innerHTML = asc.pol === '陽性'
        ? '<b>陽性（火象、風象）：</b>傾向外放、主動，習慣向外表達與行動，社交上較容易主動開啟話題。'
        : '<b>陰性（土象、水象）：</b>傾向內斂、接納，習慣先觀察、感受再回應，給人穩重或含蓄的印象。';

    // Tab 3–7：運勢（本命太陽、月亮、上升點 × 當前行星位置）
    const natal = { Sun: pos.Sun.lon, Moon: pos.Moon.lon, ASC: ascLon };
    const now = Date.now();
    const DAY = 86400000;

    const today = Fortune.computePeriod(natal, now, 1, 1, Fortune.ALL, 12);
    const tomorrow = Fortune.computePeriod(natal, now + DAY, 1, 1, Fortune.ALL, 12);
    const week = Fortune.computePeriod(natal, now, 7, 1, Fortune.NO_MOON, 18);

    const nd = new Date();
    const monthStart = new Date(nd.getFullYear(), nd.getMonth(), 1, 12).getTime();
    const monthDays = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
    const month = Fortune.computePeriod(natal, monthStart, monthDays, 1, Fortune.NO_MOON, 18);

    const yearStart = new Date(tYear, 0, 1, 12).getTime();
    const year = Fortune.computePeriod(natal, yearStart, 122, 3, Fortune.SLOW, 22);

    $('todayScores').innerHTML = renderScoresHtml(today.scores);
    $('todayText').innerHTML = Fortune.buildText(sun, asc, '今日', today, false);
    $('tomorrowScores').innerHTML = renderScoresHtml(tomorrow.scores);
    $('tomorrowText').innerHTML = Fortune.buildText(sun, asc, '明日', tomorrow, false);
    $('weekScores').innerHTML = renderScoresHtml(week.scores);
    $('weekText').innerHTML = Fortune.buildText(sun, asc, '本週', week, true);
    $('monthScores').innerHTML = renderScoresHtml(month.scores);
    $('monthText').innerHTML = Fortune.buildText(sun, asc, '本月', month, true);

    // 本月標籤（依太陽星座與月份）
    const DIR8 = ['正東方向', '東南方向', '正南方向', '西南方向', '正西方向', '西北方向', '正北方向', '東北方向'];
    const LEISURE = {
        '火象': ['戶外運動', '健身或球類'], '土象': ['園藝或料理', '整理居家'],
        '風象': ['逛論壇', '閱讀與聊天'], '水象': ['泡澡聽音樂', '看電影放鬆']
    };
    const thisMonth = nd.getMonth() + 1;
    $('mDir').innerText = DIR8[(sunIdx + thisMonth) % 8];
    $('mLeisure').innerText = LEISURE[sun.elem][thisMonth % 2];
    $('mFriend').innerText = SIGNS[(sunIdx + 2) % 12].name;
    $('mWealth').innerText = SIGNS[(sunIdx + 4) % 12].name;
    $('mAnnoy').innerText = SIGNS[(sunIdx + 3) % 12].name;

    const bestGood = month.events.find(e => e.effect > 0);
    const bestBad = month.events.find(e => e.effect < 0);
    $('mStrength').innerHTML = '💡 <b>本月優勢：</b>' + (bestGood ? Fortune.eventText(bestGood, true) : '本月沒有特別突出的助力相位，穩定發揮即可。');
    $('mWeak').innerHTML = '⚠️ <b>本月弱勢：</b>' + (bestBad ? Fortune.eventText(bestBad, true) : '本月沒有明顯的壓力相位，保持日常警覺即可。');

    $('tabYearLabel').innerText = tYear;
    $('yearTitle').innerText = `${tYear} 西元年流年過運深度分析`;
    $('yearScores').innerHTML = renderScoresHtml(year.scores);
    $('yearText').innerHTML = Fortune.buildText(sun, asc, `${tYear} 年`, year, true);

    $('resultContainer').style.display = 'block';
    $('resultContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
