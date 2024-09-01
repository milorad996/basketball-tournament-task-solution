const exibitions = require('./exibitions.json');
const groups = require('./groups.json');

const rankings = {};
Object.keys(groups).forEach(groupKey => {
    const teams = groups[groupKey];
    teams.forEach(team => {
        rankings[team.ISOCode] = team.FIBARanking;
    });
});

function calculateInitialForm(games) {
    let form = 0;
    games.forEach(game => {
        const result = game.Result.split('-');
        const teamScore = parseInt(result[0]);
        const opponentScore = parseInt(result[1]);
        if (teamScore > opponentScore) {
            form += 1;
            form += Math.abs(teamScore - opponentScore) * 0.1;
        } else {
            form -= 1;
            form -= Math.abs(teamScore - opponentScore) * 0.1;
        }
    });
    return form;
}

function basicWinChance(fibaRank1, fibaRank2) {
    const rankDifference = fibaRank2 - fibaRank1;
    return 0.5 + rankDifference / 100;
}

function calculateWinProbability(team1, team2, form1, form2) {
    const baseProbability = basicWinChance(rankings[team1], rankings[team2]);

    const finalProbability = baseProbability + 0.4 * (form1 - form2);

    return Math.max(0, Math.min(1, finalProbability));
}

function simulateGame(team1, team2, form1, form2) {
    const winProbability = calculateWinProbability(team1, team2, form1, form2);

    const basePoints = 80;
    const variability = 10;

    let team1Points = Math.floor(basePoints + (Math.random() * variability));
    let team2Points = Math.floor(basePoints + (Math.random() * variability));

    if (Math.random() < winProbability) {
        team1Points += Math.floor(Math.random() * 15);
    } else {
        team2Points += Math.floor(Math.random() * 15);
    }

    return {
        team1: {
            name: team1,
            points: team1Points
        },
        team2: {
            name: team2,
            points: team2Points
        }
    };
}


function simulateGroupGames(group) {
    const results = [];
    const standings = {};

    group.forEach(team => {
        standings[team.ISOCode] = {
            wins: 0,
            losses: 0,
            pointsScored: 0,
            pointsConceded: 0,
            points: 0
        };
    });

    for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
            const team1 = group[i].ISOCode;
            const team2 = group[j].ISOCode;
            const form1 = calculateInitialForm(exibitions[team1] || []);
            const form2 = calculateInitialForm(exibitions[team2] || []);
            const gameResult = simulateGame(team1, team2, form1, form2);

            results.push(`${gameResult.team1.name} - ${gameResult.team2.name}: ${gameResult.team1.points}:${gameResult.team2.points}`);

            standings[team1].pointsScored += gameResult.team1.points;
            standings[team1].pointsConceded += gameResult.team2.points;
            standings[team2].pointsScored += gameResult.team2.points;
            standings[team2].pointsConceded += gameResult.team1.points;

            if (gameResult.team1.points > gameResult.team2.points) {
                standings[team1].wins += 1;
                standings[team1].points += 2;
                standings[team2].losses += 1;
                standings[team2].points += 1;
            } else {
                standings[team2].wins += 1;
                standings[team2].points += 2;
                standings[team1].losses += 1;
                standings[team1].points += 1;
            }
        }
    }
    return { results, standings };
}

function rankTeams(standings) {
    return Object.keys(standings).map(team => ({
        team,
        ...standings[team],
        pointDifference: standings[team].pointsScored - standings[team].pointsConceded
    })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
        return b.pointsScored - a.pointsScored;
    });
}

function simulateTournament() {
    const groupResults = {};
    const finalStandings = {};

    Object.keys(groups).forEach(groupKey => {
        console.log(`Grupa ${groupKey}:`);
        const { results, standings } = simulateGroupGames(groups[groupKey]);
        groupResults[groupKey] = results;
        finalStandings[groupKey] = rankTeams(standings);

        results.forEach(result => console.log(result));
        console.log();
    });

    console.log('Konačan plasman u grupama:');
    Object.keys(finalStandings).forEach(groupKey => {
        console.log(`Grupa ${groupKey}:`);
        finalStandings[groupKey].forEach((team, idx) => {
            console.log(`${idx + 1}. ${team.team} - pobede/porazi: ${team.wins}/${team.losses}, bodovi: ${team.points}, koševi: ${team.pointsScored}/${team.pointsConceded}, koš razlika: ${team.pointDifference}`);
        });
        console.log();
    });

    return finalStandings;
}

const finalStandings = simulateTournament();

function formHat(finalStandings) {
    const hats = {
        D: [],
        E: [],
        F: [],
        G: []
    };

    const allTeams = [];
    ['A', 'B', 'C'].forEach(groupKey => {
        finalStandings[groupKey].forEach((team, idx) => {
            allTeams.push({ ...team, group: groupKey });
        });
    });

    allTeams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
        return b.pointsScored - a.pointsScored;
    });

    hats.D.push(allTeams[0].team, allTeams[1].team);
    hats.E.push(allTeams[2].team, allTeams[3].team);
    hats.F.push(allTeams[4].team, allTeams[5].team);
    hats.G.push(allTeams[6].team, allTeams[7].team);

    console.log('Šeširi:');
    Object.keys(hats).forEach(hat => {
        console.log(`Šešir ${hat}:`);
        hats[hat].forEach(team => console.log(`    ${team}`));
    });

    return hats;
}

console.log(formHat(finalStandings));