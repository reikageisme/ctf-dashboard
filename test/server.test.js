const test = require('node:test');
const assert = require('node:assert/strict');

const { getActiveRating, getParticipatedEvents } = require('../server');

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
