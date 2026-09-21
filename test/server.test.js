const test = require('node:test');
const assert = require('node:assert/strict');

const { getActiveRating, getParticipatedEvents, toUpcomingOperation, parsePost, createIcs } = require('../server');

test('getActiveRating reads the current CTFtime rating object shape', () => {
    const result = getActiveRating({
        2024: { country_place: 42 },
        2025: { country_place: 53 },
        2026: { country_place: 72 }
    });

    assert.deepEqual(result, {
        year: '2026',
        stats: { country_place: 72 }
    });
});

test('getActiveRating ignores empty and invalid seasons', () => {
    const result = getActiveRating({
        current: { country_place: 1 },
        2026: {},
        2025: { country_place: 53 }
    });

    assert.equal(result.year, '2025');
});

test('getParticipatedEvents filters the results feed and sorts newest first', () => {
    const result = getParticipatedEvents({
        100: {
            title: 'Older CTF',
            time: 1700000000,
            scores: [{ team_id: 412747, place: 20, points: '100.0000' }]
        },
        200: {
            title: 'Other Team CTF',
            time: 1800000000,
            scores: [{ team_id: 1, place: 1, points: '999.0000' }]
        },
        300: {
            title: 'Newer CTF',
            time: 1750000000,
            scores: [{ team_id: 412747, place: 10, points: '200.0000' }]
        }
    }, '412747', '2026');

    assert.deepEqual(result.map(event => event.id), ['300', '100']);
    assert.equal(result[0].rating_points, null);
    assert.equal(result[0].url, 'https://ctftime.org/event/300');
});

test('toUpcomingOperation keeps calendar-ready CTFtime fields', () => {
    const result = toUpcomingOperation({
        id: 42,
        title: 'Example CTF',
        start: '2026-10-01T10:00:00+00:00',
        finish: '2026-10-02T10:00:00+00:00',
        format: 'Jeopardy',
        weight: 25,
        onsite: false,
        ctftime_url: 'https://ctftime.org/event/42/'
    });

    assert.equal(result.name, 'Example CTF');
    assert.equal(result.format, 'Jeopardy');
    assert.equal(result.url, 'https://ctftime.org/event/42/');
    assert.equal(result.onsite, false);
});

test('parsePost reads frontmatter and estimates reading time', () => {
    const post = parsePost(`---
slug: sample-note
title: Sample note
tags: web, pwn
date: 2026-09-21
---

# Sample note

Useful field notes.`, 'fallback');

    assert.equal(post.slug, 'sample-note');
    assert.equal(post.title, 'Sample note');
    assert.deepEqual(post.tags, ['web', 'pwn']);
    assert.equal(post.readingMinutes, 1);
});

test('createIcs returns an importable calendar event', () => {
    const calendar = createIcs({
        id: 42,
        name: 'Example CTF, Finals',
        start: '2026-10-01T10:00:00.000Z',
        finish: '2026-10-02T10:00:00.000Z',
        url: 'https://ctftime.org/event/42/'
    });

    assert.match(calendar, /BEGIN:VCALENDAR/);
    assert.match(calendar, /DTSTART:20261001T100000Z/);
    assert.match(calendar, /SUMMARY:Example CTF\\, Finals/);
    assert.match(calendar, /END:VCALENDAR/);
});
