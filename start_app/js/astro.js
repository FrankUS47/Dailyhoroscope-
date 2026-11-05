const AstroCalc = (() => {
    const RAD = Math.PI / 180;
    const norm = x => ((x % 360) + 360) % 360;
    const sin = d => Math.sin(d * RAD);
    const cos = d => Math.cos(d * RAD);

    const julianDay = ms => ms / 86400000 + 2440587.5;
    const centuries = ms => (julianDay(ms) - 2451545.0) / 36525;

    // 黃經章動
    function nutationLon(T) {
        const om = 125.04452 - 1934.136261 * T;
        const L = 280.4665 + 36000.7698 * T;
        const Lm = 218.3165 + 481267.8813 * T;
        return (-17.20 * sin(om) - 1.32 * sin(2 * L) - 0.23 * sin(2 * Lm) + 0.21 * sin(2 * om)) / 3600;
    }

    // 太陽視黃經（Meeus 低精度公式，誤差約 0.01°）
    function sunLon(T) {
        const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
        const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
        const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
                + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
        const om = 125.04 - 1934.136 * T;
        return norm(L0 + C - 0.00569 - 0.00478 * sin(om));
    }

    // 月亮黃經（Meeus 第 47 章主要項，誤差約 0.02°）
    // 欄位：[D, M, M', F, 係數(1e-6 度)]
    const MOON_TERMS = [
        [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],
        [0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],
        [0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],
        [0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
        [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],
        [4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
        [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],
        [2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
        [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],
        [2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487],
        [2,1,0,-2,-399],[0,0,2,-2,-381],[1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],
        [2,-1,2,0,327],[0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294]
    ];

    function moonLon(T) {
        const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
        const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
        const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
        const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
        const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
        const E = 1 - 0.002516 * T - 0.0000074 * T * T;
        let sum = 0;
        for (const [d, m, mp, f, c] of MOON_TERMS) {
            const arg = d * D + m * M + mp * Mp + f * F;
            const am = Math.abs(m);
            const ef = am === 1 ? E : (am === 2 ? E * E : 1);
            sum += c * ef * sin(arg);
        }
        const A1 = 119.75 + 131.849 * T;
        const A2 = 53.09 + 479264.290 * T;
        sum += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
        return norm(Lp + sum / 1e6 + nutationLon(T));
    }

    // JPL 近似軌道要素（1800–2050）：[a, da, e, de, I, dI, L, dL, 近日點經度, d, 升交點經度, d]
    const ELEMENTS = {
        Mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
        Venus:   [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
        Earth:   [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0.0, 0.0],
        Mars:    [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
        Jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
        Saturn:  [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
        Uranus:  [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589],
        Neptune: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
        Pluto:   [39.48211675, -0.00031596, 0.24882730, 0.00005170, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482]
    };

    // 日心直角座標（J2000 黃道）
    function helio(name, T) {
        const el = ELEMENTS[name];
        const a = el[0] + el[1] * T;
        const e = el[2] + el[3] * T;
        const I = el[4] + el[5] * T;
        const L = el[6] + el[7] * T;
        const varpi = el[8] + el[9] * T;
        const Om = el[10] + el[11] * T;
        const w = varpi - Om;
        let M = norm(L - varpi);
        if (M > 180) M -= 360;
        const eDeg = e / RAD;
        let E = M + eDeg * sin(M);
        for (let i = 0; i < 12; i++) {
            const dE = (M - E + eDeg * sin(E)) / (1 - e * cos(E));
            E += dE;
            if (Math.abs(dE) < 1e-9) break;
        }
        const xp = a * (cos(E) - e);
        const yp = a * Math.sqrt(1 - e * e) * sin(E);
        const cw = cos(w), sw = sin(w), cO = cos(Om), sO = sin(Om), cI = cos(I), sI = sin(I);
        return {
            x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
            y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
            z: (sw * sI) * xp + (cw * sI) * yp
        };
    }

    // 行星地心視黃經（當日分點黃道）
    function planetLon(name, T) {
        const p = helio(name, T);
        const e = helio('Earth', T);
        const lon = Math.atan2(p.y - e.y, p.x - e.x) / RAD;
        const precession = 1.396971 * T + 0.0003086 * T * T;
        return norm(lon + precession + nutationLon(T));
    }

    function bodyLon(name, T) {
        if (name === 'Sun') return sunLon(T);
        if (name === 'Moon') return moonLon(T);
        return planetLon(name, T);
    }

    const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

    // 回傳各天體黃經；withRetro 時附上逆行判斷
    function positions(ms, withRetro) {
        const T = centuries(ms);
        const out = {};
        const dT = 0.5 / 36525;
        for (const b of BODIES) {
            const lon = bodyLon(b, T);
            let retro = false;
            if (withRetro && b !== 'Sun' && b !== 'Moon') {
                let diff = bodyLon(b, T + dT) - bodyLon(b, T - dT);
                diff = ((diff + 540) % 360) - 180;
                retro = diff < 0;
            }
            out[b] = { lon, retro };
        }
        return out;
    }

    // 上升點黃經：由恆星時、地理緯度與黃赤交角計算
    function ascendant(ms, latDeg, lonDeg) {
        const jd = julianDay(ms);
        const T = (jd - 2451545.0) / 36525;
        const gmst = norm(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
        const ramc = norm(gmst + lonDeg);
        const eps = 23.439291 - 0.0130042 * T;
        const asc = Math.atan2(cos(ramc), -(sin(ramc) * cos(eps) + Math.tan(latDeg * RAD) * sin(eps))) / RAD;
        return norm(asc);
    }

    return { positions, ascendant, norm, BODIES };
})();

// 出生當地時間 → UTC：使用瀏覽器內建的歷史時區資料庫（含各地歷年夏令時間）
const LocalTime = (() => {
    const fmtCache = {};
    function offsetMin(zone, utcMs) {
        const f = fmtCache[zone] || (fmtCache[zone] = new Intl.DateTimeFormat('en-US', {
            timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric' }));
        const p = {};
        f.formatToParts(new Date(utcMs)).forEach(x => { p[x.type] = parseInt(x.value, 10); });
        const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
        return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
    }
    // 標準時間偏移：取該年 1/1 與 7/1 兩個偏移中較小者（夏令時間讓偏移變大）
    function standardOffsetMin(zone, y) {
        return Math.min(offsetMin(zone, Date.UTC(y, 0, 1, 12)), offsetMin(zone, Date.UTC(y, 6, 1, 12)));
    }
    // 回傳 { utcMs, offsetMin, dst }；assumeStandard 為 true 時，輸入視為標準時間（不再自動扣夏令）
    function toUtc(y, m, d, hh, mm, zone, assumeStandard) {
        const naive = Date.UTC(y, m - 1, d, hh, mm);
        const std = standardOffsetMin(zone, y);
        if (assumeStandard) return { utcMs: naive - std * 60000, offsetMin: std, dst: false };
        let off = offsetMin(zone, naive - std * 60000);
        for (let i = 0; i < 3; i++) off = offsetMin(zone, naive - off * 60000);
        return { utcMs: naive - off * 60000, offsetMin: off, dst: off > std };
    }
    function supported(zone) {
        try { offsetMin(zone, Date.UTC(2000, 0, 1)); return true; } catch (e) { return false; }
    }
    return { toUtc, supported, standardOffsetMin };
})();
