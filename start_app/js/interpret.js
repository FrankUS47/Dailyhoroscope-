const Interpret = (() => {
    // 行星功能簡述
    const FUNC = {
        Sun: '自我與人生目標', Moon: '情緒與安全感', Mercury: '思考與溝通', Venus: '感情與價值觀', Mars: '行動與慾望',
        Jupiter: '成長與信念', Saturn: '責任與限制', Uranus: '變革與獨立', Neptune: '理想與直覺', Pluto: '轉化與權力'
    };
    const NAME = {
        Sun: '太陽', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星',
        Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星', ASC: '上升點'
    };
    // 各星座優勢與盲點（索引同 SIGNS：白羊=0）
    const SIGN_EXTRA = [
        { gift: '行動果斷、勇於開創', shadow: '急躁、容易衝動' },
        { gift: '穩定耐心、重視實質', shadow: '固執、不易改變' },
        { gift: '好奇多才、反應敏捷', shadow: '注意力分散、不夠深入' },
        { gift: '體貼顧家、直覺敏銳', shadow: '情緒起伏、過度防衛' },
        { gift: '自信大方、有感染力', shadow: '愛面子、需要被肯定' },
        { gift: '細心務實、樂於服務', shadow: '過度挑剔、容易焦慮' },
        { gift: '公平協調、富有美感', shadow: '猶豫不決、太在意他人眼光' },
        { gift: '專注深刻、洞察力強', shadow: '多疑、控制慾' },
        { gift: '樂觀開闊、重視理想', shadow: '說話過直、承諾較鬆散' },
        { gift: '負責耐力、善於規劃', shadow: '過度嚴肅、壓抑情感' },
        { gift: '獨立創新、理性客觀', shadow: '疏離、固執己見' },
        { gift: '富同情與想像、靈感強', shadow: '逃避現實、界線不清' }
    ];
    // 古典尊貴（星座索引：白羊0 金牛1 雙子2 巨蟹3 獅子4 處女5 天秤6 天蠍7 射手8 摩羯9 水瓶10 雙魚11）
    const DIGNITY = {
        Sun:     { dom: [4],     exalt: [0],  det: [10],    fall: [6] },
        Moon:    { dom: [3],     exalt: [1],  det: [9],     fall: [7] },
        Mercury: { dom: [2, 5],  exalt: [5],  det: [8, 11], fall: [11] },
        Venus:   { dom: [1, 6],  exalt: [11], det: [7, 0],  fall: [5] },
        Mars:    { dom: [0, 7],  exalt: [9],  det: [6, 1],  fall: [3] },
        Jupiter: { dom: [8, 11], exalt: [3],  det: [2, 5],  fall: [9] },
        Saturn:  { dom: [9, 10], exalt: [6],  det: [3, 4],  fall: [0] },
        Uranus:  { dom: [10] }, Neptune: { dom: [11] }, Pluto: { dom: [7] }
    };
    const DIGNITY_TEXT = {
        dom: ['本位（入廟）', '落在自己主管的星座，力量穩固，表達自然順暢。'],
        exalt: ['入旺', '落在受到禮遇的星座，容易發揮得特別出色。'],
        det: ['陷（失勢）', '落在與本性相反的星座，使用這份能量比較不順手，需要多花力氣調整方式。'],
        fall: ['落陷（弱）', '落在較難施展的星座，容易信心不足或使不上力，需要靠後天累積來補強。']
    };
    function dignity(key, signIdx) {
        const d = DIGNITY[key];
        if (!d) return null;
        for (const t of ['dom', 'exalt', 'det', 'fall']) {
            if (d[t] && d[t].includes(signIdx)) return { type: t, label: DIGNITY_TEXT[t][0], text: DIGNITY_TEXT[t][1] };
        }
        return null;
    }

    const RETRO_TEXT = '出生時逆行：這項功能偏向向內運作，常需要多一點時間消化，才會用行動或言語表達出來。';

    // 命主星（上升星座的守護星；古典為主，現代共同守護星另註）
    const RULER = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
    const RULER_MODERN = { 7: 'Pluto', 10: 'Uranus', 11: 'Neptune' };

    function chartRuler(ascIdx, lons, ascLon, SIGNS, HOUSE_MEANING) {
        const key = RULER[ascIdx];
        const lon = lons[key];
        const sIdx = Math.floor(lon / 30) % 12;
        const house = (sIdx - ascIdx + 12) % 12;
        let html = `<p>上升在<b>${SIGNS[ascIdx].name}</b>，命主星（守護星）是<b>${NAME[key]}</b>`;
        if (RULER_MODERN[ascIdx]) html += `（現代占星另以${NAME[RULER_MODERN[ascIdx]]}為共同守護星）`;
        html += `。它位於<b>${SIGNS[sIdx].name}</b>、第 <b>${house + 1} 宮</b>（${HOUSE_MEANING[house]}）。</p>`;
        html += `<p>命主星像是整張盤的「總開關」：你人生的主要動力與課題，常會圍繞「${HOUSE_MEANING[house]}」這個領域展開，並帶有${SIGNS[sIdx].name}「${SIGNS[sIdx].style}」的色彩。${NAME[key]}掌管的是${FUNC[key]}，因此這方面的處理方式，會明顯影響你整體的運勢走向。</p>`;
        return html;
    }

    const PHASES = [
        ['新月期', '新的開始與直覺主導。做事憑感覺與衝勁，擅長開創，但容易在看清全貌前就行動。'],
        ['眉月期', '成長初期，需要突破舊有框架。有想擺脫過去、證明自己的動力，過程中會遇到阻力。'],
        ['上弦月', '行動與挑戰並存。習慣面對危機與抉擇，擅長處理問題，也容易在壓力下與環境對抗。'],
        ['盈凸月', '精益求精與自我修正。重視細節與方法，有追求完美、不斷調整的傾向。'],
        ['滿月期', '圓滿與覺察。太陽與月亮位置相對，容易同時看見理性與情感兩端，人際與關係是重要課題。'],
        ['虧凸月', '分享與傳承。願意把所學傳遞給別人，重視意義，有教導或影響他人的傾向。'],
        ['下弦月', '重新評估與價值轉換。會質疑既有信念，經歷內在重整後建立自己的觀點。'],
        ['殘月期', '釋放與總結。帶著使命感與內省氣質，擅長收尾、轉化與看見事物的結局。']
    ];
    function moonPhase(sunLon, moonLon) {
        const a = ((moonLon - sunLon) % 360 + 360) % 360;
        const p = PHASES[Math.floor(a / 45) % 8];
        return { angle: a, name: p[0], text: p[1] };
    }

    const ELEM_NAMES = ['火象', '土象', '風象', '水象'];
    const MODE_NAMES = ['基本', '固定', '變動'];
    const ELEM_OF = i => ['火象', '土象', '風象', '水象'][i % 4];
    const MODE_OF = i => ['基本', '固定', '變動'][i % 3];
    const ELEM_HI = {
        '火象': '熱情、主動、有行動力，但容易急躁、缺少耐性。',
        '土象': '務實、穩定、重視安全感，但容易保守、不願冒險。',
        '風象': '理性、善於思考與溝通，但容易想得多做得少、情感上抽離。',
        '水象': '感受深、同理心強，但容易受情緒左右、想太多。'
    };
    const ELEM_LO = {
        '火象': '火象偏少：較缺乏自發的衝勁與自信，需要刻意替自己「啟動」，設定小目標並付諸行動。',
        '土象': '土象偏少：對現實細節、金錢與身體照顧較容易忽略，需要刻意落實計畫與日常規律。',
        '風象': '風象偏少：較少從旁觀角度看事情，情緒容易主導判斷，多與人討論、寫下想法會有幫助。',
        '水象': '水象偏少：較不容易察覺他人與自己的細微情緒，多留意感受、練習傾聽能補強。'
    };
    const MODE_HI = {
        '基本': '基本星座偏多：愛開創、行動快，但可能開頭熱情、後勁不足。',
        '固定': '固定星座偏多：堅持穩定、意志強，但遇到變動時容易僵住或抗拒。',
        '變動': '變動星座偏多：靈活、適應力強，但可能缺乏定見、容易被環境牽著走。'
    };

    // 元素與模式：太陽、月亮、上升點權重 2，其餘行星權重 1
    function balance(lons, ascLon) {
        const W = { Sun: 2, Moon: 2, ASC: 2 };
        const e = { '火象': 0, '土象': 0, '風象': 0, '水象': 0 };
        const m = { '基本': 0, '固定': 0, '變動': 0 };
        let total = 0;
        const all = Object.assign({}, lons, { ASC: ascLon });
        for (const k in all) {
            const w = W[k] || 1;
            const idx = Math.floor(all[k] / 30) % 12;
            e[ELEM_OF(idx)] += w; m[MODE_OF(idx)] += w; total += w;
        }
        const sortE = Object.entries(e).sort((a, b) => b[1] - a[1]);
        const sortM = Object.entries(m).sort((a, b) => b[1] - a[1]);
        const notes = [];
        const topE = sortE[0], lowE = sortE[sortE.length - 1];
        if (topE[1] / total >= 0.35) notes.push(`<b>${topE[0]}最強（${topE[1]}/${total}）</b>：${ELEM_HI[topE[0]]}`);
        else notes.push('四元素分布相當平均，沒有特別偏重某一種特質，性格的彈性較大。');
        if (lowE[1] / total <= 0.12) notes.push(ELEM_LO[lowE[0]]);
        const topM = sortM[0];
        if (topM[1] / total >= 0.42) notes.push(MODE_HI[topM[0]]);
        return { e, m, total, notes };
    }

    // 本命相位（含上升點）；世代行星之間的相位為同世代共有，不列入
    const ASPECTS = [
        { angle: 0, name: '合相', text: '能量合一、互相強化，是這張盤的重點之一。' },
        { angle: 60, name: '六分相', text: '兩者之間容易取得合作與機會，需要主動運用才有感。' },
        { angle: 90, name: '四分相', text: '內在有張力與摩擦，是推動你成長與採取行動的壓力來源。' },
        { angle: 120, name: '三分相', text: '彼此配合流暢，屬於天生就比較順的才能，但容易視為理所當然。' },
        { angle: 180, name: '對分相', text: '兩端拉扯，需要學習在兩種需求之間取得平衡。' }
    ];
    const ORB_BASE = { Sun: 8, Moon: 8, ASC: 6, Mercury: 6, Venus: 6, Mars: 6, Jupiter: 6, Saturn: 6, Uranus: 4, Neptune: 4, Pluto: 4 };
    const GEN = ['Uranus', 'Neptune', 'Pluto'];
    function natalAspects(lons, ascLon) {
        const all = Object.assign({}, lons, { ASC: ascLon });
        const keys = Object.keys(all);
        const out = [];
        for (let i = 0; i < keys.length; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                const a = keys[i], b = keys[j];
                if (GEN.includes(a) && GEN.includes(b)) continue;
                let d = Math.abs(all[a] - all[b]) % 360; if (d > 180) d = 360 - d;
                const base = (ORB_BASE[a] + ORB_BASE[b]) / 2;
                for (const asp of ASPECTS) {
                    const orb = Math.abs(d - asp.angle);
                    const limit = asp.angle === 60 ? Math.max(2, base - 2) : base;
                    if (orb <= limit) out.push({ a, b, asp, orb, tight: orb / limit });
                }
            }
        }
        out.sort((x, y) => x.tight - y.tight);
        return out;
    }
    function aspectLine(x) {
        return `<li><b>${NAME[x.a]}</b>（${FUNC[x.a] || '外在形象'}）${x.asp.name}<b>${NAME[x.b]}</b>（${FUNC[x.b] || '外在形象'}），誤差 ${x.orb.toFixed(1)}°：${x.asp.text}</li>`;
    }

    return { dignity, RETRO_TEXT, SIGN_EXTRA, chartRuler, moonPhase, balance, natalAspects, aspectLine, NAME, FUNC };
})();
