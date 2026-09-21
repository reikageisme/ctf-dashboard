const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs/promises');
const Parser = require('rss-parser');
const app = express();
const parser = new Parser();

const PORT = Number(process.env.PORT) || 7000;
const TEAM_ID = '412747';
const PUBLIC_DIR = path.join(__dirname, 'public');
const POSTS_DIR = path.join(__dirname, 'content', 'posts');

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

const toUpcomingOperation = (event = {}) => ({
    id: event.id,
    name: event.title || 'Untitled operation',
    start: event.start || null,
    finish: event.finish || null,
    format: event.format || 'Other',
    weight: event.weight ?? null,
    onsite: Boolean(event.onsite),
    location: event.location || null,
    restrictions: event.restrictions || 'Open',
    url: event.ctftime_url || event.url || (event.id ? `https://ctftime.org/event/${event.id}` : '#'),
    officialUrl: event.url || null
});

const escapeIcsValue = (value = '') => String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

const toIcsDate = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const createIcs = event => [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//6h4T 9pT pR0//CTF Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:ctftime-${event.id || 'event'}@6h4t9ptpr0.tech`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(event.finish)}`,
    `SUMMARY:${escapeIcsValue(event.name)}`,
    `DESCRIPTION:${escapeIcsValue(`CTF operation tracked by 6h4T 9pT pR0. ${event.url || ''}`)}`,
    `URL:${event.url || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
].join('\r\n');

const parsePost = (source = '', fallbackSlug = '') => {
    const normalized = source.replace(/\r\n/g, '\n');
    const frontmatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    const metadata = {};
    let body = normalized.trim();

    if (frontmatterMatch) {
        frontmatterMatch[1].split('\n').forEach(line => {
            const separator = line.indexOf(':');
            if (separator === -1) return;
            const key = line.slice(0, separator).trim();
            const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key) metadata[key] = value;
        });
        body = frontmatterMatch[2].trim();
    }

    const titleFromBody = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const slug = metadata.slug || fallbackSlug;
    const tags = (metadata.tags || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
    const wordCount = body.split(/\s+/).filter(Boolean).length;

    return {
        slug,
        title: metadata.title || titleFromBody || slug,
        excerpt: metadata.excerpt || '',
        category: metadata.category || 'Field notes',
        tags,
        author: metadata.author || '6h4T 9pT pR0',
        publishedAt: metadata.date || null,
        readingMinutes: Math.max(1, Math.ceil(wordCount / 220)),
        body
    };
};

const getPosts = async () => {
    let files = [];
    try {
        files = await fs.readdir(POSTS_DIR);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }

    const posts = await Promise.all(files
        .filter(file => file.endsWith('.md') && !file.startsWith('_'))
        .map(async file => {
            const source = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
            return parsePost(source, path.basename(file, '.md'));
        }));

    return posts.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
};

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
        const eventWindowStart = timeNow - (24 * 60 * 60);
        const timeEnd = timeNow + (30 * 24 * 60 * 60); // 30 ngày tới
        const currentYear = new Date().getFullYear().toString();
        const requestConfig = {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CTF-Node-Bot/2.0)' },
            timeout: 15000
        };
        const [teamResult, upcomingResult, currentResultsResult] = await Promise.allSettled([
            axios.get(`https://ctftime.org/api/v1/teams/${TEAM_ID}/`, requestConfig),
            axios.get(`https://ctftime.org/api/v1/events/?limit=12&start=${eventWindowStart}&finish=${timeEnd}`, requestConfig),
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
        const upcomingOps = upcomingEvents
            .map(toUpcomingOperation)
            .filter(event => !event.finish || new Date(event.finish).getTime() > Date.now())
            .sort((a, b) => (a.start || '').localeCompare(b.start || ''));

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

app.get('/api/writeups', async (req, res) => {
    try {
        const posts = await getPosts();
        res.json({
            posts: posts.map(({ body, ...summary }) => summary)
        });
    } catch (error) {
        console.error(`[BLOG] Failed to load posts: ${error.message}`);
        res.status(500).json({ error: 'Writeup library is temporarily unavailable.' });
    }
});

app.get('/api/writeups/:slug', async (req, res) => {
    try {
        if (!/^[a-z0-9-]+$/.test(req.params.slug)) {
            return res.status(400).json({ error: 'Invalid writeup slug.' });
        }

        const posts = await getPosts();
        const post = posts.find(item => item.slug === req.params.slug);
        if (!post) return res.status(404).json({ error: 'Writeup not found.' });
        res.json({ post });
    } catch (error) {
        console.error(`[BLOG] Failed to load post: ${error.message}`);
        res.status(500).json({ error: 'Writeup is temporarily unavailable.' });
    }
});

app.get('/api/events/:id/calendar.ics', (req, res) => {
    const event = intelCache?.upcoming?.find(item => String(item.id) === req.params.id);
    if (!event || !event.start || !event.finish) {
        return res.status(404).json({ error: 'Calendar event is not available.' });
    }

    const filename = String(event.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'ctf-event';
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.ics"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(createIcs(event));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[SYSTEM] 6h4T 9pT pR0 Node Server running on :${PORT}`);
    });
}

module.exports = { app, getActiveRating, getParticipatedEvents, toUpcomingOperation, parsePost, createIcs };
