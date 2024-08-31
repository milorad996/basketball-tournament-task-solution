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