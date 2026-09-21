import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Chart from 'chart.js/auto';

// --- CẤU HÌNH THỦ CÔNG (FALLBACK) ---
const MANUAL_MEMBERS = [
    "BaoZ",
    "ReiKage", 
    "B_Bo"
];

// --- THREAT INTELLIGENCE DATA (Will be fetched from API) ---

// --- TEXT SCRAMBLE EFFECT ---
const useTextScramble = (finalText, duration = 2000) => {
    const [text, setText] = useState('');
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setText(finalText);
            return undefined;
        }

        let frame = 0;
        let timeoutId;
        const totalFrames = duration / 50;
        
        const scramble = () => {
            if (frame < totalFrames) {
                const progress = frame / totalFrames;
                const revealedChars = Math.floor(progress * finalText.length);
                
                let scrambled = finalText
                    .split('')
                    .map((char, index) => {
                        if (index < revealedChars) {
                            return char;
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');
                
                setText(scrambled);
                frame++;
                timeoutId = setTimeout(scramble, 50);
            } else {
                setText(finalText);
            }
        };
        
        scramble();
        return () => clearTimeout(timeoutId);
    }, [finalText, duration]);
    
    return text;
};

// --- TERMINAL MODE COMPONENT ---
const Terminal = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState([
        { type: 'output', text: '6h4T 9pT pR0 Terminal v2.0.1' },
        { type: 'output', text: 'Type "help" for available commands' },
    ]);
    const [currentInput, setCurrentInput] = useState('');
    const inputRef = useRef(null);
    const terminalBodyRef = useRef(null);

    const commands = {
        help: () => [
            'Available commands:',
            '  whoami     - Display current user',
            '  ls         - List files',
            '  cat <file> - Display file contents',
            '  members    - Show team members',
            '  clear      - Clear terminal',
            '  flag       - Try to find the flag ;)',
            '  exit       - Close terminal'
        ],
        whoami: () => ['h4ck3r@6h4t9ptpr0:~$'],
        ls: () => ['members.txt', 'secrets.log', 'missions.db', 'config.sys'],
        cat: (args) => {
            const file = args[0];
            if (!file) return ['cat: missing file name'];
            if (file === 'members.txt') {
                return ['Team Members:', ...MANUAL_MEMBERS.map(m => `  - ${m}`)];
            }
            if (file === 'secrets.log') {
                return ['[ENCRYPTED]', 'Ym9vdGxlZ2dlcg==', 'Maybe try base64 decode? ;)'];
            }
            if (file === 'flag.txt') {
                return ['FLAG{T3RM1N4L_M4ST3R_UN10CK3D}', 'Congratulations! Flag #2 found!'];
            }
            return [`cat: ${file}: No such file or directory`];
        },
        members: () => ['Team Members:', ...MANUAL_MEMBERS.map(m => `  > ${m}`)],
        clear: () => {
            setHistory([]);
            return [];
        },
        flag: () => ['Try: cat flag.txt', '(Hint: The file is hidden, but exists)'],
        exit: () => {
            onClose();
            return [];
        }
    };

    const executeCommand = (cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;

        const parts = trimmed.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        setHistory(prev => [...prev, { type: 'command', text: trimmed }]);

        if (commands[command]) {
            const output = commands[command](args);
            if (output.length > 0) {
                setHistory(prev => [...prev, ...output.map(text => ({ type: 'output', text }))]);
            }
        } else {
            setHistory(prev => [...prev, { type: 'error', text: `Command not found: ${command}` }]);
        }

        setCurrentInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            executeCommand(currentInput);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
    }, [history]);

    if (!isOpen) return null;

    return (
        <div className="terminal-overlay">
            <div className="terminal-window" role="dialog" aria-modal="true" aria-labelledby="terminal-title">
                <div className="terminal-header">
                    <span className="terminal-title" id="terminal-title">root@6h4t9ptpr0:~</span>
                    <button type="button" className="terminal-close" onClick={onClose} aria-label="Close terminal">✕</button>
                </div>
                <div className="terminal-body" ref={terminalBodyRef}>
                    {history.map((line, idx) => (
                        <div key={idx} className={`terminal-line terminal-${line.type}`}>
                            {line.type === 'command' && <span className="terminal-prompt">$ </span>}
                            <span>{line.text}</span>
                        </div>
                    ))}
                    <div className="terminal-input-line">
                        <span className="terminal-prompt">$</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="terminal-input"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            aria-label="Terminal command"
                        />
                        <span className="cursor"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- THREAT TICKER COMPONENT ---
const ThreatTicker = ({ threats = [] }) => {
    const [paused, setPaused] = useState(false);
    const doubledThreats = [...threats, ...threats];
    
    if (threats.length === 0) {
        return (
            <section className="threat-strip" aria-label="Threat intelligence feed">
                <div className="threat-strip-label"><span className="status-dot"></span>THREAT INTEL</div>
                <div className="ticker-viewport"><span className="ticker-loading">Connecting to intelligence feeds...</span></div>
            </section>
        );
    }
    
    return (
        <section className="threat-strip" aria-label="Threat intelligence feed">
            <div className="threat-strip-label"><span className="status-dot"></span>THREAT INTEL</div>
            <div className="ticker-viewport" aria-live="off">
                <div className={`ticker-content ${paused ? 'is-paused' : ''}`}>
                    {doubledThreats.map((threat, idx) => (
                        <span key={idx} className={`ticker-item threat-${threat.level}`}>
                            <span className="threat-level">{threat.level}</span>
                            <span className="threat-time">{threat.time}</span>
                            {threat.text.replace(/^[^A-Z0-9✓⚠]+/i, '')}
                        </span>
                    ))}
                </div>
            </div>
            <button type="button" className="ticker-control" onClick={() => setPaused(value => !value)} aria-pressed={paused}>
                {paused ? 'Resume' : 'Pause'}
            </button>
        </section>
    );
};

// --- ICONS (INLINED FOR STABILITY) ---
const Shield = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const CalendarIcon = ({ size = 18 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v4M16 2v4M3 10h18"/><rect width="18" height="18" x="3" y="4" rx="2"/></svg>
);
const ArrowIcon = ({ size = 18 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>
);
const SearchIcon = ({ size = 18 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
// --- COMPONENTS ---
const Box = ({ title, children, className = "" }) => (
    <section className={`dashboard-panel ${className}`}>
        <div className="panel-header">
            <span className="panel-index">SYS</span>
            <h2>{title}</h2>
        </div>
        <div className="panel-body">{children}</div>
    </section>
);

const MetricCard = ({ label, value, tone, detail }) => (
    <div className={`metric-card metric-${tone}`}>
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <span className="metric-detail">{detail}</span>
    </div>
);

// Interactive Chart Component using Chart.js
const NetworkChart = ({ missions }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const chartData = missions.slice(0, 8).reverse();
    const chartSignature = chartData.map(item => `${item.id}:${item.ctf_points}`).join('|');

    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const labels = chartData.map(item => item.name.length > 12 ? `${item.name.slice(0, 12)}…` : item.name);
            const points = chartData.map(item => Number(item.ctf_points) || 0);

            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'CTF points',
                        data: points,
                        borderColor: '#22d3a6',
                        backgroundColor: 'rgba(34, 211, 166, 0.12)',
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: '#08110f',
                        pointBorderColor: '#5eeac4',
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(8, 17, 15, 0.96)',
                            titleColor: '#f2f7f5',
                            bodyColor: '#b5c6c0',
                            borderColor: '#245246',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(148, 163, 184, 0.08)' },
                            ticks: { color: '#789188', font: { size: 10 } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#789188', font: { size: 10 }, maxRotation: 0 }
                        }
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [chartSignature]);

    return (
        <div className="chart-wrap">
            {chartData.length > 0 ? (
                <canvas ref={chartRef} role="img" aria-label={`CTF score trend across ${chartData.length} recent events`}></canvas>
            ) : (
                <div className="empty-state">No score history is available for this season.</div>
            )}
        </div>
    );
};

const getEventState = (event, now) => {
    const start = new Date(event.start).getTime();
    const finish = new Date(event.finish).getTime();
    if (Number.isFinite(start) && now < start) return 'upcoming';
    if (Number.isFinite(finish) && now < finish) return 'live';
    return 'ended';
};

const formatCountdown = (target, now) => {
    const difference = Math.max(0, new Date(target).getTime() - now);
    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const EventCommandCenter = ({ events = [] }) => {
    const [filter, setFilter] = useState('all');
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const filters = [
        { id: 'all', label: 'All operations' },
        { id: 'live', label: 'Live now' },
        { id: 'jeopardy', label: 'Jeopardy' },
        { id: 'attack-defense', label: 'Attack / defense' }
    ];
    const visibleEvents = events.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'live') return getEventState(event, now) === 'live';
        const format = String(event.format || '').toLowerCase();
        return filter === 'jeopardy' ? format.includes('jeopardy') : format.includes('attack');
    });

    return (
        <section className="content-section" id="events" aria-labelledby="events-title">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Operation queue / CTFtime live feed</p>
                    <h2 id="events-title">Event command center</h2>
                    <p>Upcoming competitions, live countdowns and calendar-ready mission briefs.</p>
                </div>
                <span className="section-count">{events.length} tracked</span>
            </div>

            <div className="filter-row" aria-label="Filter CTF events">
                {filters.map(item => (
                    <button key={item.id} type="button" className="filter-chip" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
                        {item.label}
                    </button>
                ))}
            </div>

            {visibleEvents.length > 0 ? (
                <div className="operation-grid">
                    {visibleEvents.map(event => {
                        const state = getEventState(event, now);
                        const countdownTarget = state === 'live' ? event.finish : event.start;
                        const startDate = event.start ? new Date(event.start) : null;
                        return (
                            <article className={`operation-card operation-${state}`} key={event.id || `${event.name}-${event.start}`}>
                                <div className="operation-card-top">
                                    <span className="operation-status"><span className="status-dot"></span>{state === 'live' ? 'Live now' : 'Upcoming'}</span>
                                    <span className="operation-format">{event.format || 'Other'}</span>
                                </div>
                                <div className="operation-date" aria-hidden="true">
                                    <strong>{startDate && !Number.isNaN(startDate.getTime()) ? startDate.toLocaleDateString('en-GB', { day: '2-digit' }) : '--'}</strong>
                                    <span>{startDate && !Number.isNaN(startDate.getTime()) ? startDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() : 'TBD'}</span>
                                </div>
                                <div className="operation-copy">
                                    <h3>{event.name}</h3>
                                    <div className="operation-meta">
                                        <span>{event.onsite ? event.location || 'On-site' : 'Online'}</span>
                                        <span>{Number(event.weight) > 0 ? `Weight ${event.weight}` : 'Unrated'}</span>
                                        <span>{event.restrictions || 'Open'}</span>
                                    </div>
                                </div>
                                <div className="countdown-block">
                                    <span>{state === 'live' ? 'Ends in' : 'Starts in'}</span>
                                    <strong aria-label={`${state === 'live' ? 'Ends' : 'Starts'} in ${formatCountdown(countdownTarget, now)}`}>{formatCountdown(countdownTarget, now)}</strong>
                                </div>
                                <div className="operation-actions">
                                    {event.id && event.start && event.finish ? (
                                        <a className="secondary-action" href={`/api/events/${encodeURIComponent(event.id)}/calendar.ics`} download>
                                            <CalendarIcon /> Save .ics
                                        </a>
                                    ) : (
                                        <button type="button" className="secondary-action" disabled><CalendarIcon /> Calendar unavailable</button>
                                    )}
                                    <a className="primary-action" href={event.url} target="_blank" rel="noopener noreferrer">
                                        Mission brief <ArrowIcon />
                                    </a>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="section-empty">
                    <strong>No matching operations.</strong>
                    <span>Try another filter or check back after the next CTFtime sync.</span>
                </div>
            )}
        </section>
    );
};

const renderInlineMarkdown = (text, keyPrefix) => {
    const parts = String(text).split(/(`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).filter(Boolean);
    return parts.map((part, index) => {
        const key = `${keyPrefix}-${index}`;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
        if (link) return <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
        return <React.Fragment key={key}>{part}</React.Fragment>;
    });
};

const MarkdownArticle = ({ markdown = '' }) => {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index].trim();
        if (!line) { index += 1; continue; }

        if (line.startsWith('```')) {
            const language = line.slice(3).trim();
            const code = [];
            index += 1;
            while (index < lines.length && !lines[index].trim().startsWith('```')) {
                code.push(lines[index]);
                index += 1;
            }
            blocks.push(<pre key={`code-${index}`} data-language={language || undefined}><code>{code.join('\n')}</code></pre>);
            index += 1;
            continue;
        }

        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
            const level = Math.min(3, heading[1].length + 1);
            blocks.push(React.createElement(`h${level}`, { key: `heading-${index}` }, renderInlineMarkdown(heading[2], `heading-${index}`)));
            index += 1;
            continue;
        }

        if (line.startsWith('- ')) {
            const items = [];
            while (index < lines.length && lines[index].trim().startsWith('- ')) {
                items.push(lines[index].trim().slice(2));
                index += 1;
            }
            blocks.push(<ul key={`list-${index}`}>{items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item, `list-${index}-${itemIndex}`)}</li>)}</ul>);
            continue;
        }

        const paragraph = [line];
        index += 1;
        while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s|^- |^```/.test(lines[index].trim())) {
            paragraph.push(lines[index].trim());
            index += 1;
        }
        blocks.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(paragraph.join(' '), `paragraph-${index}`)}</p>);
    }

    return <div className="article-content">{blocks}</div>;
};

const WriteupLibrary = ({ posts = [], state = 'loading' }) => {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [selectedPost, setSelectedPost] = useState(null);
    const [articleState, setArticleState] = useState('idle');
    const categories = ['all', ...new Set(posts.map(post => post.category).filter(Boolean))];
    const normalizedQuery = query.trim().toLowerCase();
    const visiblePosts = posts.filter(post => {
        const matchesCategory = category === 'all' || post.category === category;
        const haystack = [post.title, post.excerpt, post.author, ...(post.tags || [])].join(' ').toLowerCase();
        return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });

    const openPost = async slug => {
        setArticleState('loading');
        try {
            const response = await fetch(`/api/writeups/${encodeURIComponent(slug)}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            setSelectedPost(payload.post);
            setArticleState('ready');
            requestAnimationFrame(() => document.getElementById('article-reader')?.focus());
        } catch (error) {
            console.error('Writeup fetch failed', error);
            setArticleState('error');
        }
    };

    return (
        <section className="content-section" id="writeups" aria-labelledby="writeups-title">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">Knowledge base / public archive</p>
                    <h2 id="writeups-title">Field notes &amp; writeups</h2>
                    <p>Technical debriefs, team workflows and lessons carried into the next operation.</p>
                </div>
                <span className="section-count">{posts.length} published</span>
            </div>

            {selectedPost ? (
                <article className="article-reader" id="article-reader" tabIndex="-1">
                    <button type="button" className="article-back" onClick={() => setSelectedPost(null)}>← Back to field notes</button>
                    <div className="article-meta">
                        <span>{selectedPost.category}</span>
                        <time dateTime={selectedPost.publishedAt}>{new Date(`${selectedPost.publishedAt}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</time>
                        <span>{selectedPost.readingMinutes} min read</span>
                    </div>
                    <MarkdownArticle markdown={selectedPost.body} />
                </article>
            ) : (
                <>
                    <div className="library-toolbar">
                        <label className="search-field">
                            <SearchIcon />
                            <span className="sr-only">Search field notes</span>
                            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search writeups, tags or authors" />
                        </label>
                        <div className="filter-row" aria-label="Filter field notes by category">
                            {categories.map(item => (
                                <button key={item} type="button" className="filter-chip" aria-pressed={category === item} onClick={() => setCategory(item)}>
                                    {item === 'all' ? 'All notes' : item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {state === 'loading' || articleState === 'loading' ? (
                        <div className="section-empty">Loading field notes...</div>
                    ) : visiblePosts.length > 0 ? (
                        <div className="writeup-grid">
                            {visiblePosts.map((post, index) => (
                                <article className={`writeup-card ${index === 0 && !query && category === 'all' ? 'writeup-featured' : ''}`} key={post.slug}>
                                    <div className="writeup-card-meta">
                                        <span>{post.category}</span>
                                        <time dateTime={post.publishedAt}>{new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</time>
                                    </div>
                                    <h3>{post.title}</h3>
                                    <p>{post.excerpt}</p>
                                    <div className="tag-list" aria-label="Post tags">
                                        {(post.tags || []).map(tag => <span key={tag}>{tag}</span>)}
                                    </div>
                                    <button type="button" className="read-post" onClick={() => openPost(post.slug)}>
                                        Read field note <ArrowIcon />
                                    </button>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="section-empty">
                            <strong>No field notes match “{query || category}”.</strong>
                            <span>Clear the search or choose another category.</span>
                        </div>
                    )}

                    {articleState === 'error' && <p className="inline-error" role="alert">The selected field note could not be loaded. Please try again.</p>}
                </>
            )}
        </section>
    );
};

// --- MAIN APP ---
const App = () => {
    const [data, setData] = useState({ 
        team: { name: 'LOADING...', logo: '', rank: '--', points: 0, country_rank: '--' }, 
        members: [],
        missions: [], 
        upcoming: [] 
    });
    const [threats, setThreats] = useState([]);
    const [writeups, setWriteups] = useState([]);
    const [writeupState, setWriteupState] = useState('loading');
    const [terminalOpen, setTerminalOpen] = useState(false);
    const [connectionState, setConnectionState] = useState('loading');
    const [lastUpdated, setLastUpdated] = useState(null);
    
    const scrambledTitle = useTextScramble(typeof data.team.name === 'string' ? data.team.name : '6h4T 9pT pR0', 1200);
    
    // Terminal hotkey listener (~)
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === '~' || e.key === '`') {
                e.preventDefault();
                setTerminalOpen(prev => !prev);
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);
    
    useEffect(() => {
        const controller = new AbortController();
        const fetchIntel = async () => {
            try {
                const res = await fetch('/api/intel', { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!json.team || !Array.isArray(json.missions) || !Array.isArray(json.upcoming)) {
                    throw new Error('Invalid intelligence response');
                }
                setData(json);
                setConnectionState(json.status === 'STALE' ? 'degraded' : 'online');
                setLastUpdated(new Date());
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setConnectionState('degraded');
                    console.error('Intel fetch failed', e);
                }
            }
        };

        const fetchThreats = async () => {
            try {
                const res = await fetch('/api/threats', { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (Array.isArray(json.threats)) setThreats(json.threats);
            } catch (e) {
                if (e.name !== 'AbortError') console.error('Threat feed failed', e);
            }
        };

        const fetchWriteups = async () => {
            try {
                const res = await fetch('/api/writeups', { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setWriteups(Array.isArray(json.posts) ? json.posts : []);
                setWriteupState('ready');
            } catch (e) {
                if (e.name !== 'AbortError') {
                    setWriteupState('error');
                    console.error('Writeup library fetch failed', e);
                }
            }
        };

        fetchIntel();
        fetchThreats();
        fetchWriteups();
        const intelInterval = setInterval(fetchIntel, 300000);
        const threatInterval = setInterval(fetchThreats, 300000);
        return () => {
            controller.abort();
            clearInterval(intelInterval);
            clearInterval(threatInterval);
        };
    }, []);

    const formatNumber = (value, digits = 0) => {
        const number = Number(value);
        return value === null || value === undefined || !Number.isFinite(number)
            ? '---'
            : number.toFixed(digits);
    };

    // Logic hiển thị thành viên: Ưu tiên API, nếu không có thì dùng Manual
    const displayMembers = (Array.isArray(data.members) && data.members.length > 0) 
        ? data.members 
        : MANUAL_MEMBERS;

    return (
        <>
            <a className="skip-link" href="#main-content">Skip to dashboard content</a>
            <div className="dashboard-shell">
                <header className="app-header">
                    <div className="brand-block">
                        <div className="brand-mark">
                            {data.team.logo ? (
                                <img src={data.team.logo} alt={`${data.team.name} logo`} />
                            ) : (
                                <Shield size={28} aria-hidden="true" />
                            )}
                        </div>
                        <div>
                            <p className="eyebrow">CTF intelligence network</p>
                            <h1>{scrambledTitle}</h1>
                        </div>
                    </div>
                    <div className="header-actions">
                        <nav className="quick-nav" aria-label="Primary navigation">
                            <a href="#events">Events</a>
                            <a href="#writeups">Field notes</a>
                        </nav>
                        <div className={`connection-pill connection-${connectionState}`} role="status" aria-live="polite">
                            <span className="status-dot"></span>
                            {connectionState === 'loading' ? 'Syncing' : connectionState}
                        </div>
                        <button type="button" className="terminal-trigger" onClick={() => setTerminalOpen(true)}>
                            <span aria-hidden="true">&gt;_</span> Open terminal
                        </button>
                    </div>
                </header>

                <section className="overview" aria-labelledby="overview-title">
                    <div className="overview-copy">
                        <p className="eyebrow">Command center / season {data.team.year || new Date().getFullYear()}</p>
                        <h2 id="overview-title">Competition signal, without the noise.</h2>
                        <p>Live CTFtime intelligence, team performance, upcoming operations and public field notes in one focused view.</p>
                    </div>
                    <div className="sync-meta">
                        <span>Last synchronized</span>
                        <strong>{lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong>
                    </div>
                </section>

                <section className="metrics-grid" aria-label="Team metrics">
                    <MetricCard label="Country rank" value={`#${data.team.country_rank ?? '---'}`} tone="green" detail="Vietnam leaderboard" />
                    <MetricCard label="Events played" value={data.missions.length} tone="cyan" detail={`${data.team.year || 'Current'} season`} />
                    <MetricCard label="Upcoming" value={data.upcoming.length} tone="violet" detail="Next 30 days" />
                    <MetricCard label="Field notes" value={writeups.length} tone="amber" detail="Public knowledge base" />
                </section>

                <main className="dashboard-grid" id="main-content">
                    <div className="dashboard-stack">
                        <Box title="Score trajectory">
                            <NetworkChart missions={data.missions} />
                            <p className="panel-note">CTF points from the latest events in this season.</p>
                        </Box>

                        <Box title="Squad roster" className="panel-grow">
                            <ul className="member-list">
                                {displayMembers.map((member, index) => {
                                    const name = typeof member === 'string' ? member : member?.name || 'Redacted agent';
                                    return (
                                        <li key={`${name}-${index}`}>
                                            <span className="member-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
                                            <span>{name}</span>
                                            <span className="member-state">Active</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </Box>

                        <Box title="Node status">
                            <dl className="status-list">
                                <div><dt>API link</dt><dd className={connectionState === 'online' ? 'status-good' : 'status-warn'}>{connectionState}</dd></div>
                                <div><dt>Refresh cycle</dt><dd>5 min</dd></div>
                                <div><dt>Endpoint</dt><dd>:7000</dd></div>
                                <div><dt>Season</dt><dd>{data.team.year || '---'}</dd></div>
                            </dl>
                        </Box>
                    </div>

                    <Box title="Mission archive" className="mission-panel">
                        <div className="table-wrap">
                            <table className="mission-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Placement</th>
                                        <th>CTF points</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.missions.length > 0 ? data.missions.map(mission => (
                                        <tr key={mission.id}>
                                            <td data-label="Event"><a href={mission.url} target="_blank" rel="noopener noreferrer">{mission.name}</a></td>
                                            <td data-label="Placement"><span className="rank-chip">#{mission.place}</span></td>
                                            <td data-label="CTF points">{formatNumber(mission.ctf_points)}</td>
                                            <td data-label="Date">{mission.date ? new Date(mission.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4"><div className="empty-state">No mission data found for this season.</div></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Box>
                </main>

                <EventCommandCenter events={data.upcoming} />
                <WriteupLibrary posts={writeups} state={writeupState} />

                <ThreatTicker threats={threats} />

                <footer className="app-footer">
                    <span>6h4T 9pT pR0 / secure operations console</span>
                    <span>Press <kbd>~</kbd> for terminal</span>
                </footer>
            </div>

            <Terminal isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />
        </>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
