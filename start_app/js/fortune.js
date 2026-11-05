const Fortune = (() => {
    const ASPECTS = [
        { angle: 0, name: '合相', type: 'c' },
        { angle: 60, name: '六分相', type: 'soft' },
        { angle: 90, name: '四分相', type: 'hard' },
        { angle: 120, name: '三分相', type: 'soft' },
        { angle: 180, name: '對分相', type: 'hard' }
    ];

    // 過運行星對本命點的影響：c=合相、soft=和諧相位、hard=緊張相位
    const NATURE = {
        Moon:    { c: 0.4,  soft: 0.5, hard: -0.4 },
        Mercury: { c: 0.3,  soft: 0.5, hard: -0.4 },
        Venus:   { c: 1.0,  soft: 1.0, hard: -0.3 },
        Mars:    { c: -0.4, soft: 0.3, hard: -0.9 },
        Jupiter: { c: 1.2,  soft: 1.0, hard: -0.2 },
        Saturn:  { c: -0.8, soft: 0.3, hard: -1.0 },
        Uranus:  { c: -0.3, soft: 0.2, hard: -0.6 },
        Neptune: { c: -0.3, soft: 0.1, hard: -0.5 },
        Pluto:   { c: -0.4, soft: 0.1, hard: -0.6 }
    };

    // 各行星對愛情、事業、財運的關聯權重
    const CAT_W = {
        Moon:    { love: 0.8, career: 0.3, wealth: 0.3 },
        Mercury: { love: 0.3, career: 0.8, wealth: 0.5 },
        Venus:   { love: 1.2, career: 0.4, wealth: 0.9 },
        Mars:    { love: 0.5, career: 1.0, wealth: 0.4 },
        Jupiter: { love: 0.6, career: 0.9, wealth: 1.2 },
        Saturn:  { love: 0.4, career: 1.0, wealth: 0.7 },
        Uranus:  { love: 0.5, career: 0.6, wealth: 0.5 },
        Neptune: { love: 0.5, career: 0.3, wealth: 0.4 },
        Pluto:   { love: 0.4, career: 0.6, wealth: 0.5 }
    };

    const ORB = { Moon: 5, Mercury: 3, Venus: 4, Mars: 4, Jupiter: 5, Saturn: 5, Uranus: 3, Neptune: 3, Pluto: 3 };
    const NATAL_W = { Sun: 1.0, Moon: 0.9, ASC: 0.7 };
    const POINT_NAME = { Sun: '本命太陽', Moon: '本命月亮', ASC: '上升點' };
    const PLANET_NAME = { Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星' };
    const PLANET_MEANING = {
        Moon: '情緒與日常節奏', Mercury: '溝通、資訊與學習', Venus: '人緣、感情與金錢價值', Mars: '行動力與衝突',
        Jupiter: '機會、成長與貴人', Saturn: '壓力、責任與長期考驗', Uranus: '突發變動與突破', Neptune: '直覺、靈感與迷惘', Pluto: '深層轉變與權力議題'
    };

    const ALL = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const NO_MOON = ALL.filter(p => p !== 'Moon');
    const SLOW = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

    const angDist = (a, b) => {
        const d = Math.abs(a - b) % 360;
        return d > 180 ? 360 - d : d;
    };

    function aspectBetween(lonA, lonB, orb) {
        const d = angDist(lonA, lonB);
        for (const a of ASPECTS) if (Math.abs(d - a.angle) <= orb) return a;
        return null;
    }

    // 某一時刻，過運行星對本命太陽、月亮、上升點形成的相位
    function transitEvents(natal, ms, allowed) {
        const pos = AstroCalc.positions(ms, false);
        const events = [];
        for (const p of allowed) {
            for (const point of ['Sun', 'Moon', 'ASC']) {
                const d = angDist(pos[p].lon, natal[point]);
                for (const asp of ASPECTS) {
                    const orb = Math.abs(d - asp.angle);
                    if (orb < ORB[p]) {
                        const strength = 1 - orb / ORB[p];
                        events.push({
                            planet: p, point, aspect: asp, strength,
                            effect: NATURE[p][asp.type] * strength * NATAL_W[point]
                        });
                    }
                }
            }
        }
        return events;
    }

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    function computePeriod(natal, startMs, count, stepDays, allowed, scale) {
        const sum = { overall: 0, love: 0, career: 0, wealth: 0 };
        const best = new Map();
        for (let i = 0; i < count; i++) {
            const ms = startMs + i * stepDays * 86400000;
            for (const ev of transitEvents(natal, ms, allowed)) {
                sum.overall += ev.effect;
                sum.love += ev.effect * CAT_W[ev.planet].love;
                sum.career += ev.effect * CAT_W[ev.planet].career;
                sum.wealth += ev.effect * CAT_W[ev.planet].wealth;
                const key = ev.planet + '|' + ev.point + '|' + ev.aspect.angle;
                const cur = best.get(key);
                if (!cur || Math.abs(ev.effect) > Math.abs(cur.effect)) best.set(key, Object.assign({}, ev, { ms }));
            }
        }
        const score = k => clamp(Math.round(66 + scale * sum[k] / count), 45, 98);
        const events = Array.from(best.values())
            .filter(e => Math.abs(e.effect) >= 0.08)
            .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
        return {
            scores: { overall: score('overall'), love: score('love'), career: score('career'), wealth: score('wealth') },
            events
        };
    }

    function level(score) { return score >= 78 ? 'high' : (score >= 64 ? 'mid' : 'low'); }

    const LEVEL_PREFIX = {
        love:   { high: '愛情運勢順遂，', mid: '愛情運勢平穩，', low: '愛情上較容易有摩擦，' },
        career: { high: '事業／學業有推進力，', mid: '事業／學業步調平穩，', low: '事業／學業需要多留心，' },
        wealth: { high: '財運有利，', mid: '財運持平，', low: '財務宜保守，' }
    };

    const OVERALL_SENTENCE = {
        high: '整體氣勢偏順，適合主動把握機會。',
        mid: '整體節奏平穩，按計畫行事即可。',
        low: '整體需要多一點耐心與彈性，重要決定可以多確認一次。'
    };

    const fmtDate = ms => {
        const d = new Date(ms);
        return (d.getMonth() + 1) + '/' + d.getDate();
    };

    function eventText(ev, showDate) {
        const tone = ev.effect >= 0 ? '<span class="tone-good">有利</span>' : '<span class="tone-bad">考驗</span>';
        const when = showDate ? fmtDate(ev.ms) + ' 前後，' : '';
        return `${when}${PLANET_NAME[ev.planet]}與${POINT_NAME[ev.point]}形成${ev.aspect.name}（${tone}）：牽動${PLANET_MEANING[ev.planet]}。`;
    }

    // 產生文字說明（依太陽星座、上升星座、本期分數與相位）
    function buildText(sunSign, ascSign, lead, res, showDate) {
        const s = res.scores;
        let html = `<p>${lead}以${sunSign.name}的「${sunSign.style}」為基調，加上${ascSign.name}上升的外在風格，${OVERALL_SENTENCE[level(s.overall)]}</p>`;
        const evs = res.events.slice(0, 3);
        if (evs.length) {
            html += `<div class="event-title">🔭 關鍵行星相位</div><ul class="event-list">` +
                evs.map(e => `<li>${eventText(e, showDate)}</li>`).join('') + `</ul>`;
        } else {
            html += `<p>此期間沒有明顯的行星相位，整體以日常節奏為主。</p>`;
        }
        html += `<p>💗 ${LEVEL_PREFIX.love[level(s.love)]}${sunSign.tips.love}。</p>`;
        html += `<p>💼 ${LEVEL_PREFIX.career[level(s.career)]}${sunSign.tips.career}。</p>`;
        html += `<p>💰 ${LEVEL_PREFIX.wealth[level(s.wealth)]}${sunSign.tips.wealth}。</p>`;
        return html;
    }

    return { computePeriod, buildText, eventText, aspectBetween, transitEvents, ALL, NO_MOON, SLOW, ASPECTS, level, fmtDate };
})();
