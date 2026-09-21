const express = require('express');
const axios = require('axios');
const path = require('path');
const Parser = require('rss-parser');
const app = express();
const parser = new Parser();

const PORT = Number(process.env.PORT) || 7000;
const TEAM_ID = '412747';
const PUBLIC_DIR = path.join(__dirname, 'public');

// Cache for RSS feeds
let threatCache = [];
let lastFetch = 0;
let intelCache = null;
let lastIntelFetch = 0;
const CACHE_DURATION = 300000; // 5 minutes 

// Add custom headers middleware (Including hidden flag!)
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', '6h4T-9pT-pR0-Node-v2.5');
    res.setHeader('X-CTF-Challenge', 'Find-All-Hidden-Flags');
    res.setHeader('X-Hidden-Flag', 'FLAG{HTTP_H34D3R5_C4N_L34K_D4T4}');
    res.setHeader('X-Team', '6h4T_9pT_pR0');
    res.setHeader('X-Security-Level', 'PARANOID');
    next();
});

app.use(express.static(PUBLIC_DIR));

const getActiveRating = (ratings = {}) => {
    const activeYear = Object.entries(ratings)
        .filter(([year, stats]) => /^\d{4}$/.test(year) && stats && Object.keys(stats).length > 0)
        .map(([year]) => Number(year))
        .sort((a, b) => b - a)[0];

    const year = String(activeYear || new Date().getFullYear());
    return { year, stats: ratings[year] || {} };
};

const getParticipatedEvents = (results = {}, teamId, year) => Object.entries(results)
    .flatMap(([id, event]) => {
        const score = event.scores?.find(entry => String(entry.team_id) === String(teamId));
        if (!score) return [];

        return [{
            id,
            name: event.title,
            place: score.place,
            ctf_points: score.points,
            rating_points: null,
            date: event.time ? new Date(event.time * 1000).toISOString() : null,
            url: `https://ctftime.org/event/${id}`,
            year
        }];
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

// --- [BOT] THREAT INTELLIGENCE FEED (NIST NVD + Exploit-DB) ---
app.get('/api/threats', async (req, res) => {
    try {
        const now = Date.now();
        
        // Return cache if still valid
        if (threatCache.length > 0 && (now - lastFetch) < CACHE_DURATION) {
            return res.json({ threats: threatCache });
        }
        
        console.log('[THREAT] Fetching vulnerability intelligence...');
        
        const threats = [];
        
        // Fetch from NIST NVD API (JSON)
        try {
            const pubEndDate = new Date(now).toISOString();
            const pubStartDate = new Date(now - (30 * 24 * 60 * 60 * 1000)).toISOString();
            const nvdResponse = await axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 CTF-Dashboard/2.0'
                },
                params: {
                    resultsPerPage: 10,
                    pubStartDate,
                    pubEndDate
                },
                timeout: 10000
            });
            
            if (nvdResponse.data && nvdResponse.data.vulnerabilities) {
                nvdResponse.data.vulnerabilities.forEach(vuln => {
                    const cve = vuln.cve;
                    const cveId = cve.id;
                    const description = cve.descriptions?.find(item => item.lang === 'en')?.value
                        || cve.descriptions?.[0]?.value
                        || 'No description available';
                    const shortDesc = description.length > 100
                        ? `${description.substring(0, 100)}...`
                        : description;
                    
                    // Determine severity
                    let level = 'medium';
                    const metrics = cve.metrics;
                    if (metrics?.cvssMetricV31 || metrics?.cvssMetricV30) {
                        const cvssData = metrics.cvssMetricV31?.[0] || metrics.cvssMetricV30?.[0];
                        const severity = cvssData?.cvssData?.baseSeverity;
                        if (severity === 'CRITICAL' || severity === 'HIGH') level = 'high';
                        if (severity === 'LOW') level = 'low';
                    }
                    
                    const pubDate = new Date(cve.published);
                    
                    threats.push({
                        level: level,
                        text: `${cveId} — ${shortDesc}`,
                        time: pubDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
                    });
                });
                console.log(`[THREAT] Fetched ${threats.length} CVEs from NIST NVD`);
            }
        } catch (nvdError) {
            console.error('[THREAT] NIST NVD error:', nvdError.message);
        }
        
        // Fetch Exploit-DB RSS as supplement
        try {
            const exploitFeed = await parser.parseURL('https://www.exploit-db.com/rss.xml');
            
            exploitFeed.items.slice(0, 5).forEach(item => {
                threats.push({
                    level: 'high',
                    text: `Exploit: ${item.title}`,
                    time: new Date(item.pubDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
                });
            });
            console.log('[THREAT] Added Exploit-DB feed');
        } catch (exploitError) {
            console.error('[THREAT] Exploit-DB error:', exploitError.message);
        }
        
        // Fallback data if both feeds fail
        if (threats.length === 0) {
            console.log('[THREAT] Using fallback threat data');
            threats.push(
                { level: 'medium', text: '⚠️ INFO: Threat intelligence feeds temporarily unavailable', time: new Date().toLocaleTimeString('en-GB') },
                { level: 'low', text: '✓ SYSTEM: Using cached vulnerability data', time: new Date().toLocaleTimeString('en-GB') }
            );
        }
        
        // Update cache
        threatCache = threats;
        lastFetch = now;
        
        console.log(`[THREAT] Total threats: ${threats.length}`);
        res.json({ threats });
        
    } catch (error) {
        console.error('[THREAT] API Error:', error);
        res.json({ threats: threatCache.length > 0 ? threatCache : [
            { level: 'low', text: '⚠️ Threat feed temporarily unavailable', time: new Date().toLocaleTimeString('en-GB') }
        ]});
    }
});

// --- [BOT] INTELLIGENCE AGENT ---
app.get('/api/intel', async (req, res) => {
    try {
        if (intelCache && (Date.now() - lastIntelFetch) < CACHE_DURATION) {
            return res.json(intelCache);
        }

        console.log(`[AGENT] Scanning CTFtime for Team ID: ${TEAM_ID}...`);
        
        const timeNow = Math.floor(Date.now() / 1000);
        const timeEnd = timeNow + (30 * 24 * 60 * 60); // 30 ngày tới
        const currentYear = new Date().getFullYear().toString();
        const requestConfig = {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CTF-Node-Bot/2.0)' },
            timeout: 15000
        };
        const [teamResult, upcomingResult, currentResultsResult] = await Promise.allSettled([
            axios.get(`https://ctftime.org/api/v1/teams/${TEAM_ID}/`, requestConfig),
            axios.get(`https://ctftime.org/api/v1/events/?limit=5&start=${timeNow}&finish=${timeEnd}`, requestConfig),
            axios.get(`https://ctftime.org/api/v1/results/${currentYear}/?limit=100`, requestConfig)
        ]);

        if (teamResult.status === 'rejected') throw teamResult.reason;

        const teamData = teamResult.value.data;
        const { year: activeYear, stats: displayStats } = getActiveRating(teamData.rating);
        let resultsResult = currentResultsResult;

        if (activeYear !== currentYear) {
            [resultsResult] = await Promise.allSettled([
                axios.get(`https://ctftime.org/api/v1/results/${activeYear}/?limit=100`, requestConfig)
            ]);
        }

        console.log(`[AGENT] Detected Active Season: ${activeYear}`);

        if (upcomingResult.status === 'rejected') {
            console.error('[AGENT] Upcoming events error:', upcomingResult.reason.message);
        }
        if (resultsResult.status === 'rejected') {
            console.error('[AGENT] Results error:', resultsResult.reason.message);
        }

        const participatedEvents = getParticipatedEvents(
            resultsResult.status === 'fulfilled' ? resultsResult.value.data : {},
            TEAM_ID,
            activeYear
        );

        // --- FETCH MEMBERS (Nếu API trả về) ---
        // Fix: API CTFtime trả members dưới dạng array objects hoặc strings
        let members = [];
        if (Array.isArray(teamData.members)) {
            members = teamData.members.map(m => {
                if (typeof m === 'string') return m;
                if (m && typeof m === 'object') return m.name || m.username || 'Unknown';
                return 'Unknown';
            });
        }
        
        console.log(`[AGENT] Found ${members.length} members from API`);

        // Chuẩn bị dữ liệu Upcoming
        const upcomingEvents = upcomingResult.status === 'fulfilled' && Array.isArray(upcomingResult.value.data)
            ? upcomingResult.value.data
            : [];
        const upcomingOps = upcomingEvents.map(evt => ({
            name: evt.title,
            start: new Date(evt.start).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
            weight: evt.weight,
            url: evt.url
        }));

        // Gửi về Frontend
        intelCache = {
            team: {
                name: teamData.name, // Tự động lấy tên
                logo: teamData.logo, // Tự động lấy logo
                rank: displayStats.rating_place ?? null,
                points: displayStats.rating_points ?? null,
                country_rank: displayStats.country_place ?? null,
                year: activeYear
            },
            members: members,
            missions: participatedEvents,
            upcoming: upcomingOps,
            status: 'LINKED'
        };
        lastIntelFetch = Date.now();
        res.json(intelCache);

    } catch (error) {
        console.error(`[AGENT] Error: ${error.message}`);
        if (intelCache) {
            return res.json({ ...intelCache, status: 'STALE' });
        }
        res.status(500).json({ error: 'Agent failed to retrieve intel.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[SYSTEM] 6h4T 9pT pR0 Node Server running on :${PORT}`);
    });
}

module.exports = { app, getActiveRating, getParticipatedEvents };
